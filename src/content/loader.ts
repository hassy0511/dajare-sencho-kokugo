import hiraWordsJson from '../../data/g1/pools/hira_words.json';
import seaJson from '../../data/g1/sea.json';
import wordImagesJson from '../../data/g1/assets/word_images.json';
import type { HiraWordPool, SeaDefinition, WordImageLibrary } from '../types/content';
import { hiraWordPoolSchema, seaSchema, wordImageLibrarySchema } from './schema';

export function loadHiraWordPool(): HiraWordPool {
  return hiraWordPoolSchema.parse(hiraWordsJson);
}

export function loadSea(): SeaDefinition {
  return seaSchema.parse(seaJson);
}

export function loadWordImageLibrary(): WordImageLibrary {
  return wordImageLibrarySchema.parse(wordImagesJson);
}
