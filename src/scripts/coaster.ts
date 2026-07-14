import {
  coasterConfigForWidth,
  coasterMotionProgress,
  pointAtProgress,
  sampleVerticalSCurve,
  trainPointsAtProgress,
  type CoasterConfiguration,
  type CoasterPathSample,
} from '../lib/coaster-path';

const MAX_DEVICE_PIXEL_RATIO = 1.5;
const LOOP_DURATION_MS = 22_000;
const PARKED_PROGRESS = .58;
const CANVAS_SELECTOR = '[data-coaster-atmosphere]';
const REGISTRY_KEY = Symbol.for('zibin.roller-coaster-atmosphere');

type Cleanup = () => void;

interface CoasterRegistry {
  cleanupController?: Cleanup;
  dispose: Cleanup;
  mount: () => void;
  unmount: Cleanup;
}

const createController = (canvas: HTMLCanvasElement): Cleanup | undefined => {
  const context = canvas.getContext('2d');
  const trackBuffer = document.createElement('canvas');
  const trackContext = trackBuffer.getContext('2d');
  if (!context || !trackContext) return undefined;

  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let configuration: CoasterConfiguration = coasterConfigForWidth(window.innerWidth);
  let pathSamples: CoasterPathSample[] = [];
  let devicePixelRatio = 1;
  let viewportHeight = 1;
  let viewportWidth = 1;
  let elapsedMotionTime = 0;
  let frameId: number | null = null;
  let previousFrameTimestamp: number | null = null;
  let destroyed = false;

  const cssColor = (property: string, fallback: string) => (
    getComputedStyle(document.documentElement).getPropertyValue(property).trim() || fallback
  );

  const traceRail = (offset: number) => {
    trackContext.beginPath();
    pathSamples.forEach((point, index) => {
      const normalX = -Math.sin(point.angle);
      const normalY = Math.cos(point.angle);
      const x = point.x + (normalX * offset);
      const y = point.y + (normalY * offset);
      if (index === 0) trackContext.moveTo(x, y);
      else trackContext.lineTo(x, y);
    });
    trackContext.stroke();
  };

  const renderTrackBuffer = () => {
    const ink = cssColor('--ink', '#171717');
    const railGap = configuration.carCount === 1 ? 6 : 8;
    trackContext.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    trackContext.clearRect(0, 0, viewportWidth, viewportHeight);
    trackContext.save();
    trackContext.globalAlpha = configuration.trackOpacity;
    trackContext.strokeStyle = ink;
    trackContext.lineCap = 'round';
    trackContext.lineWidth = 1.35;

    for (let index = 0; index < configuration.sleeperCount; index += 1) {
      const point = pointAtProgress(pathSamples, (index + .5) / configuration.sleeperCount);
      const normalX = -Math.sin(point.angle);
      const normalY = Math.cos(point.angle);
      const halfWidth = railGap + (configuration.carCount === 1 ? 4 : 5);
      trackContext.beginPath();
      trackContext.moveTo(point.x - (normalX * halfWidth), point.y - (normalY * halfWidth));
      trackContext.lineTo(point.x + (normalX * halfWidth), point.y + (normalY * halfWidth));
      trackContext.stroke();
    }

    trackContext.lineWidth = 2;
    traceRail(-railGap);
    traceRail(railGap);
    trackContext.restore();
  };

  const roundedRectangle = (
    drawingContext: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ) => {
    drawingContext.beginPath();
    drawingContext.moveTo(x + radius, y);
    drawingContext.lineTo(x + width - radius, y);
    drawingContext.quadraticCurveTo(x + width, y, x + width, y + radius);
    drawingContext.lineTo(x + width, y + height - radius);
    drawingContext.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    drawingContext.lineTo(x + radius, y + height);
    drawingContext.quadraticCurveTo(x, y + height, x, y + height - radius);
    drawingContext.lineTo(x, y + radius);
    drawingContext.quadraticCurveTo(x, y, x + radius, y);
    drawingContext.closePath();
  };

  const drawCar = (point: CoasterPathSample, index: number) => {
    const ink = cssColor('--ink', '#171717');
    const orange = cssColor('--orange', '#ff6b35');
    const green = cssColor('--green-bright', '#b6ff5c');
    const carLength = configuration.carCount === 1
      ? Math.max(38, Math.min(52, viewportHeight * .055))
      : Math.max(44, Math.min(58, viewportHeight * .052));
    const carWidth = configuration.carCount === 1 ? 20 : 23;

    context.save();
    context.translate(point.x, point.y);
    context.rotate(point.angle);
    context.globalAlpha = configuration.carCount === 1 ? .38 : .44;
    context.fillStyle = index === 0 ? orange : green;
    context.strokeStyle = ink;
    context.lineWidth = 1.5;
    roundedRectangle(context, -carLength / 2, -carWidth / 2, carLength, carWidth, 6);
    context.fill();
    context.stroke();

    context.globalAlpha *= .8;
    context.fillStyle = ink;
    const windowSize = Math.max(4, carWidth * .28);
    for (const offset of [-carLength * .2, carLength * .12]) {
      roundedRectangle(context, offset, -windowSize / 2, windowSize * 1.3, windowSize, 2);
      context.fill();
    }
    context.restore();
  };

  const drawScene = (progress: number) => {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(trackBuffer, 0, 0);
    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    trainPointsAtProgress(pathSamples, progress, configuration).forEach(drawCar);
  };

  const currentProgress = () => coasterMotionProgress(elapsedMotionTime / LOOP_DURATION_MS);

  const cancelFrame = () => {
    if (frameId !== null) {
      window.cancelAnimationFrame(frameId);
      frameId = null;
    }
    previousFrameTimestamp = null;
  };

  const frame = (timestamp: number) => {
    frameId = null;
    if (destroyed || motionPreference.matches || document.hidden) return;
    if (previousFrameTimestamp !== null) {
      elapsedMotionTime = (elapsedMotionTime + (timestamp - previousFrameTimestamp)) % LOOP_DURATION_MS;
    }
    previousFrameTimestamp = timestamp;
    drawScene(currentProgress());
    frameId = window.requestAnimationFrame(frame);
  };

  const startAnimation = () => {
    if (destroyed || frameId !== null) return;
    previousFrameTimestamp = null;
    canvas.dataset.motionState = 'running';
    frame(window.performance.now());
  };

  const applyMotionPreference = () => {
    cancelFrame();
    if (motionPreference.matches) {
      canvas.dataset.motionState = 'reduced';
      drawScene(PARKED_PROGRESS);
      return;
    }
    if (document.hidden) {
      canvas.dataset.motionState = 'paused';
      drawScene(currentProgress());
      return;
    }
    startAnimation();
  };

  const onMotionPreferenceChange = () => applyMotionPreference();

  const onVisibilityChange = () => {
    if (motionPreference.matches) return;
    if (document.hidden) {
      cancelFrame();
      canvas.dataset.motionState = 'paused';
      drawScene(currentProgress());
      return;
    }
    startAnimation();
  };

  const resize = () => {
    viewportWidth = Math.max(1, window.innerWidth);
    viewportHeight = Math.max(1, window.innerHeight);
    devicePixelRatio = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
    configuration = coasterConfigForWidth(viewportWidth);
    pathSamples = sampleVerticalSCurve(viewportWidth, viewportHeight);
    canvas.width = Math.round(viewportWidth * devicePixelRatio);
    canvas.height = Math.round(viewportHeight * devicePixelRatio);
    trackBuffer.width = canvas.width;
    trackBuffer.height = canvas.height;
    canvas.dataset.carCount = String(configuration.carCount);
    canvas.dataset.sleeperCount = String(configuration.sleeperCount);
    canvas.dataset.trainSpan = String(configuration.trainSpan);
    renderTrackBuffer();
    drawScene(motionPreference.matches ? PARKED_PROGRESS : currentProgress());
  };

  const onResize = () => resize();

  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);
  motionPreference.addEventListener('change', onMotionPreferenceChange);
  resize();
  applyMotionPreference();

  return () => {
    destroyed = true;
    cancelFrame();
    canvas.dataset.motionState = motionPreference.matches ? 'reduced' : 'paused';
    window.removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    motionPreference.removeEventListener('change', onMotionPreferenceChange);
  };
};

