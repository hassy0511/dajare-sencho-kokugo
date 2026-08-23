import { z } from 'zod';

export const hiraWordPoolSchema = z.object({
  id: z.string().min(1),
  kind: z.literal('hira-seion'),
  items: z.array(z.object({ w: z.string().min(2), visual: z.string().min(1) })).min(8),
  dakuon: z
    .array(
      z.object({
        key: z.string().min(1),
        prompt: z.string().min(1),
        emphasis: z.string().min(1).nullable(),
        choices: z.array(z.string().min(1)).length(4),
        answer: z.string().min(1),
        explanation: z.string().min(1),
      }),
    )
    .min(8),
  sokuon: z
    .array(
      z.object({
        key: z.string().min(1),
        prompt: z.string().min(1),
        emphasis: z.string().min(1).nullable(),
        choices: z.array(z.string().min(1)).length(4),
        answer: z.string().min(1),
        explanation: z.string().min(1),
      }),
    )
    .min(8),
  chouon: z
    .array(
      z.object({
        key: z.string().min(1),
        prompt: z.string().min(1),
        emphasis: z.string().min(1).nullable(),
        choices: z.array(z.string().min(1)).length(4),
        answer: z.string().min(1),
        explanation: z.string().min(1),
      }),
    )
    .min(8),
  recoveryWords: z
    .array(
      z.object({
        key: z.string().min(1),
        prompt: z.string().min(1),
        emphasis: z.string().min(1).nullable(),
        choices: z.array(z.string().min(1)).length(4),
        answer: z.string().min(1),
        explanation: z.string().min(1),
      }),
    )
    .min(8),
});

export const curriculumDefinitionSchema = z.object({
  version: z.literal(1),
  hiragana: z.array(z.string().length(1)).length(46),
  katakana: z.array(z.string().length(1)).length(46),
  concepts: z
    .array(
      z.object({
        stageId: z.string().min(1),
        display: z.string().min(1),
        detail: z.string().min(1),
      }),
    )
    .min(20),
});

const wrongsSchema = z.array(z.string().min(1)).length(3);
const readingQuestionSchema = z.object({
  text: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
  wrongs: wrongsSchema,
});

export const grade1BankSchema = z.object({
  version: z.literal(1),
  youon: z.array(z.string().min(2)).min(8),
  katakana: z.array(z.object({ hira: z.string().min(1), kata: z.string().min(1) })).min(10),
  kanji: z
    .array(
      z.object({
        char: z.string().length(1),
        reading: z.string().min(1),
        group: z.enum(['nature', 'body', 'number', 'school', 'action']),
      }),
    )
    .length(80),
  strokes: z
    .array(z.object({ char: z.string().length(1), count: z.number().int().min(1).max(20) }))
    .min(8),
  categories: z
    .array(
      z.object({
        name: z.string().min(1),
        members: z.array(z.string().min(1)).length(3),
        outsider: z.string().min(1),
      }),
    )
    .min(8),
  counters: z.array(z.object({ thing: z.string().min(1), unit: z.string().min(1) })).min(10),
  polite: z.array(z.object({ plain: z.string().min(1), polite: z.string().min(1) })).min(8),
  sentences: z
    .array(
      z.object({
        text: z.string().min(1),
        subject: z.string().min(1),
        predicate: z.string().min(1),
      }),
    )
    .min(8),
  yousu: z
    .array(
      z.object({
        scene: z.string().min(1),
        answer: z.string().min(1),
        wrongs: wrongsSchema,
      }),
    )
    .min(8),
  shiritori: z
    .array(
      z.object({
        from: z.string().min(1),
        answer: z.string().min(1),
        wrongs: wrongsSchema,
      }),
    )
    .min(8),
  readings: z
    .array(
      z.object({
        text: z.string().min(1),
        who: z.string().min(1),
        what: z.string().min(1),
        place: z.string().min(1),
        keyword: z.string().min(1),
      }),
    )
    .min(12),
  sequences: z
    .array(
      z.object({
        title: z.string().min(1),
        events: z.array(z.string().min(1)).length(3),
      }),
    )
    .min(6),
  folktales: z.array(readingQuestionSchema.extend({ title: z.string().min(1) })).min(8),
  longReadings: z.array(readingQuestionSchema).min(8),
  sentenceTiles: z.array(z.array(z.string().min(1)).length(3)).min(8),
  particles: z
    .array(
      z.object({
        text: z.string().min(1),
        answer: z.string().min(1),
        wrongs: wrongsSchema,
      }),
    )
    .min(10),
  punctuation: z
    .array(
      z.object({
        plain: z.string().min(1),
        correct: z.string().min(1),
        wrongs: wrongsSchema,
      }),
    )
    .min(8),
  diarySequences: z.array(z.array(z.string().min(1)).length(3)).min(6),
  fixes: z
    .array(
      z.object({
        wrong: z.string().min(1),
        correct: z.string().min(1),
        wrongs: wrongsSchema,
      }),
    )
    .min(8),
});

