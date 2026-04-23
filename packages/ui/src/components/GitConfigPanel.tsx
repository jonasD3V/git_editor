import React, { useState, useEffect, useCallback } from 'react';
import {
  getGlobalConfig,
  setGlobalConfig,
  getLocalConfig,
  setLocalConfig,
  unsetLocalConfig,
} from '@git-gui/core/git';
import type { GitUserConfig } from '@git-gui/core/git';
import { colors, typography } from '../theme';

interface GitConfigPanelProps {
  repoPath: string | null;
}

interface ConfigRow {
  name: string;
  email: string;
}

export function GitConfigPanel({ repoPath }: GitConfigPanelProps) {
  const [global_, setGlobal] = useState<ConfigRow>({ name: '', email: '' });
  const [local, setLocal] = useState<ConfigRow>({ name: '', email: '' });
  const [savedGlobal, setSavedGlobal] = useState(false);
  const [savedLocal, setSavedLocal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const g = await getGlobalConfig();
      setGlobal({ name: g.name, email: g.email });

      if (repoPath) {
        const l = await getLocalConfig(repoPath);
        setLocal({ name: l.name, email: l.email });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load config');
    }
  }, [repoPath]);

  useEffect(() => { void load(); }, [load]);

  const handleSaveGlobal = async () => {
    setError(null);
    try {
      const update: Partial<GitUserConfig> = {};
      if (global_.name.trim()) update.name = global_.name.trim();
      if (global_.email.trim()) update.email = global_.email.trim();
      await setGlobalConfig(update);
      setSavedGlobal(true);
      setTimeout(() => setSavedGlobal(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save global config');
    }
  };

  const handleSaveLocal = async () => {
    if (!repoPath) return;
    setError(null);
    try {
      const update: Partial<GitUserConfig> = {};
      if (local.name.trim()) update.name = local.name.trim();
      if (local.email.trim()) update.email = local.email.trim();
      await setLocalConfig(repoPath, update);
      setSavedLocal(true);
      setTimeout(() => setSavedLocal(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save local config');
    }
  };

  const handleUnsetLocal = async (key: 'name' | 'email') => {
    if (!repoPath) return;
    await unsetLocalConfig(repoPath, key);
    setLocal((prev) => ({ ...prev, [key]: '' }));
    await load();
  };

  const effectiveName = local.name || global_.name || '—';
  const effectiveEmail = local.email || global_.email || '—';

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>Git Identity</div>

      <div style={styles.body}>
        {/* Effective identity preview */}
        <div style={styles.previewCard}>
          <div style={styles.previewLabel}>Effective identity for commits</div>
          <div style={styles.previewRow}>
            <span style={styles.previewValue}>{effectiveName}</span>
            <span style={styles.previewSep}>&lt;</span>
            <span style={styles.previewValue}>{effectiveEmail}</span>
            <span style={styles.previewSep}>&gt;</span>
          </div>
          <div style={styles.previewHint}>
            Local config overrides global. Leave local empty to use global.
          </div>
        </div>

        {error && <div style={styles.errorMsg}>{error}</div>}

        {/* Global config */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            Global Config
            <span style={styles.scope}>~/.gitconfig</span>
          </div>
          <label style={styles.label}>Name</label>
          <input
            style={styles.input}
            placeholder="Your Name"
            value={global_.name}
            onChange={(e) => setGlobal((p) => ({ ...p, name: e.target.value }))}
          />
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            placeholder="you@example.com"
            value={global_.email}
            onChange={(e) => setGlobal((p) => ({ ...p, email: e.target.value }))}
          />
          <button
            style={{ ...styles.saveBtn, ...(savedGlobal ? styles.saveBtnSuccess : {}) }}
            onClick={() => void handleSaveGlobal()}
          >
            {savedGlobal ? '✓ Saved' : 'Save Global'}
          </button>
        </div>

        {/* Local config */}
        {repoPath && (
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              Local Config
              <span style={styles.scope}>this repo only</span>
            </div>
            <label style={styles.label}>Name</label>
            <div style={styles.fieldRow}>
              <input
                style={styles.input}
                placeholder={global_.name || 'Override name for this repo…'}
                value={local.name}
                onChange={(e) => setLocal((p) => ({ ...p, name: e.target.value }))}
              />
              {local.name && (
                <button style={styles.unsetBtn} onClick={() => void handleUnsetLocal('name')} title="Remove local override">
                  ✕
                </button>
              )}
            </div>
            <label style={styles.label}>Email</label>
            <div style={styles.fieldRow}>
              <input
                style={styles.input}
                placeholder={global_.email || 'Override email for this repo…'}
                value={local.email}
                onChange={(e) => setLocal((p) => ({ ...p, email: e.target.value }))}
              />
              {local.email && (
                <button style={styles.unsetBtn} onClick={() => void handleUnsetLocal('email')} title="Remove local override">
                  ✕
                </button>
              )}
            </div>
            <button
              style={{ ...styles.saveBtn, ...(savedLocal ? styles.saveBtnSuccess : {}) }}
              onClick={() => void handleSaveLocal()}
            >
              {savedLocal ? '✓ Saved' : 'Save Local'}
            </button>
          </div>
        )}
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
    padding: '12px 16px',
    backgroundColor: colors.bg.tertiary,
    borderBottom: `1px solid ${colors.border.default}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    flexShrink: 0,
  },
  body: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  previewCard: {
    padding: '12px 14px',
    backgroundColor: colors.bg.primary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '4px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  previewLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.4px',
  },
  previewRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: typography.fontFamily.mono,
    fontSize: typography.fontSize.sm,
    flexWrap: 'wrap',
  },
  previewValue: {
    color: colors.text.primary,
  },
  previewSep: {
    color: colors.text.disabled,
  },
  previewHint: {
    fontSize: '11px',
    color: colors.text.disabled,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '14px',
    backgroundColor: colors.bg.tertiary,
    borderRadius: '4px',
    border: `1px solid ${colors.border.default}`,
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
  scope: {
    fontSize: '10px',
    fontFamily: typography.fontFamily.mono,
    color: colors.text.disabled,
    fontWeight: 'normal',
    textTransform: 'none',
    letterSpacing: 'normal',
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginBottom: '-4px',
  },
  fieldRow: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    color: colors.text.primary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '4px',
    padding: '7px 10px',
    fontSize: typography.fontSize.sm,
    outline: 'none',
  },
  unsetBtn: {
    flexShrink: 0,
    padding: '6px 9px',
    backgroundColor: 'none',
    background: 'none',
    color: colors.text.secondary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  saveBtn: {
    marginTop: '4px',
    padding: '7px',
    backgroundColor: colors.accent.primary,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
  },
  saveBtnSuccess: {
    backgroundColor: colors.accent.success,
    color: '#1e1e1e',
  },
  errorMsg: {
    fontSize: typography.fontSize.xs,
    color: colors.accent.error,
    padding: '6px 10px',
    backgroundColor: colors.accent.error + '18',
    borderRadius: '3px',
    border: `1px solid ${colors.accent.error + '44'}`,
  },
};
