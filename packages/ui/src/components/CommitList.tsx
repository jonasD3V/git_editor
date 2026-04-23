import type { Commit } from '@git-gui/core/git/types';
import { format } from 'date-fns';
import React, { useMemo } from 'react';

import { colors, typography } from '../theme';
import {
  buildGraphLayout,
  LANE_WIDTH,
  ROW_HEIGHT,
  NODE_RADIUS,
} from './GraphHelper';

interface CommitListProps {
  commits: Commit[];
  selectedSha?: string | null;
  onCommitClick?: (commit: Commit) => void;
  onCheckoutCommit?: (commit: Commit) => void;
}

export function CommitList({
  commits,
  selectedSha,
  onCommitClick,
  onCheckoutCommit,
}: CommitListProps) {
  const graphRows = useMemo(() => buildGraphLayout(commits), [commits]);

  const graphWidth = useMemo(() => {
    const maxCols = Math.max(1, ...graphRows.map((r) => r.numColumns));
    return maxCols * LANE_WIDTH;
  }, [graphRows]);

  if (commits.length === 0) {
    return (
      <div style={styles.empty}>
        <p style={styles.emptyText}>No commits yet</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {commits.map((commit, index) => {
        const row = graphRows[index];
        const isSelected =
          !!selectedSha &&
          (commit.sha === selectedSha || commit.shortSha === selectedSha);

        let formattedDate = 'Unknown date';
        try {
          const d =
            typeof commit.date === 'string'
              ? new Date(commit.date)
              : commit.date;
          formattedDate = format(d, 'MMM d, yy HH:mm');
        } catch {
          // keep default
        }

        return (
          <div
            key={commit.sha || index}
            style={{
              ...styles.row,
              backgroundColor: isSelected
                ? colors.bg.hover
                : colors.bg.secondary,
            }}
            onClick={() => onCommitClick?.(commit)}
          >
            {/* ── Graph column ── */}
            <svg
              width={graphWidth}
              height={ROW_HEIGHT}
              style={styles.graphSvg}
            >
              {row?.lines.map((line, li) => (
                <line
                  key={li}
                  x1={line.x1 * LANE_WIDTH + LANE_WIDTH / 2}
                  y1={line.y1 * ROW_HEIGHT}
                  x2={line.x2 * LANE_WIDTH + LANE_WIDTH / 2}
                  y2={line.y2 * ROW_HEIGHT}
                  style={{ stroke: line.color, strokeWidth: 1.5, strokeLinecap: 'round' }}
                />
              ))}
              {row && (
                <circle
                  cx={row.commitColumn * LANE_WIDTH + LANE_WIDTH / 2}
                  cy={ROW_HEIGHT / 2}
                  r={NODE_RADIUS}
                  style={{
                    fill: row.commitColor,
                    stroke: isSelected ? colors.bg.hover : colors.bg.secondary,
                    strokeWidth: 2,
                  }}
                />
              )}
            </svg>

            {/* ── Commit info ── */}
            <div
              style={{
                ...styles.commitInfo,
                ...(isSelected ? styles.commitInfoSelected : {}),
              }}
            >
              <div style={styles.commitHeader}>
                <span style={styles.commitSha}>{commit.shortSha}</span>
                <span style={styles.commitAuthor}>{commit.author.name}</span>
                <span style={styles.commitDate}>{formattedDate}</span>
                {onCheckoutCommit && (
                  <button
                    style={styles.checkoutBtn}
                    title="Checkout this commit (detached HEAD)"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCheckoutCommit(commit);
                    }}
                  >
                    Checkout
                  </button>
                )}
              </div>
              <div style={styles.commitMessage}>{commit.message}</div>
              {commit.refs && commit.refs.filter((r) => r.trim()).length > 0 && (
                <div style={styles.refs}>
                  {commit.refs
                    .filter((r) => r.trim())
                    .map((ref, idx) => (
                      <span key={`${ref}-${idx}`} style={styles.ref}>
                        {ref}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
    backgroundColor: colors.bg.primary,
    overflowY: 'auto',
    height: '100%',
  },
  row: {
    display: 'flex',
    alignItems: 'stretch',
    cursor: 'pointer',
    transition: 'background-color 0.1s',
    minHeight: ROW_HEIGHT,
  },
  graphSvg: {
    flexShrink: 0,
    display: 'block',
  },
  commitInfo: {
    flex: 1,
    padding: '8px 12px 8px 4px',
    borderLeft: `1px solid ${colors.border.subtle}`,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '3px',
  },
  commitInfoSelected: {
    borderLeft: `1px solid ${colors.accent.secondaryBorder}`,
  },
  commitHeader: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  commitSha: {
    fontFamily: typography.fontFamily.mono,
    color: colors.accent.secondary,
    fontWeight: typography.fontWeight.semibold,
    flexShrink: 0,
  },
  commitAuthor: {
    flex: 1,
    color: colors.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  commitDate: {
    color: colors.text.disabled,
    flexShrink: 0,
    fontSize: '10px',
  },
  checkoutBtn: {
    flexShrink: 0,
    padding: '1px 6px',
    fontSize: '10px',
    backgroundColor: colors.bg.tertiary,
    color: colors.text.secondary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '3px',
    cursor: 'pointer',
  },
  commitMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  refs: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
  },
  ref: {
    fontSize: '10px',
    padding: '1px 6px',
    backgroundColor: colors.bg.tertiary,
    color: colors.accent.secondary,
    borderRadius: '3px',
    fontFamily: typography.fontFamily.mono,
  },
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.md,
  },
};
