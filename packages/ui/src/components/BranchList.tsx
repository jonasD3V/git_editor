/**
 * Branch list component
 * Displays repository branches
 */

import type { Branch } from '@git-gui/core/git/types';
import React, { useState } from 'react';

import { colors, typography } from '../theme';

interface BranchListProps {
  branches: Branch[];
  currentBranch: Branch | null;
  onBranchClick?: (branch: Branch) => void;
  onCreateBranch?: (name: string) => void;
  onDeleteBranch?: (name: string) => void;
}

export function BranchList({
  branches,
  onBranchClick,
  onCreateBranch,
  onDeleteBranch,
}: BranchListProps) {
  const [newBranchName, setNewBranchName] = useState('');

  const handleCreate = () => {
    const sanitized = newBranchName.trim().replace(/\s+/g, '-');
    if (sanitized && onCreateBranch) {
      onCreateBranch(sanitized);
      setNewBranchName('');
    }
  };

  const handleDelete = (e: React.MouseEvent, branchName: string) => {
    e.stopPropagation();
    if (
      window.confirm(`Are you sure you want to delete branch "${branchName}"?`)
    ) {
      onDeleteBranch?.(branchName);
    }
  };

  const localBranches = branches.filter((b) => !b.isRemote);
  const remoteBranches = branches.filter((b) => b.isRemote);

  return (
    <div style={styles.container}>
      {onCreateBranch && (
        <div style={styles.createSection}>
          <input
            style={styles.input}
            placeholder="New branch..."
            value={newBranchName}
            onChange={(e) => setNewBranchName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button style={styles.createButton} onClick={handleCreate}>
            +
          </button>
        </div>
      )}

      {localBranches.length === 0 &&
        remoteBranches.length === 0 &&
        !onCreateBranch && (
          <div style={styles.empty}>
            <p style={styles.emptyText}>No branches</p>
          </div>
        )}

      {localBranches.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>Local Branches</div>
          {localBranches.map((branch) => (
            <div
              key={branch.fullName}
              style={{
                ...styles.branchItem,
                ...(branch.isCurrent ? styles.branchItemCurrent : {}),
              }}
              onClick={() => onBranchClick?.(branch)}
            >
              {branch.isCurrent && (
                <span style={styles.currentIndicator}>●</span>
              )}
              <span style={styles.branchName}>{branch.name}</span>
              {branch.upstream && (
                <span style={styles.upstream}>
                  → {branch.upstream.replace('refs/remotes/', '')}
                </span>
              )}
              {!branch.isCurrent && onDeleteBranch && (
                <button
                  style={styles.deleteButton}
                  onClick={(e) => handleDelete(e, branch.name)}
                  title="Delete Branch"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {remoteBranches.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>Remote Branches</div>
          {remoteBranches.map((branch) => (
            <div
              key={branch.fullName}
              style={styles.branchItem}
              onClick={() => onBranchClick?.(branch)}
            >
              <span style={styles.branchName}>{branch.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.bg.primary,
    overflowY: 'auto',
    height: '100%',
  },
  createSection: {
    display: 'flex',
    padding: '8px 16px',
    gap: '8px',
    borderBottom: `1px solid ${colors.border.default}`,
    backgroundColor: colors.bg.tertiary,
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    color: colors.text.primary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '3px',
    padding: '4px 8px',
    fontSize: typography.fontSize.sm,
    outline: 'none',
  },
  createButton: {
    backgroundColor: colors.accent.primary,
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    width: '24px',
    height: '24px',
    cursor: 'pointer',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: '16px',
  },
  sectionHeader: {
    padding: '8px 16px',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  branchItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    backgroundColor: colors.bg.secondary,
    marginBottom: '1px',
    position: 'relative',
  },
  branchItemCurrent: {
    backgroundColor: colors.bg.tertiary,
    borderLeft: `3px solid ${colors.accent.primary}`,
  },
  currentIndicator: {
    color: colors.accent.primary,
    fontSize: '8px',
  },
  branchName: {
    flex: 1,
    fontFamily: typography.fontFamily.mono,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    minWidth: 0,
  },
  upstream: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  deleteButton: {
    flexShrink: 0,
    background: 'none',
    border: `1px solid ${colors.border.default}`,
    borderRadius: '3px',
    cursor: 'pointer',
    padding: '2px 7px',
    fontSize: '11px',
    color: colors.accent.error,
    opacity: 0.7,
    transition: 'opacity 0.2s',
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