const registryWindow = window as typeof window & Record<symbol, CoasterRegistry | undefined>;
registryWindow[REGISTRY_KEY]?.dispose();

const registry: CoasterRegistry = {
  cleanupController: undefined,
  dispose: () => {},
  mount: () => {},
  unmount: () => {},
};

registry.unmount = () => {
  registry.cleanupController?.();
  registry.cleanupController = undefined;
};

registry.mount = () => {
  registry.unmount();
  const canvas = document.querySelector<HTMLCanvasElement>(CANVAS_SELECTOR);
  if (canvas) registry.cleanupController = createController(canvas);
};

const mount = () => registry.mount();
const unmount = () => registry.unmount();
const onPageHide = () => unmount();
const onPageShow = (event: PageTransitionEvent) => {
  if (event.persisted) mount();
};

registry.dispose = () => {
  unmount();
  document.removeEventListener('DOMContentLoaded', mount);
  document.removeEventListener('astro:before-swap', unmount);
  document.removeEventListener('astro:page-load', mount);
  window.removeEventListener('pagehide', onPageHide);
  window.removeEventListener('pageshow', onPageShow);
  if (registryWindow[REGISTRY_KEY] === registry) delete registryWindow[REGISTRY_KEY];
};

registryWindow[REGISTRY_KEY] = registry;
document.addEventListener('astro:before-swap', unmount);
document.addEventListener('astro:page-load', mount);
window.addEventListener('pagehide', onPageHide);
window.addEventListener('pageshow', onPageShow);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
