import type {
  ChoiceQuestion,
  CurriculumEvidence,
  HiraWordItem,
  HiraWordPool,
} from '../../types/content';
import { curriculumCharacterId, curriculumConceptId, curriculumItemsForStage } from '../curriculum';
import { createSeededRng, shuffled } from './rng';

const STAGE_ID = 'g1-moji-seion';
const WORD_READING_ID = curriculumConceptId(STAGE_ID);

const HIRAGANA_ROWS = [
  [...'あいうえお'],
  [...'かきくけこ'],
  [...'さしすせそ'],
  [...'たちつてと'],
  [...'なにぬねの'],
  [...'はひふへほ'],
  [...'まみむめも'],
  [...'やゆよ'],
  [...'らりるれろ'],
  [...'わをん'],
] as const;

const SIMILAR_SHAPES = [
  [...'あおむ'],
  [...'いりこ'],
  [...'うつら'],
  [...'きさち'],
  [...'くしつ'],
  [...'けはほ'],
  [...'ぬめねれ'],
  [...'るろそ'],
  [...'わねれ'],
] as const;

interface HiraCandidate extends ChoiceQuestion {
  evidenceKey?: string;
}

type SeededRng = ReturnType<typeof createSeededRng>;

export function makeHiraSeionQuiz(
  pool: HiraWordPool,
  count: number,
  seed: number,
  priorityIds: readonly string[] = [],
  priorityEvidence: readonly CurriculumEvidence[] = [],
): ChoiceQuestion[] {
  if (pool.items.length < 4) throw new Error('ひらがなの絵は4つ以上必要です。');
  const rng = createSeededRng(seed);
  const candidates = [
    ...hiraganaMasteryCandidates(pool, rng),
    ...wordReadingCandidates(pool, rng),
    woUsageCandidate(pool),
  ];
  if (count > candidates.length) {
    throw new Error(`ひらがなは${count}問に対して問題候補が不足しています。`);
  }

  const selected: HiraCandidate[] = [];
  const selectedKeys = new Set<string>();
  const add = (candidate: HiraCandidate | undefined): void => {
    if (!candidate || selected.length >= count || selectedKeys.has(candidate.key)) return;
    selected.push(candidate);
    selectedKeys.add(candidate.key);
  };

  for (const evidence of shuffled(priorityEvidence, rng)) {
    const evidenceKey = keyForEvidence(evidence);
    add(
      shuffled(
        candidates.filter((candidate) => candidate.evidenceKey === evidenceKey),
        rng,
      )[0],
    );
  }
  if (priorityIds.includes(WORD_READING_ID)) {
    add(
      shuffled(
        candidates.filter((candidate) => candidate.curriculumItemIds[0] === WORD_READING_ID),
        rng,
      )[0],
    );
  }
  for (const candidate of shuffled(candidates, rng)) add(candidate);

  return selected;
}

function hiraganaMasteryCandidates(pool: HiraWordPool, rng: SeededRng): HiraCandidate[] {
  const characters = curriculumItemsForStage(STAGE_ID).filter((item) => item.kind === 'hiragana');
  return characters.flatMap((item) => {
    if (item.display === 'を') return [];
    const containing = pool.items.filter((word) => word.w.includes(item.display));
    if (containing.length === 0) {
      throw new Error(`「${item.display}」を含む承認済みの絵がありません。`);
    }
    const singleOccurrence = containing.filter(
      (word) => [...word.w].filter((character) => character === item.display).length === 1,
    );
    const spellingWords = singleOccurrence.length > 0 ? singleOccurrence : containing;
    return [
      ...containing.map((word) => letterToWordCandidate(item.id, item.display, word, pool, rng)),
      ...spellingWords.map((word) => wordToLetterCandidate(item.id, item.display, word, rng)),
    ];
  });
}

