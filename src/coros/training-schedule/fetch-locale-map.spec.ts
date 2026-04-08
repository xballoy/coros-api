import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { parseLocalePayload } from './fetch-locale-map';

describe('parseLocalePayload', () => {
  it('parses payload with exact marker "window.en_US="', () => {
    const map = { key1: 'value1', key2: 'value2' };
    const text = `window.en_US=${JSON.stringify(map)};`;
    expect(parseLocalePayload(text)).toEqual(map);
  });

  it('parses payload with spaces around equals sign', () => {
    const map = { hello: 'world' };
    const text = `window.en_US = ${JSON.stringify(map)}`;
    expect(parseLocalePayload(text)).toEqual(map);
  });

  it('strips trailing semicolon', () => {
    const map = { a: 'b' };
    const text = `window.en_US=${JSON.stringify(map)};`;
    expect(parseLocalePayload(text)).toEqual(map);
  });

  it('works without trailing semicolon', () => {
    const map = { a: 'b' };
    const text = `window.en_US=${JSON.stringify(map)}`;
    expect(parseLocalePayload(text)).toEqual(map);
  });

  it('handles text with content before the marker', () => {
    const map = { key: 'val' };
    const text = `// some JS code\nvar x = 1;\nwindow.en_US=${JSON.stringify(map)};`;
    expect(parseLocalePayload(text)).toEqual(map);
  });

  it('throws when marker is missing', () => {
    expect(() => parseLocalePayload('var x = 1;')).toThrow('Locale map did not contain expected window.en_US payload');
  });

  it('throws for empty input', () => {
    expect(() => parseLocalePayload('')).toThrow('Locale map did not contain expected window.en_US payload');
  });

  it('round-trips arbitrary string-to-string maps via exact marker', () => {
    const mapArbitrary = fc.dictionary(
      fc.string({ minLength: 1, maxLength: 20 }).filter((s) => !s.includes('"') && !s.includes('\\')),
      fc.string({ maxLength: 50 }).filter((s) => !s.includes('"') && !s.includes('\\')),
    );

    fc.assert(
      fc.property(mapArbitrary, (map) => {
        const text = `window.en_US=${JSON.stringify(map)};`;
        expect(parseLocalePayload(text)).toEqual(map);
      }),
    );
  });
});
