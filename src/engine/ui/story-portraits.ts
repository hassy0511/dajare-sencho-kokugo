import Phaser from 'phaser';

import { COLORS } from '../constants';

export function drawStoryPortrait(
  scene: Phaser.Scene,
  role: 'dajare-sencho' | 'sumizo' | 'buddy',
  x: number,
  y: number,
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  if (role === 'dajare-sencho') {
    const art = scene.add.graphics();
    container.add(art);
    drawDajareSencho(art);
    return container;
  }
  if (role === 'buddy') {
    const art = scene.add.graphics();
    container.add(art);
    drawBuddy(art);
    return container;
  }
  const art = scene.add.graphics();
  container.add(art);
  drawSumizo(art);
  return container;
}

function drawDajareSencho(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(COLORS.brownDark).lineStyle(5, COLORS.ink, 1);
  g.fillRoundedRect(-58, 79, 46, 39, 12).strokeRoundedRect(-58, 79, 46, 39, 12);
  g.fillRoundedRect(12, 79, 46, 39, 12).strokeRoundedRect(12, 79, 46, 39, 12);
  g.fillStyle(COLORS.coral).lineStyle(6, COLORS.ink, 1);
  g.fillRoundedRect(-76, 4, 152, 92, 38).strokeRoundedRect(-76, 4, 152, 92, 38);
  g.fillStyle(COLORS.coralDark).fillRoundedRect(-71, 10, 62, 78, 28);
  g.lineStyle(6, COLORS.ink, 1).lineBetween(0, 7, 0, 91);
  g.fillStyle(0xe8c15a).lineStyle(3, COLORS.ink, 1);
  g.fillCircle(-12, 35, 6).strokeCircle(-12, 35, 6);
  g.fillCircle(-12, 60, 6).strokeCircle(-12, 60, 6);

  g.fillStyle(0xf5d9ad).lineStyle(6, COLORS.ink, 1);
  g.fillCircle(0, -48, 56).strokeCircle(0, -48, 56);
  g.fillStyle(0x6fa054).lineStyle(4, COLORS.ink, 1);
  g.fillEllipse(-37, -15, 48, 54).strokeEllipse(-37, -15, 48, 54);
  g.fillEllipse(0, -8, 64, 56).strokeEllipse(0, -8, 64, 56);
  g.fillEllipse(37, -15, 48, 54).strokeEllipse(37, -15, 48, 54);
  g.fillStyle(COLORS.ink).fillCircle(-20, -57, 6).fillCircle(20, -57, 6);
  g.fillStyle(0x8a4a3c).lineStyle(3, COLORS.ink, 1);
  g.fillEllipse(0, -31, 34, 18).strokeEllipse(0, -31, 34, 18);

  g.fillStyle(0x5d3d8c).lineStyle(6, COLORS.ink, 1);
  g.fillTriangle(-76, -91, 0, -139, 76, -91).strokeTriangle(-76, -91, 0, -139, 76, -91);
  g.fillRoundedRect(-88, -98, 176, 30, 14).strokeRoundedRect(-88, -98, 176, 30, 14);
  g.fillStyle(0xe8c15a).lineStyle(3, COLORS.ink, 1);
  const badge: Phaser.Geom.Point[] = [];
  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? 18 : 8;
    const angle = -Math.PI / 2 + (Math.PI * index) / 5;
    badge.push(new Phaser.Geom.Point(Math.cos(angle) * radius, -101 + Math.sin(angle) * radius));
  }
  g.fillPoints(badge, true).strokePoints(badge, true);
}

function drawSumizo(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x76579e).lineStyle(6, COLORS.ink, 1);
  g.fillEllipse(0, -6, 154, 150).strokeEllipse(0, -6, 154, 150);
  for (let index = 0; index < 4; index += 1) {
    const x = -55 + index * 37;
    g.fillRoundedRect(x, 42, 28, 90 - Math.abs(index - 1.5) * 12, 14).strokeRoundedRect(
      x,
      42,
      28,
      90 - Math.abs(index - 1.5) * 12,
      14,
    );
  }
  g.fillStyle(COLORS.cream).fillCircle(-28, -20, 18).fillCircle(28, -20, 18);
  g.fillStyle(COLORS.ink).fillCircle(-25, -20, 8).fillCircle(25, -20, 8);
  g.lineStyle(5, COLORS.ink, 1).lineBetween(-20, 23, 20, 23);
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
