export const escapeText = (value: string): string => {
  return value
    .replaceAll('\\', '\\\\')
    .replaceAll(/\r?\n/g, String.raw`\n`)
    .replaceAll(',', String.raw`\,`)
    .replaceAll(';', String.raw`\;`);
};
