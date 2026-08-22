import characterImagesJson from '../../data/assets/character_images.json';
import worldImagesJson from '../../data/assets/world_images.json';
import hiraWordsJson from '../../data/g1/pools/hira_words.json';
import curriculumJson from '../../data/g1/curriculum_items.json';
import grade1BankJson from '../../data/g1/pools/grade1_bank.json';
import seaJson from '../../data/g1/sea.json';
import wordImagesJson from '../../data/g1/assets/word_images.json';
import grade2CurriculumJson from '../../data/g2/curriculum_items.json';
import grade2BankJson from '../../data/g2/pools/grade2_bank.json';
import sea2Json from '../../data/g2/sea.json';
import type {
  CharacterImageLibrary,
  CurriculumDefinition,
  Grade1Bank,
  Grade2Bank,
  Grade2CurriculumDefinition,
  HiraWordPool,
  SeaDefinition,
  SeaId,
  WordImageLibrary,
  WorldImageLibrary,
} from '../types/content';
import {
  characterImageLibrarySchema,
  curriculumDefinitionSchema,
  grade1BankSchema,
  grade2BankSchema,
  grade2CurriculumDefinitionSchema,
  hiraWordPoolSchema,
  seaSchema,
  wordImageLibrarySchema,
  worldImageLibrarySchema,
} from './schema';

export function loadCurriculumDefinition(): CurriculumDefinition {
  return curriculumDefinitionSchema.parse(curriculumJson);
}

export function loadCharacterImageLibrary(): CharacterImageLibrary {
  return characterImageLibrarySchema.parse(characterImagesJson);
}

export function loadGrade1Bank(): Grade1Bank {
  return grade1BankSchema.parse(grade1BankJson);
}

export function loadGrade2Bank(): Grade2Bank {
  return grade2BankSchema.parse(grade2BankJson);
}

export function loadGrade2CurriculumDefinition(): Grade2CurriculumDefinition {
  return grade2CurriculumDefinitionSchema.parse(grade2CurriculumJson);
}

export function loadHiraWordPool(): HiraWordPool {
  return hiraWordPoolSchema.parse(hiraWordsJson);
}

export function loadSea(seaId: SeaId = 'g1'): SeaDefinition {
  return seaSchema.parse(seaId === 'g2' ? sea2Json : seaJson);
}

export function loadSeas(): SeaDefinition[] {
  return [loadSea('g1'), loadSea('g2')];
}

export function loadWordImageLibrary(): WordImageLibrary {
  return wordImageLibrarySchema.parse(wordImagesJson);
}

export function loadWorldImageLibrary(): WorldImageLibrary {
  return worldImageLibrarySchema.parse(worldImagesJson);
}
