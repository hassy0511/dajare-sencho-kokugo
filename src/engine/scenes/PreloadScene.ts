import Phaser from 'phaser';

import { preloadCharacterImages } from '../assets/character-image-library';
import { preloadWordImages } from '../assets/word-image-library';
import { preloadAudio } from '../audio/catalog';
import { COLORS, GAME_FONT, GAME_HEIGHT, GAME_WIDTH } from '../constants';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload(): void {
    preloadCharacterImages(this);
    preloadWordImages(this);
    preloadAudio(this);
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.skyLight);

    const compass = this.add.graphics({ x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 - 50 });
    compass.fillStyle(COLORS.cream).lineStyle(8, COLORS.ink, 1);
    compass.fillCircle(0, 0, 74).strokeCircle(0, 0, 74);
    compass.fillStyle(COLORS.coral).fillTriangle(0, -52, -18, 12, 18, 12);
    compass.fillStyle(COLORS.seaDark).fillTriangle(0, 52, -18, -12, 18, -12);
    compass.fillStyle(COLORS.ink).fillCircle(0, 0, 8);

    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70, 'ぼうけんを じゅんびちゅう…', {
        fontFamily: GAME_FONT,
        fontSize: '30px',
        color: '#3d3323',
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: compass,
      angle: 360,
      duration: 900,
      ease: 'Back.easeOut',
      onComplete: () => this.scene.start('Welcome'),
    });
  }
}
