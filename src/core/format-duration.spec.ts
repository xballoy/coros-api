import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { formatDuration } from './format-duration';

describe('formatDuration', () => {
  it('always produces a non-empty string for non-negative input', () => {
    fc.assert(
      fc.property(fc.nat({ max: 1_000_000 }), (seconds) => {
        const result = formatDuration(seconds);
        expect(result.length).toBeGreaterThan(0);
      }),
    );
  });

  it('output always matches the expected pattern', () => {
    fc.assert(
      fc.property(fc.nat({ max: 1_000_000 }), (seconds) => {
        const result = formatDuration(seconds);
        expect(result).toMatch(/^\d+h \d+m$|^\d+m$|^\d+s$/);
      }),
    );
  });

  it('returns hours component when seconds >= 3600', () => {
    fc.assert(
      fc.property(fc.integer({ min: 3600, max: 1_000_000 }), (seconds) => {
        expect(formatDuration(seconds)).toMatch(/^\d+h \d+m$/);
      }),
    );
  });

  it('returns minutes component when 60 <= seconds < 3600', () => {
    fc.assert(
      fc.property(fc.integer({ min: 60, max: 3599 }), (seconds) => {
        expect(formatDuration(seconds)).toMatch(/^\d+m$/);
      }),
    );
  });

  it('returns seconds component when seconds < 60', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 59 }), (seconds) => {
        expect(formatDuration(seconds)).toMatch(/^\d+s$/);
      }),
    );
  });

  it('clamps negative input to 0s', () => {
    expect(formatDuration(-100)).toBe('0s');
  });

  it.each([
    [0, '0s'],
    [59, '59s'],
    [60, '1m'],
    [3600, '1h 0m'],
    [5400, '1h 30m'],
    [7261, '2h 1m'],
  ])('formatDuration(%i) = %s', (input, expected) => {
    expect(formatDuration(input)).toBe(expected);
  });
});
