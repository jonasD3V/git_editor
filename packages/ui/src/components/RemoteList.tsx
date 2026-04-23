/**
 * Remote list component
 * Displays and manages repository remotes
 */

import React, { useState } from 'react';
import type { Remote } from '@git-gui/core/git/types';
import { colors, typography } from '../theme';

interface RemoteListProps {
  remotes: Remote[];
  onAddRemote?: (name: string, url: string) => void;
  onRemoveRemote?: (name: string) => void;
  onUpdateUrl?: (name: string, url: string) => void;
}

export function RemoteList({ remotes, onAddRemote, onRemoveRemote, onUpdateUrl }: RemoteListProps) {
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [editingRemote, setEditingRemote] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState('');

  const handleAdd = () => {
    if (newName.trim() && newUrl.trim() && onAddRemote) {
      onAddRemote(newName.trim(), newUrl.trim());
      setNewName('');
      setNewUrl('');
    }
  };

  const handleStartEdit = (remote: Remote) => {
    setEditingRemote(remote.name);
    setEditUrl(remote.fetchUrl);
  };

  const handleSaveEdit = (name: string) => {
    if (editUrl.trim() && onUpdateUrl) {
      onUpdateUrl(name, editUrl.trim());
      setEditingRemote(null);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <div style={styles.sectionHeader}>Manage Remotes</div>
        {remotes.map((remote) => (
          <div key={remote.name} style={styles.remoteItem}>
            <div style={styles.remoteHeader}>
              <span style={styles.remoteName}>{remote.name}</span>
              <div style={styles.remoteActions}>
                {editingRemote === remote.name ? (
                  <>
                    <button style={styles.iconButton} onClick={() => handleSaveEdit(remote.name)} title="Save">💾</button>
                    <button style={styles.iconButton} onClick={() => setEditingRemote(null)} title="Cancel">✕</button>
                  </>
                ) : (
                  <>
                    <button style={styles.iconButton} onClick={() => handleStartEdit(remote)} title="Edit URL">✏️</button>
                    <button style={{ ...styles.iconButton, color: colors.accent.error }} onClick={() => onRemoveRemote?.(remote.name)} title="Remove">🗑</button>
                  </>
                )}
              </div>
            </div>
            {editingRemote === remote.name ? (
              <input
                style={styles.input}
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(remote.name)}
              />
            ) : (
              <div style={styles.remoteUrl} title={remote.fetchUrl}>{remote.fetchUrl}</div>
            )}
          </div>
        ))}
      </div>

      <div style={styles.addSection}>
        <div style={styles.sectionHeader}>Add Remote</div>
        <input
          style={styles.input}
          placeholder="Remote name (e.g. origin)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <input
          style={styles.input}
          placeholder="Remote URL"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button
          style={{
            ...styles.addButton,
            ...(!newName.trim() || !newUrl.trim() ? styles.buttonDisabled : {}),
          }}
          onClick={handleAdd}
          disabled={!newName.trim() || !newUrl.trim()}
        >
          Add Remote
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: colors.bg.secondary,
    padding: '16px',
    gap: '24px',
    height: '100%',
    overflowY: 'auto',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sectionHeader: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },
  remoteItem: {
    backgroundColor: colors.bg.primary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '4px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  remoteHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remoteName: {
    fontWeight: typography.fontWeight.semibold,
    color: colors.accent.primary,
    fontSize: typography.fontSize.sm,
  },
  remoteActions: {
    display: 'flex',
    gap: '8px',
  },
  remoteUrl: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.mono,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  addSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    backgroundColor: colors.bg.tertiary,
    borderRadius: '4px',
    border: `1px solid ${colors.border.default}`,
  },
  input: {
    backgroundColor: colors.bg.primary,
    color: colors.text.primary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '4px',
    padding: '8px 12px',
    fontSize: typography.fontSize.sm,
    outline: 'none',
  },
  addButton: {
    padding: '8px',
    backgroundColor: colors.accent.primary,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
  },
  iconButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};
