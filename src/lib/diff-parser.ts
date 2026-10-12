export interface DiffLineContext {
  oldLineNumber?: number | null;
  newLineNumber?: number | null;
  type: 'context' | 'addition' | 'deletion';
  content: string;
}

export interface DiffContext {
  filePath: string;
  lines: DiffLineContext[];
}

/**
 * Parses a unified git diff and extracts context lines around a given target line.
 */
export function extractDiffSnippet(
  rawDiff: string,
  filePath: string,
  targetNewLine?: number | null,
  targetOldLine?: number | null,
  contextRadius = 4,
): DiffContext {
  if (!rawDiff) {
    return { filePath, lines: [] };
  }

  const lines = rawDiff.split('\n');
  const allParsedLines: DiffLineContext[] = [];

  let currentOld = 0;
  let currentNew = 0;

  for (const line of lines) {
    // Hunk header e.g. @@ -144,7 +159,8 @@
    const hunkMatch = line.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch) {
      currentOld = parseInt(hunkMatch[1], 10);
      currentNew = parseInt(hunkMatch[2], 10);
      continue;
    }

    if (line.startsWith('+') && !line.startsWith('+++')) {
      allParsedLines.push({
        newLineNumber: currentNew++,
        oldLineNumber: null,
        type: 'addition',
        content: line.slice(1),
      });
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      allParsedLines.push({
        oldLineNumber: currentOld++,
        newLineNumber: null,
        type: 'deletion',
        content: line.slice(1),
      });
    } else if (line.startsWith(' ')) {
      allParsedLines.push({
        oldLineNumber: currentOld++,
        newLineNumber: currentNew++,
        type: 'context',
        content: line.slice(1),
      });
    }
  }

  // Find target line index
  let targetIdx = -1;
  if (targetNewLine !== undefined && targetNewLine !== null) {
    targetIdx = allParsedLines.findIndex((l) => l.newLineNumber === targetNewLine);
  }
  if (targetIdx === -1 && targetOldLine !== undefined && targetOldLine !== null) {
    targetIdx = allParsedLines.findIndex((l) => l.oldLineNumber === targetOldLine);
  }

  if (targetIdx === -1) {
    // If exact target line not matched, return the last few lines or up to 8 lines
    return {
      filePath,
      lines: allParsedLines.slice(0, 8),
    };
  }

  const start = Math.max(0, targetIdx - contextRadius);
  const end = Math.min(allParsedLines.length, targetIdx + contextRadius + 1);

  return {
    filePath,
    lines: allParsedLines.slice(start, end),
  };
}
