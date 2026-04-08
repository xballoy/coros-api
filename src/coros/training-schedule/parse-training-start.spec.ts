import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { InvalidParameterError } from '../../core/invalid-parameter-error';
import { parseTrainingStart } from './parse-training-start';

const validTimeArbitrary = fc
  .record({
    hour: fc.integer({ min: 0, max: 23 }),
    minute: fc.integer({ min: 0, max: 59 }),
  })
  .map(({ hour, minute }) => ({
    str: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    hour,
    minute,
  }));

const invalidTimeArbitrary = fc.string().filter((s) => !/^\d{2}:\d{2}$/.test(s));

describe('parseTrainingStart', () => {
  it('parses valid HH:mm times and returns correct hour/minute', () => {
    fc.assert(
      fc.property(validTimeArbitrary, ({ str, hour, minute }) => {
        const result = parseTrainingStart(str);
        expect(result.hour).toBe(hour);
        expect(result.minute).toBe(minute);
      }),
    );
  });

  it('throws InvalidParameterError for strings not matching HH:mm', () => {
    fc.assert(
      fc.property(invalidTimeArbitrary, (input) => {
        expect(() => parseTrainingStart(input)).toThrow(InvalidParameterError);
      }),
    );
  });

  it('throws for out-of-range hours like 25:00', () => {
    expect(() => parseTrainingStart('25:00')).toThrow(InvalidParameterError);
  });

  it('throws for out-of-range minutes like 12:60', () => {
    expect(() => parseTrainingStart('12:60')).toThrow(InvalidParameterError);
  });

  it.each([
    ['00:00', { hour: 0, minute: 0 }],
    ['07:30', { hour: 7, minute: 30 }],
    ['23:59', { hour: 23, minute: 59 }],
  ])('parseTrainingStart(%s) = %o', (input, expected) => {
    expect(parseTrainingStart(input)).toEqual(expected);
  });
});
