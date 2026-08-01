import type Phaser from 'phaser';

export type BgmName = 'map' | 'quiz' | 'boss';
export type SfxName =
  'tap' | 'correct' | 'wrong' | 'clear' | 'treasure' | 'page' | 'unlock' | 'combo';

interface AudioAsset<TName extends string> {
  name: TName;
  key: string;
  src: string;
  volume: number;
}

export const BGM_ASSETS: readonly AudioAsset<BgmName>[] = [
  { name: 'map', key: 'bgm:map', src: 'assets/audio/bgm-map.wav', volume: 0.32 },
  { name: 'quiz', key: 'bgm:quiz', src: 'assets/audio/bgm-quiz.wav', volume: 0.28 },
  { name: 'boss', key: 'bgm:boss', src: 'assets/audio/bgm-boss.wav', volume: 0.32 },
];

export const SFX_ASSETS: readonly AudioAsset<SfxName>[] = [
  { name: 'tap', key: 'sfx:tap', src: 'assets/audio/sfx-tap.wav', volume: 0.45 },
  { name: 'correct', key: 'sfx:correct', src: 'assets/audio/sfx-correct.wav', volume: 0.58 },
  { name: 'wrong', key: 'sfx:wrong', src: 'assets/audio/sfx-wrong.wav', volume: 0.45 },
  { name: 'clear', key: 'sfx:clear', src: 'assets/audio/sfx-clear.wav', volume: 0.62 },
  { name: 'treasure', key: 'sfx:treasure', src: 'assets/audio/sfx-treasure.wav', volume: 0.58 },
  { name: 'page', key: 'sfx:page', src: 'assets/audio/sfx-page.wav', volume: 0.42 },
  { name: 'unlock', key: 'sfx:unlock', src: 'assets/audio/sfx-unlock.wav', volume: 0.55 },
  { name: 'combo', key: 'sfx:combo', src: 'assets/audio/sfx-combo.wav', volume: 0.62 },
];

export function bgmAsset(name: BgmName): AudioAsset<BgmName> {
  const asset = BGM_ASSETS.find((candidate) => candidate.name === name);
  if (!asset) throw new Error(`BGMが見つかりません: ${name}`);
  return asset;
}

export function sfxAsset(name: SfxName): AudioAsset<SfxName> {
  const asset = SFX_ASSETS.find((candidate) => candidate.name === name);
  if (!asset) throw new Error(`効果音が見つかりません: ${name}`);
  return asset;
}

export function preloadAudio(scene: Phaser.Scene): void {
  for (const asset of [...BGM_ASSETS, ...SFX_ASSETS]) {
    scene.load.audio(asset.key, asset.src);
  }
}
