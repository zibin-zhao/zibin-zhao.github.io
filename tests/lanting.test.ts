import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fragments, sourceSize } from '../src/data/lanting';

describe('Lanting manuscript fidelity', () => {
  it('retains the exact original reproduction instead of baking altered wording into it', () => {
    const original = readFileSync(new URL('../public/lanting/lantingxu.jpg', import.meta.url));
    expect(createHash('sha256').update(original).digest('hex')).toBe(
      'b2cb481ea097d5fc8188389f787eb9b45369d8ad0489e02b17a80d9697a2eb54',
    );
  });

  it('gives each entry one distinct region inside the original writing', () => {
    expect(new Set(fragments.map((entry) => entry.id)).size).toBe(11);
    for (const [
      index,
      {
        region: [x, y, width, height],
      },
    ] of fragments.entries()) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
      expect(x + width).toBeLessThanOrEqual(sourceSize.width);
      expect(y + height).toBeLessThanOrEqual(sourceSize.height);
      for (const {
        region: [otherX, otherY, otherWidth, otherHeight],
      } of fragments.slice(index + 1)) {
        const overlaps =
          x < otherX + otherWidth &&
          x + width > otherX &&
          y < otherY + otherHeight &&
          y + height > otherY;
        expect(overlaps).toBe(false);
      }
    }
  });
});