export const grade2BankSchema = z.object({
  version: z.literal(1),
  kanji: z
    .array(
      z.object({
        char: z.string().length(1),
        reading: z.string().min(1),
        stageId: z.string().regex(/^g2-kanji-[a-h]$/),
      }),
    )
    .length(160),
  katakanaWords: z
    .array(
      z.object({
        key: z.string().min(1),
        clue: z.string().min(1),
        answer: z.string().min(2),
      }),
    )
    .min(12),
});

export const grade2CurriculumDefinitionSchema = z.object({
  version: z.literal(1),
  concepts: z
    .array(
      z.object({
        stageId: z.string().regex(/^g2-/),
        display: z.string().min(1),
        detail: z.string().min(1),
      }),
    )
    .min(20),
});

export const wordImageLibrarySchema = z.object({
  version: z.literal(1),
  generator: z.object({
    provider: z.string().min(1),
    model: z.string().min(1),
    mode: z.string().min(1),
    stylePrompt: z.string().min(1),
  }),
  items: z
    .array(
      z.object({
        key: z.string().min(1),
        word: z.string().min(1),
        src: z.string().regex(/^assets\/images\/words\/[a-z-]+\.png$/),
        alt: z.string().min(1),
        subjectPrompt: z.string().min(1),
      }),
    )
    .min(1),
});

export const characterImageLibrarySchema = z.object({
  version: z.literal(1),
  generator: z.object({
    provider: z.string().min(1),
    model: z.string().min(1),
    mode: z.string().min(1),
    styleGuide: z.literal('art/prompts/character-mascot-style.md'),
  }),
  items: z
    .array(
      z.object({
        key: z.string().min(1),
        role: z.enum(['dajare-sencho', 'sumizo', 'uragaeru']),
        expression: z.enum(['normal', 'angry', 'oops']),
        src: z.string().regex(/^assets\/images\/characters\/[a-z-]+\.png$/),
        source: z.string().regex(/^art\/source\/characters\/[a-z-]+\.png$/),
        alt: z.string().min(1),
        approvedAt: z.iso.date(),
      }),
    )
    .min(1),
});

export const worldImageLibrarySchema = z.object({
  version: z.literal(1),
  generator: z.object({
    provider: z.string().min(1),
    model: z.string().min(1),
    mode: z.string().min(1),
    styleReference: z.literal('art/source/characters/dajare-sencho-approved.png'),
  }),
  items: z
    .array(
      z.object({
        key: z.enum([
          'welcome-background',
          'ocean-map-background',
          'island-board-background',
          'welcome-ship',
          'g1-moji',
          'g1-kanji',
          'g1-kotoba',
          'g1-yomitoki',
          'g1-kakikata',
        ]),
        kind: z.enum(['background', 'ship', 'island']),
        src: z.string().regex(/^assets\/images\/world\/[a-z-]+\.(png|webp)$/),
        source: z.string().regex(/^art\/source\/world\/[a-z-]+-source\.png$/),
        alt: z.string().min(1),
      }),
    )
    .length(9),
});

export const seaSchema = z.object({
  id: z.enum(['g1', 'g2']),
  name: z.string().min(1),
  grade: z.union([z.literal(1), z.literal(2)]),
  challenge: z
    .array(
      z.object({
        speaker: z.string().min(1),
        role: z.enum(['dajare-sencho', 'sumizo', 'uragaeru', 'buddy']),
        text: z.string().min(1),
      }),
    )
    .min(3),
  islands: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
        subtitle: z.string().min(1),
        symbol: z.string().min(1),
        artKey: z
          .enum(['g1-moji', 'g1-kanji', 'g1-kotoba', 'g1-yomitoki', 'g1-kakikata'])
          .optional(),
        stages: z
          .array(
            z.object({
              id: z.string().min(1),
              name: z.string().min(1),
              scene: z.string().min(1),
              skill: z.string().min(1),
              skillRef: z.string().min(1),
              intro: z.string().min(1),
              marker: z.string().min(1).optional(),
              n: z.number().int().min(1).max(20),
              gen: z
                .enum(['hiraPicture', 'hiraDakuon', 'hiraSokuon', 'hiraChouon', 'grade1', 'grade2'])
                .nullable(),
              status: z.enum(['playable', 'planned']),
              treasure: z.string().min(1),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});
