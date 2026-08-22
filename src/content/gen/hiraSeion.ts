import type { ChoiceQuestion, HiraWordPool, MojiChoiceItem } from '../../types/content';
import { curriculumIdsInText } from '../curriculum';
import { selectByCoverage } from './coverage';
import { createSeededRng, shuffled } from './rng';

export function makeHiraSeionQuiz(
  pool: HiraWordPool,
  count: number,
  seed: number,
  priorityIds: readonly string[] = [],
): ChoiceQuestion[] {
  const items = pool.items;
  const uniqueWords = new Set(items.map((item) => item.w));
  if (uniqueWords.size < 4) throw new Error('4つ以上の異なる言葉が必要です。');
  if (count > items.length) throw new Error('問題数より多い単語が必要です。');

  const rng = createSeededRng(seed);
  const recoveryCandidates = priorityIds.length > 0 ? pool.recoveryWords : [];
  const candidates: SeionCandidate[] = [
    ...items.map((item) => ({
      key: `picture-${item.visual}`,
      word: item.w,
      prompt: 'えに あう ことばは\nどれ?',
      emphasis: null,
      visual: item.visual,
      choices: wordsFor(items),
      explanation: `「${item.w}」だよ`,
    })),
    ...recoveryCandidates.map(recoveryCandidate),
  ];
  const selected = selectByCoverage(candidates, count, priorityIds, rng, (candidate) =>
    curriculumIdsInText('hiragana', candidate.word),
  );
  return selected.map((item, index) => {
    const distractors = shuffled(
      item.choices.filter((word) => word !== item.word),
      rng,
    ).slice(0, 3);
    const choices = shuffled([item.word, ...distractors], rng);
    return {
      key: `hira-seion-${seed}-${index}-${item.key}`,
      type: 'choice',
      prompt: item.visual && index % 2 === 1 ? 'えの なまえを\nみつけよう!' : item.prompt,
      emphasis: item.emphasis,
      visual: item.visual,
      choices,
      answer: choices.indexOf(item.word),
      explanation: item.explanation,
      curriculumItemIds: curriculumIdsInText('hiragana', item.word),
    };
  });
}

interface SeionCandidate {
  key: string;
  word: string;
  prompt: string;
  emphasis: string | null;
  visual: string | null;
  choices: string[];
  explanation: string;
}

function recoveryCandidate(item: MojiChoiceItem): SeionCandidate {
  return {
    key: `recovery-${item.key}`,
    word: item.answer,
    prompt: item.prompt,
    emphasis: item.emphasis,
    visual: null,
    choices: item.choices,
    explanation: item.explanation,
  };
}

function wordsFor(items: HiraWordPool['items']): string[] {
  return items.map((item) => item.w);
}
