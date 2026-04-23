/**
 * Git command builder utilities
 * Provides safe command construction for Git CLI operations
 */

import { DiffOptions, LogOptions } from '../git/types';

/**
 * Escapes a string for safe use in shell commands
 */
export function escapeShellArg(arg: string): string {
  return `'${arg.replace(/'/g, "'\\''")}'`;
}

/**
 * Builds git log command with options
 */
export function buildLogCommand(options: LogOptions = {}): string[] {
  const args = ['log', '--pretty=format:%H%n%h%n%an%n%ae%n%at%n%cn%n%ce%n%ct%n%P%n%D%n%B%x00'];

  if (options.maxCount !== undefined) {
    args.push(`--max-count=${options.maxCount}`);
  }

  if (options.skip !== undefined) {
    args.push(`--skip=${options.skip}`);
  }

  if (options.author) {
    args.push(`--author=${options.author}`);
  }

  if (options.since) {
    args.push(`--since=${options.since.toISOString()}`);
  }

  if (options.until) {
    args.push(`--until=${options.until.toISOString()}`);
  }

  if (options.firstParent) {
    args.push('--first-parent');
  }

  if (options.ref && options.ref.trim()) {
    args.push(options.ref);
  }

  if (options.paths && options.paths.length > 0) {
    args.push('--');
    args.push(...options.paths);
  }

  return args;
}

/**
 * Builds git diff command with options
 */
export function buildDiffCommand(options: DiffOptions = {}): string[] {
  const args = ['diff'];

  if (options.cached) {
    args.push('--cached');
  }

  if (options.context !== undefined) {
    args.push(`--unified=${options.context}`);
  }

  if (options.commit) {
    args.push(options.commit);
  }

  if (options.paths && options.paths.length > 0) {
    args.push('--');
    args.push(...options.paths);
  }

  return args;
}

/**
 * Builds git status command
 */
export function buildStatusCommand(): string[] {
  return ['status', '--porcelain=v1', '-z'];
}

/**
 * Builds git branch command
 */
export function buildBranchListCommand(includeRemote = false): string[] {
  const args = ['branch', '--list', '--format=%(refname)%09%(HEAD)%09%(objectname)%09%(upstream)'];

  if (includeRemote) {
    args.push('--all');
  }

  return args;
}

/**
 * Builds git remote command
 */
export function buildRemoteListCommand(): string[] {
  return ['remote', '-v'];
}

/**
 * Builds git tag command
 */
export function buildTagListCommand(): string[] {
  return ['tag', '--list', '--format=%(refname:short)%09%(objectname)%09%(contents:subject)'];
}
