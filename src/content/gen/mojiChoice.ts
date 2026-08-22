import type { ChoiceQuestion, MojiChoiceItem } from '../../types/content';
import { createSeededRng, shuffled } from './rng';

export function makeMojiChoiceQuiz(
  category: string,
  items: readonly MojiChoiceItem[],
  count: number,
  seed: number,
  curriculumItemIds: readonly string[] = [],
): ChoiceQuestion[] {
  if (count > items.length) throw new Error('問題数より多い問題データが必要です。');
  if (new Set(items.map((item) => item.key)).size !== items.length) {
    throw new Error('問題データのkeyが重複しています。');
  }

  const rng = createSeededRng(seed);
  const selected = shuffled(items, rng).slice(0, count);

  return selected.map((item, index) => {
    if (new Set(item.choices).size !== 4) {
      throw new Error(`${item.key}の選択肢は異なる4つが必要です。`);
    }
    if (item.choices.filter((choice) => choice === item.answer).length !== 1) {
      throw new Error(`${item.key}の正解は選択肢に1つだけ必要です。`);
    }
    const choices = shuffled(item.choices, rng);
    return {
      key: `${category}-${seed}-${index}-${item.key}`,
      type: 'choice',
      prompt: item.prompt,
      emphasis: item.emphasis,
      visual: null,
      choices,
      answer: choices.indexOf(item.answer),
      explanation: item.explanation,
      curriculumItemIds: [...curriculumItemIds],
    };
  });
}
