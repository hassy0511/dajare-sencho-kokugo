import { BGM_ASSETS, SFX_ASSETS } from './engine/audio/catalog';
import { registerPwa } from './pwa';
import './audio-preview.css';

type PreviewAsset = (typeof BGM_ASSETS)[number] | (typeof SFX_ASSETS)[number];
type PreviewKind = 'bgm' | 'sfx';

interface PreviewItem {
  asset: PreviewAsset;
  audio: HTMLAudioElement;
  button: HTMLButtonElement;
  card: HTMLElement;
  progress: HTMLElement;
  time: HTMLElement;
  kind: PreviewKind;
}

const TITLES: Record<string, { title: string; use: string }> = {
  map: { title: 'うみの ぼうけん', use: 'スタート・うみ・しま・マップ' },
  quiz: { title: 'もんだいに ちょうせん', use: 'ふつうの ステージ' },
  boss: { title: 'ボスに ちょうせん', use: 'それぞれの しまの さいご' },
  tap: { title: 'タップ', use: 'ボタンを おした とき' },
  correct: { title: 'せいかい', use: 'こたえが あっていた とき' },
  wrong: { title: 'おしい', use: 'もういちど よく みる とき' },
  clear: { title: 'ステージ クリア', use: 'おたからを とりかえした とき' },
  treasure: { title: 'おたから', use: 'たからものを みつけた とき' },
  page: { title: 'ページ', use: 'おはなしを すすめる とき' },
  unlock: { title: 'おと オン', use: 'おとを つけた とき' },
  combo: { title: 'れんぞく せいかい', use: '3もん いじょう つづいた とき' },
};

const root = requiredElement<HTMLElement>('audio-preview');
const bgmList = requiredElement<HTMLElement>('bgm-list');
const sfxList = requiredElement<HTMLElement>('sfx-list');
const status = requiredElement<HTMLElement>('preview-status');
const volume = requiredElement<HTMLInputElement>('preview-volume');
const volumeValue = requiredElement<HTMLOutputElement>('preview-volume-value');
const loop = requiredElement<HTMLInputElement>('preview-loop');
const stop = requiredElement<HTMLButtonElement>('preview-stop');
const items: PreviewItem[] = [];
let current: PreviewItem | undefined;
let playRequest = 0;

function requiredElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`試聴ページの要素が見つかりません: ${id}`);
  return element as T;
}

function createWave(kind: PreviewKind, index: number): HTMLElement {
  const wave = document.createElement('div');
  wave.className = 'audio-wave';
  wave.setAttribute('aria-hidden', 'true');
  for (let bar = 0; bar < 9; bar += 1) {
    const line = document.createElement('span');
    line.style.setProperty('--bar-height', `${24 + ((bar * 17 + index * 11) % 52)}%`);
    wave.append(line);
  }
  if (kind === 'sfx') wave.classList.add('audio-wave-short');
  return wave;
}

function createCard(asset: PreviewAsset, kind: PreviewKind, index: number): PreviewItem {
  const copy = TITLES[asset.name];
  if (!copy) throw new Error(`試聴ページの表示名が見つかりません: ${asset.name}`);

  const card = document.createElement('article');
  card.className = 'audio-card';
  card.dataset.audioKey = asset.key;
  card.dataset.kind = kind;

  const number = document.createElement('p');
  number.className = 'audio-number';
  number.textContent = `${kind === 'bgm' ? 'BGM' : 'SE'} ${String(index + 1).padStart(2, '0')}`;

  const title = document.createElement('h3');
  title.textContent = copy.title;

  const use = document.createElement('p');
  use.className = 'audio-use';
  use.textContent = copy.use;

  const wave = createWave(kind, index);
  const progress = document.createElement('span');
  progress.className = 'audio-progress';
  wave.append(progress);

  const meta = document.createElement('div');
  meta.className = 'audio-meta';
  const time = document.createElement('span');
  time.textContent = '--:--';
  const level = document.createElement('span');
  level.textContent = `ゲーム内 おんりょう ${Math.round(asset.volume * 100)}%`;
  meta.append(time, level);

  const button = document.createElement('button');
  button.className = 'play-button';
  button.type = 'button';
  button.textContent = 'きく';
  button.setAttribute('aria-label', `${copy.title}を きく`);

  const audio = new Audio(`${import.meta.env.BASE_URL}${asset.src}`);
  audio.preload = 'metadata';
  audio.loop = kind === 'bgm' && loop.checked;
  const item: PreviewItem = { asset, audio, button, card, progress, time, kind };

  audio.addEventListener('loadedmetadata', () => updateTime(item));
  audio.addEventListener('timeupdate', () => updateTime(item));
  audio.addEventListener('ended', () => finishItem(item));
  audio.addEventListener('error', () => {
    if (current === item) current = undefined;
    button.textContent = 'もういちど';
    button.dataset.playing = 'false';
    status.textContent = `${copy.title}を よみこめませんでした`;
    root.dataset.playing = 'error';
  });
  button.addEventListener('click', () => void toggleItem(item));

  card.append(number, title, use, wave, meta, button);
  return item;
}

