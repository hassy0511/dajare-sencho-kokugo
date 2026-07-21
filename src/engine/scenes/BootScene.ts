import Phaser from 'phaser';

import { COLORS } from '../constants';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLORS.skyLight);
    this.scene.start('Preload');
  }
}
