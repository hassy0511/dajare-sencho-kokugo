import type Phaser from 'phaser';

import type { ChoiceQuestion } from '../../types/content';
import { wordImageTextureKey } from '../assets/word-image-library';
import { COLORS, GAME_FONT } from '../constants';
import { addGameTapListener } from '../input/logical-input';
import { drawWordPicture } from '../ui/word-pictures';
import type { QType, QTypeApi } from './types';

export const CHOICE_CENTERS = [
  { x: 220, y: 680 },
  { x: 590, y: 680 },
  { x: 220, y: 855 },
  { x: 590, y: 855 },
] as const;

const PICTURE_CHOICE_CENTERS = [
  { x: 220, y: 570 },
  { x: 590, y: 570 },
  { x: 220, y: 815 },
  { x: 590, y: 815 },
] as const;

interface ChoiceButton {
  face: Phaser.GameObjects.Graphics;
  label?: Phaser.GameObjects.Text;
  picture?: Phaser.GameObjects.Image;
}

export class ChoiceQType implements QType {
  private cleanupInput: (() => void) | undefined;
  private buttons: ChoiceButton[] = [];
  private centers: readonly { x: number; y: number }[] = CHOICE_CENTERS;
  private pictureChoices = false;

  mount(
    scene: Phaser.Scene,
    layer: Phaser.GameObjects.Container,
    question: ChoiceQuestion,
    api: QTypeApi,
  ): void {
    this.pictureChoices = question.choiceVisuals?.length === question.choices.length;
    this.centers = this.pictureChoices ? PICTURE_CHOICE_CENTERS : CHOICE_CENTERS;
    const prompt = scene.add
      .text(405, this.pictureChoices ? 245 : 286, question.prompt, {
        fontFamily: GAME_FONT,
        color: '#3d3323',
        fontSize: this.pictureChoices ? '28px' : '31px',
        fontStyle: 'bold',
        align: 'center',
        lineSpacing: 7,
      })
      .setOrigin(0.5);
    layer.add(prompt);
    if (question.visual) {
      drawWordPicture(scene, layer, question.visual, 405, 455);
    } else if (question.emphasis) {
      const emphasisLength = [...question.emphasis.replaceAll('\n', '')].length;
      const word = scene.add
        .text(405, this.pictureChoices ? 365 : 470, question.emphasis, {
          fontFamily: GAME_FONT,
          color: '#176b72',
          fontSize:
            emphasisLength >= 60
              ? '21px'
              : emphasisLength >= 40
                ? '25px'
                : emphasisLength >= 24
                  ? '32px'
                  : emphasisLength >= 10
                    ? '48px'
                    : emphasisLength >= 7
                      ? '58px'
                      : '72px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 650 },
        })
        .setOrigin(0.5);
      layer.add(word);
    }

    question.choices.forEach((choice, index) => {
      const center = this.centers[index];
      if (!center) return;
      const choiceVisual = question.choiceVisuals?.[index];
      const choiceLength = [...choice].length;
      const face = scene.add.graphics();
      this.drawButton(face, center.x, center.y, COLORS.cream, COLORS.sandDark, this.pictureChoices);
      if (choiceVisual) {
        const textureKey = wordImageTextureKey(choiceVisual);
        if (!scene.textures.exists(textureKey)) {
          throw new Error(`問題画像が読み込まれていません: ${choiceVisual}`);
        }
        const picture = scene.add
          .image(center.x, center.y - 7, textureKey)
          .setDisplaySize(174, 174);
        layer.add([face, picture]);
        this.buttons.push({ face, picture });
        return;
      }
      const label = scene.add
        .text(center.x, center.y - 4, choice, {
          fontFamily: GAME_FONT,
          color: '#3d3323',
          fontSize:
            choiceLength >= 22
              ? '19px'
              : choiceLength >= 15
                ? '23px'
                : choiceLength >= 10
                  ? '29px'
                  : choiceLength >= 5
                    ? '40px'
                    : '50px',
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: 270 },
        })
        .setOrigin(0.5);
      layer.add([face, label]);
      this.buttons.push({ face, label });
    });

    const surface = scene.game.canvas;
    this.cleanupInput = addGameTapListener(surface, ({ x, y }) => {
      const selected = this.centers.findIndex(
        (center) =>
          Math.abs(x - center.x) <= 155 &&
          Math.abs(y - center.y) <= (this.pictureChoices ? 105 : 67),
      );
      if (selected >= 0) api.choose(selected);
    });
  }

  reveal(selected: number, answer: number): void {
    this.cleanupInput?.();
    this.cleanupInput = undefined;
    this.buttons.forEach((button, index) => {
      const center = this.centers[index];
      if (!center) return;
      const isAnswer = index === answer;
      const isWrongSelection = index === selected && !isAnswer;
      const fill = isAnswer ? 0xbde6a8 : isWrongSelection ? 0xf3b2aa : COLORS.cream;
      const shadow = isAnswer
        ? COLORS.greenDark
        : isWrongSelection
          ? COLORS.coralDark
          : COLORS.sandDark;
      this.drawButton(button.face, center.x, center.y, fill, shadow, this.pictureChoices);
      button.label?.setAlpha(index === selected || isAnswer ? 1 : 0.62);
      button.picture?.setAlpha(index === selected || isAnswer ? 1 : 0.55);
    });
  }

  getChoiceCenter(index: number): { x: number; y: number } | undefined {
    return this.centers[index];
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
    picture = false,
  ): void {
    graphics.clear();
    graphics.fillStyle(shadow).lineStyle(5, COLORS.ink, 1);
    const top = picture ? y - 101 : y - 59;
    const height = picture ? 210 : 134;
    graphics.fillRoundedRect(x - 150, top, 300, height, 28);
    graphics.strokeRoundedRect(x - 150, top, 300, height, 28);
    graphics.fillStyle(fill).lineStyle(5, COLORS.ink, 1);
    graphics.fillRoundedRect(x - 150, top - 10, 300, height - 4, 28);
    graphics.strokeRoundedRect(x - 150, top - 10, 300, height - 4, 28);
  }
}
