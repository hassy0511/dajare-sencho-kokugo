import type {
  ChoiceQuestion,
  Grade1Bank,
  HiraWordPool,
  KanjiGroup,
  MojiChoiceItem,
} from '../../types/content';
import { createSeededRng, shuffled } from './rng';

interface Candidate {
  key: string;
  prompt: string;
  emphasis: string | null;
  visual?: string;
  correct: string;
  wrongs?: readonly string[];
  optionPool?: readonly string[];
  explanation: string;
}

type SeededRng = ReturnType<typeof createSeededRng>;

export function makeGrade1Quiz(
  stageId: string,
  bank: Grade1Bank,
  hira: HiraWordPool,
  count: number,
  seed: number,
): ChoiceQuestion[] {
  const rng = createSeededRng(seed);
  const candidates = candidatesForStage(stageId, bank, hira);
  if (count > candidates.length) {
    throw new Error(`${stageId}は${count}問に対して問題候補が不足しています。`);
  }
  const selected = shuffled(candidates, rng).slice(0, count);
  if (new Set(selected.map((item) => item.key)).size !== selected.length) {
    throw new Error(`${stageId}の問題keyが重複しています。`);
  }

  return selected.map((item, index) => makeQuestion(stageId, item, index, seed, rng));
}

function makeQuestion(
  stageId: string,
  item: Candidate,
  index: number,
  seed: number,
  rng: SeededRng,
): ChoiceQuestion {
  const optionSource = item.wrongs ?? item.optionPool ?? [];
  const wrongs = shuffled(
    [...new Set(optionSource)].filter((option) => option !== item.correct),
    rng,
  ).slice(0, 3);
  if (wrongs.length !== 3) {
    throw new Error(`${stageId}/${item.key}の誤答候補は異なる3つが必要です。`);
  }
  const choices = shuffled([item.correct, ...wrongs], rng);
  return {
    key: `${stageId}-${seed}-${index}-${item.key}`,
    type: 'choice',
    prompt: item.prompt,
    emphasis: item.emphasis,
    visual: item.visual ?? null,
    choices,
    answer: choices.indexOf(item.correct),
    explanation: item.explanation,
  };
}

