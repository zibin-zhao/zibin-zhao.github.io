export type Pub = { year: number; title: string; venue?: string; authors?: string;
  links?: { pdf?: string; doi?: string; code?: string; scholar?: string }; featured?: boolean; firstAuthor?: boolean };

export function sortPubs<T extends { year: number }>(pubs: T[]): T[] {
  return [...pubs].sort((a, b) => b.year - a.year);
}
