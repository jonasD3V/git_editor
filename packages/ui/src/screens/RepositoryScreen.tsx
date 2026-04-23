import type { Commit } from '@git-gui/core/git/types';
import React, { useEffect, useState, useCallback } from 'react';

import { BranchList } from '../components/BranchList';
import { CommitList } from '../components/CommitList';
import { CommitPanel } from '../components/CommitPanel';
import { DiffViewer } from '../components/DiffViewer';
import { FileList } from '../components/FileList';
import { GitConfigPanel } from '../components/GitConfigPanel';
import { RemoteList } from '../components/RemoteList';
import { SSHKeyManager } from '../components/SSHKeyManager';
import { StashList } from '../components/StashList';
import { useRepository } from '../hooks/useRepository';
import { colors, typography } from '../theme';

interface RepositoryScreenProps {
  repositoryPath?: string;
  shouldInit?: boolean;
  onOpenRepository?: () => void;
  onInitRepository?: () => void;
  gitVersion?: string;
}

export function RepositoryScreen({
  repositoryPath,
  shouldInit,
  onOpenRepository,
  onInitRepository,
  gitVersion,
}: RepositoryScreenProps) {
  const [sidePanel, setSidePanel] = useState<
    null | 'remotes' | 'ssh' | 'config'
  >(null);
  const [notification, setNotification] = useState<{
    message: string;
    kind: 'error' | 'push-rejected' | 'divergent' | 'unrelated-histories';
  } | null>(null);
  const [diffContent, setDiffContent] = useState<string | null>(null);
  const [diffTitle, setDiffTitle] = useState<string | undefined>(undefined);
  const [isDiffLoading, setIsDiffLoading] = useState(false);
  const [selectedCommitSha, setSelectedCommitSha] = useState<string | null>(
    null
  );
  const [selectedFile, setSelectedFile] = useState<string | undefined>(
    undefined
  );

  const {
    repository,
    commits,
    branches,
    remotes,
    stashes,
    currentBranch,
    status,
    isLoading,
    isLoadingCommits,
    isLoadingStatus,
    error,
    openRepository,
    initRepository,
    refresh,
    checkoutBranch,
    createBranch,
    deleteBranch,
    stageFiles,
    unstageFiles,
    discardChanges,
    createCommit,
    fetch,
    pull,
    pullRebase,
    resetToRemote,
    pushForce,
    push,
    addRemote,
    removeRemote,
    setRemoteUrl,
    pushStash,
    popStash,
    applyStash,
    dropStash,
    getFileDiff,
    getCommitDiff,
    pullAllowUnrelatedHistories,
    pullRebaseAllowUnrelatedHistories,
  } = useRepository();

  useEffect(() => {
    if (!repositoryPath) return;
    if (shouldInit) {
      void initRepository(repositoryPath);
    } else {
      void openRepository(repositoryPath);
    }
  }, [repositoryPath, shouldInit, openRepository, initRepository]);

  // Clear diff when switching repos
  useEffect(() => {
    setDiffContent(null);
    setDiffTitle(undefined);
    setSelectedCommitSha(null);
    setSelectedFile(undefined);
  }, [repositoryPath]);

  const handleBranchClick = async (branch: any) => {
    if (!branch.isCurrent && !branch.isRemote) {
      try {
        await checkoutBranch(branch.name);
      } catch (err) {
        console.error('Checkout failed:', err);
      }
    }
  };

  const handleCreateBranch = async (name: string) => {
    try {
      await createBranch(name);
    } catch (err) {
      console.error('Create branch failed:', err);
    }
  };

  const handleDeleteBranch = async (name: string) => {
    try {
      await deleteBranch(name);
    } catch (err) {
      console.error('Delete branch failed:', err);
    }
  };

  const handleCommitClick = useCallback(
    async (commit: Commit) => {
      const sha = commit.sha || commit.shortSha;
      if (!sha) return;
      setSelectedCommitSha(sha);
      setSelectedFile(undefined);
      setIsDiffLoading(true);
      setDiffTitle(`${commit.shortSha} – ${commit.message}`);
      const diff = await getCommitDiff(sha);
      setDiffContent(diff);
      setIsDiffLoading(false);
    },
    [getCommitDiff]
  );

  const handleCheckoutCommit = useCallback(
    async (commit: Commit) => {
      const ref = commit.sha || commit.shortSha;
      if (!ref) return;
      try {
        await checkoutBranch(ref);
      } catch (err) {
        console.error('Commit checkout failed:', err);
      }
    },
    [checkoutBranch]
  );

  const handleFileClick = useCallback(
    async (filePath: string, staged: boolean) => {
      setSelectedFile(filePath);
      setSelectedCommitSha(null);
      setIsDiffLoading(true);
      setDiffTitle(`${staged ? '[staged] ' : ''}${filePath}`);
      const diff = await getFileDiff(filePath, staged);
      setDiffContent(diff || '(no diff available)');
      setIsDiffLoading(false);
    },
    [getFileDiff]
  );

  const handleStage = async (path: string) => {
    await stageFiles([path]);
    if (selectedFile === path) {
      void handleFileClick(path, false);
    }
  };

  const handleUnstage = async (path: string) => {
    await unstageFiles([path]);
    if (selectedFile === path) {
      void handleFileClick(path, true);
    }
  };

  const handleDiscard = async (path: string) => {
    await discardChanges([path]);
  };

  const handleStageAll = async () => {
    await stageFiles([]);
  };

  const handleUnstageAll = async () => {
    await unstageFiles([]);
  };

  const handleCommit = async (message: string) => {
    await createCommit(message);
    setDiffContent(null);
    setDiffTitle(undefined);
    setSelectedFile(undefined);
  };

  const handleStash = async (message: string) => {
    await pushStash(message);
  };

  const handleManualInit = async () => {
    if (repositoryPath) {
      await initRepository(repositoryPath);
    }
  };

  const runWithNotification = async (fn: () => Promise<void>) => {
    setNotification(null);
    try {
      await fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Operation failed';
      const isUnrelatedHistories = msg.includes('unrelated histories');
      const isDivergent =
        !isUnrelatedHistories &&
        (msg.includes('divergent') ||
          msg.includes('reconcile') ||
          msg.includes('Need to specify how'));
      const isPushRejected =
        msg.includes('non-fast-forward') ||
        (msg.includes('rejected') && !isDivergent && !isUnrelatedHistories);
      setNotification({
        message: msg,
        kind: isUnrelatedHistories
          ? 'unrelated-histories'
          : isDivergent
            ? 'divergent'
            : isPushRejected
              ? 'push-rejected'
              : 'error',
      });
    }
  };

  const handleFetch = () => runWithNotification(() => fetch());
  const handlePull = () => runWithNotification(() => pull());
  const handlePush = () => runWithNotification(() => push());

  const handlePullThenPush = () =>
    runWithNotification(async () => {
      await pull();
      await push();
    });
  const handlePullRebase = () => runWithNotification(() => pullRebase());
  const handleResetToRemote = () => runWithNotification(() => resetToRemote());
  const handlePushForce = () => runWithNotification(() => pushForce());
  const handleMergeAllowUnrelated = () =>
    runWithNotification(() => pullAllowUnrelatedHistories());
  const handleRebaseAllowUnrelated = () =>
    runWithNotification(() => pullRebaseAllowUnrelatedHistories());

  const getRemotePlatform = (url: string) => {
    if (url.includes('github.com')) return 'GitHub';
    if (url.includes('gitlab.com')) return 'GitLab';
    if (url.includes('bitbucket.org')) return 'Bitbucket';
    return 'Git';
  };

  if (isLoading) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.loadingText}>Loading repository...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.errorText}>Error: {error}</div>
        <div style={styles.buttonGroup}>
          <button
            style={styles.openButton}
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
          {error.includes('Not a Git repository') && (
            <button
              style={{
                ...styles.openButton,
                backgroundColor: colors.accent.secondary,
                marginTop: 0,
              }}
              onClick={handleManualInit}
            >
              Initialize Here
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!repository) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.welcomeText}>Git GUI</div>
        <div style={styles.instructionText}>
          Open an existing repository or initialize a new one
        </div>
        <div style={styles.welcomeActions}>
          <button style={styles.welcomeBtn} onClick={onOpenRepository}>
            <span style={styles.welcomeBtnIcon}>📂</span>
            <span style={styles.welcomeBtnLabel}>Open Repository</span>
            <span style={styles.welcomeBtnDesc}>
              Open a folder that already contains a git repo
            </span>
          </button>
          <button
            style={{ ...styles.welcomeBtn, ...styles.welcomeBtnSecondary }}
            onClick={onInitRepository}
          >
            <span style={styles.welcomeBtnIcon}>✦</span>
            <span style={styles.welcomeBtnLabel}>New Repository</span>
            <span style={styles.welcomeBtnDesc}>
              Initialize git in an existing or new folder
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        {gitVersion && <div style={styles.gitVersionBadge}>{gitVersion}</div>}
        <div style={styles.repoInfo}>
          <div style={styles.repoTitleRow}>
            <span style={styles.repoPath}>{repositoryPath}</span>
            {remotes[0] && (
              <span style={styles.remoteBadge}>
                {getRemotePlatform(remotes[0].fetchUrl)}
              </span>
            )}
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
              <button
                style={{
                  ...styles.actionButton,
                  backgroundColor:
                    sidePanel === 'remotes'
                      ? colors.accent.primary
                      : colors.bg.tertiary,
                  color:
                    sidePanel === 'remotes' ? 'white' : colors.text.primary,
                }}
                onClick={() =>
                  setSidePanel(sidePanel === 'remotes' ? null : 'remotes')
                }
              >
                Remotes
              </button>
              <button
                style={{
                  ...styles.actionButton,
                  backgroundColor:
                    sidePanel === 'ssh'
                      ? colors.accent.primary
                      : colors.bg.tertiary,
                  color: sidePanel === 'ssh' ? 'white' : colors.text.primary,
                }}
                onClick={() => setSidePanel(sidePanel === 'ssh' ? null : 'ssh')}
              >
                SSH Keys
              </button>
              <button
                style={{
                  ...styles.actionButton,
                  backgroundColor:
                    sidePanel === 'config'
                      ? colors.accent.primary
                      : colors.bg.tertiary,
                  color: sidePanel === 'config' ? 'white' : colors.text.primary,
                }}
                onClick={() =>
                  setSidePanel(sidePanel === 'config' ? null : 'config')
                }
              >
                Identity
              </button>
            </div>
          </div>
          <div style={styles.repoActionsRow}>
            {currentBranch && (
              <span style={styles.currentBranch}>
                <span style={styles.branchIcon}>⎇</span> {currentBranch.name}
                {status?.upstream && (
                  <span style={styles.upstreamInfo}>
                    {' '}
                    ({status.upstream}){status.ahead > 0 && ` ↑${status.ahead}`}
                    {status.behind > 0 && ` ↓${status.behind}`}
                  </span>
                )}
              </span>
            )}
            <div style={styles.buttonGroup}>
              <button
                style={{
                  ...styles.actionButton,
                  backgroundColor: isLoadingStatus
                    ? colors.bg.hover
                    : colors.bg.tertiary,
                }}
                onClick={() => void refresh()}
                disabled={isLoadingStatus}
                title="Refresh"
              >
                {isLoadingStatus ? '⏳' : '🔄'}
              </button>
              <button
                style={styles.actionButton}
                onClick={() => void handleFetch()}
                title="Fetch from remote"
              >
                Fetch
              </button>
              <button
                style={styles.actionButton}
                onClick={() => void handlePull()}
                title="Pull from remote"
              >
                Pull
              </button>
              <button
                style={styles.actionButton}
                onClick={() => void handlePush()}
                title="Push to remote"
              >
                Push
              </button>
            </div>
            {status && (
              <span style={styles.status}>
                {status.isClean ? (
                  <span style={styles.statusClean}>✓ Clean</span>
                ) : (
                  <span style={styles.statusDirty}>
                    {status.files.length} file
                    {status.files.length !== 1 ? 's' : ''} changed
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Notification banner (simple errors and push-rejected only) */}
      {notification &&
        notification.kind !== 'divergent' &&
        notification.kind !== 'unrelated-histories' && (
          <div style={styles.notificationBar}>
            <span style={styles.notificationText}>{notification.message}</span>
            <div style={styles.notificationActions}>
              {notification.kind === 'push-rejected' && (
                <button
                  style={styles.notificationPrimaryBtn}
                  onClick={() => void handlePullThenPush()}
                >
                  Pull &amp; Push
                </button>
              )}
              <button
                style={styles.notificationDismiss}
                onClick={() => setNotification(null)}
              >
                ✕
              </button>
            </div>
          </div>
        )}

      {/* Divergent branch resolution card */}
      {notification?.kind === 'divergent' && (
        <div style={styles.divergentCard}>
          <div style={styles.divergentHeader}>
            <span style={styles.divergentTitle}>
              ⚠ Divergent branches — choose how to reconcile
            </span>
            <button
              style={styles.notificationDismiss}
              onClick={() => setNotification(null)}
            >
              ✕
            </button>
          </div>
          <div style={styles.divergentOptions}>
            <button
              style={styles.divergentOption}
              onClick={() => void handlePullThenPush()}
            >
              <span style={styles.divergentOptionTitle}>Merge</span>
              <span style={styles.divergentOptionDesc}>
                Pull remote changes into local, then push. Creates a merge
                commit.
              </span>
            </button>
            <button
              style={styles.divergentOption}
              onClick={() => void handlePullRebase()}
            >
              <span style={styles.divergentOptionTitle}>Rebase</span>
              <span style={styles.divergentOptionDesc}>
                Replay my commits on top of remote. Keeps history linear.
              </span>
            </button>
            <button
              style={{
                ...styles.divergentOption,
                ...styles.divergentOptionDanger,
              }}
              onClick={() => {
                if (
                  window.confirm(
                    'This will discard ALL your local commits on this branch and replace them with the remote version. Continue?'
                  )
                ) {
                  void handleResetToRemote();
                }
              }}
            >
              <span style={styles.divergentOptionTitle}>Reset to remote</span>
              <span style={styles.divergentOptionDesc}>
                Discard my local commits. Use remote version. Cannot be undone.
              </span>
            </button>
            <button
              style={{
                ...styles.divergentOption,
                ...styles.divergentOptionDanger,
              }}
              onClick={() => {
                if (
                  window.confirm(
                    'This will overwrite the remote branch with your local version. Other contributors may lose work. Continue?'
                  )
                ) {
                  void handlePushForce();
                }
              }}
            >
              <span style={styles.divergentOptionTitle}>Force push</span>
              <span style={styles.divergentOptionDesc}>
                Overwrite remote with my local version. Dangerous for shared
                branches.
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Unrelated histories resolution card */}
      {notification?.kind === 'unrelated-histories' && (
        <div style={styles.divergentCard}>
          <div style={styles.divergentHeader}>
            <span style={styles.divergentTitle}>
              ⚠ Unrelated histories — choose how to reconcile
            </span>
            <button
              style={styles.notificationDismiss}
              onClick={() => setNotification(null)}
            >
              ✕
            </button>
          </div>
          <div style={styles.divergentOptions}>
            <button
              style={styles.divergentOption}
              onClick={() => void handleMergeAllowUnrelated()}
            >
              <span style={styles.divergentOptionTitle}>Merge</span>
              <span style={styles.divergentOptionDesc}>
                Pull and merge despite unrelated histories. Creates a merge
                commit.
              </span>
            </button>
            <button
              style={styles.divergentOption}
              onClick={() => void handleRebaseAllowUnrelated()}
            >
              <span style={styles.divergentOptionTitle}>Rebase</span>
              <span style={styles.divergentOptionDesc}>
                Replay my commits on top of remote, allowing unrelated
                histories.
              </span>
            </button>
            <button
              style={{
                ...styles.divergentOption,
                ...styles.divergentOptionDanger,
              }}
              onClick={() => {
                if (
                  window.confirm(
                    'This will discard ALL your local commits on this branch and replace them with the remote version. Continue?'
                  )
                ) {
                  void handleResetToRemote();
                }
              }}
            >
              <span style={styles.divergentOptionTitle}>Reset to remote</span>
              <span style={styles.divergentOptionDesc}>
                Discard my local commits. Use remote version. Cannot be undone.
              </span>
            </button>
            <button
              style={{
                ...styles.divergentOption,
                ...styles.divergentOptionDanger,
              }}
              onClick={() => {
                if (
                  window.confirm(
                    'This will overwrite the remote branch with your local version. Other contributors may lose work. Continue?'
                  )
                ) {
                  void handlePushForce();
                }
              }}
            >
              <span style={styles.divergentOptionTitle}>Force push</span>
              <span style={styles.divergentOptionDesc}>
                Overwrite remote with my local version. Dangerous for shared
                branches.
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={styles.content}>
        {sidePanel !== null ? (
          <div
            style={{
              flex: 1,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {sidePanel === 'remotes' && (
              <RemoteList
                remotes={remotes}
                onAddRemote={addRemote}
                onRemoveRemote={removeRemote}
                onUpdateUrl={setRemoteUrl}
              />
            )}
            {sidePanel === 'ssh' && <SSHKeyManager />}
            {sidePanel === 'config' && (
              <GitConfigPanel repoPath={repositoryPath ?? null} />
            )}
          </div>
        ) : (
          <>
            {/* Sidebar: Changes + Stash + Branches */}
            <div style={styles.sidebar}>
              <div style={styles.sidebarSection}>
                <div style={styles.sidebarHeader}>Changes</div>
                <div style={styles.fileListContainer}>
                  <FileList
                    files={status?.files || []}
                    selectedFile={selectedFile}
                    onStage={handleStage}
                    onUnstage={handleUnstage}
                    onDiscard={handleDiscard}
                    onStageAll={handleStageAll}
                    onUnstageAll={handleUnstageAll}
                    onFileClick={handleFileClick}
                  />
                </div>
                <CommitPanel
                  onCommit={handleCommit}
                  onStash={handleStash}
                  disabled={status?.isClean}
                />
              </div>

              <div
                style={{
                  ...styles.sidebarSection,
                  flex: 0,
                  minHeight: '150px',
                  borderTop: `1px solid ${colors.border.default}`,
                }}
              >
                <StashList
                  stashes={stashes}
                  onApply={applyStash}
                  onPop={popStash}
                  onDrop={dropStash}
                />
              </div>

              <div
                style={{
                  ...styles.sidebarSection,
                  flex: 0,
                  minHeight: '200px',
                  borderTop: `1px solid ${colors.border.default}`,
                }}
              >
                <div style={styles.sidebarHeader}>Branches</div>
                <BranchList
                  branches={branches}
                  currentBranch={currentBranch}
                  onBranchClick={handleBranchClick}
                  onCreateBranch={handleCreateBranch}
                  onDeleteBranch={handleDeleteBranch}
                />
              </div>
            </div>

            {/* Commit list (fixed width) */}
            <div style={styles.commitPanel}>
              <div style={styles.panelHeader}>
                <span>Commits</span>
                {isLoadingCommits && (
                  <span style={styles.loadingIndicator}>Loading...</span>
                )}
              </div>
              <CommitList
                commits={commits}
                selectedSha={selectedCommitSha}
                onCommitClick={handleCommitClick}
                onCheckoutCommit={handleCheckoutCommit}
              />
            </div>

            {/* Diff viewer */}
            <div style={styles.diffPanel}>
              <div style={styles.panelHeader}>
                <span>Diff</span>
              </div>
              <DiffViewer
                diff={diffContent}
                isLoading={isDiffLoading}
                title={diffTitle}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: colors.bg.primary,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.sans,
  },
  header: {
    padding: '12px 16px',
    backgroundColor: colors.bg.secondary,
    borderBottom: `1px solid ${colors.border.default}`,
  },
  notificationBar: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: '12px',
    padding: '10px 16px',
    backgroundColor: '#3a1f1f',
    borderBottom: `1px solid ${colors.accent.error}55`,
    flexShrink: 0,
  },
  notificationText: {
    flex: 1,
    fontSize: typography.fontSize.xs,
    color: colors.accent.error,
    fontFamily: typography.fontFamily.mono,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: '1.5',
  },
  notificationActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexShrink: 0,
  },
  notificationPrimaryBtn: {
    padding: '4px 12px',
    backgroundColor: colors.accent.primary,
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  notificationDismiss: {
    background: 'none',
    border: 'none',
    color: colors.text.secondary,
    cursor: 'pointer',
    fontSize: '14px',
    padding: '0 2px',
    lineHeight: 1,
  },
  divergentCard: {
    backgroundColor: '#2a2000',
    borderBottom: `1px solid ${colors.accent.warning}55`,
    padding: '12px 16px',
    flexShrink: 0,
  },
  divergentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  divergentTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.accent.warning,
  },
  divergentOptions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap' as const,
  },
  divergentOption: {
    flex: '1 1 180px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-start',
    gap: '4px',
    padding: '10px 12px',
    backgroundColor: colors.bg.tertiary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '4px',
    cursor: 'pointer',
    textAlign: 'left' as const,
  },
  divergentOptionDanger: {
    borderColor: colors.accent.error + '55',
  },
  divergentOptionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  divergentOptionDesc: {
    fontSize: '11px',
    color: colors.text.secondary,
    lineHeight: '1.4',
  },
  gitVersionBadge: {
    fontSize: '10px',
    color: colors.text.disabled,
    fontFamily: typography.fontFamily.mono,
    marginBottom: '4px',
  },
  repoInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  repoTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  repoActionsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  repoPath: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.mono,
  },
  remoteBadge: {
    fontSize: '10px',
    padding: '2px 6px',
    backgroundColor: colors.bg.tertiary,
    color: colors.accent.secondary,
    borderRadius: '10px',
    border: `1px solid ${colors.border.default}`,
    fontWeight: 'bold',
  },
  currentBranch: {
    fontSize: typography.fontSize.sm,
    color: colors.accent.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  branchIcon: {
    marginRight: '4px',
  },
  upstreamInfo: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.normal,
  },
  buttonGroup: {
    display: 'flex',
    gap: '4px',
  },
  actionButton: {
    padding: '4px 10px',
    fontSize: '11px',
    backgroundColor: colors.bg.tertiary,
    color: colors.text.primary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '3px',
    cursor: 'pointer',
  },
  status: {
    fontSize: typography.fontSize.xs,
  },
  statusClean: {
    color: colors.git.added,
  },
  statusDirty: {
    color: colors.git.modified,
  },
  content: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
  },
  sidebar: {
    width: '360px',
    minWidth: '280px',
    backgroundColor: colors.bg.secondary,
    borderRight: `1px solid ${colors.border.default}`,
    display: 'flex',
    flexDirection: 'column',
  },
  sidebarSection: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
  sidebarHeader: {
    padding: '12px 16px',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    borderBottom: `1px solid ${colors.border.default}`,
    backgroundColor: colors.bg.tertiary,
  },
  fileListContainer: {
    flex: 1,
    overflowY: 'auto',
  },
  commitPanel: {
    width: '320px',
    minWidth: '240px',
    display: 'flex',
    flexDirection: 'column',
    borderRight: `1px solid ${colors.border.default}`,
    overflow: 'hidden',
  },
  diffPanel: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
  },
  panelHeader: {
    padding: '12px 16px',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    backgroundColor: colors.bg.secondary,
    borderBottom: `1px solid ${colors.border.default}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexShrink: 0,
  },
  loadingIndicator: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  centerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: colors.bg.primary,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.sans,
  },
  welcomeText: {
    fontSize: '28px',
    fontWeight: typography.fontWeight.semibold,
    marginBottom: '8px',
    color: colors.text.primary,
  },
  instructionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: '32px',
  },
  welcomeActions: {
    display: 'flex',
    gap: '16px',
  },
  welcomeBtn: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '6px',
    width: '180px',
    padding: '24px 16px',
    backgroundColor: colors.bg.secondary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'border-color 0.15s',
    color: colors.text.primary,
  },
  welcomeBtnSecondary: {
    borderColor: colors.accent.primary + '66',
  },
  welcomeBtnIcon: {
    fontSize: '28px',
    marginBottom: '4px',
  },
  welcomeBtnLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  welcomeBtnDesc: {
    fontSize: '11px',
    color: colors.text.secondary,
    textAlign: 'center' as const,
    lineHeight: '1.4',
  },
  loadingText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
  },
  errorText: {
    fontSize: typography.fontSize.md,
    color: colors.accent.error,
  },
  openButton: {
    marginTop: '20px',
    padding: '10px 20px',
    backgroundColor: colors.accent.primary,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
  },
};
