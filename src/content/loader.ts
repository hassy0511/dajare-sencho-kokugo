import characterImagesJson from '../../data/assets/character_images.json';
import worldImagesJson from '../../data/assets/world_images.json';
import hiraWordsJson from '../../data/g1/pools/hira_words.json';
import grade1BankJson from '../../data/g1/pools/grade1_bank.json';
import seaJson from '../../data/g1/sea.json';
import wordImagesJson from '../../data/g1/assets/word_images.json';
import type {
  CharacterImageLibrary,
  Grade1Bank,
  HiraWordPool,
  SeaDefinition,
  WordImageLibrary,
  WorldImageLibrary,
} from '../types/content';
import {
  characterImageLibrarySchema,
  grade1BankSchema,
  hiraWordPoolSchema,
  seaSchema,
  wordImageLibrarySchema,
  worldImageLibrarySchema,
} from './schema';

export function loadCharacterImageLibrary(): CharacterImageLibrary {
  return characterImageLibrarySchema.parse(characterImagesJson);
}

export function loadGrade1Bank(): Grade1Bank {
  return grade1BankSchema.parse(grade1BankJson);
}

export function loadHiraWordPool(): HiraWordPool {
  return hiraWordPoolSchema.parse(hiraWordsJson);
}

export function loadSea(): SeaDefinition {
  return seaSchema.parse(seaJson);
}

export function loadWordImageLibrary(): WordImageLibrary {
  return wordImageLibrarySchema.parse(wordImagesJson);
}

export function loadWorldImageLibrary(): WorldImageLibrary {
  return worldImageLibrarySchema.parse(worldImagesJson);
}
