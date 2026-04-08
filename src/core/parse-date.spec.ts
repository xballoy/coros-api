import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { InvalidParameterError } from './invalid-parameter-error';
import { parseDate } from './parse-date';

const validDateArbitrary = fc
  .record({
    year: fc.integer({ min: 1970, max: 2099 }),
    month: fc.integer({ min: 1, max: 12 }),
    day: fc.integer({ min: 1, max: 28 }),
  })
  .map(({ year, month, day }) => ({
    str: `${String(year)}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    year,
    month,
    day,
  }));

const invalidDateArbitrary = fc.string().filter((s) => !/^\d{4}-\d{2}-\d{2}$/.test(s));

describe('parseDate', () => {
  it('parses valid YYYY-MM-DD dates and preserves year/month/day', () => {
    fc.assert(
      fc.property(validDateArbitrary, ({ str, year, month, day }) => {
        const result = parseDate(str, 'test');
        expect(result.getFullYear()).toBe(year);
        expect(result.getMonth() + 1).toBe(month);
        expect(result.getDate()).toBe(day);
      }),
    );
  });

  it('throws InvalidParameterError for strings not matching YYYY-MM-DD', () => {
    fc.assert(
      fc.property(invalidDateArbitrary, (input) => {
        expect(() => parseDate(input, 'test')).toThrow(InvalidParameterError);
      }),
    );
  });

  it('throws for invalid calendar dates like 2023-02-29', () => {
    expect(() => parseDate('2023-02-29', 'test')).toThrow(InvalidParameterError);
  });

  it('accepts leap day 2024-02-29', () => {
    const result = parseDate('2024-02-29', 'test');
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth() + 1).toBe(2);
    expect(result.getDate()).toBe(29);
  });

  it('includes the parameter name in the error message', () => {
    expect(() => parseDate('invalid', 'fromDate')).toThrow(/fromDate/);
  });
});
