import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { formatDistance } from './format-distance';

describe('formatDistance', () => {
  it('always ends with " km"', () => {
    fc.assert(
      fc.property(fc.nat({ max: 100_000_000 }), (cm) => {
        expect(formatDistance(cm)).toMatch(/ km$/);
      }),
    );
  });

  it('contains a valid number before " km"', () => {
    fc.assert(
      fc.property(fc.nat({ max: 100_000_000 }), (cm) => {
        const result = formatDistance(cm);
        const numPart = result.replace(' km', '');
        expect(Number.isFinite(Number(numPart))).toBe(true);
      }),
    );
  });

  it('has no decimal when distance is an exact multiple of 100000', () => {
    fc.assert(
      fc.property(fc.nat({ max: 1000 }), (multiplier) => {
        const result = formatDistance(multiplier * 100000);
        expect(result).not.toContain('.');
      }),
    );
  });

  it('has one decimal place when not a whole number of km', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 100_000_000 }).filter((cm) => cm % 100000 !== 0),
        (cm) => {
          const result = formatDistance(cm);
          const numPart = result.replace(' km', '');
          expect(numPart).toMatch(/\.\d$/);
        },
      ),
    );
  });

  it.each([
    [0, '0 km'],
    [100000, '1 km'],
    [750000, '7.5 km'],
    [1000000, '10 km'],
    [123456, '1.2 km'],
  ])('formatDistance(%i) = %s', (input, expected) => {
    expect(formatDistance(input)).toBe(expected);
  });
});
