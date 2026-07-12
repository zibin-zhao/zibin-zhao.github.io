export const HOME_RESEARCH_TITLES = [
  'DNA-guided CRISPR–Cas12a effectors for programmable RNA recognition and cleavage',
  'Structure-enhanced deep learning accelerates aptamer selection for small molecule families like steroids',
  'Transforming ECG diagnosis: an in-depth review of transformer-based deep-learning models in cardiovascular disease detection',
] as const;

export function selectByTitles<T extends { title: string }>(items: T[], titles: readonly string[]): T[] {
  const byTitle = new Map(items.map((item) => [item.title, item]));
  return titles.map((title) => {
    const item = byTitle.get(title);
    if (!item) throw new Error(`Missing canonical Stitch item: ${title}`);
    return item;
  });
}
