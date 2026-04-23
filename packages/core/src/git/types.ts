/**
 * Core Git type definitions
 * Provides TypeScript interfaces for Git operations
 */

/**
 * Represents a Git commit
 */
export interface Commit {
  /** Commit SHA hash */
  sha: string;
  /** Short SHA hash (7 characters) */
  shortSha: string;
  /** Commit message */
  message: string;
  /** Commit author */
  author: CommitAuthor;
  /** Commit committer */
  committer: CommitAuthor;
  /** Commit timestamp */
  date: Date;
  /** Parent commit SHAs */
  parents: string[];
  /** Branch/tag references pointing to this commit */
  refs: string[];
}

/**
 * Represents a commit author or committer
 */
export interface CommitAuthor {
  /** Author/committer name */
  name: string;
  /** Author/committer email */
  email: string;
  /** Timestamp */
  date: Date;
}

/**
 * Represents a Git branch
 */
export interface Branch {
  /** Branch name */
  name: string;
  /** Full reference name (e.g., refs/heads/main) */
  fullName: string;
  /** Whether this is the current branch */
  isCurrent: boolean;
  /** Whether this is a remote branch */
  isRemote: boolean;
  /** Commit SHA the branch points to */
  commit: string;
  /** Upstream branch name if set */
  upstream?: string;
}

/**
 * Represents a Git remote
 */
export interface Remote {
  /** Remote name (e.g., origin) */
  name: string;
  /** Fetch URL */
  fetchUrl: string;
  /** Push URL */
  pushUrl: string;
}

/**
 * Represents the status of a file in the working directory
 */
export interface FileStatus {
  /** File path relative to repository root */
  path: string;
  /** Status in the index (staging area) */
  indexStatus: FileStatusType;
  /** Status in the working tree */
  workingTreeStatus: FileStatusType;
  /** Original path for renamed files */
  originalPath?: string;
}

/**
 * File status types
 */
export enum FileStatusType {
  Unmodified = ' ',
  Modified = 'M',
  Added = 'A',
  Deleted = 'D',
  Renamed = 'R',
  Copied = 'C',
  Untracked = '?',
  Ignored = '!',
  UpdatedButUnmerged = 'U',
}

/**
 * Represents repository status
 */
export interface RepositoryStatus {
  /** Current branch name */
  currentBranch: string | null;
  /** Upstream branch name */
  upstream: string | null;
  /** Commits ahead of upstream */
  ahead: number;
  /** Commits behind upstream */
  behind: number;
  /** Modified files */
  files: FileStatus[];
  /** Whether repository is in clean state */
  isClean: boolean;
}

/**
 * Represents a Git tag
 */
export interface Tag {
  /** Tag name */
  name: string;
  /** Commit SHA the tag points to */
  commit: string;
  /** Tag message (for annotated tags) */
  message?: string;
  /** Tag type */
  type: 'lightweight' | 'annotated';
}

/**
 * Represents a stash entry
 */
export interface Stash {
  /** Stash index */
  index: number;
  /** Stash message */
  message: string;
  /** Branch name where stash was created */
  branch: string;
  /** Timestamp */
  date: Date;
}

/**
 * Git diff options
 */
export interface DiffOptions {
  /** Compare against specific commit */
  commit?: string;
  /** Include cached/staged changes */
  cached?: boolean;
  /** File paths to diff */
  paths?: string[];
  /** Context lines */
  context?: number;
}

/**
 * Git log options
 */
export interface LogOptions {
  /** Maximum number of commits */
  maxCount?: number;
  /** Skip first N commits */
  skip?: number;
  /** Filter by author */
  author?: string;
  /** Filter commits since date */
  since?: Date;
  /** Filter commits until date */
  until?: Date;
  /** File paths to filter */
  paths?: string[];
  /** Show first parent only (simplify merges) */
  firstParent?: boolean;
  /** Branch or ref to get log from */
  ref?: string;
}

/**
 * Represents diff for a single file
 */
export interface FileDiff {
  /** File path */
  path: string;
  /** Original path for renamed files */
  oldPath?: string;
  /** Change type */
  type: 'add' | 'modify' | 'delete' | 'rename';
  /** Hunks containing the actual changes */
  hunks: DiffHunk[];
  /** Additions count */
  additions: number;
  /** Deletions count */
  deletions: number;
}

/**
 * Represents a hunk in a diff
 */
export interface DiffHunk {
  /** Old file start line */
  oldStart: number;
  /** Old file line count */
  oldLines: number;
  /** New file start line */
  newStart: number;
  /** New file line count */
  newLines: number;
  /** Hunk header */
  header: string;
  /** Lines in this hunk */
  lines: DiffLine[];
}

/**
 * Represents a single line in a diff
 */
export interface DiffLine {
  /** Line type */
  type: 'add' | 'delete' | 'context';
  /** Line content */
  content: string;
  /** Line number in old file */
  oldLineNumber?: number;
  /** Line number in new file */
  newLineNumber?: number;
}

/**
 * Options for creating a commit
 */
export interface CommitOptions {
  /** Commit message */
  message: string;
  /** Whether to amend the previous commit */
  amend?: boolean;
  /** Allow empty commit */
  allowEmpty?: boolean;
  /** Author override */
  author?: {
    name: string;
    email: string;
  };
}

/**
 * Options for merging
 */
export interface MergeOptions {
  /** Branch to merge */
  branch: string;
  /** Fast-forward only */
  fastForwardOnly?: boolean;
  /** No fast-forward (always create merge commit) */
  noFastForward?: boolean;
  /** Commit message for merge commit */
  message?: string;
}

/**
 * Merge conflict
 */
export interface MergeConflict {
  /** File path */
  path: string;
  /** Our version (current branch) */
  ours: string;
  /** Their version (merging branch) */
  theirs: string;
  /** Common ancestor version */
  base?: string;
  /** Conflict type */
  type: 'content' | 'add-add' | 'delete-modify';
}
