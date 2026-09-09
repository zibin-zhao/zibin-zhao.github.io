import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const publications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/publications' }),
  schema: z.object({
    title: z.string(),
    authors: z.string(),
    venue: z.string(),
    year: z.number(),
    kind: z.enum(['journal', 'preprint']).default('journal'),
    links: z.object({
      pdf: z.url().optional(),
      doi: z.url().optional(),
      code: z.url().optional(),
      scholar: z.url().optional(),
      preprint: z.url().optional(),
      correction: z.url().optional(),
    }),
    featured: z.boolean().default(false),
    firstAuthor: z.boolean().default(false),
  }),
});
export const collections = { publications };
