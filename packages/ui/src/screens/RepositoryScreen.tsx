import React, { useEffect, useState, useCallback } from 'react';
import { useRepository } from '../hooks/useRepository';
import { CommitList } from '../components/CommitList';
import { BranchList } from '../components/BranchList';
import { FileList } from '../components/FileList';
import { CommitPanel } from '../components/CommitPanel';
import { RemoteList } from '../components/RemoteList';
import { StashList } from '../components/StashList';
import { DiffViewer } from '../components/DiffViewer';
import { SSHKeyManager } from '../components/SSHKeyManager';
import { GitConfigPanel } from '../components/GitConfigPanel';
import { colors, typography } from '../theme';
import type { Commit } from '@git-gui/core/git/types';

interface RepositoryScreenProps {
  repositoryPath?: string;
  shouldInit?: boolean;
  onOpenRepository?: () => void;
  onInitRepository?: () => void;
  gitVersion?: string;
}

export function RepositoryScreen({ repositoryPath, shouldInit, onOpenRepository, onInitRepository, gitVersion }: RepositoryScreenProps) {
  const [sidePanel, setSidePanel] = useState<null | 'remotes' | 'ssh' | 'config'>(null);
  const [diffContent, setDiffContent] = useState<string | null>(null);
  const [diffTitle, setDiffTitle] = useState<string | undefined>(undefined);
  const [isDiffLoading, setIsDiffLoading] = useState(false);
  const [selectedCommitSha, setSelectedCommitSha] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | undefined>(undefined);

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

  const handleCommitClick = useCallback(async (commit: Commit) => {
    const sha = commit.sha || commit.shortSha;
    if (!sha) return;
    setSelectedCommitSha(sha);
    setSelectedFile(undefined);
    setIsDiffLoading(true);
    setDiffTitle(`${commit.shortSha} – ${commit.message}`);
    const diff = await getCommitDiff(sha);
    setDiffContent(diff);
    setIsDiffLoading(false);
  }, [getCommitDiff]);

  const handleCheckoutCommit = useCallback(async (commit: Commit) => {
    const ref = commit.sha || commit.shortSha;
    if (!ref) return;
    try {
      await checkoutBranch(ref);
    } catch (err) {
      console.error('Commit checkout failed:', err);
    }
  }, [checkoutBranch]);

  const handleFileClick = useCallback(async (filePath: string, staged: boolean) => {
    setSelectedFile(filePath);
    setSelectedCommitSha(null);
    setIsDiffLoading(true);
    setDiffTitle(`${staged ? '[staged] ' : ''}${filePath}`);
    const diff = await getFileDiff(filePath, staged);
    setDiffContent(diff || '(no diff available)');
    setIsDiffLoading(false);
  }, [getFileDiff]);

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
          <button style={styles.openButton} onClick={() => window.location.reload()}>
            Retry
          </button>
          {error.includes('Not a Git repository') && (
            <button
              style={{ ...styles.openButton, backgroundColor: colors.accent.secondary, marginTop: 0 }}
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
        <div style={styles.welcomeText}>Welcome to Git GUI</div>
        <div style={styles.instructionText}>Open an existing repository or create a new one</div>
        <div style={{ ...styles.buttonGroup, marginTop: '20px' }}>
          <button style={styles.openButton} onClick={onOpenRepository}>
            Open Repository
          </button>
          <button style={{ ...styles.openButton, backgroundColor: colors.accent.secondary, marginTop: 0 }} onClick={onInitRepository}>
            Init Repository
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
                style={{ ...styles.actionButton, backgroundColor: sidePanel === 'remotes' ? colors.accent.primary : colors.bg.tertiary, color: sidePanel === 'remotes' ? 'white' : colors.text.primary }}
                onClick={() => setSidePanel(sidePanel === 'remotes' ? null : 'remotes')}
              >
                Remotes
              </button>
              <button
                style={{ ...styles.actionButton, backgroundColor: sidePanel === 'ssh' ? colors.accent.primary : colors.bg.tertiary, color: sidePanel === 'ssh' ? 'white' : colors.text.primary }}
                onClick={() => setSidePanel(sidePanel === 'ssh' ? null : 'ssh')}
              >
                SSH Keys
              </button>
              <button
                style={{ ...styles.actionButton, backgroundColor: sidePanel === 'config' ? colors.accent.primary : colors.bg.tertiary, color: sidePanel === 'config' ? 'white' : colors.text.primary }}
                onClick={() => setSidePanel(sidePanel === 'config' ? null : 'config')}
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
                    {' '}({status.upstream})
                    {status.ahead > 0 && ` ↑${status.ahead}`}
                    {status.behind > 0 && ` ↓${status.behind}`}
                  </span>
                )}
              </span>
            )}
            <div style={styles.buttonGroup}>
              <button
                style={{ ...styles.actionButton, backgroundColor: isLoadingStatus ? colors.bg.hover : colors.bg.tertiary }}
                onClick={() => void refresh()}
                disabled={isLoadingStatus}
                title="Refresh"
              >
                {isLoadingStatus ? '⏳' : '🔄'}
              </button>
              <button style={styles.actionButton} onClick={() => void fetch()} title="Fetch from remote">Fetch</button>
              <button style={styles.actionButton} onClick={() => void pull()} title="Pull from remote">Pull</button>
              <button style={styles.actionButton} onClick={() => void push()} title="Push to remote">Push</button>
            </div>
            {status && (
              <span style={styles.status}>
                {status.isClean ? (
                  <span style={styles.statusClean}>✓ Clean</span>
                ) : (
                  <span style={styles.statusDirty}>
                    {status.files.length} file{status.files.length !== 1 ? 's' : ''} changed
                  </span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={styles.content}>
        {sidePanel !== null ? (
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {sidePanel === 'remotes' && (
              <RemoteList
                remotes={remotes}
                onAddRemote={addRemote}
                onRemoveRemote={removeRemote}
                onUpdateUrl={setRemoteUrl}
              />
            )}
            {sidePanel === 'ssh' && <SSHKeyManager />}
            {sidePanel === 'config' && <GitConfigPanel repoPath={repositoryPath ?? null} />}
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
                <CommitPanel onCommit={handleCommit} onStash={handleStash} disabled={status?.isClean} />
              </div>

              <div style={{ ...styles.sidebarSection, flex: 0, minHeight: '150px', borderTop: `1px solid ${colors.border.default}` }}>
                <StashList
                  stashes={stashes}
                  onApply={applyStash}
                  onPop={popStash}
                  onDrop={dropStash}
                />
              </div>

              <div style={{ ...styles.sidebarSection, flex: 0, minHeight: '200px', borderTop: `1px solid ${colors.border.default}` }}>
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
                {isLoadingCommits && <span style={styles.loadingIndicator}>Loading...</span>}
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
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: '12px',
  },
  instructionText: {
    fontSize: typography.fontSize.md,
    color: colors.text.secondary,
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
