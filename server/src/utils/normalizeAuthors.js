export function normalizeAuthors(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((author) => (typeof author === 'string' ? { name: author } : author))
      .filter(Boolean);
  }

  const normalized =
    typeof value === 'string'
      ? { name: value }
      : value;

  return normalized ? [normalized] : [];
}