function candidatesForStage(stageId: string, bank: Grade1Bank, hira: HiraWordPool): Candidate[] {
  switch (stageId) {
    case 'g1-moji-test1':
      return [
        ...hiraPictureCandidates(hira),
        ...mojiItems('dakuon', hira.dakuon),
        ...mojiItems('sokuon', hira.sokuon),
        ...mojiItems('chouon', hira.chouon),
      ];
    case 'g1-moji-youon':
      return youonCandidates(bank);
    case 'g1-moji-katakana':
      return katakanaCandidates(bank);
    case 'g1-moji-boss':
      return [
        ...hiraPictureCandidates(hira),
        ...mojiItems('dakuon', hira.dakuon),
        ...mojiItems('sokuon', hira.sokuon),
        ...mojiItems('chouon', hira.chouon),
        ...youonCandidates(bank),
        ...katakanaCandidates(bank),
      ];
    case 'g1-kanji-shizen':
      return kanjiReadingCandidates(bank, 'nature');
    case 'g1-kanji-karada':
      return kanjiReadingCandidates(bank, 'body');
    case 'g1-kanji-kazu':
      return kanjiReadingCandidates(bank, 'number');
    case 'g1-kanji-musubi':
      return kanjiMusubiCandidates(bank);
    case 'g1-kanji-test1':
      return ['nature', 'body', 'number'].flatMap((group) =>
        kanjiReadingCandidates(bank, group as KanjiGroup),
      );
    case 'g1-kanji-gakko':
      return kanjiReadingCandidates(bank, 'school');
    case 'g1-kanji-muki':
      return kanjiReadingCandidates(bank, 'action');
    case 'g1-kanji-kakusu':
      return strokeCandidates(bank);
    case 'g1-kanji-hori':
      return kanjiHoriCandidates(bank);
    case 'g1-kanji-boss':
      return [
        ...kanjiReadingCandidates(bank),
        ...kanjiHoriCandidates(bank),
        ...strokeCandidates(bank),
      ];
    case 'g1-kotoba-nakama':
      return categoryCandidates(bank);
    case 'g1-kotoba-kazoe':
      return counterCandidates(bank);
    case 'g1-kotoba-teinei':
      return politeCandidates(bank);
    case 'g1-kotoba-daredou':
      return sentenceCandidates(bank);
    case 'g1-kotoba-test1':
      return [
        ...categoryCandidates(bank),
        ...counterCandidates(bank),
        ...politeCandidates(bank),
        ...sentenceCandidates(bank),
      ];
    case 'g1-kotoba-yousu':
      return yousuCandidates(bank);
    case 'g1-kotoba-shiritori':
      return shiritoriCandidates(bank);
    case 'g1-kotoba-boss':
      return [
        ...categoryCandidates(bank),
        ...counterCandidates(bank),
        ...politeCandidates(bank),
        ...sentenceCandidates(bank),
        ...yousuCandidates(bank),
        ...shiritoriCandidates(bank),
      ];
    case 'g1-yomi-dare':
      return whoCandidates(bank);
    case 'g1-yomi-nani':
      return whatPlaceCandidates(bank);
    case 'g1-yomi-junban':
      return sequenceCandidates(bank);
    case 'g1-yomi-kotoba':
      return keywordCandidates(bank);
    case 'g1-yomi-test1':
      return [
        ...whoCandidates(bank),
        ...whatPlaceCandidates(bank),
        ...sequenceCandidates(bank),
        ...keywordCandidates(bank),
      ];
    case 'g1-yomi-mukashi':
      return folktaleCandidates(bank);
    case 'g1-yomi-nagabun':
      return longReadingCandidates(bank);
    case 'g1-yomi-boss':
      return [
        ...whoCandidates(bank),
        ...whatPlaceCandidates(bank),
        ...sequenceCandidates(bank),
        ...keywordCandidates(bank),
        ...folktaleCandidates(bank),
        ...longReadingCandidates(bank),
      ];
    case 'g1-kaki-kumitate':
      return sentenceTileCandidates(bank);
    case 'g1-kaki-teniwoha':
      return particleCandidates(bank);
    case 'g1-kaki-kutouten':
      return punctuationCandidates(bank);
    case 'g1-kaki-test1':
      return [
        ...sentenceTileCandidates(bank),
        ...particleCandidates(bank),
        ...punctuationCandidates(bank),
      ];
    case 'g1-kaki-junsaku':
      return diaryCandidates(bank);
    case 'g1-kaki-naoshi':
      return fixCandidates(bank);
    case 'g1-kaki-boss':
      return [
        ...sentenceTileCandidates(bank),
        ...particleCandidates(bank),
        ...punctuationCandidates(bank),
        ...diaryCandidates(bank),
        ...fixCandidates(bank),
      ];
    default:
      throw new Error(`1年生問題バンクに未登録のステージです: ${stageId}`);
  }
}

function hiraPictureCandidates(hira: HiraWordPool): Candidate[] {
  const words = hira.items.map((item) => item.w);
  return hira.items.map((item, index) => ({
    key: `hira-picture-${item.visual}`,
    prompt: index % 2 === 0 ? 'えに あう ことばは\nどれ?' : 'えの なまえを\nみつけよう!',
    emphasis: null,
    visual: item.visual,
    correct: item.w,
    optionPool: words,
    explanation: `「${item.w}」だよ`,
  }));
}

function mojiItems(prefix: string, items: readonly MojiChoiceItem[]): Candidate[] {
  return items.map((item) => ({
    key: `${prefix}-${item.key}`,
    prompt: item.prompt,
    emphasis: item.emphasis,
    correct: item.answer,
    wrongs: item.choices,
    explanation: item.explanation,
  }));
}

