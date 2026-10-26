export function normalizeGeneratedDescription(description?: string | null): string {
  if (!description) return '';

  return description
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/(?:^|\s)(?:estimasi|estimate)\s*:\s*\d+(?:[.,]\d+)?\s*(?:jam|hours?|h)\b/gi, '')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
