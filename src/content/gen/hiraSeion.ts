import type { ChoiceQuestion, HiraWordItem } from '../../types/content';
import { createSeededRng, shuffled } from './rng';

export function makeHiraSeionQuiz(
  items: readonly HiraWordItem[],
  count: number,
  seed: number,
): ChoiceQuestion[] {
  const uniqueInitials = new Set(items.map((item) => [...item.w][0]));
  if (uniqueInitials.size < 4) throw new Error('4つ以上の異なる先頭文字が必要です。');
  if (count > items.length) throw new Error('問題数より多い単語が必要です。');

  const rng = createSeededRng(seed);
  const selected = shuffled(items, rng).slice(0, count);
  const initials = [...uniqueInitials].filter((value): value is string => value !== undefined);

  return selected.map((item, index) => {
    const correct = [...item.w][0];
    if (!correct) throw new Error('空の単語は問題にできません。');
    const distractors = shuffled(
      initials.filter((initial) => initial !== correct),
      rng,
    ).slice(0, 3);
    const choices = shuffled([correct, ...distractors], rng);
    return {
      key: `hira-seion-${seed}-${index}-${item.w}`,
      type: 'choice',
      prompt: 'この ことばの\nはじめの もじは?',
      emphasis: item.w,
      choices,
      answer: choices.indexOf(correct),
      explanation: `${item.w}は「${correct}」から はじまるよ`,
    };
  });
}
