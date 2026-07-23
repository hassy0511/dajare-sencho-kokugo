import type Phaser from 'phaser';

import { loadCharacterImageLibrary } from '../../content/loader';
import type { CharacterImageExpression, CharacterImageRole } from '../../types/content';

const TEXTURE_PREFIX = 'character-image:';

export function characterImageTextureKey(
  role: CharacterImageRole,
  expression: CharacterImageExpression = 'normal',
): string {
  return `${TEXTURE_PREFIX}${role}:${expression}`;
}

export function preloadCharacterImages(scene: Phaser.Scene): void {
  for (const asset of loadCharacterImageLibrary().items) {
    scene.load.image(characterImageTextureKey(asset.role, asset.expression), asset.src);
  }
}
