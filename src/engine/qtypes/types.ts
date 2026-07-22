import type Phaser from 'phaser';

import type { ChoiceQuestion } from '../../types/content';

export interface QTypeApi {
  choose(index: number): void;
}

export interface QType {
  mount(
    scene: Phaser.Scene,
    layer: Phaser.GameObjects.Container,
    question: ChoiceQuestion,
    api: QTypeApi,
  ): void;
  reveal(selected: number, answer: number): void;
  destroy(): void;
}
