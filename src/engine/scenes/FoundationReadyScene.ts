import Phaser from 'phaser';

import { COLORS, GAME_FONT, GAME_HEIGHT, GAME_WIDTH, SAFE_AREA } from '../constants';

const TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: GAME_FONT,
  color: '#3d3323',
  align: 'center',
};

export class FoundationReadyScene extends Phaser.Scene {
  constructor() {
    super('FoundationReady');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.skyLight);
    this.drawBackground();

    this.add
      .text(GAME_WIDTH / 2, SAFE_AREA + 150, 'しゅっぱつの じゅんび', {
        ...TEXT_STYLE,
        color: '#176b72',
        fontSize: '44px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, SAFE_AREA + 255, 'ここまで できたよ!', {
        ...TEXT_STYLE,
        fontSize: '54px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.add
      .text(
        GAME_WIDTH / 2,
        SAFE_AREA + 430,
        'いまは ゲームの きばんを\nかくにんする バージョンです。\n\nつぎは こくごの もんだいが\nあそべるように なります。',
        {
          ...TEXT_STYLE,
          fontSize: '30px',
          lineSpacing: 13,
          wordWrap: { width: 650 },
        },
      )
      .setOrigin(0.5);

    this.createBackButton();
    this.markReady();

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.cameras.main.fadeIn(reducedMotion ? 0 : 220, 234, 246, 239);
  }

  private drawBackground(): void {
    const art = this.add.graphics();
    const compassY = SAFE_AREA + 650;
    art.fillStyle(COLORS.sky).fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    art.fillStyle(COLORS.sea).fillRect(0, 720, GAME_WIDTH, GAME_HEIGHT - 720);
    art.fillStyle(COLORS.cream).lineStyle(6, COLORS.ink, 1);
    art.fillRoundedRect(72, SAFE_AREA + 70, 666, 690, 42);
    art.strokeRoundedRect(72, SAFE_AREA + 70, 666, 690, 42);

    art.fillStyle(0xffd65a).lineStyle(4, COLORS.ink, 0.8);
    art.fillCircle(GAME_WIDTH / 2, compassY, 42);
    art.strokeCircle(GAME_WIDTH / 2, compassY, 42);
    art.lineStyle(7, COLORS.ink, 1);
    art.lineBetween(GAME_WIDTH / 2, compassY - 24, GAME_WIDTH / 2, compassY + 24);
    art.lineBetween(GAME_WIDTH / 2 - 24, compassY, GAME_WIDTH / 2 + 24, compassY);
  }

  private createBackButton(): void {
    const button = this.add.container(GAME_WIDTH / 2, 900).setName('back-to-title');
    const face = this.add.graphics();
    face.fillStyle(COLORS.seaDark).lineStyle(5, COLORS.ink, 1);
    face.fillRoundedRect(-220, -62, 440, 124, 30);
    face.strokeRoundedRect(-220, -62, 440, 124, 30);
    const label = this.add
      .text(0, 0, 'タイトルへ もどる', {
        ...TEXT_STYLE,
        color: '#fff7d0',
        fontSize: '32px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    button.add([face, label]);
    button.setInteractive(
      new Phaser.Geom.Rectangle(-220, -62, 440, 124),
      Phaser.Geom.Rectangle.Contains,
    );
    button.input!.cursor = 'pointer';
    const canvas = this.game.canvas;
    let returning = false;
    const goBack = (): void => {
      if (returning) return;
      returning = true;
      this.time.delayedCall(50, () => this.scene.start('Welcome'));
    };
    this.time.delayedCall(500, () => {
      canvas.addEventListener('pointerup', goBack);
      canvas.addEventListener('touchend', goBack);
      const shell = document.querySelector<HTMLElement>('#game-shell');
      if (shell) shell.dataset.inputReady = 'true';
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      canvas.removeEventListener('pointerup', goBack);
      canvas.removeEventListener('touchend', goBack);
    });
  }

  private markReady(): void {
    const status = document.querySelector<HTMLElement>('#game-status');
    const shell = document.querySelector<HTMLElement>('#game-shell');
    if (status) status.textContent = 'しゅっぱつの じゅんびが できました。タイトルへ もどれます';
    if (shell) shell.dataset.scene = 'foundation-ready';
    if (window.__DSK_APP__) window.__DSK_APP__.scene = 'foundation-ready';
  }
}
