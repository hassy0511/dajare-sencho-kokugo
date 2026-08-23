import type Phaser from 'phaser';

import type { StoryRole } from '../../types/content';
import { characterImageTextureKey } from '../assets/character-image-library';
import { COLORS } from '../constants';

export function drawStoryPortrait(
  scene: Phaser.Scene,
  role: StoryRole,
  x: number,
  y: number,
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  if (role === 'buddy') {
    const art = scene.add.graphics();
    container.add(art);
    drawBuddy(art);
    return container;
  }
  const art = scene.add.image(0, 0, characterImageTextureKey(role)).setDisplaySize(360, 360);
  container.add(art);
  return container;
}

function drawBuddy(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0xd4a63c).lineStyle(6, COLORS.ink, 1);
  g.fillCircle(0, 0, 88).strokeCircle(0, 0, 88);
  g.fillStyle(COLORS.cream).fillCircle(0, 0, 68).strokeCircle(0, 0, 68);
  g.lineStyle(4, 0x6b5d48, 1);
  g.lineBetween(0, -68, 0, -51).lineBetween(68, 0, 51, 0);
  g.lineBetween(0, 68, 0, 51).lineBetween(-68, 0, -51, 0);
  g.fillStyle(COLORS.coral).lineStyle(4, COLORS.ink, 1);
  g.fillTriangle(0, -52, -15, 5, 15, 5).strokeTriangle(0, -52, -15, 5, 15, 5);
  g.fillStyle(COLORS.sea)
    .fillTriangle(0, 52, -15, -5, 15, -5)
    .strokeTriangle(0, 52, -15, -5, 15, -5);
  g.fillStyle(COLORS.ink).fillCircle(-23, 23, 6).fillCircle(23, 23, 6);
  g.lineStyle(4, COLORS.ink, 1)
    .beginPath()
    .arc(0, 27, 20, 0.15, Math.PI - 0.15)
    .strokePath();
}
