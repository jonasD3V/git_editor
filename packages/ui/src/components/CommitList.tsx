/**
 * Commit list component
 * Displays a list of commits
 */

import type { Commit } from '@git-gui/core/git/types';
import { format } from 'date-fns';
import React from 'react';

import { colors, typography } from '../theme';

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
  if (commits.length === 0) {
    return (
      <div style={styles.empty}>
        <p style={styles.emptyText}>No commits yet</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {commits.map((commit, index) => (
        <div
          key={commit.sha || index}
          style={{
            ...styles.commitItem,
            ...(selectedSha &&
            (commit.sha === selectedSha || commit.shortSha === selectedSha)
              ? styles.commitItemSelected
              : {}),
          }}
          onClick={() => onCommitClick?.(commit)}
        >
          <div style={styles.commitHeader}>
            <span style={styles.commitSha}>{commit.shortSha}</span>
            <span style={styles.commitAuthor}>{commit.author.name}</span>
            <span style={styles.commitDate}>
              {(() => {
                try {
                  const date =
                    typeof commit.date === 'string'
                      ? new Date(commit.date)
                      : commit.date;
                  return format(date, 'MMM d, yyyy HH:mm');
                } catch {
                  return 'Unknown date';
                }
              })()}
            </span>
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
      ))}
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
  commitItem: {
    padding: '12px 16px',
    backgroundColor: colors.bg.secondary,
    borderLeft: `3px solid ${colors.accent.primary}`,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
  },
  commitItemSelected: {
    backgroundColor: colors.bg.hover,
    borderLeft: `3px solid ${colors.accent.secondary}`,
  },
  checkoutBtn: {
    marginLeft: 'auto',
    flexShrink: 0,
    padding: '1px 8px',
    fontSize: '10px',
    backgroundColor: colors.bg.tertiary,
    color: colors.text.secondary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '3px',
    cursor: 'pointer',
  },
  commitHeader: {
    display: 'flex',
    gap: '12px',
    marginBottom: '6px',
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  commitSha: {
    fontFamily: typography.fontFamily.mono,
    color: colors.accent.secondary,
    fontWeight: typography.fontWeight.semibold,
  },
  commitAuthor: {
    flex: 1,
    color: colors.text.secondary,
  },
  commitDate: {
    color: colors.text.secondary,
  },
  commitMessage: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: '4px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
  refs: {
    display: 'flex',
    gap: '6px',
    marginTop: '6px',
  },
  ref: {
    fontSize: typography.fontSize.xs,
    padding: '2px 8px',
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
