export const redactAccessToken = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(redactAccessToken);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) =>
        key.toLowerCase() === 'accesstoken' ? [key, '<redacted>'] : [key, redactAccessToken(entry)],
      ),
    );
  }

  return value;
};
