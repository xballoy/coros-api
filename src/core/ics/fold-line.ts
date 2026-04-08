export const foldLine = (line: string): string[] => {
  const maxLength = 75;
  if (line.length <= maxLength) {
    return [line];
  }

  const segments: string[] = [];
  let remaining = line;
  let isFirst = true;
  while (remaining.length > 0) {
    const chunkSize = isFirst ? maxLength : maxLength - 1;
    segments.push(remaining.slice(0, chunkSize));
    remaining = remaining.slice(chunkSize);
    isFirst = false;
  }

  return segments.map((segment, index) => (index === 0 ? segment : ` ${segment}`));
};
