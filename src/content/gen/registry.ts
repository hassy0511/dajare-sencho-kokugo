import type { ChoiceQuestion, Grade1Bank, HiraWordPool } from '../../types/content';
import { makeGrade1Quiz } from './grade1';
import { makeHiraSeionQuiz } from './hiraSeion';
import { makeMojiChoiceQuiz } from './mojiChoice';

export interface QuestionGeneratorContext {
  stageId: string;
  hira: HiraWordPool;
  grade1: Grade1Bank;
}

export const questionGenerators = {
  hiraPicture(context: QuestionGeneratorContext, count: number, seed: number): ChoiceQuestion[] {
    return makeHiraSeionQuiz(context.hira.items, count, seed);
  },
  hiraDakuon(context: QuestionGeneratorContext, count: number, seed: number): ChoiceQuestion[] {
    return makeMojiChoiceQuiz('hira-dakuon', context.hira.dakuon, count, seed);
  },
  hiraSokuon(context: QuestionGeneratorContext, count: number, seed: number): ChoiceQuestion[] {
    return makeMojiChoiceQuiz('hira-sokuon', context.hira.sokuon, count, seed);
  },
  hiraChouon(context: QuestionGeneratorContext, count: number, seed: number): ChoiceQuestion[] {
    return makeMojiChoiceQuiz('hira-chouon', context.hira.chouon, count, seed);
  },
  grade1(context: QuestionGeneratorContext, count: number, seed: number): ChoiceQuestion[] {
    return makeGrade1Quiz(context.stageId, context.grade1, context.hira, count, seed);
  },
} as const;
