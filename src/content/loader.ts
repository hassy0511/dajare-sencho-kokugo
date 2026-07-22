import hiraWordsJson from '../../data/g1/pools/hira_words.json';
import seaJson from '../../data/g1/sea.json';
import type { HiraWordPool, SeaDefinition } from '../types/content';
import { hiraWordPoolSchema, seaSchema } from './schema';

export function loadHiraWordPool(): HiraWordPool {
  return hiraWordPoolSchema.parse(hiraWordsJson);
}

export function loadSea(): SeaDefinition {
  return seaSchema.parse(seaJson);
}
