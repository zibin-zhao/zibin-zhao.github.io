import { describe, expect, it } from 'vitest';
import { HOME_RESEARCH_TITLES, selectByTitles } from '../src/data/home';

describe('selectByTitles', () => {
  it('selects named records in authored order', () => {
    expect(selectByTitles([{ title: 'B' }, { title: 'A' }, { title: 'C' }], ['A', 'C']).map((item) => item.title)).toEqual(['A', 'C']);
  });

  it('fails when canonical data is missing', () => {
    expect(() => selectByTitles([{ title: 'A' }], ['A', 'B'])).toThrow('Missing canonical Stitch item: B');
  });

  it('names the three papers', () => {
    expect(HOME_RESEARCH_TITLES).toEqual([
      'DNA-guided CRISPR–Cas12a effectors for programmable RNA recognition and cleavage',
      'Structure-enhanced deep learning accelerates aptamer selection for small molecule families like steroids',
      'Transforming ECG diagnosis: an in-depth review of transformer-based deep-learning models in cardiovascular disease detection',
    ]);
  });
});
