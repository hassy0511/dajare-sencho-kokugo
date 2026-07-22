import { z } from 'zod';

export const hiraWordPoolSchema = z.object({
  id: z.string().min(1),
  kind: z.literal('hira-seion'),
  items: z.array(z.object({ w: z.string().min(2) })).min(10),
});

export const seaSchema = z.object({
  grade: z.literal(1),
  islands: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().min(1),
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
              gen: z.literal('hiraSeion'),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
});
