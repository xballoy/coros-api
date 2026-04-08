import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { escapeText } from './escape-text';

describe('escapeText', () => {
  it('output never contains unescaped commas', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 200 }), (input) => {
        const result = escapeText(input);
        // Every comma should be preceded by a backslash
        for (let i = 0; i < result.length; i++) {
          if (result[i] === ',' && (i === 0 || result[i - 1] !== '\\')) {
            return false;
          }
        }
        return true;
      }),
    );
  });

  it('output never contains unescaped semicolons', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 200 }), (input) => {
        const result = escapeText(input);
        for (let i = 0; i < result.length; i++) {
          if (result[i] === ';' && (i === 0 || result[i - 1] !== '\\')) {
            return false;
          }
        }
        return true;
      }),
    );
  });

  it('output never contains literal newlines', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 200 }), (input) => {
        const result = escapeText(input);
        expect(result).not.toMatch(/\r?\n/);
      }),
    );
  });

  it('returns input unchanged when no special characters present', () => {
    const safeCharArbitrary = fc.string({ maxLength: 100 }).filter((s) => !/[\\,;\r\n]/.test(s));
    fc.assert(
      fc.property(safeCharArbitrary, (input) => {
        expect(escapeText(input)).toBe(input);
      }),
    );
  });

  it.each([
    ['hello', 'hello'],
    ['hello, world', String.raw`hello\, world`],
    ['a;b', String.raw`a\;b`],
    ['back\\slash', String.raw`back\\slash`],
    ['line1\nline2', String.raw`line1\nline2`],
    ['line1\r\nline2', String.raw`line1\nline2`],
  ])('escapeText(%j) = %j', (input, expected) => {
    expect(escapeText(input)).toBe(expected);
  });
});
