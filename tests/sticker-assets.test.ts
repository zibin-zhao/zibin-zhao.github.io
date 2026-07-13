import { readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('..', import.meta.url);
const stickerNames = [
  'dna-ai',
  'instruments',
  'calligraphy',
  'reading',
  'psychology',
  'meditation',
  'coding-lab',
] as const;
const MAX_DIMENSION = 768;
const MAX_INDIVIDUAL_BYTES = 700_000;
const MAX_TOTAL_BYTES = 4_200_000;

const pngMetadata = (name: string) => {
  const url = new URL(`public/stickers/${name}.png`, root);
  const png = readFileSync(url);
  return {
    bytes: statSync(url).size,
    colorType: png[25],
    height: png.readUInt32BE(20),
    width: png.readUInt32BE(16),
  };
};

describe('sticker raster assets', () => {
  it('keeps every transparent PNG within its intrinsic size and byte budget', () => {
    const metadata = stickerNames.map(pngMetadata);

    for (const asset of metadata) {
      expect(asset.width).toBeLessThanOrEqual(MAX_DIMENSION);
      expect(asset.height).toBeLessThanOrEqual(MAX_DIMENSION);
      expect(asset.colorType).toBe(6);
      expect(asset.bytes).toBeLessThanOrEqual(MAX_INDIVIDUAL_BYTES);
    }
    expect(metadata.reduce((total, asset) => total + asset.bytes, 0))
      .toBeLessThanOrEqual(MAX_TOTAL_BYTES);
  });
});
