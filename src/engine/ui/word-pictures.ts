import type Phaser from 'phaser';

import { wordImageTextureKey } from '../assets/word-image-library';
import { COLORS } from '../constants';

export function drawWordPicture(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  visual: string,
  x: number,
  y: number,
): void {
  const textureKey = wordImageTextureKey(visual);
  if (!scene.textures.exists(textureKey)) {
    throw new Error(`問題画像が読み込まれていません: ${visual}`);
  }

  const shadow = scene.add.graphics();
  shadow.fillStyle(COLORS.sandDark, 0.9);
  shadow.fillRoundedRect(x - 122, y - 116, 244, 244, 34);

  const frame = scene.add.graphics();
  frame.fillStyle(0xfff7e2).lineStyle(6, COLORS.ink, 1);
  frame.fillRoundedRect(x - 122, y - 124, 244, 244, 34);
  frame.strokeRoundedRect(x - 122, y - 124, 244, 244, 34);

  const image = scene.add.image(x, y - 2, textureKey).setDisplaySize(224, 224);
  parent.add([shadow, frame, image]);
}
