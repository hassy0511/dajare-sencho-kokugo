import Phaser from 'phaser';

import { createGameConfig } from './engine/game-config';
import { registerPwa } from './pwa';
import './styles.css';

async function start(): Promise<void> {
  const shell = document.querySelector<HTMLElement>('#game-shell');
  const status = document.querySelector<HTMLElement>('#game-status');

  if (!shell || !status) {
    throw new Error('ゲーム画面の初期化先が見つかりません。');
  }

  window.__DSK_APP__ = {
    ready: false,
    scene: 'boot',
  };

  await document.fonts.ready;
  new Phaser.Game(createGameConfig(shell));
  registerPwa();
}

void start();
