/**
 * File list component
 * Displays changed files and allows staging/unstaging/discarding
 */

import { FileStatus, FileStatusType } from '@git-gui/core/git/types';
import React from 'react';

import { colors, typography } from '../theme';

interface FileListProps {
  files: FileStatus[];
  selectedFile?: string;
  onStage?: (path: string) => void;
  onUnstage?: (path: string) => void;
  onDiscard?: (path: string) => void;
  onStageAll?: () => void;
  onUnstageAll?: () => void;
  onFileClick?: (path: string, staged: boolean) => void;
}

export function FileList({
  files,
  selectedFile,
  onStage,
  onUnstage,
  onDiscard,
  onStageAll,
  onUnstageAll,
  onFileClick,
}: FileListProps) {
  const stagedFiles = files.filter(
    (f) =>
      f.indexStatus !== FileStatusType.Unmodified &&
      f.indexStatus !== FileStatusType.Untracked
  );
  const unstagedFiles = files.filter(
    (f) =>
      f.workingTreeStatus !== FileStatusType.Unmodified &&
      f.workingTreeStatus !== FileStatusType.Untracked
  );
  const untrackedFiles = files.filter(
    (f) =>
      f.indexStatus === FileStatusType.Untracked ||
      f.workingTreeStatus === FileStatusType.Untracked
  );

  return (
    <div style={styles.container}>
      {stagedFiles.length > 0 && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span>Staged Changes</span>
            {onUnstageAll && (
              <button
                style={styles.headerButton}
                onClick={onUnstageAll}
                title="Unstage all"
              >
                Unstage All
              </button>
            )}
          </div>
          {stagedFiles.map((file) => (
            <FileItem
              key={`staged-${file.path}`}
              file={file}
              isStaged={true}
              isSelected={selectedFile === file.path}
              onAction={() => onUnstage?.(file.path)}
              actionLabel="-"
              onClick={() => onFileClick?.(file.path, true)}
            />
          ))}
        </div>
      )}

      {(unstagedFiles.length > 0 || untrackedFiles.length > 0) && (
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span>Unstaged Changes</span>
            {onStageAll && (
              <button
                style={styles.headerButton}
                onClick={onStageAll}
                title="Stage all (git add .)"
              >
                Stage All
              </button>
            )}
          </div>
          {unstagedFiles.map((file) => (
            <FileItem
              key={`unstaged-${file.path}`}
              file={file}
              isStaged={false}
              isSelected={selectedFile === file.path}
              onAction={() => onStage?.(file.path)}
              actionLabel="+"
              onDiscard={onDiscard ? () => onDiscard(file.path) : undefined}
              onClick={() => onFileClick?.(file.path, false)}
            />
          ))}
          {untrackedFiles.map((file) => (
            <FileItem
              key={`untracked-${file.path}`}
              file={file}
              isStaged={false}
              isSelected={selectedFile === file.path}
              onAction={() => onStage?.(file.path)}
              actionLabel="+"
              onDiscard={onDiscard ? () => onDiscard(file.path) : undefined}
              onClick={() => onFileClick?.(file.path, false)}
            />
          ))}
        </div>
      )}

      {files.length === 0 && (
        <div style={styles.empty}>
          <p style={styles.emptyText}>No changes</p>
        </div>
      )}
    </div>
  );
}

interface FileItemProps {
  file: FileStatus;
  isStaged: boolean;
  isSelected: boolean;
  onAction: () => void;
  actionLabel: string;
  onDiscard?: () => void;
  onClick?: () => void;
}

function FileItem({
  file,
  isStaged,
  isSelected,
  onAction,
  actionLabel,
  onDiscard,
  onClick,
}: FileItemProps) {
  const status = isStaged ? file.indexStatus : file.workingTreeStatus;
  const statusColor = getStatusColor(status);

  const handleDiscard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Discard changes in "${file.path}"?`)) {
      onDiscard?.();
    }
  };

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAction();
  };

  return (
    <div
      style={{
        ...styles.fileItem,
        ...(isSelected ? styles.fileItemSelected : {}),
      }}
      onClick={onClick}
    >
      <span style={{ ...styles.statusIndicator, color: statusColor }}>
        {status}
      </span>
      <span style={styles.filePath} title={file.path}>
        {file.path}
      </span>
      <div style={styles.fileActions}>
        {!isStaged && onDiscard && (
          <button
            style={{
              ...styles.actionButton,
              marginRight: '4px',
              color: colors.accent.error,
            }}
            onClick={handleDiscard}
            title="Discard changes"
          >
            ⎌
          </button>
        )}
        <button style={styles.actionButton} onClick={handleAction}>
          {actionLabel}
        </button>
      </div>
    </div>
  );
}

function getStatusColor(status: FileStatusType): string {
  switch (status) {
    case FileStatusType.Added:
    case FileStatusType.Untracked:
      return colors.git.added;
    case FileStatusType.Modified:
      return colors.git.modified;
    case FileStatusType.Deleted:
      return colors.git.deleted;
    case FileStatusType.Renamed:
      return colors.git.renamed;
    default:
      return colors.text.secondary;
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.bg.primary,
    overflowY: 'auto',
  },
  section: {
    marginBottom: '16px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 8px 6px 16px',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    backgroundColor: colors.bg.tertiary,
  },
  headerButton: {
    fontSize: '10px',
    padding: '2px 8px',
    backgroundColor: colors.bg.hover,
    color: colors.text.secondary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '3px',
    cursor: 'pointer',
  },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 16px',
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    backgroundColor: colors.bg.secondary,
    marginBottom: '1px',
    cursor: 'pointer',
  },
  fileItemSelected: {
    backgroundColor: colors.bg.hover,
    borderLeft: `2px solid ${colors.accent.primary}`,
    paddingLeft: '14px',
  },
  statusIndicator: {
    fontFamily: typography.fontFamily.mono,
    fontWeight: typography.fontWeight.bold,
    width: '12px',
    textAlign: 'center',
  },
  filePath: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: typography.fontFamily.mono,
  },
  fileActions: {
    display: 'flex',
    alignItems: 'center',
  },
  actionButton: {
    padding: '0 8px',
    backgroundColor: colors.bg.tertiary,
    border: `1px solid ${colors.border.default}`,
    color: colors.text.primary,
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  empty: {
    padding: '20px',
    textAlign: 'center',
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.sm,
  },
};
