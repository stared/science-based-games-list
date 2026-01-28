import { defineCollection, z } from 'astro:content';

const games = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    url: z.string().url(),
    authors: z.array(z.string()).default(["Unknown"]),
    year: z.number().int().default(0),
    category: z.string(),
    sub_topics: z.array(z.string()).default([]),
    genres: z.array(z.string()).default([]),
    platforms: z.array(z.string()).default([]),
    pricing: z.array(z.enum(["free", "paid"])).default(["free"]),
    description: z.string(),
    image: z.string().default("/placeholder.png"),
    repo_url: z.string().default(""),
    license: z.string().default("proprietary"),
  }),
});

export const collections = {
  games,
};
