import type { ChoiceQuestion, Grade1Bank, HiraWordPool } from '../../types/content';
import { makeGrade1Quiz } from './grade1';
import { makeHiraSeionQuiz } from './hiraSeion';
import { makeMojiChoiceQuiz } from './mojiChoice';

export interface QuestionGeneratorContext {
  stageId: string;
  hira: HiraWordPool;
  grade1: Grade1Bank;
  missingItemIds: string[];
}

export const questionGenerators = {
  hiraPicture(context: QuestionGeneratorContext, count: number, seed: number): ChoiceQuestion[] {
    return makeHiraSeionQuiz(context.hira, count, seed, context.missingItemIds);
  },
  hiraDakuon(context: QuestionGeneratorContext, count: number, seed: number): ChoiceQuestion[] {
    return makeMojiChoiceQuiz(
      'hira-dakuon',
      context.hira.dakuon,
      count,
      seed,
      context.missingItemIds,
    );
  },
  hiraSokuon(context: QuestionGeneratorContext, count: number, seed: number): ChoiceQuestion[] {
    return makeMojiChoiceQuiz(
      'hira-sokuon',
      context.hira.sokuon,
      count,
      seed,
      context.missingItemIds,
    );
  },
  hiraChouon(context: QuestionGeneratorContext, count: number, seed: number): ChoiceQuestion[] {
    return makeMojiChoiceQuiz(
      'hira-chouon',
      context.hira.chouon,
      count,
      seed,
      context.missingItemIds,
    );
  },
  grade1(context: QuestionGeneratorContext, count: number, seed: number): ChoiceQuestion[] {
    return makeGrade1Quiz(
      context.stageId,
      context.grade1,
      context.hira,
      count,
      seed,
      context.missingItemIds,
    );
  },
} as const;
