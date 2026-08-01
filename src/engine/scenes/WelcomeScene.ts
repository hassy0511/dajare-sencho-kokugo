import Phaser from 'phaser';

import { addWorldBackground, worldImageTextureKey } from '../assets/world-image-library';
import { enterSceneAudio } from '../audio/director';
import { COLORS, GAME_FONT, GAME_TITLE, GAME_WIDTH, SAFE_AREA } from '../constants';
import { addGameTapListener } from '../input/logical-input';

const TEXT_STYLE: Phaser.Types.GameObjects.Text.TextStyle = {
  fontFamily: GAME_FONT,
  color: '#3d3323',
  align: 'center',
};

export class WelcomeScene extends Phaser.Scene {
  private started = false;

  constructor() {
    super('Welcome');
  }

  create(): void {
    this.started = false;
    enterSceneAudio(this, 'map');
    this.drawWorld();

    const ship = this.drawShip();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reducedMotion) {
      this.tweens.add({
        targets: ship,
        y: ship.y + 8,
        angle: 1.2,
        yoyo: true,
        repeat: -1,
        duration: 1800,
        ease: 'Sine.inOut',
      });
    }

    this.drawTitle();
    this.createStartButton();
    this.markReady();

    this.cameras.main.fadeIn(reducedMotion ? 0 : 260, 234, 246, 239);
  }

  private drawWorld(): void {
    addWorldBackground(this, 'welcome-background');
  }

  private drawTitle(): void {
    const card = this.add.graphics();
    card.fillStyle(COLORS.cream).lineStyle(6, COLORS.ink, 1);
    card.fillRoundedRect(84, SAFE_AREA + 40, 642, 276, 38);
    card.strokeRoundedRect(84, SAFE_AREA + 40, 642, 276, 38);
    card.fillStyle(COLORS.coralDark);
    card.fillRoundedRect(112, SAFE_AREA + 64, 586, 50, 22);

    this.add
      .text(GAME_WIDTH / 2, SAFE_AREA + 89, 'こくごの ぼうけん', {
        ...TEXT_STYLE,
        color: '#fff7d0',
        fontSize: '25px',
        fontStyle: 'bold',
        letterSpacing: 4,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, SAFE_AREA + 191, GAME_TITLE, {
        ...TEXT_STYLE,
        fontSize: '45px',
        fontStyle: 'bold',
        lineSpacing: 10,
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, SAFE_AREA + 285, 'ことばの たからを とりかえそう!', {
        ...TEXT_STYLE,
        color: '#176b72',
        fontSize: '24px',
      })
      .setOrigin(0.5);
  }

  private drawShip(): Phaser.GameObjects.Image {
    return this.add
      .image(GAME_WIDTH / 2, 610, worldImageTextureKey('welcome-ship'))
      .setDisplaySize(430, 430);
  }

  private createStartButton(): void {
    const button = this.add.container(GAME_WIDTH / 2, 882).setName('start-adventure');
    const shadow = this.add.graphics({ y: 10 });
    shadow.fillStyle(COLORS.coralDark).lineStyle(5, COLORS.ink, 1);
    shadow.fillRoundedRect(-250, -66, 500, 132, 32);
    shadow.strokeRoundedRect(-250, -66, 500, 132, 32);

    const face = this.add.graphics();
    face.fillStyle(COLORS.coral).lineStyle(5, COLORS.ink, 1);
    face.fillRoundedRect(-250, -72, 500, 132, 32);
    face.strokeRoundedRect(-250, -72, 500, 132, 32);

    const label = this.add
      .text(0, -8, 'ぼうけんを はじめる', {
        ...TEXT_STYLE,
        color: '#fff7d0',
        fontSize: '34px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    button.add([shadow, face, label]);
    button.setInteractive(
      new Phaser.Geom.Rectangle(-250, -72, 500, 142),
      Phaser.Geom.Rectangle.Contains,
    );
    button.input!.cursor = 'pointer';

    button.on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
      button.setScale(0.96).setY(888);
    });
    button.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
      button.setScale(1).setY(882);
    });
    const inputSurface = this.game.canvas;
    const cleanupInput = addGameTapListener(inputSurface, ({ x, y }) => {
      if (Math.abs(x - GAME_WIDTH / 2) <= 260 && Math.abs(y - 882) <= 80) {
        this.startAdventure(button, label);
      }
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      cleanupInput();
    });
  }

  private startAdventure(
    button: Phaser.GameObjects.Container,
    label: Phaser.GameObjects.Text,
  ): void {
    if (this.started) return;
    this.started = true;

    label.setText('じゅんび できた!');
    button.disableInteractive();
    this.tweens.add({
      targets: button,
      scale: 1,
      duration: 280,
      ease: 'Back.easeOut',
    });
    this.releaseStars(GAME_WIDTH / 2, 812);

    const status = document.querySelector<HTMLElement>('#game-status');
    if (status) status.textContent = 'つぎの がめんへ すすみます';

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let sceneTimer: number | undefined;
    const fadeTimer = window.setTimeout(
      () => {
        this.cameras.main.fadeOut(reducedMotion ? 0 : 220, 234, 246, 239);
        sceneTimer = window.setTimeout(
          () => this.scene.start('SeaSelect'),
          reducedMotion ? 0 : 220,
        );
      },
      reducedMotion ? 0 : 420,
    );
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.clearTimeout(fadeTimer);
      if (sceneTimer !== undefined) window.clearTimeout(sceneTimer);
    });
  }

  private releaseStars(x: number, y: number): void {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const count = reducedMotion ? 4 : 18;

    for (let index = 0; index < count; index += 1) {
      const star = this.add.star(x, y, 5, 5, 13, index % 2 ? COLORS.cream : 0xffd65a);
      star.setStrokeStyle(2, COLORS.ink, 0.7);
      const angle = Phaser.Math.DegToRad(-165 + (150 / Math.max(count - 1, 1)) * index);
      const distance = reducedMotion ? 45 : Phaser.Math.Between(100, 240);
      this.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        angle: Phaser.Math.Between(-120, 120),
        alpha: 0,
        scale: 0.4,
        duration: reducedMotion ? 200 : Phaser.Math.Between(650, 950),
        ease: 'Cubic.easeOut',
        onComplete: () => star.destroy(),
      });
    }
  }

  private markReady(): void {
    const status = document.querySelector<HTMLElement>('#game-status');
    const shell = document.querySelector<HTMLElement>('#game-shell');
    if (status) status.textContent = 'ぼうけんを はじめる ボタンが あります';
    if (shell) {
      shell.dataset.ready = 'true';
      shell.dataset.scene = 'welcome';
      delete shell.dataset.inputReady;
    }
    if (window.__DSK_APP__) {
      window.__DSK_APP__.ready = true;
      window.__DSK_APP__.scene = 'welcome';
    }
  }
}
