import { projects } from '../data/projects';
import { t, type Lang, type Localized } from './i18n';

export interface ArchiveLeaf {
  id: string;
  title: string;
  kicker: string;
  summary: string;
  detail: string;
  links: { label: string; href: string }[];
}

type ArchivePublication = {
  id: string;
  data: {
    title: string;
    authors: string;
    venue?: string;
    year: number;
    links?: { doi?: string; preprint?: string; correction?: string };
  };
};

const paperTitles = {
  'nature-biotech-cas12a': { en: 'DNA-guided Cas12a', zh: 'DNA 引导的 Cas12a' },
  'ecg-patch-12lead': { en: '12-lead ECG patch', zh: '十二导联心电贴片' },
  'dna-hydrogel-oect': { en: 'DNA hydrogel + OECT', zh: 'DNA 水凝胶与 OECT' },
} satisfies Record<string, Localized>;

export function buildArchiveLeaves(lang: Lang, publications: ArchivePublication[]): ArchiveLeaf[] {
  if (projects.length !== 6)
    throw new Error('The nine-leaf archive requires exactly six curated projects.');

  const paper = (id: keyof typeof paperTitles): ArchiveLeaf => {
    const publication = publications.find((entry) => entry.id === id);
    if (!publication) throw new Error(`The archive is missing publication: ${id}`);
    const { data } = publication;
    const links: ArchiveLeaf['links'] = [];
    if (data.links?.doi)
      links.push({ label: lang === 'en' ? 'Read article' : '阅读论文', href: data.links.doi });
    if (data.links?.preprint)
      links.push({
        label: lang === 'en' ? 'Earlier preprint' : '早期预印本',
        href: data.links.preprint,
      });
    if (data.links?.correction)
      links.push({
        label: lang === 'en' ? 'Author correction' : '作者更正',
        href: data.links.correction,
      });
    return {
      id: publication.id,
      title: t(paperTitles[id], lang),
      kicker: data.venue ? `${data.venue} · ${data.year}` : String(data.year),
      summary: data.title,
      detail: data.authors,
      links,
    };
  };

  const projectLeaves = projects.map((project): ArchiveLeaf => {
    const links: ArchiveLeaf['links'] = [{ label: t(project.action, lang), href: project.href }];
    if (project.source)
      links.push({ label: lang === 'en' ? 'Source code' : '源代码', href: project.source });
    if (project.paper) links.push({ label: lang === 'en' ? 'Paper' : '论文', href: project.paper });
    return {
      id: project.id,
      title: project.name,
      kicker: t(project.type, lang),
      summary: t(project.summary, lang),
      detail: t(project.contribution, lang),
      links,
    };
  });

  return [
    paper('nature-biotech-cas12a'),
    ...projectLeaves,
    paper('ecg-patch-12lead'),
    paper('dna-hydrogel-oect'),
  ];
}
