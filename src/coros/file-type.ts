type FileTypeKey = 'fit' | 'tcx' | 'gpx' | 'kml' | 'csv';

const AllFileTypes: {
  [T in FileTypeKey]: { key: T; value: string };
} = {
  fit: { key: 'fit', value: '4' },
  tcx: { key: 'tcx', value: '3' },
  gpx: { key: 'gpx', value: '1' },
  kml: { key: 'kml', value: '2' },
  csv: { key: 'csv', value: '0' },
};

export const FileTypeKeys: FileTypeKey[] = Object.values(AllFileTypes).map(({ key }) => key);
export const DefaultFileType = AllFileTypes.fit;

export const getFileTypeFromKey = (value: FileTypeKey) => {
  return AllFileTypes[value];
};

export const isValidFileTypeKey = (value: string): value is FileTypeKey => {
  return Object.keys(AllFileTypes).some((it) => it === value);
};
