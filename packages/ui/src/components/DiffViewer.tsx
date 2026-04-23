import React from 'react';

import { colors, typography } from '../theme';

interface DiffViewerProps {
  diff: string | null;
  isLoading?: boolean;
  title?: string;
}

export function DiffViewer({ diff, isLoading, title }: DiffViewerProps) {
  if (isLoading) {
    return (
      <div style={styles.placeholder}>
        <span style={styles.placeholderText}>Loading diff...</span>
      </div>
    );
  }

  if (!diff) {
    return (
      <div style={styles.placeholder}>
        <span style={styles.placeholderText}>
          Select a commit or file to view changes
        </span>
      </div>
    );
  }

  const lines = diff.split('\n');

  return (
    <div style={styles.container}>
      {title && <div style={styles.header}>{title}</div>}
      <div style={styles.content}>
        <pre style={styles.pre}>
          {lines.map((line, idx) => (
            <div key={idx} style={{ ...styles.line, ...getLineStyle(line) }}>
              <span style={styles.lineNumber}>{idx + 1}</span>
              <span style={styles.lineContent}>{line || ' '}</span>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

function getLineStyle(line: string): React.CSSProperties {
  if (line.startsWith('+') && !line.startsWith('+++')) {
    return {
      backgroundColor: 'rgba(137, 209, 133, 0.12)',
      color: colors.git.added,
    };
  }
  if (line.startsWith('-') && !line.startsWith('---')) {
    return {
      backgroundColor: 'rgba(244, 135, 113, 0.12)',
      color: colors.git.deleted,
    };
  }
  if (line.startsWith('@@')) {
    return {
      backgroundColor: 'rgba(0, 122, 204, 0.1)',
      color: colors.accent.secondary,
    };
  }
  if (
    line.startsWith('diff ') ||
    line.startsWith('index ') ||
    line.startsWith('--- ') ||
    line.startsWith('+++ ')
  ) {
    return { color: colors.text.secondary };
  }
  if (
    line.startsWith('commit ') ||
    line.startsWith('Author:') ||
    line.startsWith('Date:')
  ) {
    return { color: colors.accent.secondary };
  }
  return {};
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: colors.bg.primary,
  },
  header: {
    padding: '8px 16px',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    backgroundColor: colors.bg.secondary,
    borderBottom: `1px solid ${colors.border.default}`,
    fontFamily: typography.fontFamily.mono,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'auto',
  },
  pre: {
    margin: 0,
    padding: 0,
    fontFamily: typography.fontFamily.mono,
    fontSize: '12px',
  },
  line: {
    display: 'flex',
    minWidth: 'max-content',
  },
  lineNumber: {
    display: 'inline-block',
    minWidth: '40px',
    padding: '0 8px',
    textAlign: 'right',
    color: colors.text.disabled,
    fontSize: '11px',
    userSelect: 'none',
    borderRight: `1px solid ${colors.border.subtle}`,
    marginRight: '8px',
    flexShrink: 0,
  },
  lineContent: {
    whiteSpace: 'pre',
    flex: 1,
    paddingRight: '16px',
  },
  placeholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    backgroundColor: colors.bg.primary,
  },
  placeholderText: {
    color: colors.text.disabled,
    fontSize: typography.fontSize.sm,
  },
};
