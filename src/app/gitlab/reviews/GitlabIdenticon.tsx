'use client';

interface GitlabIdenticonProps {
  username: string;
  avatarUrl?: string | null;
  size?: number;
}

const GITLAB_COLORS = [
  '#108548', // Green (as seen in screenshot)
  '#1f75cb', // Blue
  '#e24329', // Red-Orange
  '#7b58cf', // Purple
  '#009688', // Teal
  '#d97706', // Amber
  '#db2777', // Pink
  '#475569', // Slate
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function GitlabIdenticon({ username, avatarUrl, size = 32 }: GitlabIdenticonProps) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        width={size}
        height={size}
        className='rounded object-cover block shrink-0'
      />
    );
  }

  const hash = hashString(username || 'gitlab');
  const colorIndex = hash % GITLAB_COLORS.length;
  const primaryColor = GITLAB_COLORS[colorIndex];

  // 5x5 grid, mirrored horizontally (cols 0 & 4 match, cols 1 & 3 match, col 2 center)
  // 3 cols * 5 rows = 15 bits
  const cells: boolean[][] = Array.from({ length: 5 }, () => Array(5).fill(false));
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 3; c++) {
      const bitIndex = r * 3 + c;
      const isFilled = ((hash >> bitIndex) & 1) === 1;
      cells[r][c] = isFilled;
      cells[r][4 - c] = isFilled;
    }
  }

  // Ensure at least some cells are visible
  cells[2][2] = true;
  cells[1][1] = true;
  cells[1][3] = true;

  const cellSize = 6;
  const svgDimension = 30;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${svgDimension} ${svgDimension}`}
      className='rounded bg-slate-50 border border-black/5 block shrink-0'
    >
      {cells.map((row, r) =>
        row.map((filled, c) => {
          if (!filled) return null;
          return (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize}
              height={cellSize}
              fill={primaryColor}
            />
          );
        }),
      )}
    </svg>
  );
}
