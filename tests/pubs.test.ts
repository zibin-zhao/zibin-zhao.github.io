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
});
