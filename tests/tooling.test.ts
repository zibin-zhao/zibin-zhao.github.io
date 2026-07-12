import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('..', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');
const readBytes = (path: string) => readFileSync(new URL(path, root));
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

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

  it('documents the ESLint 10 accessibility-tooling decision', () => {
    const decision = read('docs/quality-gates.md');
    expect(decision).toContain('eslint-plugin-jsx-a11y');
    expect(decision).toContain('ESLint 10');
    expect(decision).toContain('eslint-plugin-astro');
  });

  it.each([
    ['cart.png', 'Rollercoaster Cart Icon'],
    ['casmd.png', 'CasMD'],
    ['singularity.png', 'Singularity'],
  ])('tracks a non-empty PNG payload for %s', (file, label) => {
    const bytes = readBytes(`public/stitch/${file}`);
    expect(bytes.byteLength).toBeGreaterThan(pngSignature.byteLength);
    expect(bytes.subarray(0, pngSignature.byteLength)).toEqual(pngSignature);
    expect(read('public/stitch/ASSETS.md')).toContain(label);
  });
});
