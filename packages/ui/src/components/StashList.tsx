/**
 * Stash list component
 * Displays and manages repository stashes
 */

import React from 'react';
import type { Stash } from '@git-gui/core/git/types';
import { colors, typography } from '../theme';

interface StashListProps {
  stashes: Stash[];
  onApply?: (index: number) => void;
  onPop?: (index: number) => void;
  onDrop?: (index: number) => void;
}

export function StashList({ stashes = [], onApply, onPop, onDrop }: StashListProps) {
  if (!stashes || stashes.length === 0) {
    return (
      <div style={styles.empty}>
        <p style={styles.emptyText}>No stashes</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.sectionHeader}>Stashes</div>
      {stashes.map((stash) => (
        <div key={stash.index} style={styles.stashItem}>
          <div style={styles.stashInfo}>
            <span style={styles.stashRef}>stash@&#123;{stash.index}&#125;</span>
            <span style={styles.stashMessage}>{stash.message}</span>
          </div>
          <div style={styles.stashActions}>
            <button style={styles.actionButton} onClick={() => onApply?.(stash.index)} title="Apply stash (keep in list)">Apply</button>
            <button style={styles.actionButton} onClick={() => onPop?.(stash.index)} title="Pop stash (apply and remove)">Pop</button>
            <button style={{ ...styles.actionButton, color: colors.accent.error }} onClick={() => onDrop?.(stash.index)} title="Drop stash">Drop</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.bg.primary,
    borderTop: `1px solid ${colors.border.default}`,
  },
  sectionHeader: {
    padding: '8px 16px',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    backgroundColor: colors.bg.tertiary,
  },
  stashItem: {
    padding: '8px 16px',
    borderBottom: `1px solid ${colors.border.subtle}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  stashInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    flex: 1,
    overflow: 'hidden',
  },
  stashRef: {
    fontSize: '10px',
    color: colors.accent.secondary,
    fontFamily: typography.fontFamily.mono,
  },
  stashMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  stashActions: {
    display: 'flex',
    gap: '4px',
  },
  actionButton: {
    padding: '2px 8px',
    fontSize: '11px',
    backgroundColor: colors.bg.tertiary,
    color: colors.text.primary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '3px',
    cursor: 'pointer',
  },
  empty: {
    padding: '16px',
    textAlign: 'center',
    backgroundColor: colors.bg.tertiary,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.xs,
  },
};