function letterToWordCandidate(
  itemId: string,
  character: string,
  correctWord: HiraWordItem,
  pool: HiraWordPool,
  rng: SeededRng,
): HiraCandidate {
  const distractors = shuffled(
    pool.items.filter((item) => item.visual !== correctWord.visual && !item.w.includes(character)),
    rng,
  ).slice(0, 3);
  if (distractors.length !== 3) {
    throw new Error(`「${character}」の絵の誤答候補が足りません。`);
  }
  const options = shuffled([correctWord, ...distractors], rng);
  const evidence: CurriculumEvidence = { itemId, facet: 'hira-letter-to-word' };
  return {
    key: `hira-letter-to-word-${character}-${correctWord.visual}`,
    type: 'choice',
    prompt: 'この もじが はいっている\nものは どれ?',
    emphasis: character,
    visual: null,
    choices: options.map((option) => option.w),
    choiceVisuals: options.map((option) => option.visual),
    answer: options.findIndex((option) => option.visual === correctWord.visual),
    explanation: `「${correctWord.w}」に「${character}」が はいっているよ`,
    curriculumItemIds: [itemId],
    curriculumEvidence: [evidence],
    evidenceKey: keyForEvidence(evidence),
  };
}

function wordToLetterCandidate(
  itemId: string,
  character: string,
  word: HiraWordItem,
  rng: SeededRng,
): HiraCandidate {
  const choices = shuffled([character, ...characterDistractors(character, rng)], rng);
  const evidence: CurriculumEvidence = { itemId, facet: 'hira-word-to-letter' };
  return {
    key: `hira-word-to-letter-${character}-${word.visual}`,
    type: 'choice',
    prompt: `「${maskCharacter(word.w, character)}」に はいる\nもじは どれ?`,
    emphasis: null,
    visual: word.visual,
    choices,
    answer: choices.indexOf(character),
    explanation: `「${word.w}」だから「${character}」が はいるよ`,
    curriculumItemIds: [itemId],
    curriculumEvidence: [evidence],
    evidenceKey: keyForEvidence(evidence),
  };
}

function wordReadingCandidates(pool: HiraWordPool, rng: SeededRng): HiraCandidate[] {
  return pool.items.map((word) => {
    const distractors = shuffled(
      pool.items.filter((item) => item.visual !== word.visual),
      rng,
    ).slice(0, 3);
    const options = shuffled([word, ...distractors], rng);
    return {
      key: `hira-word-reading-${word.visual}`,
      type: 'choice',
      prompt: 'この ことばの えは\nどれ?',
      emphasis: word.w,
      visual: null,
      choices: options.map((option) => option.w),
      choiceVisuals: options.map((option) => option.visual),
      answer: options.findIndex((option) => option.visual === word.visual),
      explanation: `「${word.w}」の えだよ`,
      curriculumItemIds: [WORD_READING_ID],
    };
  });
}

function woUsageCandidate(pool: HiraWordPool): HiraCandidate {
  const source = pool.recoveryWords.find((item) => item.key === 'hon-wo-yomu');
  if (!source) throw new Error('「を」の専用問題がありません。');
  const itemId = curriculumCharacterId('hiragana', 'を');
  const evidence: CurriculumEvidence = { itemId, facet: 'hira-use' };
  return {
    key: 'hira-use-を-hon-wo-yomu',
    type: 'choice',
    prompt: '「ほん □ よむ」\n□に はいる もじは?',
    emphasis: null,
    visual: null,
    choices: ['を', 'は', 'へ', 'が'],
    answer: 0,
    explanation: source.explanation,
    curriculumItemIds: [itemId],
    curriculumEvidence: [evidence],
    evidenceKey: keyForEvidence(evidence),
  };
}

function characterDistractors(character: string, rng: SeededRng): string[] {
  const related = [
    ...SIMILAR_SHAPES.filter((group) => group.includes(character)).flat(),
    ...HIRAGANA_ROWS.filter((group) => group.includes(character)).flat(),
  ].filter((candidate) => candidate !== character);
  const all = HIRAGANA_ROWS.flat().filter((candidate) => candidate !== character);
  const prioritized = [...new Set([...shuffled(related, rng), ...shuffled(all, rng)])];
  return prioritized.slice(0, 3);
}

function maskCharacter(word: string, character: string): string {
  return word.replace(character, '□');
}

function keyForEvidence(evidence: CurriculumEvidence): string {
  return `${evidence.itemId}:${evidence.facet}`;
}
