import type { ChoiceQuestion, Grade2Bank } from '../../types/content';
import { curriculumItemsForStage } from '../curriculum';
import { createSeededRng, shuffled } from './rng';

export function makeGrade2Quiz(
  stageId: string,
  bank: Grade2Bank,
  count: number,
  seed: number,
): ChoiceQuestion[] {
  if (stageId !== 'g2-moji-gairaigo') {
    throw new Error(`2年生問題バンクに未登録のステージです: ${stageId}`);
  }
  if (count > bank.katakanaWords.length) {
    throw new Error(`${stageId}は${count}問に対して問題候補が不足しています。`);
  }
  const rng = createSeededRng(seed);
  const selected = shuffled(bank.katakanaWords, rng).slice(0, count);
  const optionPool = bank.katakanaWords.map((item) => item.answer);
  const curriculumItemIds = curriculumItemsForStage(stageId).map((item) => item.id);

  return selected.map((item, index) => {
    const wrongs = shuffled(
      optionPool.filter((option) => option !== item.answer),
      rng,
    ).slice(0, 3);
    const choices = shuffled([item.answer, ...wrongs], rng);
    return {
      key: `${stageId}-${seed}-${index}-${item.key}`,
      type: 'choice',
      prompt: 'せつめいに あう\nカタカナことばは どれ?',
      emphasis: item.clue,
      visual: null,
      choices,
      answer: choices.indexOf(item.answer),
      explanation: `「${item.answer}」は がいこくから きた ことばだよ`,
      curriculumItemIds,
    };
  });
}
