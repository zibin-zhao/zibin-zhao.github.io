import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { pages, pathFor, descriptions } from '../src/lib/i18n';
import { projects } from '../src/data/projects';
import { promptPack } from '../src/data/prompts';

describe('public navigation and content contracts', () => {
  it('gives each locale a unique, stable route and page description', () => {
    const routes = ['en', 'zh'].flatMap((lang) =>
      pages.map((page) => pathFor(page, lang as 'en' | 'zh')),
    );
    expect(new Set(routes).size).toBe(14);
    expect(routes).toContain('/');
    expect(routes).toContain('/zh/');
    for (const lang of ['en', 'zh'] as const) {
      expect(new Set(pages.map((page) => descriptions[page][lang])).size).toBe(pages.length);
    }
  });
  it('keeps project identities unique and links explicit', () => {
    expect(new Set(projects.map((p) => p.id)).size).toBe(projects.length);
    for (const project of projects) {
      expect(project.href).toMatch(/^(https:\/\/|\/(?:medit|singularity)\/)/);
      for (const lang of ['en', 'zh'] as const) {
        expect(project.summary[lang].trim()).toBeTruthy();
        expect(project.contribution[lang].trim()).toBeTruthy();
      }
    }
  });
  it('preserves eight complete prompt stages and all eleven source prompt blocks', () => {
    expect(promptPack.stages).toHaveLength(8);
    expect(
      promptPack.stages.every((stage) =>
        stage.blocks.every((block) => block.text.trim().length > 60),
      ),
    ).toBe(true);
    expect(promptPack.stages.flatMap((stage) => stage.blocks).length).toBe(11);
  });
  it('lists the journal version once and links its earlier preprint', () => {
    const dir = 'src/content/publications';
    const files = readdirSync(dir);
    expect(files).not.toContain('dna-guided-cas-effector.md');
    expect(readFileSync(`${dir}/nature-biotech-cas12a.md`, 'utf8')).toContain(
      '10.21203/rs.3.rs-6705640/v1',
    );
    expect(readFileSync(`${dir}/onepot-snp-genotyping.md`, 'utf8')).toContain(
      '10.1038/s41467-026-75358-1',
    );
    expect(readFileSync(`${dir}/ecg-transformer-review.md`, 'utf8')).toContain('kind: preprint');
  });
});
