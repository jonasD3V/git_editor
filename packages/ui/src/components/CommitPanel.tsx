/**
 * Commit panel component
 * Allows entering a commit message and committing or stashing
 */

import React, { useState } from 'react';

import { colors, typography } from '../theme';

interface CommitPanelProps {
  onCommit: (message: string) => Promise<void>;
  onStash?: (message: string) => Promise<void>;
  disabled?: boolean;
}

export function CommitPanel({ onCommit, onStash, disabled }: CommitPanelProps) {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCommit = async () => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await onCommit(message);
      setMessage('');
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleStash = async () => {
    if (isLoading || !onStash) return;

    setIsLoading(true);
    try {
      await onStash(message);
      setMessage('');
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <textarea
        style={styles.textarea}
        placeholder="Commit or stash message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        disabled={disabled || isLoading}
      />
      <div style={styles.buttonGroup}>
        <button
          style={{
            ...styles.button,
            flex: 2,
            ...(disabled || !message.trim() || isLoading
              ? styles.buttonDisabled
              : {}),
          }}
          onClick={handleCommit}
          disabled={disabled || !message.trim() || isLoading}
        >
          {isLoading ? 'Processing...' : 'Commit'}
        </button>
        {onStash && (
          <button
            style={{
              ...styles.button,
              flex: 1,
              backgroundColor: colors.accent.secondary,
              ...(disabled || isLoading ? styles.buttonDisabled : {}),
            }}
            onClick={handleStash}
            disabled={disabled || isLoading}
          >
            Stash
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '16px',
    backgroundColor: colors.bg.secondary,
    borderTop: `1px solid ${colors.border.default}`,
  },
  textarea: {
    width: '100%',
    height: '80px',
    padding: '8px',
    backgroundColor: colors.bg.primary,
    color: colors.text.primary,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '4px',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.sans,
    resize: 'none',
    outline: 'none',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
  },
  button: {
    padding: '8px 16px',
    backgroundColor: colors.accent.primary,
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
};
