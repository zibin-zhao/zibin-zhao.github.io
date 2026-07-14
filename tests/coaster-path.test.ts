import { describe, expect, it } from 'vitest';
import {
  coasterConfigForWidth,
  coasterMotionProgress,
  pointAtProgress,
  sampleVerticalSCurve,
  trainPointsAtProgress,
  wrapProgress,
} from '../src/lib/coaster-path';

describe('roller-coaster path geometry', () => {
  const width = 1_440;
  const height = 900;
  const samples = sampleVerticalSCurve(width, height, 181);

  it('samples a vertical S curve beyond both viewport edges', () => {
    expect(samples).toHaveLength(181);
    expect(samples[0].y).toBeLessThan(0);
    expect(samples.at(-1)?.y).toBeGreaterThan(height);
    expect(Math.min(...samples.map(({ x }) => x))).toBeGreaterThan(width * .55);
    expect(Math.max(...samples.map(({ x }) => x))).toBeLessThan(width);
  });

  it.each([
    [-.15, .85],
    [0, 0],
    [.4, .4],
    [1, 0],
    [2.25, .25],
  ])('wraps progress %s to %s', (input, expected) => {
    expect(wrapProgress(input)).toBeCloseTo(expected);
  });

  it.each([0, .5, 1])('returns a finite point and tangent at progress %s', (progress) => {
    const point = pointAtProgress(samples, progress);
    expect(Number.isFinite(point.x)).toBe(true);
    expect(Number.isFinite(point.y)).toBe(true);
    expect(Number.isFinite(point.angle)).toBe(true);
  });

  it('keeps every offset train car on the sampled path', () => {
    const cars = trainPointsAtProgress(samples, .03, coasterConfigForWidth(width));
    expect(cars).toHaveLength(2);
    for (const car of cars) {
      expect(Number.isFinite(car.x)).toBe(true);
      expect(Number.isFinite(car.y)).toBe(true);
      expect(Number.isFinite(car.angle)).toBe(true);
      expect(car.progress).toBeGreaterThanOrEqual(0);
      expect(car.progress).toBeLessThan(1);
    }
  });

  it('uses a lighter mobile train and track configuration', () => {
    const mobile = coasterConfigForWidth(390);
    const desktop = coasterConfigForWidth(width);

    expect(mobile.carCount).toBe(1);
    expect(desktop.carCount).toBe(2);
    expect(mobile.sleeperCount).toBeLessThan(desktop.sleeperCount);
    expect(mobile.trackOpacity).toBeCloseTo(.07);
    expect(desktop.trackOpacity).toBeCloseTo(.12);
    expect(mobile.trainSpan).toBeCloseTo(.07);
    expect(desktop.trainSpan).toBeCloseTo(.12);
  });
});

describe('roller-coaster motion timing', () => {
  const sampleCount = 2_000;
  const sampleStep = 1 / sampleCount;
  const progressSamples = Array.from(
    { length: sampleCount },
    (_, index) => coasterMotionProgress(index * sampleStep),
  );
  const sampledSpeeds = progressSamples.map((progress, index) => {
    const nextProgress = index === sampleCount - 1
      ? 1 + coasterMotionProgress(1)
      : progressSamples[index + 1];
    return (nextProgress - progress) / sampleStep;
  });

  it('stays wrapped and moves strictly forward within each cycle', () => {
    for (const progress of progressSamples) {
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThan(1);
    }
    for (let index = 1; index < progressSamples.length; index += 1) {
      expect(progressSamples[index]).toBeGreaterThan(progressSamples[index - 1]);
    }
  });

  it('joins position and speed continuously at the loop boundary', () => {
    const speedAfterBoundary = sampledSpeeds[0];
    const speedBeforeBoundary = sampledSpeeds.at(-1);

    expect(coasterMotionProgress(1)).toBeCloseTo(coasterMotionProgress(0), 12);
    expect(speedBeforeBoundary).toBeDefined();
    expect(speedBeforeBoundary).toBeCloseTo(speedAfterBoundary, 2);
  });

  it('varies visibly while retaining positive forward speed', () => {
    const minimumSpeed = Math.min(...sampledSpeeds);
    const maximumSpeed = Math.max(...sampledSpeeds);

    expect(minimumSpeed).toBeGreaterThan(.45);
    expect(maximumSpeed).toBeGreaterThan(1.6);
    expect(maximumSpeed - minimumSpeed).toBeGreaterThan(.8);
  });
});
