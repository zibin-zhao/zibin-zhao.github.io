import { describe, expect, it } from 'vitest';
import { HOME_RESEARCH_TITLES, HOME_VIBE_TITLES, selectByTitles } from '../src/data/home';

describe('selectByTitles', () => {
  it('selects named records in authored order', () => {
    expect(selectByTitles([{ title: 'B' }, { title: 'A' }, { title: 'C' }], ['A', 'C']).map((item) => item.title)).toEqual(['A', 'C']);
  });

  it('fails when canonical data is missing', () => {
    expect(() => selectByTitles([{ title: 'A' }], ['A', 'B'])).toThrow('Missing canonical Stitch item: B');
  });

  it('fails when canonical data contains a duplicate title', () => {
    const records = [
      { title: 'A', payload: 'first' },
      { title: 'A', payload: 'second' },
    ];
    expect(() => selectByTitles(records, ['A'])).toThrow('Duplicate canonical Stitch item: A');
  });

  it('fails when the authored selection repeats a title', () => {
    expect(() => selectByTitles([{ title: 'A' }], ['A', 'A'])).toThrow('Duplicate canonical Stitch selection: A');
  });

  it('names the three papers', () => {
    expect(HOME_RESEARCH_TITLES).toEqual([
      'DNA-guided CRISPR–Cas12a effectors for programmable RNA recognition and cleavage',
      'Structure-enhanced deep learning accelerates aptamer selection for small molecule families like steroids',
      'Transforming ECG diagnosis: an in-depth review of transformer-based deep-learning models in cardiovascular disease detection',
    ]);
  });

  it('fixes canonical Vibe order', () => {
    expect(HOME_VIBE_TITLES).toEqual(['Singularity', 'Medit', 'Yaos', 'Zen']);
    expect(HOME_VIBE_TITLES).not.toContain('CasMD');
  });
});
