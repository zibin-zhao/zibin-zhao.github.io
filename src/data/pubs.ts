export type Pub = { year: number; title: string; venue?: string; authors?: string;
  links?: { pdf?: string; doi?: string; code?: string; scholar?: string }; featured?: boolean; firstAuthor?: boolean };

const titleCollator = new Intl.Collator('en', {
  usage: 'sort',
  sensitivity: 'base',
  ignorePunctuation: true,
  numeric: true,
});

export function sortPubs<T extends { year: number; title: string }>(pubs: T[]): T[] {
  return [...pubs].sort((a, b) => (b.year - a.year) || titleCollator.compare(a.title, b.title));
}
