import type Phaser from 'phaser';

import type { ChoiceQuestion } from '../../types/content';
import { COLORS, GAME_FONT } from '../constants';
import { addGameTapListener } from '../input/logical-input';
import type { QType, QTypeApi } from './types';

export const CHOICE_CENTERS = [
  { x: 220, y: 680 },
  { x: 590, y: 680 },
  { x: 220, y: 855 },
  { x: 590, y: 855 },
] as const;

interface ChoiceButton {
  face: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
}

export class ChoiceQType implements QType {
  private cleanupInput: (() => void) | undefined;
  private buttons: ChoiceButton[] = [];

  mount(
    scene: Phaser.Scene,
    layer: Phaser.GameObjects.Container,
    question: ChoiceQuestion,
    api: QTypeApi,
  ): void {
    const prompt = scene.add
      .text(405, 286, question.prompt, {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: '31px',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 7,
      })
      .setOrigin(0.5);
    const word = scene.add
      .text(405, 470, question.emphasis, {
        fontFamily: GAME_FONT,
        color: '#176b72',
        fontSize: '72px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    layer.add([prompt, word]);

    question.choices.forEach((choice, index) => {
      const center = CHOICE_CENTERS[index];
      if (!center) return;
      const face = scene.add.graphics();
      this.drawButton(face, center.x, center.y, COLORS.cream, COLORS.sandDark);
      const label = scene.add
        .text(center.x, center.y - 4, choice, {
          fontFamily: GAME_FONT,
          color: '#3d3323',
          fontSize: '64px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      layer.add([face, label]);
      this.buttons.push({ face, label });
    });

    const surface = scene.game.canvas;
    this.cleanupInput = addGameTapListener(surface, ({ x, y }) => {
      const selected = CHOICE_CENTERS.findIndex(
        (center) => Math.abs(x - center.x) <= 155 && Math.abs(y - center.y) <= 67,
      );
      if (selected >= 0) api.choose(selected);
    });
  }

  reveal(selected: number, answer: number): void {
    this.cleanupInput?.();
    this.cleanupInput = undefined;
    this.buttons.forEach((button, index) => {
      const center = CHOICE_CENTERS[index];
      if (!center) return;
      const isAnswer = index === answer;
      const isWrongSelection = index === selected && !isAnswer;
      const fill = isAnswer ? 0xbde6a8 : isWrongSelection ? 0xf3b2aa : COLORS.cream;
      const shadow = isAnswer
        ? COLORS.greenDark
        : isWrongSelection
          ? COLORS.coralDark
          : COLORS.sandDark;
      this.drawButton(button.face, center.x, center.y, fill, shadow);
      button.label.setAlpha(index === selected || isAnswer ? 1 : 0.62);
    });
  }

  destroy(): void {
    this.cleanupInput?.();
    this.cleanupInput = undefined;
    this.buttons = [];
  }

  private drawButton(
    graphics: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    fill: number,
    shadow: number,
  ): void {
    graphics.clear();
    graphics.fillStyle(shadow).lineStyle(5, COLORS.ink, 1);
    graphics.fillRoundedRect(x - 150, y - 59, 300, 134, 28);
    graphics.strokeRoundedRect(x - 150, y - 59, 300, 134, 28);
    graphics.fillStyle(fill).lineStyle(5, COLORS.ink, 1);
    graphics.fillRoundedRect(x - 150, y - 69, 300, 130, 28);
    graphics.strokeRoundedRect(x - 150, y - 69, 300, 130, 28);
  }
}
