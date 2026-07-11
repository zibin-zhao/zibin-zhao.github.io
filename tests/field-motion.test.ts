import { describe, expect, it } from 'vitest';
import { canUseFieldMotion, takeNewest } from '../src/scripts/field-motion';

describe('canUseFieldMotion', () => {
  it('enables motion only for fine pointers without reduced motion', () => {
    expect(canUseFieldMotion(false, true)).toBe(true);
    expect(canUseFieldMotion(true, true)).toBe(false);
    expect(canUseFieldMotion(false, false)).toBe(false);
  });
});

describe('takeNewest', () => {
  it('keeps only the newest bounded entries', () => {
    expect(takeNewest([1, 2, 3, 4], 2)).toEqual([3, 4]);
    expect(takeNewest([1, 2], 6)).toEqual([1, 2]);
  });
});
