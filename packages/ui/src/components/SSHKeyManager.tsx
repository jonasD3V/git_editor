import { SSHManager } from '@git-gui/core/ssh';
import type { SSHKeyInfo } from '@git-gui/core/ssh';
import React, { useState, useEffect, useCallback } from 'react';

import { colors, typography } from '../theme';

const sshManager = new SSHManager();

export function SSHKeyManager() {
  const [keys, setKeys] = useState<SSHKeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  // Generate form state
  const [genName, setGenName] = useState('');
  const [genType, setGenType] = useState<'ed25519' | 'rsa'>('ed25519');
  const [genComment, setGenComment] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  const loadKeys = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await sshManager.listKeys();
      setKeys(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load SSH keys');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadKeys();
  }, [loadKeys]);

  const handleCopy = async (key: SSHKeyInfo) => {
    try {
      await navigator.clipboard.writeText(key.publicKey);
      setCopiedKey(key.name);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // fallback for environments where clipboard API isn't available
      const ta = document.createElement('textarea');
      ta.value = key.publicKey;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedKey(key.name);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleDelete = async (key: SSHKeyInfo) => {
    if (
      !window.confirm(
        `Delete SSH key "${key.name}"?\n\nThis deletes both the private and public key file. This cannot be undone.`
      )
    )
      return;
    try {
      await sshManager.deleteKey(key.name);
      await loadKeys();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete key');
    }
  };

  const handleGenerate = async () => {
    const name = genName.trim().replace(/\s+/g, '_');
    if (!name) return;
    setIsGenerating(true);
    setGenError(null);
    try {
      await sshManager.generateKey(name, genType, genComment.trim() || name);
      setGenName('');
      setGenComment('');
      await loadKeys();
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Key generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.pageHeader}>
        <span>SSH Keys</span>
        <span style={styles.sshDir}>{sshManager.getSshDir()}</span>
      </div>

      <div style={styles.body}>
        {/* Key list */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            Existing Keys
            <button
              style={styles.refreshBtn}
              onClick={loadKeys}
              title="Refresh"
            >
              ↺
            </button>
          </div>

          {isLoading && <div style={styles.hint}>Loading...</div>}
          {error && <div style={styles.errorMsg}>{error}</div>}
          {!isLoading && keys.length === 0 && (
            <div style={styles.hint}>
              No SSH keys found in {sshManager.getSshDir()}
            </div>
          )}

          {keys.map((key) => (
            <div key={key.name} style={styles.keyCard}>
              <div style={styles.keyRow}>
                <div style={styles.keyMeta}>
                  <span style={styles.keyName}>{key.name}</span>
                  <span style={styles.keyType}>{key.type.toUpperCase()}</span>
                  {!key.hasPrivateKey && (
                    <span style={styles.noPubKey}>public only</span>
                  )}
                </div>
                <div style={styles.keyActions}>
                  <button
                    style={styles.actionBtn}
                    onClick={() =>
                      setExpandedKey(expandedKey === key.name ? null : key.name)
                    }
                    title="Show public key"
                  >
                    {expandedKey === key.name ? 'Hide' : 'Show'}
                  </button>
                  <button
                    style={{
                      ...styles.actionBtn,
                      ...(copiedKey === key.name
                        ? styles.actionBtnSuccess
                        : {}),
                    }}
                    onClick={() => void handleCopy(key)}
                    title="Copy public key to clipboard"
                  >
                    {copiedKey === key.name ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    style={{
                      ...styles.actionBtn,
                      color: colors.accent.error,
                      borderColor: colors.accent.errorBorder,
                    }}
                    onClick={() => void handleDelete(key)}
                    title="Delete key pair"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {key.fingerprint && key.fingerprint !== 'unavailable' && (
                <div style={styles.fingerprint}>{key.fingerprint}</div>
              )}

              {expandedKey === key.name && (
                <textarea
                  style={styles.pubKeyArea}
                  readOnly
                  value={key.publicKey}
                  rows={3}
                  onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                />
              )}
            </div>
          ))}
        </div>

        {/* Generate new key */}
        <div style={styles.generateSection}>
          <div style={styles.sectionHeader}>Generate New Key</div>

          <label style={styles.label}>Key name (filename in ~/.ssh/)</label>
          <input
            style={styles.input}
            placeholder="e.g. id_ed25519_github"
            value={genName}
            onChange={(e) => setGenName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleGenerate()}
          />

          <label style={styles.label}>Type</label>
          <div style={styles.typeRow}>
            {(['ed25519', 'rsa'] as const).map((t) => (
              <button
                key={t}
                style={{
                  ...styles.typeBtn,
                  ...(genType === t ? styles.typeBtnActive : {}),
                }}
                onClick={() => setGenType(t)}
              >
                {t === 'ed25519' ? 'Ed25519 (recommended)' : 'RSA 4096'}
              </button>
            ))}
          </div>

          <label style={styles.label}>
            Comment (optional, e.g. your email)
          </label>
          <input
            style={styles.input}
            placeholder="you@example.com"
            value={genComment}
            onChange={(e) => setGenComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void handleGenerate()}
          />

          {genError && <div style={styles.errorMsg}>{genError}</div>}

          <button
            style={{
              ...styles.generateBtn,
              ...(!genName.trim() || isGenerating ? styles.btnDisabled : {}),
            }}
            onClick={() => void handleGenerate()}
            disabled={!genName.trim() || isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Key'}
          </button>

          <div style={styles.hint}>
            After generating, copy the public key and add it to your GitHub /
            GitLab account under <em>Settings → SSH Keys</em>.
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: colors.bg.secondary,
  },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: colors.bg.tertiary,
    borderBottom: `1px solid ${colors.border.default}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    flexShrink: 0,
  },
  sshDir: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.mono,
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px',
  },
  refreshBtn: {
    background: 'none',
    border: 'none',
    color: colors.text.secondary,
    cursor: 'pointer',
    fontSize: '14px',
    padding: '0 2px',
  },
  keyCard: {
    backgroundColor: colors.bg.primary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '4px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  keyRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  keyMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    minWidth: 0,
  },
  keyName: {
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.semibold,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  keyType: {
    fontSize: '10px',
    padding: '1px 5px',
    backgroundColor: colors.bg.tertiary,
    color: colors.accent.secondary,
    borderRadius: '3px',
    border: `1px solid ${colors.border.default}`,
    flexShrink: 0,
  },
  noPubKey: {
    fontSize: '10px',
    color: colors.accent.warning,
    flexShrink: 0,
  },
  keyActions: {
    display: 'flex',
    gap: '6px',
    flexShrink: 0,
  },
  actionBtn: {
    padding: '3px 10px',
    fontSize: '11px',
    backgroundColor: colors.bg.tertiary,
    color: colors.text.primary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '3px',
    cursor: 'pointer',
  },
  actionBtnSuccess: {
    color: colors.git.added,
    borderColor: colors.git.addedBorder,
  },
  fingerprint: {
    fontSize: '11px',
    fontFamily: typography.fontFamily.mono,
    color: colors.text.secondary,
  },
  pubKeyArea: {
    backgroundColor: colors.bg.tertiary,
    color: colors.text.primary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '3px',
    padding: '8px',
    fontSize: '11px',
    fontFamily: typography.fontFamily.mono,
    resize: 'none',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    wordBreak: 'break-all',
  },
  generateSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '16px',
    backgroundColor: colors.bg.tertiary,
    borderRadius: '4px',
    border: `1px solid ${colors.border.default}`,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: '-4px',
  },
  input: {
    backgroundColor: colors.bg.primary,
    color: colors.text.primary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '4px',
    padding: '7px 10px',
    fontSize: typography.fontSize.sm,
    outline: 'none',
  },
  typeRow: {
    display: 'flex',
    gap: '8px',
  },
  typeBtn: {
    flex: 1,
    padding: '6px',
    fontSize: '11px',
    backgroundColor: colors.bg.primary,
    color: colors.text.secondary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '3px',
    cursor: 'pointer',
  },
  typeBtnActive: {
    backgroundColor: colors.accent.primary,
    color: 'white',
    borderColor: colors.accent.primary,
  },
  generateBtn: {
    padding: '8px',
    backgroundColor: colors.accent.primary,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
    marginTop: '4px',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  errorMsg: {
    fontSize: typography.fontSize.xs,
    color: colors.accent.error,
    padding: '6px 10px',
    backgroundColor: colors.accent.errorSubtleBg,
    borderRadius: '3px',
    border: `1px solid ${colors.accent.errorBorder}`,
  },
  hint: {
    fontSize: typography.fontSize.xs,
    color: colors.text.disabled,
    lineHeight: '1.5',
  },
};
