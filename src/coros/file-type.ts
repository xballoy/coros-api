enum FileType {
  fit = 0,
  tcx = 1,
  gpx = 2,
  kml = 3,
  csv = 4,
}
export type FileTypeKey = keyof typeof FileType;

const AllFileTypes: Record<FileType, { key: string; value: string }> = {
  [FileType.fit]: { key: 'fit', value: '4' },
  [FileType.tcx]: { key: 'tcx', value: '3' },
  [FileType.gpx]: { key: 'gpx', value: '1' },
  [FileType.kml]: { key: 'kml', value: '2' },
  [FileType.csv]: { key: 'csv', value: '0' },
};

export const FileTypeKeys = Object.values(AllFileTypes).map(({ key }) => key);
export const DefaultFileType = AllFileTypes[FileType.fit];

export const getFileTypeFromKey = (value: FileTypeKey) => {
  return AllFileTypes[FileType[value]];
};

export const isValidFileType = (value: string): value is FileTypeKey => {
  return Object.keys(FileType).some((it) => it === value);
};
