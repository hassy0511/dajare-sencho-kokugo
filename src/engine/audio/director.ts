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

  constructor(game: Phaser.Game) {
    this.game = game;
    this.button = this.createToggle();
    this.game.sound.on(Phaser.Sound.Events.UNLOCKED, () => this.syncMusic());
    this.game.canvas.addEventListener('pointerdown', this.onCanvasTap, true);
    window.addEventListener('resize', this.positionToggle);
    window.addEventListener('orientationchange', this.positionToggle);
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

  playSfx(name: SfxName): void {
    const state = loadState();
    if (!state.settings.sfx || this.game.sound.locked) return;
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
    this.playSfx('tap');
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
      this.syncMusic();
      if (enabled) this.playSfx('unlock');
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
    if (this.game.sound.locked) return;
    if (this.activeBgmName === this.pendingBgm && this.activeBgm?.isPlaying) return;

    this.stopMusic();
    const asset = bgmAsset(this.pendingBgm);
    if (!this.game.cache.audio.exists(asset.key)) return;
    const sound = this.game.sound.add(asset.key, { loop: true, volume: 0 });
    this.activeBgm = sound;
    this.activeBgmName = this.pendingBgm;
    sound.play();
    const scene = this.currentScene;
    if (scene?.sys.isActive()) {
      scene.tweens.add({ targets: sound, volume: asset.volume, duration: 320 });
    } else {
      sound.setVolume(asset.volume);
    }
  }

  private stopMusic(): void {
    const sound = this.activeBgm;
    this.activeBgm = undefined;
    this.activeBgmName = undefined;
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
  getDirector(scene).playSfx(name);
}
