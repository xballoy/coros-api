enum FileType {
  fit,
  tcx,
  gpx,
  kml,
  csv,
}
export type FileTypeKey = keyof typeof FileType;

export class FileTypes {
  private static readonly All: Record<FileType, { key: string; value: string }> = {
    [FileType.fit]: { key: 'fit', value: '4' },
    [FileType.tcx]: { key: 'tcx', value: '3' },
    [FileType.gpx]: { key: 'gpx', value: '1' },
    [FileType.kml]: { key: 'kml', value: '2' },
    [FileType.csv]: { key: 'csv', value: '0' },
  };

  static get keys() {
    return Object.values(FileTypes.All).map(({ key }) => key);
  }

  static get default() {
    return FileTypes.All[FileType.fit];
  }

  static parse(value: FileTypeKey) {
    return FileTypes.All[FileType[value]];
  }

  static isValid(value: string): value is FileTypeKey {
    return Object.keys(FileType).some((it) => it === value);
  }
}
