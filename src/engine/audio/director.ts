import Phaser from 'phaser';

import { loadState, setAudioEnabled } from '../save/state';
import { bgmAsset, sfxAsset } from './catalog';
import type { BgmName, SfxName } from './catalog';

class AudioDirector {
  readonly game: Phaser.Game;

  private activeBgm: Phaser.Sound.BaseSound | undefined;
  private activeBgmName: BgmName | undefined;
  private currentScene: Phaser.Scene | undefined;
  private pendingBgm: BgmName = 'map';
  private button: HTMLButtonElement;
  private lastTapAt = 0;
  private pendingSfx: SfxName | undefined;

  constructor(game: Phaser.Game) {
    this.game = game;
    this.button = this.createToggle();
    this.game.sound.on(Phaser.Sound.Events.UNLOCKED, () => this.flushAudio());
    this.game.canvas.addEventListener('pointerdown', this.onCanvasTap, true);
    window.addEventListener('resize', this.positionToggle);
    window.addEventListener('orientationchange', this.positionToggle);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible')
        void this.resumeAudio().then(() => this.flushAudio());
    });
    this.positionToggle();
    this.syncToggle();
  }

  enter(scene: Phaser.Scene, bgm: BgmName): void {
    this.currentScene = scene;
    this.pendingBgm = bgm;
    const shell = document.querySelector<HTMLElement>('#game-shell');
    if (shell) shell.dataset.bgm = bgm;
    if (window.__DSK_APP__) window.__DSK_APP__.bgm = bgm;
    this.syncMusic();
  }

  requestSfx(name: SfxName): void {
    this.pendingSfx = name;
    void this.resumeAudio().then(() => this.flushAudio());
  }

  private playSfxNow(name: SfxName): void {
    const state = loadState();
    if (!state.settings.sfx || !this.audioReady()) return;
    const asset = sfxAsset(name);
    if (!this.game.cache.audio.exists(asset.key)) return;
    this.game.sound.play(asset.key, { volume: asset.volume });
    const shell = document.querySelector<HTMLElement>('#game-shell');
    if (shell) shell.dataset.lastSfx = name;
    if (window.__DSK_APP__) window.__DSK_APP__.lastSfx = name;
  }

  private readonly onCanvasTap = (): void => {
    const now = Date.now();
    if (now - this.lastTapAt < 100) return;
    this.lastTapAt = now;
    this.requestSfx('tap');
  };

  private createToggle(): HTMLButtonElement {
    document.querySelector('#audio-toggle')?.remove();
    const button = document.createElement('button');
    button.id = 'audio-toggle';
    button.type = 'button';
    button.addEventListener('click', () => {
      const state = loadState();
      const enabled = !(state.settings.bgm || state.settings.sfx);
      setAudioEnabled(enabled);
      this.syncToggle();
      if (enabled) this.requestSfx('unlock');
      else this.syncMusic();
      const status = document.querySelector<HTMLElement>('#game-status');
      if (status) status.textContent = enabled ? 'おとを つけました' : 'おとを けしました';
    });
    document.body.append(button);
    return button;
  }

  private readonly positionToggle = (): void => {
    window.requestAnimationFrame(() => {
      const box = this.game.canvas.getBoundingClientRect();
      const size = this.button.getBoundingClientRect().width || 64;
      this.button.style.left = `${Math.max(8, box.right - size - 12)}px`;
      this.button.style.top = `${Math.max(8, box.bottom - size - 12)}px`;
    });
  };

  private syncToggle(): void {
    const state = loadState();
    const enabled = state.settings.bgm || state.settings.sfx;
    this.button.textContent = enabled ? '♪\nおと' : '×\nおと';
    this.button.setAttribute('aria-label', enabled ? 'おとを けす' : 'おとを つける');
    this.button.setAttribute('aria-pressed', String(enabled));
    this.button.dataset.enabled = String(enabled);
    const shell = document.querySelector<HTMLElement>('#game-shell');
    if (shell) shell.dataset.audio = enabled ? 'on' : 'off';
    if (window.__DSK_APP__) window.__DSK_APP__.audioEnabled = enabled;
  }

  private syncMusic(): void {
    const state = loadState();
    if (!state.settings.bgm) {
      this.stopMusic();
      return;
    }
    if (!this.audioReady()) return;
    if (this.activeBgmName === this.pendingBgm && this.activeBgm?.isPlaying) return;

    this.stopMusic();
    const asset = bgmAsset(this.pendingBgm);
    if (!this.game.cache.audio.exists(asset.key)) return;
    const sound = this.game.sound.add(asset.key, { loop: true, volume: 0 });
    this.activeBgm = sound;
    this.activeBgmName = this.pendingBgm;
    sound.play();
    const shell = document.querySelector<HTMLElement>('#game-shell');
    if (shell) shell.dataset.bgmPlaying = this.pendingBgm;
    if (window.__DSK_APP__) window.__DSK_APP__.bgmPlaying = this.pendingBgm;
    const scene = this.currentScene;
    if (scene?.sys.isActive()) {
      scene.tweens.add({ targets: sound, volume: asset.volume, duration: 320 });
    } else {
      sound.setVolume(asset.volume);
    }
  }

  private async resumeAudio(): Promise<void> {
    const context = this.audioContext();
    if (context?.state === 'suspended') {
      try {
        await context.resume();
      } catch {
        // Safari may keep the context suspended until the next direct user gesture.
      }
    }
    this.markAudioContext();
  }

  private audioContext(): AudioContext | undefined {
    return (this.game.sound as Phaser.Sound.BaseSoundManager & { context?: AudioContext }).context;
  }

  private audioReady(): boolean {
    const context = this.audioContext();
    return !this.game.sound.locked && context?.state !== 'suspended';
  }

  private flushAudio(): void {
    this.markAudioContext();
    if (!this.audioReady()) return;
    this.syncMusic();
    const pending = this.pendingSfx;
    this.pendingSfx = undefined;
    if (pending) this.playSfxNow(pending);
  }

  private markAudioContext(): void {
    const state = this.audioContext()?.state ?? (this.game.sound.locked ? 'locked' : 'ready');
    const shell = document.querySelector<HTMLElement>('#game-shell');
    if (shell) shell.dataset.audioContext = state;
    if (window.__DSK_APP__) window.__DSK_APP__.audioContext = state;
  }

  private stopMusic(): void {
    const sound = this.activeBgm;
    this.activeBgm = undefined;
    this.activeBgmName = undefined;
    const shell = document.querySelector<HTMLElement>('#game-shell');
    if (shell) shell.dataset.bgmPlaying = 'none';
    if (window.__DSK_APP__) delete window.__DSK_APP__.bgmPlaying;
    if (!sound) return;
    const scene = this.currentScene;
    if (sound.isPlaying && scene?.sys.isActive()) {
      scene.tweens.add({
        targets: sound,
        volume: 0,
        duration: 180,
        onComplete: () => sound.destroy(),
      });
    } else {
      sound.destroy();
    }
  }
}

let director: AudioDirector | undefined;

function getDirector(scene: Phaser.Scene): AudioDirector {
  if (!director || director.game !== scene.game) director = new AudioDirector(scene.game);
  return director;
}

export function enterSceneAudio(scene: Phaser.Scene, bgm: BgmName): void {
  getDirector(scene).enter(scene, bgm);
}

export function playSfx(scene: Phaser.Scene, name: SfxName): void {
  getDirector(scene).requestSfx(name);
}
