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
        role: z.enum(['dajare-sencho', 'sumizo']),
        expression: z.enum(['normal', 'angry', 'oops']),
        src: z.string().regex(/^assets\/images\/characters\/[a-z-]+\.png$/),
        source: z.string().regex(/^art\/source\/characters\/[a-z-]+\.png$/),
        alt: z.string().min(1),
        approvedAt: z.iso.date(),
      }),
    )
    .min(1),
});

export const seaSchema = z.object({
  id: z.literal('g1'),
  name: z.string().min(1),
  grade: z.literal(1),
  challenge: z
    .array(
      z.object({
        speaker: z.string().min(1),
        role: z.enum(['dajare-sencho', 'sumizo', 'buddy']),
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
              gen: z.enum(['hiraPicture', 'hiraDakuon', 'hiraSokuon', 'hiraChouon']).nullable(),
              status: z.enum(['playable', 'planned']),
              treasure: z.string().min(1),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});
