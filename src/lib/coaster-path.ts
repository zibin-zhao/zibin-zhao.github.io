export interface CoasterPathSample {
  angle: number;
  progress: number;
  x: number;
  y: number;
}

export interface CoasterConfiguration {
  carCount: 1 | 2;
  sleeperCount: number;
  trackOpacity: number;
  trainSpan: number;
}

export const MOBILE_COASTER_MAX_WIDTH = 700;

const MOBILE_CONFIGURATION: CoasterConfiguration = {
  carCount: 1,
  sleeperCount: 18,
  trackOpacity: .12,
  trainSpan: .07,
};

const DESKTOP_CONFIGURATION: CoasterConfiguration = {
  carCount: 2,
  sleeperCount: 34,
  trackOpacity: .16,
  trainSpan: .12,
};

export const coasterConfigForWidth = (width: number): CoasterConfiguration => (
  width <= MOBILE_COASTER_MAX_WIDTH ? MOBILE_CONFIGURATION : DESKTOP_CONFIGURATION
);

export const wrapProgress = (progress: number): number => (
  ((progress % 1) + 1) % 1
);

export const sampleVerticalSCurve = (
  width: number,
  height: number,
  sampleCount = 241,
): CoasterPathSample[] => {
  const count = Math.max(2, Math.floor(sampleCount));
  const points = Array.from({ length: count }, (_, index) => {
    const progress = index / (count - 1);
    const x = width * (
      .78
      + (.065 * Math.sin(progress * Math.PI * 2))
      + (.018 * (progress - .5))
    );
    const y = (-height * .15) + (height * 1.3 * progress);
    return { progress, x, y };
  });

  return points.map((point, index) => {
    const before = points[Math.max(0, index - 1)];
    const after = points[Math.min(points.length - 1, index + 1)];
    return {
      ...point,
      angle: Math.atan2(after.y - before.y, after.x - before.x),
    };
  });
};

export const pointAtProgress = (
  samples: readonly CoasterPathSample[],
  progress: number,
): CoasterPathSample => {
  if (samples.length < 2) throw new Error('A coaster path needs at least two samples');

  const clamped = Math.max(0, Math.min(1, progress));
  const position = clamped * (samples.length - 1);
  const lowerIndex = Math.floor(position);
  const upperIndex = Math.min(samples.length - 1, Math.ceil(position));
  const mix = position - lowerIndex;
  const lower = samples[lowerIndex];
  const upper = samples[upperIndex];

  return {
    angle: lower.angle + ((upper.angle - lower.angle) * mix),
    progress: clamped,
    x: lower.x + ((upper.x - lower.x) * mix),
    y: lower.y + ((upper.y - lower.y) * mix),
  };
};

export const trainPointsAtProgress = (
  samples: readonly CoasterPathSample[],
  progress: number,
  configuration: CoasterConfiguration,
): CoasterPathSample[] => {
  const spacing = configuration.trainSpan / configuration.carCount;
  return Array.from({ length: configuration.carCount }, (_, index) => {
    const carProgress = wrapProgress(progress - (index * spacing));
    return pointAtProgress(samples, carProgress);
  });
};