function youonCandidates(bank: Grade1Bank): Candidate[] {
  return bank.youon.map((word) => {
    const large = word.replaceAll('ゃ', 'や').replaceAll('ゅ', 'ゆ').replaceAll('ょ', 'よ');
    const missing = word.replace(/[ゃゅょ]/u, '');
    const swapped = word.replace(/[ゃゅょ]/gu, (character) => {
      const replacements: Record<string, string> = { ゃ: 'ゅ', ゅ: 'ょ', ょ: 'ゃ' };
      return replacements[character] ?? character;
    });
    return {
      key: `youon-${word}`,
      prompt: 'ちいさい「ゃゅょ」を\nただしく つかっているのは?',
      emphasis: large,
      correct: word,
      wrongs: [large, missing, swapped],
      explanation: `ちいさい もじを つかって「${word}」だよ`,
    };
  });
}

function katakanaCandidates(bank: Grade1Bank): Candidate[] {
  const options = bank.katakana.map((item) => item.kata);
  return bank.katakana.map((item) => ({
    key: `katakana-${item.kata}`,
    prompt: 'カタカナに すると\nどれ?',
    emphasis: item.hira,
    correct: item.kata,
    optionPool: options,
    explanation: `カタカナでは「${item.kata}」だよ`,
  }));
}

function kanjiReadingCandidates(bank: Grade1Bank, group?: KanjiGroup): Candidate[] {
  const items = group ? bank.kanji.filter((item) => item.group === group) : bank.kanji;
  const readings = bank.kanji.map((item) => item.reading);
  return items.map((item) => ({
    key: `kanji-read-${item.char}`,
    prompt: 'この かんじの\nよみは どれ?',
    emphasis: item.char,
    correct: item.reading,
    optionPool: readings,
    explanation: `「${item.char}」は「${item.reading}」と よむよ`,
  }));
}

function kanjiMusubiCandidates(bank: Grade1Bank): Candidate[] {
  return bank.kanji.flatMap((item) => [
    {
      key: `musubi-reading-${item.char}`,
      prompt: 'かんじと よみを\nむすぼう',
      emphasis: item.char,
      correct: item.reading,
      optionPool: bank.kanji.map((candidate) => candidate.reading),
      explanation: `「${item.char}」は「${item.reading}」だよ`,
    },
    {
      key: `musubi-char-${item.char}`,
      prompt: `「${item.reading}」と よむ\nかんじは どれ?`,
      emphasis: item.reading,
      correct: item.char,
      optionPool: bank.kanji
        .filter((candidate) => candidate.reading !== item.reading)
        .map((candidate) => candidate.char),
      explanation: `「${item.reading}」は「${item.char}」だよ`,
    },
  ]);
}

function strokeCandidates(bank: Grade1Bank): Candidate[] {
  return bank.strokes.map((item) => {
    const counts = [item.count - 1, item.count + 1, item.count + 2, item.count + 3]
      .filter((count) => count > 0 && count !== item.count)
      .slice(0, 3)
      .map((count) => `${count}かく`);
    return {
      key: `stroke-${item.char}`,
      prompt: 'この かんじは\nなんかく?',
      emphasis: item.char,
      correct: `${item.count}かく`,
      wrongs: counts,
      explanation: `「${item.char}」は ${item.count}かくで かくよ`,
    };
  });
}

function kanjiHoriCandidates(bank: Grade1Bank): Candidate[] {
  return bank.kanji.map((item) => ({
    key: `hori-${item.char}`,
    prompt: `「${item.reading}」と よむ\nかんじを ほりだそう`,
    emphasis: 'どの かんじ?',
    correct: item.char,
    optionPool: bank.kanji
      .filter((candidate) => candidate.reading !== item.reading)
      .map((candidate) => candidate.char),
    explanation: `「${item.reading}」と よむのは「${item.char}」だよ`,
  }));
}

function categoryCandidates(bank: Grade1Bank): Candidate[] {
  const categoryNames = bank.categories.map((item) => item.name);
  return bank.categories.flatMap((item) => [
    {
      key: `category-name-${item.name}`,
      prompt: 'まとめて なんと\nよぶ ことば?',
      emphasis: item.members.join('・'),
      correct: item.name,
      optionPool: categoryNames,
      explanation: `${item.members.join('・')}は「${item.name}」の なかまだよ`,
    },
    {
      key: `category-out-${item.name}`,
      prompt: 'なかまでは ない\nことばは どれ?',
      emphasis: item.name,
      correct: item.outsider,
      wrongs: item.members,
      explanation: `「${item.outsider}」だけ ${item.name}では ないよ`,
    },
  ]);
}

