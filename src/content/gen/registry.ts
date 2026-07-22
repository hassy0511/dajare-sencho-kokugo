import type { ChoiceQuestion, HiraWordItem } from '../../types/content';
import { makeHiraSeionQuiz } from './hiraSeion';

export const questionGenerators = {
  hiraSeion(items: readonly HiraWordItem[], count: number, seed: number): ChoiceQuestion[] {
    return makeHiraSeionQuiz(items, count, seed);
  },
} as const;
