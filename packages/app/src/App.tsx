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
      gitVersion={gitVersion}
    />
  );
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...styles.center, color: '#9d9d9d', fontSize: '14px' }}>
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
    backgroundColor: '#1e1e1e',
    color: '#cccccc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: '40px',
    gap: '16px',
    textAlign: 'center',
  },
  errorIcon: {
    fontSize: '48px',
    color: '#cca700',
  },
  title: {
    fontSize: '22px',
    fontWeight: 600,
    color: '#cccccc',
  },
  body: {
    fontSize: '14px',
    color: '#9d9d9d',
    maxWidth: '400px',
    lineHeight: '1.6',
  },
  platform: {
    fontSize: '13px',
    color: '#9d9d9d',
  },
  btnRow: {
    display: 'flex',
    gap: '12px',
    marginTop: '8px',
  },
  primaryBtn: {
    padding: '10px 24px',
    backgroundColor: '#007acc',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  secondaryBtn: {
    padding: '10px 24px',
    backgroundColor: '#2d2d30',
    color: '#cccccc',
    border: '1px solid #3e3e42',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
  },
  hint: {
    fontSize: '12px',
    color: '#6e6e6e',
    maxWidth: '420px',
    lineHeight: '1.6',
    marginTop: '8px',
  },
};
