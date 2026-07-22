import type { ChoiceQuestion, HiraWordItem } from '../../types/content';
import { createSeededRng, shuffled } from './rng';

export function makeHiraSeionQuiz(
  items: readonly HiraWordItem[],
  count: number,
  seed: number,
): ChoiceQuestion[] {
  const uniqueWords = new Set(items.map((item) => item.w));
  if (uniqueWords.size < 4) throw new Error('4つ以上の異なる言葉が必要です。');
  if (count > items.length) throw new Error('問題数より多い単語が必要です。');

  const rng = createSeededRng(seed);
  const selected = shuffled(items, rng).slice(0, count);
  const words = [...uniqueWords];

  return selected.map((item, index) => {
    const distractors = shuffled(
      words.filter((word) => word !== item.w),
      rng,
    ).slice(0, 3);
    const choices = shuffled([item.w, ...distractors], rng);
    return {
      key: `hira-picture-${seed}-${index}-${item.w}`,
      type: 'choice',
      prompt: index % 2 === 0 ? 'えに あう ことばは\nどれ?' : 'えの なまえを\nみつけよう!',
      emphasis: null,
      visual: item.visual,
      choices,
      answer: choices.indexOf(item.w),
      explanation: `「${item.w}」だよ`,
    };
  });
}
