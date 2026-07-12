export const HOME_RESEARCH_TITLES = [
  'DNA-guided CRISPR–Cas12a effectors for programmable RNA recognition and cleavage',
  'Structure-enhanced deep learning accelerates aptamer selection for small molecule families like steroids',
  'Transforming ECG diagnosis: an in-depth review of transformer-based deep-learning models in cardiovascular disease detection',
] as const;

export const HOME_VIBE_TITLES = [
  'CasMD',
  'Singularity',
  'Medit',
  'Yaos',
  'Zen',
] as const;

export function selectByTitles<T extends { title: string }>(items: T[], titles: readonly string[]): T[] {
  const byTitle = new Map<string, T>();
  for (const item of items) {
    if (byTitle.has(item.title)) throw new Error(`Duplicate canonical Stitch item: ${item.title}`);
    byTitle.set(item.title, item);
  }

  const requestedTitles = new Set<string>();
  for (const title of titles) {
    if (requestedTitles.has(title)) throw new Error(`Duplicate canonical Stitch selection: ${title}`);
    requestedTitles.add(title);
  }

  return titles.map((title) => {
    const item = byTitle.get(title);
    if (!item) throw new Error(`Missing canonical Stitch item: ${title}`);
    return item;
  });
}
