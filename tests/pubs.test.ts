import { describe, it, expect } from 'vitest';
import { sortPubs } from '../src/data/pubs';

const sample = [
  { year: 2023, title: 'B', featured: false },
  { year: 2026, title: 'A', featured: true },
  { year: 2025, title: 'C', featured: false },
];

describe('sortPubs', () => {
  it('orders by year descending', () => {
    const out = sortPubs(sample);
    expect(out.map(p => p.year)).toEqual([2026, 2025, 2023]);
  });
  it('keeps featured flag intact', () => {
    expect(sortPubs(sample)[0].featured).toBe(true);
  });

  it('orders same-year publications by semantic title without mutating input', () => {
    const shuffled = [
      { year: 2025, title: 'Structure-enhanced learning' },
      { year: 2026, title: 'Thermodynamic diagnostics' },
      { year: 2025, title: 'Benchtop testing' },
      { year: 2025, title: 'DNA-guided effectors' },
      { year: 2025, title: 'DNA hydrogel interfaces' },
    ];
    const originalTitles = shuffled.map((publication) => publication.title);

    expect(sortPubs(shuffled).map((publication) => publication.title)).toEqual([
      'Thermodynamic diagnostics',
      'Benchtop testing',
      'DNA-guided effectors',
      'DNA hydrogel interfaces',
      'Structure-enhanced learning',
    ]);
    expect(shuffled.map((publication) => publication.title)).toEqual(originalTitles);
  });
});
