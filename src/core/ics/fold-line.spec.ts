import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { foldLine } from './fold-line';

const octetLength = (value: string) => new TextEncoder().encode(value).length;

describe('foldLine', () => {
  it('returns a single-element array for strings <= 75 octets', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 75 }), (line) => {
        fc.pre(octetLength(line) <= 75);
        const result = foldLine(line);
        expect(result).toHaveLength(1);
        expect(result[0]).toBe(line);
      }),
    );
  });

  it('every segment is at most 75 octets', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'grapheme', maxLength: 500 }), (line) => {
        const result = foldLine(line);
        for (const segment of result) {
          expect(octetLength(segment)).toBeLessThanOrEqual(75);
        }
      }),
    );
  });

  it('concatenating segments (stripping continuation space) reproduces the original', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'grapheme', maxLength: 500 }), (line) => {
        const result = foldLine(line);
        const reconstructed = result.map((segment, index) => (index === 0 ? segment : segment.slice(1))).join('');
        expect(reconstructed).toBe(line);
      }),
    );
  });

  it('continuation lines always start with a space', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 76, maxLength: 500 }), (line) => {
        const result = foldLine(line);
        for (let i = 1; i < result.length; i++) {
          expect(result[i][0]).toBe(' ');
        }
      }),
    );
  });

  it('handles empty string', () => {
    expect(foldLine('')).toEqual(['']);
  });

  it('handles exactly 75 characters', () => {
    const line = 'a'.repeat(75);
    expect(foldLine(line)).toEqual([line]);
  });

  it('handles 76 characters', () => {
    const line = 'a'.repeat(76);
    const result = foldLine(line);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('a'.repeat(75));
    expect(result[1]).toBe(' a');
  });

  it('folds on octets for multi-byte characters', () => {
    // 'é' is 2 octets in UTF-8: 50 of them (100 octets) exceed the 75-octet limit at 37 characters
    const line = 'é'.repeat(50);
    const result = foldLine(line);
    expect(result).toHaveLength(2);
    expect(result[0]).toBe('é'.repeat(37));
    expect(result[1]).toBe(` ${'é'.repeat(13)}`);
  });

  it('never splits a multi-byte character across segments', () => {
    fc.assert(
      fc.property(fc.string({ unit: 'binary', maxLength: 300 }), (line) => {
        const result = foldLine(line);
        const reconstructed = result.map((segment, index) => (index === 0 ? segment : segment.slice(1))).join('');
        expect(reconstructed).toBe(line);
      }),
    );
  });
});
