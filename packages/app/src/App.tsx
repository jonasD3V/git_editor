/**
 * Main App component
 */

import { useState, useEffect } from 'react';
import { RepositoryScreen } from '@git-gui/ui';

const { ipcRenderer } = window.require('electron');

type GitStatus = 'checking' | 'ok' | 'missing';

const INSTALL_URLS: Record<string, string> = {
  darwin: 'https://git-scm.com/download/mac',
  win32: 'https://git-scm.com/download/win',
  linux: 'https://git-scm.com/download/linux',
};

export function App() {
  const [gitStatus, setGitStatus] = useState<GitStatus>('checking');
  const [gitVersion, setGitVersion] = useState('');
  const [repositoryPath, setRepositoryPath] = useState<string | undefined>(
    (typeof process !== 'undefined' ? process.env.TEST_REPO_PATH : undefined) ||
      undefined
  );
  const [shouldInit, setShouldInit] = useState(false);

  useEffect(() => {
    void (async () => {
      const version: string | null = await ipcRenderer.invoke('check-git');
      if (version) {
        setGitVersion(version);
        setGitStatus('ok');
      } else {
        setGitStatus('missing');
      }
    })();
  }, []);

  const handleOpenInstallPage = () => {
    const url =
      INSTALL_URLS[process.platform as string] ??
      'https://git-scm.com/downloads';
    void ipcRenderer.invoke('open-external', url);
  };

  const handleRetryGitCheck = async () => {
    setGitStatus('checking');
    const version: string | null = await ipcRenderer.invoke('check-git');
    if (version) {
      setGitVersion(version);
      setGitStatus('ok');
    } else {
      setGitStatus('missing');
    }
  };

  const handleOpenRepository = async () => {
    const path: string | null = await ipcRenderer.invoke('select-folder');
    if (path) {
      setShouldInit(false);
      setRepositoryPath(path);
    }
  };

  const handleInitRepository = async () => {
    const path: string | null = await ipcRenderer.invoke('init-folder');
    if (path) {
      setShouldInit(true);
      setRepositoryPath(path);
    }
  };

  const handleCloneRepository = async (url: string) => {
    const destination: string | null =
      await ipcRenderer.invoke('select-clone-folder');
    if (!destination) return;
    try {
      const { execFile } = window.require('child_process');
      const { promisify } = window.require('util');
      const execFileAsync = promisify(execFile) as (
        cmd: string,
        args: string[],
        opts?: object
      ) => Promise<{ stdout: string }>;
      await execFileAsync('git', ['clone', url, destination]);
      setShouldInit(false);
      setRepositoryPath(destination);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Clone failed';
      alert(`Clone failed: ${msg}`);
    }
  };

  if (gitStatus === 'checking') {
    return <CenteredMessage>Checking requirements...</CenteredMessage>;
  }

  if (gitStatus === 'missing') {
    return (
      <div style={styles.center}>
        <div style={styles.errorIcon}>⚠</div>
        <div style={styles.title}>Git is not installed</div>
        <div style={styles.body}>
          Git GUI requires Git to be installed and available in your PATH.
        </div>
        <div style={styles.platform}>
          Detected OS: <strong>{platformName()}</strong>
        </div>
        <div style={styles.btnRow}>
          <button style={styles.primaryBtn} onClick={handleOpenInstallPage}>
            Download Git
          </button>
          <button
            style={styles.secondaryBtn}
            onClick={() => void handleRetryGitCheck()}
          >
            Retry
          </button>
        </div>
        <div style={styles.hint}>
          On Windows, install <strong>Git for Windows</strong> — this also
          includes <code>ssh-keygen</code> which is required for SSH key
          management.
        </div>
      </div>
    );
  }

  return (
    <RepositoryScreen
      repositoryPath={repositoryPath}
      shouldInit={shouldInit}
      onOpenRepository={handleOpenRepository}
      onInitRepository={handleInitRepository}
      onCloneRepository={handleCloneRepository}
      gitVersion={gitVersion}
    />
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...styles.center, color: 'var(--text-secondary)', fontSize: '14px' }}>
      {children}
    </div>
  );
}

function platformName() {
  switch (process.platform) {
    case 'darwin':
      return 'macOS';
    case 'win32':
      return 'Windows';
    case 'linux':
      return 'Linux';
    default:
      return process.platform;
  }
}

const styles: Record<string, React.CSSProperties> = {
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    backgroundColor: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: '40px',
    gap: '16px',
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: '48px',
    color: 'var(--accent-warning)',
  },
  title: {
    fontSize: '22px',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  body: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    maxWidth: '400px',
    lineHeight: '1.6',
  },
  platform: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  btnRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  primaryBtn: {
    padding: '10px 24px',
    backgroundColor: 'var(--accent-primary)',
    color: 'var(--text-inverse)',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '10px 24px',
    backgroundColor: 'var(--bg-tertiary)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-default)',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  hint: {
    fontSize: '12px',
    color: 'var(--text-disabled)',
    maxWidth: '420px',
    lineHeight: '1.6',
    marginTop: '8px',
  },
};