function counterCandidates(bank: Grade1Bank): Candidate[] {
  const units = bank.counters.map((item) => item.unit);
  return bank.counters.map((item) => ({
    key: `counter-${item.thing}`,
    prompt: `${item.thing}を かぞえる\nことばは どれ?`,
    emphasis: item.thing,
    correct: item.unit,
    optionPool: item.thing === 'とり' ? units.filter((unit) => unit !== 'ひき') : units,
    explanation: `${item.thing}は「${item.unit}」で かぞえるよ`,
  }));
}

function politeCandidates(bank: Grade1Bank): Candidate[] {
  const options = bank.polite.map((item) => item.polite);
  return bank.polite.map((item) => ({
    key: `polite-${item.plain}`,
    prompt: 'ていねいに いうと\nどれ?',
    emphasis: item.plain,
    correct: item.polite,
    optionPool: options,
    explanation: `「${item.plain}」を ていねいに いうと「${item.polite}」だよ`,
  }));
}

function sentenceCandidates(bank: Grade1Bank): Candidate[] {
  const subjects = bank.sentences.map((item) => item.subject);
  const predicates = bank.sentences.map((item) => item.predicate);
  return bank.sentences.flatMap((item) => [
    {
      key: `subject-${item.subject}`,
      prompt: '「だれが・なにが」に\nあたる ことばは?',
      emphasis: item.text,
      correct: item.subject,
      optionPool: subjects,
      explanation: `「${item.subject}」が だれが・なにがの ことばだよ`,
    },
    {
      key: `predicate-${item.subject}`,
      prompt: '「どうした」に\nあたる ことばは?',
      emphasis: item.text,
      correct: item.predicate,
      optionPool: predicates,
      explanation: `「${item.predicate}」が どうしたの ことばだよ`,
    },
  ]);
}

function yousuCandidates(bank: Grade1Bank): Candidate[] {
  return bank.yousu.map((item, index) => ({
    key: `yousu-${index}`,
    prompt: 'ようすに あう\nことばは どれ?',
    emphasis: item.scene,
    correct: item.answer,
    wrongs: item.wrongs,
    explanation: `この ようすは「${item.answer}」だよ`,
  }));
}

function shiritoriCandidates(bank: Grade1Bank): Candidate[] {
  return bank.shiritori.map((item) => ({
    key: `shiritori-${item.from}`,
    prompt: 'しりとりで\nつながる ことばは?',
    emphasis: `${item.from} → ?`,
    correct: item.answer,
    wrongs: item.wrongs,
    explanation: `「${item.from}」の さいごの おとから「${item.answer}」へ つながるよ`,
  }));
}

function whoCandidates(bank: Grade1Bank): Candidate[] {
  const options = bank.readings.map((item) => item.who);
  return bank.readings.map((item, index) => ({
    key: `who-${index}`,
    prompt: 'したのは だれ?',
    emphasis: item.text,
    correct: item.who,
    optionPool: options,
    explanation: `${item.who}が した おはなしだよ`,
  }));
}

function whatPlaceCandidates(bank: Grade1Bank): Candidate[] {
  const whats = bank.readings.map((item) => item.what);
  const places = bank.readings.map((item) => item.place);
  return bank.readings.flatMap((item, index) => [
    {
      key: `what-${index}`,
      prompt: 'なにを した?',
      emphasis: item.text,
      correct: item.what,
      optionPool: whats,
      explanation: `したことは「${item.what}」だよ`,
    },
    {
      key: `place-${index}`,
      prompt: 'どこで した?',
      emphasis: item.text,
      correct: item.place,
      optionPool: places,
      explanation: `ばしょは「${item.place}」だよ`,
    },
  ]);
}

