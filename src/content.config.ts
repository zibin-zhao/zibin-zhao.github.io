import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const publications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/publications' }),
  schema: z.object({
    title: z.string(), authors: z.string().optional(), venue: z.string().optional(),
    year: z.number(),
    links: z.object({ pdf: z.string().optional(), doi: z.string().optional(), code: z.string().optional(), scholar: z.string().optional() }).optional(),
    featured: z.boolean().default(false), firstAuthor: z.boolean().default(false),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({ title: z.string(), blurb: z.string(), blurbZh: z.string().optional(), type: z.string(), tags: z.array(z.string()).default([]), href: z.string().optional(), order: z.number().default(0) }),
});

const vibe = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/vibe' }),
  schema: z.object({ title: z.string(), titleZh: z.string().optional(), blurb: z.string(), blurbZh: z.string().optional(), tags: z.array(z.string()).default([]), href: z.string().optional(), screenshot: z.string().optional(), preview: z.enum(['medit']).optional(), comingSoon: z.boolean().default(false), order: z.number().default(0) }),
});

export const collections = { publications, projects, vibe };
