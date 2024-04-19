export enum FileType {
  fit = '4',
  tcx = '3',
  gpx = '1',
  kml = '2',
  csv = '0',
}
export type ReadableFileType = keyof typeof FileType;
export const READABLE_FILE_TYPE = Object.keys(FileType);
export const DEFAULT_FILE_TYPE = 'fit';
export const parseReadableFileType = (value: ReadableFileType): FileType => FileType[value];
