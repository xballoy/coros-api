import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { DefaultFileType, FileTypeKeys, getFileTypeFromKey, isValidFileTypeKey } from './file-type';

const ValidFileTypes = ['fit', 'tcx', 'gpx', 'kml', 'csv'];
const InvalidFileTypeArbitrary = fc.string().filter((fileType) => !ValidFileTypes.includes(fileType));

describe('File Type', () => {
  it('should return FileTypeKeys', () => {
    expect(FileTypeKeys).toMatchInlineSnapshot(`
      [
        "fit",
        "tcx",
        "gpx",
        "kml",
        "csv",
      ]
    `);
  });

  it('should return DefaultFileType', () => {
    expect(DefaultFileType).toMatchInlineSnapshot(`
      {
        "key": "fit",
        "value": "4",
      }
    `);
  });

  describe('isValidFileTypeKey', () => {
    it.each(ValidFileTypes)('%s should be valid a valid file type', (fileType) => {
      expect(isValidFileTypeKey(fileType)).toBe(true);
    });

    it('should be an invalid file type', () => {
      fc.assert(
        fc.property(InvalidFileTypeArbitrary, (input) => {
          expect(isValidFileTypeKey(input)).toBe(false);
        }),
      );
    });
  });

  describe('getFileTypeFromKey', () => {
    it('should return the file type for fit', () => {
      expect(getFileTypeFromKey('fit')).toEqual({ key: 'fit', value: '4' });
    });

    it('should return the file type for tcx', () => {
      expect(getFileTypeFromKey('tcx')).toEqual({ key: 'tcx', value: '3' });
    });

    it('should return the file type for gpx', () => {
      expect(getFileTypeFromKey('gpx')).toEqual({ key: 'gpx', value: '1' });
    });

    it('should return the file type for kml', () => {
      expect(getFileTypeFromKey('kml')).toEqual({ key: 'kml', value: '2' });
    });

    it('should return the file type for csv', () => {
      expect(getFileTypeFromKey('csv')).toEqual({ key: 'csv', value: '0' });
    });
  });
});