function addAssets(assets: readonly PreviewAsset[], kind: PreviewKind, target: HTMLElement): void {
  assets.forEach((asset, index) => {
    const item = createCard(asset, kind, index);
    items.push(item);
    target.append(item.card);
  });
}

async function toggleItem(item: PreviewItem): Promise<void> {
  if (current === item && !item.audio.paused) {
    stopAll();
    return;
  }

  stopAll(false);
  const request = ++playRequest;
  current = item;
  applyVolume(item);
  item.audio.loop = item.kind === 'bgm' && loop.checked;
  item.button.textContent = 'じゅんびちゅう';
  item.button.dataset.playing = 'loading';
  root.dataset.playing = 'loading';
  const copy = TITLES[item.asset.name];
  status.textContent = `${copy?.title ?? item.asset.name}を じゅんびしています`;

  try {
    await item.audio.play();
    if (request !== playRequest || current !== item) return;
    item.button.textContent = 'とめる';
    item.button.dataset.playing = 'true';
    root.dataset.playing = item.asset.name;
    status.textContent = `${copy?.title ?? item.asset.name}を さいせいしています`;
  } catch {
    if (request !== playRequest || current !== item) return;
    finishItem(item);
    status.textContent = 'もういちど ボタンを おしてください';
    root.dataset.playing = 'blocked';
  }
}

function stopAll(announce = true): void {
  playRequest += 1;
  for (const item of items) {
    item.audio.pause();
    item.audio.currentTime = 0;
    item.button.textContent = 'きく';
    item.button.dataset.playing = 'false';
    item.progress.style.width = '0%';
    updateTime(item);
  }
  current = undefined;
  root.dataset.playing = 'none';
  if (announce) status.textContent = 'ぜんぶの おとを とめました';
}

function finishItem(item: PreviewItem): void {
  item.button.textContent = 'きく';
  item.button.dataset.playing = 'false';
  item.progress.style.width = '0%';
  if (current === item) {
    current = undefined;
    root.dataset.playing = 'none';
    status.textContent = `${TITLES[item.asset.name]?.title ?? item.asset.name}を ききおわりました`;
  }
}

function applyVolume(item: PreviewItem): void {
  const multiplier = Number(volume.value) / 100;
  item.audio.volume = Math.min(1, item.asset.volume * multiplier);
}

function updateVolume(): void {
  const percent = Number(volume.value);
  volumeValue.value = percent === 100 ? '100%（ゲームと おなじ）' : `${percent}%（しちょうよう）`;
  items.forEach(applyVolume);
}

function updateTime(item: PreviewItem): void {
  const duration = Number.isFinite(item.audio.duration) ? item.audio.duration : 0;
  const currentTime = Number.isFinite(item.audio.currentTime) ? item.audio.currentTime : 0;
  item.time.textContent =
    duration > 0 ? `${formatTime(currentTime)} / ${formatTime(duration)}` : '--:--';
  item.progress.style.width =
    duration > 0 ? `${Math.min(100, (currentTime / duration) * 100)}%` : '0%';
}

function formatTime(seconds: number): string {
  if (seconds < 10) return `${seconds.toFixed(1)}びょう`;
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

addAssets(BGM_ASSETS, 'bgm', bgmList);
addAssets(SFX_ASSETS, 'sfx', sfxList);
volume.addEventListener('input', updateVolume);
loop.addEventListener('change', () => {
  for (const item of items) item.audio.loop = item.kind === 'bgm' && loop.checked;
});
stop.addEventListener('click', () => stopAll());
updateVolume();
root.dataset.ready = 'true';
registerPwa();
