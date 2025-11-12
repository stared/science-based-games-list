import { defineCollection, z } from 'astro:content';

const games = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    url: z.string().url(),
    category: z.string(),
    topics: z.array(z.string()),
    type: z.array(z.string()),
    platforms: z.array(z.string()),
    free: z.boolean(),
    source: z.string().url().optional(),
  }),
});

export const collections = {
  games,
};
