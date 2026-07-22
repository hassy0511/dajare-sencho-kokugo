import Phaser from 'phaser';

import { COLORS } from '../constants';

export function drawWordPicture(
  scene: Phaser.Scene,
  parent: Phaser.GameObjects.Container,
  visual: string,
  x: number,
  y: number,
): void {
  const picture = scene.add.container(x, y);
  const frame = scene.add.graphics();
  frame.fillStyle(0xeaf6ef).lineStyle(5, COLORS.ink, 1);
  frame.fillCircle(0, 0, 112).strokeCircle(0, 0, 112);
  const art = scene.add.graphics();
  picture.add([frame, art]);

  const drawers: Record<string, (graphics: Phaser.GameObjects.Graphics) => void> = {
    cat: drawCat,
    dog: drawDog,
    umbrella: drawUmbrella,
    octopus: drawOctopus,
    ship: drawShip,
    peach: drawPeach,
    mountain: drawMountain,
    star: drawStar,
  };
  (drawers[visual] ?? drawStar)(art);
  parent.add(picture);
}

function drawCat(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0xe9a85f).lineStyle(6, COLORS.ink, 1);
  g.fillTriangle(-72, -42, -38, -94, -16, -38).strokeTriangle(-72, -42, -38, -94, -16, -38);
  g.fillTriangle(72, -42, 38, -94, 16, -38).strokeTriangle(72, -42, 38, -94, 16, -38);
  g.fillCircle(0, 0, 73).strokeCircle(0, 0, 73);
  g.fillStyle(COLORS.ink).fillCircle(-27, -10, 7).fillCircle(27, -10, 7);
  g.fillStyle(0xc95f59).fillTriangle(-8, 12, 8, 12, 0, 23);
  g.lineStyle(4, COLORS.ink, 1);
  [-1, 1].forEach((side) => {
    g.lineBetween(side * 16, 26, side * 68, 18);
    g.lineBetween(side * 14, 34, side * 67, 40);
  });
}

function drawDog(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0x9d6a42).lineStyle(6, COLORS.ink, 1);
  g.fillEllipse(-62, -5, 48, 104).strokeEllipse(-62, -5, 48, 104);
  g.fillEllipse(62, -5, 48, 104).strokeEllipse(62, -5, 48, 104);
  g.fillStyle(0xd7a86e).fillCircle(0, 0, 72).strokeCircle(0, 0, 72);
  g.fillStyle(COLORS.ink).fillCircle(-25, -14, 7).fillCircle(25, -14, 7);
  g.fillEllipse(0, 16, 22, 17);
  g.lineStyle(4, COLORS.ink, 1)
    .beginPath()
    .moveTo(0, 24)
    .lineTo(0, 40)
    .lineTo(-14, 49)
    .moveTo(0, 40)
    .lineTo(14, 49)
    .strokePath();
}

function drawUmbrella(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(COLORS.coral).lineStyle(6, COLORS.ink, 1);
  g.beginPath()
    .moveTo(-92, 2)
    .arc(0, 2, 92, Math.PI, Math.PI * 2)
    .lineTo(92, 2)
    .lineTo(62, 20)
    .lineTo(30, 2)
    .lineTo(0, 20)
    .lineTo(-30, 2)
    .lineTo(-62, 20)
    .closePath()
    .fillPath()
    .strokePath();
  g.lineStyle(8, COLORS.ink, 1).lineBetween(0, 5, 0, 78);
  g.beginPath().arc(20, 76, 20, 0, Math.PI).strokePath();
}

function drawOctopus(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0xc95f75).lineStyle(6, COLORS.ink, 1);
  g.fillCircle(0, -18, 66).strokeCircle(0, -18, 66);
  for (let index = 0; index < 4; index += 1) {
    const startX = -54 + index * 36;
    g.beginPath()
      .moveTo(startX, 25)
      .lineTo(startX - 12, 76)
      .arc(startX + 4, 76, 16, Math.PI, 0)
      .lineTo(startX + 15, 30)
      .fillPath()
      .strokePath();
  }
  g.fillStyle(COLORS.cream).fillCircle(-23, -27, 13).fillCircle(23, -27, 13);
  g.fillStyle(COLORS.ink).fillCircle(-23, -27, 6).fillCircle(23, -27, 6);
}

function drawShip(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(COLORS.brown).lineStyle(6, COLORS.ink, 1);
  g.fillPoints(
    [
      new Phaser.Geom.Point(-88, 34),
      new Phaser.Geom.Point(88, 34),
      new Phaser.Geom.Point(57, 76),
      new Phaser.Geom.Point(-57, 76),
    ],
    true,
  );
  g.strokePoints(
    [
      new Phaser.Geom.Point(-88, 34),
      new Phaser.Geom.Point(88, 34),
      new Phaser.Geom.Point(57, 76),
      new Phaser.Geom.Point(-57, 76),
    ],
    true,
  );
  g.lineStyle(8, COLORS.ink, 1).lineBetween(0, -80, 0, 36);
  g.fillStyle(COLORS.cream).lineStyle(5, COLORS.ink, 1);
  g.fillTriangle(-5, -72, -5, 24, -72, 24).strokeTriangle(-5, -72, -5, 24, -72, 24);
  g.fillStyle(COLORS.coral)
    .fillTriangle(8, -54, 8, 24, 64, 24)
    .strokeTriangle(8, -54, 8, 24, 64, 24);
}

function drawPeach(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(0xf29b91).lineStyle(6, COLORS.ink, 1);
  g.fillEllipse(-31, 15, 92, 126).strokeEllipse(-31, 15, 92, 126);
  g.fillEllipse(31, 15, 92, 126).strokeEllipse(31, 15, 92, 126);
  g.fillStyle(COLORS.green).lineStyle(5, COLORS.ink, 1);
  g.fillEllipse(35, -66, 70, 32).strokeEllipse(35, -66, 70, 32);
  g.lineStyle(7, COLORS.brownDark, 1).lineBetween(0, -48, 11, -79);
}

function drawMountain(g: Phaser.GameObjects.Graphics): void {
  g.fillStyle(COLORS.green).lineStyle(6, COLORS.ink, 1);
  g.fillTriangle(-98, 70, -25, -48, 35, 70).strokeTriangle(-98, 70, -25, -48, 35, 70);
  g.fillStyle(COLORS.greenDark);
  g.fillTriangle(-15, 70, 48, -78, 102, 70).strokeTriangle(-15, 70, 48, -78, 102, 70);
  g.fillStyle(COLORS.cream);
  g.fillTriangle(20, -12, 48, -78, 72, -12).strokeTriangle(20, -12, 48, -78, 72, -12);
}

function drawStar(g: Phaser.GameObjects.Graphics): void {
  const points: Phaser.Geom.Point[] = [];
  for (let index = 0; index < 10; index += 1) {
    const radius = index % 2 === 0 ? 90 : 40;
    const angle = -Math.PI / 2 + (Math.PI * index) / 5;
    points.push(new Phaser.Geom.Point(Math.cos(angle) * radius, Math.sin(angle) * radius));
  }
  g.fillStyle(0xffd65a)
    .lineStyle(6, COLORS.ink, 1)
    .fillPoints(points, true)
    .strokePoints(points, true);
}
