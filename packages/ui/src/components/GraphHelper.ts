import { colors } from '../theme';

export const LANE_WIDTH = 14;
export const ROW_HEIGHT = 56;
export const NODE_RADIUS = 4;

const LANE_COLORS = colors.branch;

export interface GraphLine {
  x1: number; // column index (0, 1, 2, ...)
  y1: number; // 0..1 fraction of row height
  x2: number;
  y2: number;
  color: string;
}

export interface GraphRow {
  commitColumn: number;
  commitColor: string;
  lines: GraphLine[];
  numColumns: number;
}

interface Lane {
  sha: string | null;
  color: string;
}

export function buildGraphLayout(
  commits: { sha: string; parents: string[] }[]
): GraphRow[] {
  let colorIdx = 0;
  let lanes: Lane[] = [];
  const rows: GraphRow[] = [];

  const nextColor = () =>
    LANE_COLORS[colorIdx++ % LANE_COLORS.length] ?? LANE_COLORS[0]!;

  for (const commit of commits) {
    const prevLanes = lanes.map((l) => ({ ...l }));

    // Find all lanes tracking this commit (first = primary, rest = converging)
    const matchIdxs: number[] = prevLanes.reduce<number[]>((acc, l, i) => {
      if (l.sha === commit.sha) acc.push(i);
      return acc;
    }, []);

    let commitLane: number;
    let commitColor: string;

    if (matchIdxs.length === 0) {
      // Untracked tip – create new lane
      const free = lanes.findIndex((l) => l.sha === null);
      commitLane = free !== -1 ? free : lanes.length;
      commitColor = nextColor();
      if (commitLane < lanes.length) {
        lanes[commitLane] = { sha: commit.sha, color: commitColor };
      } else {
        lanes.push({ sha: commit.sha, color: commitColor });
      }
    } else {
      commitLane = matchIdxs[0]!;
      commitColor = lanes[commitLane]!.color;
      // Free duplicate lanes (they converge here)
      for (let k = 1; k < matchIdxs.length; k++) {
        lanes[matchIdxs[k]!]!.sha = null;
      }
    }

    // Update lane for first parent (continues in same lane)
    if (commit.parents.length === 0) {
      lanes[commitLane]!.sha = null;
    } else {
      lanes[commitLane] = { sha: commit.parents[0]!, color: commitColor };

      // Additional parents (merge commits) get new lanes
      for (let p = 1; p < commit.parents.length; p++) {
        const pSha = commit.parents[p]!;
        if (lanes.findIndex((l) => l.sha === pSha) === -1) {
          const free = lanes.findIndex((l) => l.sha === null);
          if (free !== -1) {
            lanes[free] = { sha: pSha, color: commitColor };
          } else {
            lanes.push({ sha: pSha, color: commitColor });
          }
        }
      }
    }

    // Trim trailing nulls
    while (lanes.length > 0 && lanes[lanes.length - 1]?.sha === null) {
      lanes.pop();
    }

    const nextLanes = lanes.map((l) => ({ ...l }));

    // Columns that converge into this commit from above
    const convergingCols = matchIdxs.slice(1);

    // Columns that branch out below this commit (new lanes for extra parents)
    const newBranchCols: number[] = [];
    for (let j = 0; j < nextLanes.length; j++) {
      if (j !== commitLane && nextLanes[j]?.sha !== null) {
        const wasActive =
          j < prevLanes.length && prevLanes[j]!.sha !== null;
        if (!wasActive) newBranchCols.push(j);
      }
    }

    const numColumns = Math.max(
      prevLanes.length,
      nextLanes.length,
      commitLane + 1
    );

    const lines: GraphLine[] = [];
    for (let j = 0; j < numColumns; j++) {
      const inActive =
        j < prevLanes.length && prevLanes[j]!.sha !== null;
      const outActive =
        j < nextLanes.length && nextLanes[j]!.sha !== null;
      const isCommit = j === commitLane;
      const isConv = convergingCols.includes(j);
      const isNew = newBranchCols.includes(j);

      if (isCommit) {
        // Line from top to node (if anything was coming in)
        if (inActive) {
          lines.push({ x1: j, y1: 0, x2: j, y2: 0.5, color: commitColor });
        }
        // Line from node to bottom (if branch continues)
        if (outActive) {
          lines.push({ x1: j, y1: 0.5, x2: j, y2: 1, color: commitColor });
        }
      } else if (isConv) {
        // Diagonal: converges from j down to commitLane at midpoint
        lines.push({
          x1: j,
          y1: 0,
          x2: commitLane,
          y2: 0.5,
          color: prevLanes[j]!.color,
        });
      } else if (isNew) {
        // Diagonal: branches out from commitLane to j at midpoint
        lines.push({
          x1: commitLane,
          y1: 0.5,
          x2: j,
          y2: 1,
          color: nextLanes[j]!.color,
        });
      } else {
        // Pass-through
        if (inActive && outActive) {
          lines.push({
            x1: j, y1: 0, x2: j, y2: 1,
            color: prevLanes[j]!.color,
          });
        } else if (inActive) {
          lines.push({
            x1: j, y1: 0, x2: j, y2: 0.5,
            color: prevLanes[j]!.color,
          });
        } else if (outActive) {
          lines.push({
            x1: j, y1: 0.5, x2: j, y2: 1,
            color: nextLanes[j]!.color,
          });
        }
      }
    }

    rows.push({ commitColumn: commitLane, commitColor, lines, numColumns });
  }

  return rows;
}
