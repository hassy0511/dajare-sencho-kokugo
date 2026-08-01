import type Phaser from 'phaser';

import { loadWorldImageLibrary } from '../../content/loader';
import type { WorldImageKey } from '../../types/content';
import { GAME_HEIGHT, GAME_WIDTH } from '../constants';

const TEXTURE_PREFIX = 'world-image:';

export function worldImageTextureKey(key: WorldImageKey): string {
  return `${TEXTURE_PREFIX}${key}`;
}

export function preloadWorldImages(scene: Phaser.Scene): void {
  for (const asset of loadWorldImageLibrary().items) {
    scene.load.image(worldImageTextureKey(asset.key), asset.src);
  }
}

export type WorldBackgroundKey =
  'welcome-background' | 'ocean-map-background' | 'island-board-background';

export function addWorldBackground(
  scene: Phaser.Scene,
  key: WorldBackgroundKey,
): Phaser.GameObjects.Image {
  return scene.add
    .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, worldImageTextureKey(key))
    .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
}
