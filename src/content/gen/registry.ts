import type { ChoiceQuestion, HiraWordPool } from '../../types/content';
import { makeHiraSeionQuiz } from './hiraSeion';
import { makeMojiChoiceQuiz } from './mojiChoice';

export const questionGenerators = {
  hiraPicture(pool: HiraWordPool, count: number, seed: number): ChoiceQuestion[] {
    return makeHiraSeionQuiz(pool.items, count, seed);
  },
  hiraDakuon(pool: HiraWordPool, count: number, seed: number): ChoiceQuestion[] {
    return makeMojiChoiceQuiz('hira-dakuon', pool.dakuon, count, seed);
  },
  hiraSokuon(pool: HiraWordPool, count: number, seed: number): ChoiceQuestion[] {
    return makeMojiChoiceQuiz('hira-sokuon', pool.sokuon, count, seed);
  },
  hiraChouon(pool: HiraWordPool, count: number, seed: number): ChoiceQuestion[] {
    return makeMojiChoiceQuiz('hira-chouon', pool.chouon, count, seed);
  },
} as const;
