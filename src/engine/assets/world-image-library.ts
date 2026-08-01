import type Phaser from 'phaser';

import { loadWorldImageLibrary } from '../../content/loader';
import type { WorldImageKey } from '../../types/content';

const TEXTURE_PREFIX = 'world-image:';

export function worldImageTextureKey(key: WorldImageKey): string {
  return `${TEXTURE_PREFIX}${key}`;
}

export function preloadWorldImages(scene: Phaser.Scene): void {
  for (const asset of loadWorldImageLibrary().items) {
    scene.load.image(worldImageTextureKey(asset.key), asset.src);
  }
}
