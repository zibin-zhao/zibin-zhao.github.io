import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('..', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');

describe('production quality gates', () => {
  it('defines all verification scripts', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.scripts.lint).toBe('eslint .');
    expect(pkg.scripts.check).toBe('astro check');
    expect(pkg.scripts['test:browser']).toBe('playwright test');
    expect(pkg.scripts.verify).toBe(
      'npm run lint && npm run check && npm test && npm run build',
    );
  });

  it('tracks Stitch asset provenance and the cart image', () => {
    expect(existsSync(new URL('public/stitch/cart.png', root))).toBe(true);
    expect(read('public/stitch/ASSETS.md')).toContain('Rollercoaster Cart Icon');
  });
});