function sequenceCandidates(bank: Grade1Bank): Candidate[] {
  const allEvents = bank.sequences.flatMap((item) => item.events);
  return bank.sequences.flatMap((item) => [
    {
      key: `sequence-first-${item.title}`,
      prompt: `${item.title}で\nはじめに することは?`,
      emphasis: shuffledLabel(item.events),
      correct: item.events[0] ?? '',
      optionPool: allEvents,
      explanation: `はじめは「${item.events[0]}」だよ`,
    },
    {
      key: `sequence-last-${item.title}`,
      prompt: `${item.title}で\nさいごに することは?`,
      emphasis: shuffledLabel(item.events),
      correct: item.events[2] ?? '',
      optionPool: allEvents,
      explanation: `さいごは「${item.events[2]}」だよ`,
    },
  ]);
}

function keywordCandidates(bank: Grade1Bank): Candidate[] {
  const options = bank.readings.flatMap((item) => [item.keyword, item.who, item.place]);
  return bank.readings.map((item, index) => ({
    key: `keyword-${index}`,
    prompt: 'おはなしに でてきた\nことばは どれ?',
    emphasis: item.text,
    correct: item.keyword,
    optionPool: options.filter((option) => !item.text.includes(option)),
    explanation: `おはなしに「${item.keyword}」が でてきたね`,
  }));
}

function folktaleCandidates(bank: Grade1Bank): Candidate[] {
  return bank.folktales.map((item) => ({
    key: `folktale-${item.title}`,
    prompt: item.question,
    emphasis: `${item.title}\n${item.text}`,
    correct: item.answer,
    wrongs: item.wrongs,
    explanation: `こたえは「${item.answer}」だよ`,
  }));
}

function longReadingCandidates(bank: Grade1Bank): Candidate[] {
  return bank.longReadings.map((item, index) => ({
    key: `long-${index}`,
    prompt: item.question,
    emphasis: item.text,
    correct: item.answer,
    wrongs: item.wrongs,
    explanation: `おはなしを よむと「${item.answer}」だと わかるよ`,
  }));
}

function sentenceTileCandidates(bank: Grade1Bank): Candidate[] {
  return bank.sentenceTiles.map((tiles, index) => ({
    key: `tiles-${index}`,
    prompt: 'ことばを ならべて\nできる ぶんは どれ?',
    emphasis: shuffledLabel(tiles),
    correct: tiles.join(' '),
    wrongs: orderWrongs(tiles, ' '),
    explanation: `「${tiles.join(' ')}」の じゅんばんだよ`,
  }));
}

function particleCandidates(bank: Grade1Bank): Candidate[] {
  return bank.particles.map((item, index) => ({
    key: `particle-${index}`,
    prompt: '□に はいる\nことばは どれ?',
    emphasis: item.text,
    correct: item.answer,
    wrongs: item.wrongs,
    explanation: `□には「${item.answer}」が はいるよ`,
  }));
}

function punctuationCandidates(bank: Grade1Bank): Candidate[] {
  return bank.punctuation.map((item, index) => ({
    key: `punct-${index}`,
    prompt: 'まるや てんを\nただしく いれた ぶんは?',
    emphasis: item.plain,
    correct: item.correct,
    wrongs: item.wrongs,
    explanation: `「${item.correct}」が ただしい ぶんだよ`,
  }));
}

function diaryCandidates(bank: Grade1Bank): Candidate[] {
  return bank.diarySequences.map((events, index) => ({
    key: `diary-${index}`,
    prompt: 'できごとの じゅんばんが\nただしいのは どれ?',
    emphasis: shuffledLabel(events),
    correct: events.join(' → '),
    wrongs: orderWrongs(events, ' → '),
    explanation: `「${events.join(' → ')}」の じゅんばんだよ`,
  }));
}

function fixCandidates(bank: Grade1Bank): Candidate[] {
  return bank.fixes.map((item, index) => ({
    key: `fix-${index}`,
    prompt: 'よみかえして\nなおした ぶんは どれ?',
    emphasis: item.wrong,
    correct: item.correct,
    wrongs: item.wrongs,
    explanation: `「${item.correct}」と なおすよ`,
  }));
}

function shuffledLabel(items: readonly string[]): string {
  return `${items[1]} / ${items[2]} / ${items[0]}`;
}

function orderWrongs(items: readonly string[], separator: string): string[] {
  const [first = '', second = '', third = ''] = items;
  return [
    [second, third, first].join(separator),
    [third, first, second].join(separator),
    [first, third, second].join(separator),
  ];
}
