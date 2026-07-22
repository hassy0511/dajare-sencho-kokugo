import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from './constants';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { QuizScene } from './scenes/QuizScene';
import { ResultScene } from './scenes/ResultScene';
import { WelcomeScene } from './scenes/WelcomeScene';

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: '#bce8e6',
    render: {
      antialias: true,
      roundPixels: false,
      powerPreference: 'high-performance',
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
    },
    input: {
      activePointers: 2,
      touch: {
        capture: true,
      },
    },
    scene: [BootScene, PreloadScene, WelcomeScene, QuizScene, ResultScene],
  };
}
