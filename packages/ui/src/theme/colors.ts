export const colors = {
  bg: {
    primary:   'var(--bg-primary)',
    secondary: 'var(--bg-secondary)',
    tertiary:  'var(--bg-tertiary)',
    hover:     'var(--bg-hover)',
  },
  text: {
    primary:   'var(--text-primary)',
    secondary: 'var(--text-secondary)',
    disabled:  'var(--text-disabled)',
    inverse:   'var(--text-inverse)',
  },
  accent: {
    primary:   'var(--accent-primary)',
    secondary: 'var(--accent-secondary)',
    success:   'var(--accent-success)',
    warning:   'var(--accent-warning)',
    error:     'var(--accent-error)',
    // pre-computed alpha variants – use these instead of `color + 'xx'`
    primaryBorder:     'var(--accent-primary-border)',
    secondaryBorder:   'var(--accent-secondary-border)',
    errorBorder:       'var(--accent-error-border)',
    errorSubtleBg:     'var(--accent-error-subtle-bg)',
    warningBorder:     'var(--accent-warning-border)',
  },
  git: {
    added:      'var(--git-added)',
    modified:   'var(--git-modified)',
    deleted:    'var(--git-deleted)',
    renamed:    'var(--git-renamed)',
    untracked:  'var(--git-untracked)',
    conflicted: 'var(--git-conflicted)',
    addedSubtleBg: 'var(--git-added-subtle-bg)',
    addedBorder:   'var(--git-added-border)',
  },
  branch: [
    'var(--branch-0)',
    'var(--branch-1)',
    'var(--branch-2)',
    'var(--branch-3)',
    'var(--branch-4)',
    'var(--branch-5)',
    'var(--branch-6)',
    'var(--branch-7)',
  ] as string[],
  border: {
    default: 'var(--border-default)',
    focus:   'var(--border-focus)',
    subtle:  'var(--border-subtle)',
  },
  notification: {
    errorBg:   'var(--notification-error-bg)',
    warningBg: 'var(--notification-warning-bg)',
  },
};

export type Colors = typeof colors;
