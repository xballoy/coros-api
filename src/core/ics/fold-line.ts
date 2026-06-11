const encoder = new TextEncoder();

// RFC 5545 §3.1: lines longer than 75 octets (not characters) should be folded
export const foldLine = (line: string): string[] => {
  const maxOctets = 75;
  if (encoder.encode(line).length <= maxOctets) {
    return [line];
  }

  const segments: string[] = [];
  let current = '';
  let currentOctets = 0;
  // Continuation lines are prefixed with a space, leaving 74 octets for content
  let limit = maxOctets;
  for (const char of line) {
    const charOctets = encoder.encode(char).length;
    if (currentOctets + charOctets > limit) {
      segments.push(current);
      current = '';
      currentOctets = 0;
      limit = maxOctets - 1;
    }
    current += char;
    currentOctets += charOctets;
  }
  segments.push(current);

  return segments.map((segment, index) => (index === 0 ? segment : ` ${segment}`));
};
