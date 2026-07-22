import Phaser from 'phaser';

import { COLORS, GAME_FONT, GAME_HEIGHT, GAME_TITLE, GAME_WIDTH, SAFE_AREA } from '../constants';

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
    const background = this.add.graphics();
    background.fillStyle(COLORS.sky).fillRect(0, 0, GAME_WIDTH, 480);
    background.fillStyle(COLORS.sea).fillRect(0, 480, GAME_WIDTH, GAME_HEIGHT - 480);

    background.fillStyle(0xffe08b).lineStyle(5, COLORS.ink, 1);
    background.fillCircle(680, 140, 58).strokeCircle(680, 140, 58);

    this.drawCloud(122, 140, 1);
    this.drawCloud(546, 275, 0.72);

    background.fillStyle(COLORS.sandDark).lineStyle(5, COLORS.ink, 1);
    background.fillEllipse(120, 585, 220, 72).strokeEllipse(120, 585, 220, 72);
    background.fillEllipse(714, 640, 205, 66).strokeEllipse(714, 640, 205, 66);
    background.fillStyle(COLORS.greenDark);
    background.fillEllipse(115, 565, 145, 42);
    background.fillEllipse(710, 620, 126, 36);

    background.lineStyle(5, COLORS.foam, 0.9);
    for (let y = 520; y < GAME_HEIGHT; y += 92) {
      for (let x = -40 + ((y / 92) % 2) * 50; x < GAME_WIDTH + 40; x += 150) {
        background.beginPath();
        background.arc(x, y, 32, Phaser.Math.DegToRad(205), Phaser.Math.DegToRad(335));
        background.strokePath();
      }
    }

    const foreground = this.add.graphics();
    foreground.fillStyle(COLORS.sand).lineStyle(5, COLORS.ink, 1);
    foreground.fillEllipse(405, 1055, 760, 120).strokeEllipse(405, 1055, 760, 120);
  }

  private drawCloud(x: number, y: number, scale: number): void {
    const cloud = this.add.graphics({ x, y }).setScale(scale);
    cloud.fillStyle(0xf7fbef).lineStyle(4, COLORS.ink, 0.55);
    cloud.fillCircle(-48, 10, 32);
    cloud.fillCircle(-10, -8, 44);
    cloud.fillCircle(38, 7, 35);
    cloud.fillRoundedRect(-75, 2, 145, 42, 20);
    cloud.strokeRoundedRect(-75, 2, 145, 42, 20);
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

  private drawShip(): Phaser.GameObjects.Container {
    const ship = this.add.container(GAME_WIDTH / 2, 610);
    const art = this.add.graphics();

    art.fillStyle(COLORS.brownDark).lineStyle(6, COLORS.ink, 1);
    art.fillPoints(
      [
        new Phaser.Geom.Point(-128, 58),
        new Phaser.Geom.Point(132, 58),
        new Phaser.Geom.Point(87, 132),
        new Phaser.Geom.Point(-83, 132),
      ],
      true,
    );
    art.strokePoints(
      [
        new Phaser.Geom.Point(-128, 58),
        new Phaser.Geom.Point(132, 58),
        new Phaser.Geom.Point(87, 132),
        new Phaser.Geom.Point(-83, 132),
      ],
      true,
    );
    art.fillStyle(COLORS.brown).fillRect(-100, 64, 200, 32);

    art.lineStyle(10, COLORS.ink, 1).lineBetween(0, -116, 0, 70);
    art.fillStyle(COLORS.cream).lineStyle(5, COLORS.ink, 1);
    art.fillTriangle(-7, -105, -7, 42, -118, 42);
    art.strokeTriangle(-7, -105, -7, 42, -118, 42);
    art.fillStyle(COLORS.coral).fillTriangle(10, -82, 10, 42, 100, 42);
    art.lineStyle(5, COLORS.ink, 1).strokeTriangle(10, -82, 10, 42, 100, 42);

    art.fillStyle(COLORS.seaDark).lineStyle(4, COLORS.ink, 1);
    art.fillCircle(-55, 93, 14).strokeCircle(-55, 93, 14);
    art.fillCircle(0, 93, 14).strokeCircle(0, 93, 14);
    art.fillCircle(55, 93, 14).strokeCircle(55, 93, 14);

    const badge = this.add.graphics({ x: 47, y: -12 });
    badge.fillStyle(COLORS.cream).lineStyle(4, COLORS.ink, 1);
    badge.fillCircle(0, 0, 27).strokeCircle(0, 0, 27);
    const badgeText = this.add
      .text(47, -14, 'ダ', {
        ...TEXT_STYLE,
        fontSize: '24px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    ship.add([art, badge, badgeText]);
    return ship;
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
      .text(0, -8, 'いまの ばんを みる', {
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
    const canvas = this.game.canvas;
    const advance = (): void => {
      this.showFoundationReady(button, label);
    };
    canvas.addEventListener('pointerup', advance);
    canvas.addEventListener('touchend', advance);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      canvas.removeEventListener('pointerup', advance);
      canvas.removeEventListener('touchend', advance);
    });
  }

  private showFoundationReady(
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
    this.time.delayedCall(reducedMotion ? 0 : 420, () => {
      this.cameras.main.fadeOut(reducedMotion ? 0 : 220, 234, 246, 239);
      this.time.delayedCall(reducedMotion ? 0 : 220, () => this.scene.start('FoundationReady'));
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
    if (status) status.textContent = 'いまの ばんを みる ボタンが あります';
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
