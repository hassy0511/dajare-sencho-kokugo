import { z } from 'zod';

export const hiraWordPoolSchema = z.object({
  id: z.string().min(1),
  kind: z.literal('hira-seion'),
  items: z.array(z.object({ w: z.string().min(2), visual: z.string().min(1) })).min(8),
});

export const seaSchema = z.object({
  id: z.literal('g1'),
  name: z.string().min(1),
  grade: z.literal(1),
  challenge: z
    .array(
      z.object({
        speaker: z.string().min(1),
        role: z.enum(['captain', 'sumizo', 'buddy']),
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
              n: z.number().int().min(1).max(20),
              gen: z.literal('hiraPicture').nullable(),
              status: z.enum(['playable', 'planned']),
              treasure: z.string().min(1),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});
