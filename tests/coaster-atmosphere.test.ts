import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('..', import.meta.url);
const read = (path: string) => {
  const url = new URL(path, root);
  return existsSync(url) ? readFileSync(url, 'utf8') : '';
};

describe('roller-coaster atmosphere contract', () => {
  const componentPath = 'src/components/RollerCoasterAtmosphere.astro';
  const controllerPath = 'src/scripts/coaster.ts';

  it('renders exactly one fixed, pointer-free, decorative canvas', () => {
    const component = read(componentPath);
    const atmosphere = read('src/components/StitchAtmosphere.astro');

    expect(existsSync(new URL(componentPath, root))).toBe(true);
    expect((component.match(/<canvas\b/g) ?? [])).toHaveLength(1);
    expect(component).toContain('data-coaster-atmosphere');
    expect(component).toContain('aria-hidden="true"');
    expect(component).toMatch(/\.roller-coaster-atmosphere\s*\{[^}]*position:\s*fixed;[^}]*z-index:\s*1;[^}]*pointer-events:\s*none;/s);
    expect(atmosphere).toContain("import RollerCoasterAtmosphere from './RollerCoasterAtmosphere.astro'");
    expect(atmosphere.match(/<RollerCoasterAtmosphere\s*\/>/g) ?? []).toHaveLength(1);
    expect((component + atmosphere).match(/<canvas\b/g) ?? []).toHaveLength(1);
  });

  it('retains every existing fallback atmosphere element below the canvas', () => {
    const atmosphere = read('src/components/StitchAtmosphere.astro');

    for (const marker of [
      'guide-left',
      'guide-right',
      'blob-left',
      'blob-right',
      'note-formula',
      'note-pathway',
      'note-question',
    ]) expect(atmosphere).toContain(marker);
    expect(atmosphere).toMatch(/\.stitch-atmosphere\s*\{[^}]*z-index:\s*0;/s);
    expect(atmosphere.indexOf('<RollerCoasterAtmosphere />'))
      .toBeGreaterThan(atmosphere.indexOf('</div>'));
  });

  it('loads one controller with a capped DPR and an offscreen track buffer', () => {
    const component = read(componentPath);
    const controller = read(controllerPath);

    expect(existsSync(new URL(controllerPath, root))).toBe(true);
    expect(component.match(/\.\.\/scripts\/coaster\.ts/g) ?? []).toHaveLength(1);
    expect(controller).toContain('const MAX_DEVICE_PIXEL_RATIO = 1.5');
    expect(controller).toMatch(/Math\.min\(window\.devicePixelRatio \|\| 1, MAX_DEVICE_PIXEL_RATIO\)/);
    expect(controller).toContain("document.createElement('canvas')");
    expect(controller).toContain('renderTrackBuffer');
    expect(controller).toContain('sampleVerticalSCurve');
  });

  it('runs one 22-second loop and cleans up all controller lifecycle hooks', () => {
    const controller = read(controllerPath);

    expect(controller).toContain('const LOOP_DURATION_MS = 22_000');
    expect(controller.match(/window\.requestAnimationFrame\(/g) ?? []).toHaveLength(1);
    expect(controller).toContain("document.addEventListener('visibilitychange', onVisibilityChange)");
    expect(controller).toContain("document.removeEventListener('visibilitychange', onVisibilityChange)");
    expect(controller).toContain("document.addEventListener('astro:before-swap', unmount)");
    expect(controller).toContain('window.cancelAnimationFrame(frameId)');
    expect(controller).toContain('previousFrameTimestamp = null');
    expect(controller).not.toContain('frame(0)');
  });

  it('parks under reduced motion without requesting an animation frame', () => {
    const controller = read(controllerPath);
    const reducedBranch = controller.slice(
      controller.indexOf('const applyMotionPreference'),
      controller.indexOf('const onMotionPreferenceChange'),
    );

    expect(controller).toContain("matchMedia('(prefers-reduced-motion: reduce)')");
    expect(reducedBranch).toContain("canvas.dataset.motionState = 'reduced'");
    expect(reducedBranch).toContain('drawScene(PARKED_PROGRESS)');
    expect(reducedBranch).not.toContain('requestAnimationFrame');
  });
});
