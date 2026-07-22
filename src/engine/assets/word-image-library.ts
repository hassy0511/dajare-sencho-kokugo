import type Phaser from 'phaser';

import { loadWordImageLibrary } from '../../content/loader';

const TEXTURE_PREFIX = 'word-image:';

export function wordImageTextureKey(assetKey: string): string {
  return `${TEXTURE_PREFIX}${assetKey}`;
}

export function preloadWordImages(scene: Phaser.Scene): void {
  for (const asset of loadWordImageLibrary().items) {
    scene.load.image(wordImageTextureKey(asset.key), asset.src);
  }
}
