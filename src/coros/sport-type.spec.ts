import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { DefaultSportType, getSportTypeValueFromKey, isValidSportTypeKey, SportTypeKeys } from './sport-type';

const InvalidSportTypeArbitrary = fc.string().filter((sportType) => !SportTypeKeys.includes(sportType as never));

describe('Sport Type', () => {
  it('should return DefaultSportType', () => {
    expect(DefaultSportType).toEqual({ key: 'all', value: '0' });
  });

  describe('isValidSportTypeKey', () => {
    it.each(SportTypeKeys)('%s should be a valid sport type', (sportType) => {
      expect(isValidSportTypeKey(sportType)).toBe(true);
    });

    it('should be an invalid sport type', () => {
      fc.assert(
        fc.property(InvalidSportTypeArbitrary, (input) => {
          expect(isValidSportTypeKey(input)).toBe(false);
        }),
      );
    });
  });

  describe('getSportTypeValueFromKey', () => {
    it('should return the sport type value for all', () => {
      expect(getSportTypeValueFromKey('all')).toBe('0');
    });

    it('should return the sport type value for run', () => {
      expect(getSportTypeValueFromKey('run')).toBe('100');
    });

    it('should return the sport type value for bike', () => {
      expect(getSportTypeValueFromKey('bike')).toBe('200');
    });

    it('should return the sport type value for triathlon', () => {
      expect(getSportTypeValueFromKey('triathlon')).toBe('10000');
    });
  });
});
