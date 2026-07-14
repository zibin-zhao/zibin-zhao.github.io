import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('..', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, root), 'utf8');
const readBytes = (path: string) => readFileSync(new URL(path, root));
const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const readPngMetadata = (path: string) => {
  const bytes = readBytes(path);
  if (bytes.byteLength < 33 || !bytes.subarray(0, pngSignature.byteLength).equals(pngSignature)) {
    throw new Error(`${path} is not a valid PNG`);
  }
  if (bytes.readUInt32BE(8) !== 13 || bytes.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error(`${path} does not start with a valid IHDR chunk`);
  }

  let offset = pngSignature.byteLength;
  let hasTransparencyChunk = false;
  let reachedEnd = false;
  while (offset + 12 <= bytes.byteLength) {
    const dataLength = bytes.readUInt32BE(offset);
    const chunkEnd = offset + 12 + dataLength;
    if (chunkEnd > bytes.byteLength) throw new Error(`${path} contains a truncated PNG chunk`);
    const chunkType = bytes.toString('ascii', offset + 4, offset + 8);
    hasTransparencyChunk ||= chunkType === 'tRNS';
    if (chunkType === 'IEND') {
      reachedEnd = true;
      break;
    }
    offset = chunkEnd;
  }
  if (!reachedEnd) throw new Error(`${path} does not contain an IEND chunk`);

  const colorType = bytes[25];
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    opaque: colorType !== 4 && colorType !== 6 && !hasTransparencyChunk,
  };
};

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

  it('keeps ordinary browser tests read-only and exposes an explicit artifact update command', () => {
    const pkg = JSON.parse(read('package.json'));
    const stitchSpec = read('tests/e2e/stitch.spec.ts');
    const qualityGates = read('docs/quality-gates.md');

    expect(pkg.scripts['test:visual:update']).toBe(
      'UPDATE_STITCH_ARTIFACTS=1 playwright test tests/e2e/stitch.spec.ts --grep "capture deterministic source-comparison artifacts" --project=canonical-768 --project=desktop --project=mobile',
    );
    expect(stitchSpec).toContain("process.env.UPDATE_STITCH_ARTIFACTS === '1'");
    expect(stitchSpec).toContain("testInfo.outputPath('artifacts')");
    expect(qualityGates).toContain('`npm run test:browser` is read-only with respect to tracked artifacts');
    expect(qualityGates).toContain('`npm run test:visual:update` intentionally refreshes');
  });

  it('passes GitHub authentication only to the server-side production build', () => {
    const workflow = read('.github/workflows/deploy.yml');
    const loader = read('src/data/github-projects.ts');

    expect(workflow).toContain('GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}');
    expect(loader).toContain('options.token ?? process.env.GITHUB_TOKEN');
    expect(read('src/components/Projects.astro')).not.toContain('GITHUB_TOKEN');
    expect(read('src/components/StitchVibe.astro')).not.toContain('GITHUB_TOKEN');
  });

  it('requires the Node 22 runtime floor supported by ESLint 10', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.engines.node).toBe('>=22.13.0');
  });

  it('keeps generated files from sibling worktrees outside the lint boundary', () => {
    expect(read('eslint.config.js')).toContain("'.worktrees/**'");
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
    ['casmd-cartoon.png', 'CasMD'],
    ['singularity.png', 'Singularity'],
    ['singularity-cartoon.png', 'Singularity'],
  ])('tracks a non-empty PNG payload for %s', (file, label) => {
    const bytes = readBytes(`public/stitch/${file}`);
    expect(bytes.byteLength).toBeGreaterThan(pngSignature.byteLength);
    expect(bytes.subarray(0, pngSignature.byteLength)).toEqual(pngSignature);
    expect(read('public/stitch/ASSETS.md')).toContain(label);
  });

  it.each([
    ['casmd-cartoon.png', 1024, 576],
    ['singularity-cartoon.png', 1024, 768],
  ])('keeps %s at its exact opaque cover contract', (file, width, height) => {
    expect(readPngMetadata(`public/stitch/${file}`)).toEqual({ width, height, opaque: true });
    expect(read('public/stitch/ASSETS.md')).toContain(`| \`/stitch/${file}\` |`);
  });
});
