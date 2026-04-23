/**
 * Git Repository class
 * Main interface for Git operations
 */

import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

import {
  Commit,
  Branch,
  Remote,
  RepositoryStatus,
  Stash,
  Tag,
  LogOptions,
  DiffOptions,
  CommitOptions,
  FileStatusType,
} from './types';
import {
  buildLogCommand,
  buildBranchListCommand,
  buildRemoteListCommand,
  buildTagListCommand,
  buildDiffCommand,
} from '../utils/commands';
import {
  parseLogOutput,
  parseBranchOutput,
  parseRemoteOutput,
  parseStatusOutput,
  parseTagOutput,
  parseCurrentBranch,
  parseUpstreamInfo,
} from '../utils/parsers';

const execFileAsync = promisify(execFile);

/**
 * Represents a Git repository
 */
export class Repository {
  private readonly repoPath: string;

  /**
   * Creates a new Repository instance
   * @param repoPath - Path to the Git repository
   */
  constructor(repoPath: string) {
    this.repoPath = repoPath;
  }

  /**
   * Opens and validates a Git repository
   * @param repoPath - Path to the repository
   * @returns Repository instance
   * @throws Error if path is not a valid Git repository
   */
  static async open(repoPath: string): Promise<Repository> {
    const gitDir = path.join(repoPath, '.git');

    try {
      const stats = await fs.stat(gitDir);
      if (!stats.isDirectory()) {
        throw new Error(`Not a Git repository: ${repoPath}`);
      }
    } catch (error) {
      throw new Error(`Not a Git repository: ${repoPath}`);
    }

    return new Repository(repoPath);
  }

  /**
   * Initializes a new Git repository
   * @param repoPath - Path where to initialize the repository
   * @returns Repository instance
   */
  static async init(repoPath: string): Promise<Repository> {
    try {
      await fs.mkdir(repoPath, { recursive: true });
      await execFileAsync('git', ['init'], { cwd: repoPath });
      return new Repository(repoPath);
    } catch (error) {
      if (error instanceof Error && 'stderr' in error) {
        throw new Error(`Git init failed: ${(error as { stderr: string }).stderr}`);
      }
      throw error;
    }
  }

  /**
   * Gets the repository path
   */
  getPath(): string {
    return this.repoPath;
  }

  /**
   * Executes a Git command in the repository
   * @param args - Git command arguments
   * @returns Command output
   */
  private async execGit(args: string[]): Promise<string> {
    try {
      const { stdout } = await execFileAsync('git', args, {
        cwd: this.repoPath,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large outputs
      });
      return stdout;
    } catch (error) {
      if (error instanceof Error && 'stderr' in error) {
        throw new Error(`Git command failed: ${(error as { stderr: string }).stderr}`);
      }
      throw error;
    }
  }

  /**
   * Gets the repository status
   * @returns Repository status including current branch, files, and tracking info
   */
  async getStatus(): Promise<RepositoryStatus> {
    const statusOutput = await this.execGit(['status', '--porcelain=v1', '--branch', '-z', '--untracked-files=all']);
    console.log('Raw status output (hex):', Buffer.from(statusOutput).toString('hex').substring(0, 100));
    const files = parseStatusOutput(statusOutput);
    const currentBranch = parseCurrentBranch(statusOutput);
    const upstreamInfo = parseUpstreamInfo(statusOutput);

    return {
      currentBranch,
      upstream: upstreamInfo.upstream,
      ahead: upstreamInfo.ahead,
      behind: upstreamInfo.behind,
      files,
      isClean: files.length === 0,
    };
  }

  /**
   * Gets commit history
   * @param options - Log options for filtering and pagination
   * @returns Array of commits
   */
  async getLog(options: LogOptions = {}): Promise<Commit[]> {
    try {
      const args = buildLogCommand(options);
      const output = await this.execGit(args);
      return parseLogOutput(output);
    } catch (error) {
      // Handle fresh repositories with no commits
      if (error instanceof Error && (
        error.message.includes('does not have any commits yet') ||
        error.message.includes("bad default revision 'HEAD'") ||
        error.message.includes('does not have any commits') ||
        error.message.includes('fatal: your current branch')
      )) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Gets a specific commit by SHA
   * @param sha - Commit SHA
   * @returns Commit object
   */
  async getCommit(sha: string): Promise<Commit | null> {
    try {
      const commits = await this.getLog({ maxCount: 1, ref: sha });
      return commits[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Lists all branches
   * @param includeRemote - Include remote branches
   * @returns Array of branches
   */
  async getBranches(includeRemote = false): Promise<Branch[]> {
    const args = buildBranchListCommand(includeRemote);
    const output = await this.execGit(args);
    return parseBranchOutput(output);
  }

  /**
   * Gets the current branch
   * @returns Current branch or null if in detached HEAD state
   */
  async getCurrentBranch(): Promise<Branch | null> {
    const branches = await this.getBranches();
    return branches.find((b) => b.isCurrent) || null;
  }

  /**
   * Creates a new branch
   * @param name - Branch name
   * @param startPoint - Starting point (commit SHA or branch name)
   */
  async createBranch(name: string, startPoint?: string): Promise<void> {
    const args = ['branch', name];
    if (startPoint) {
      args.push(startPoint);
    }
    await this.execGit(args);
  }

  /**
   * Deletes a branch
   * @param name - Branch name
   * @param force - Force deletion even if not fully merged
   */
  async deleteBranch(name: string, force = false): Promise<void> {
    const args = ['branch', force ? '-D' : '-d', name];
    await this.execGit(args);
  }

  /**
   * Checks out a branch or commit
   * @param ref - Branch name or commit SHA
   */
  async checkout(ref: string): Promise<void> {
    if (!ref || !ref.trim()) {
      throw new Error('Cannot checkout empty reference');
    }
    await this.execGit(['checkout', ref]);
  }

  /**
   * Lists all remotes
   * @returns Array of remotes
   */
  async getRemotes(): Promise<Remote[]> {
    const args = buildRemoteListCommand();
    const output = await this.execGit(args);
    return parseRemoteOutput(output);
  }

  /**
   * Adds a remote
   * @param name - Remote name
   * @param url - Remote URL
   */
  async addRemote(name: string, url: string): Promise<void> {
    await this.execGit(['remote', 'add', name, url]);
  }

  /**
   * Removes a remote
   * @param name - Remote name
   */
  async removeRemote(name: string): Promise<void> {
    await this.execGit(['remote', 'remove', name]);
  }

  /**
   * Sets a remote URL
   * @param name - Remote name
   * @param url - New URL
   */
  async setRemoteUrl(name: string, url: string): Promise<void> {
    await this.execGit(['remote', 'set-url', name, url]);
  }

  /**
   * Lists all tags
   * @returns Array of tags
   */
  async getTags(): Promise<Tag[]> {
    const args = buildTagListCommand();
    const output = await this.execGit(args);
    return parseTagOutput(output);
  }

  /**
   * Creates a new tag
   * @param name - Tag name
   * @param commit - Commit SHA (defaults to HEAD)
   * @param message - Tag message (creates annotated tag)
   */
  async createTag(name: string, commit = 'HEAD', message?: string): Promise<void> {
    const args = ['tag'];
    if (message) {
      args.push('-a', name, '-m', message, commit);
    } else {
      args.push(name, commit);
    }
    await this.execGit(args);
  }

  /**
   * Deletes a tag
   * @param name - Tag name
   */
  async deleteTag(name: string): Promise<void> {
    await this.execGit(['tag', '-d', name]);
  }

  /**
   * Stages files for commit
   * @param paths - File paths to stage (empty array stages all changes)
   */
  async stage(paths: string[]): Promise<void> {
    const validPaths = paths.filter((p) => p && p.trim() !== '');
    if (validPaths.length === 0) {
      if (paths.length === 0) {
        await this.execGit(['add', '-A']);
      }
    } else {
      await this.execGit(['add', '--', ...validPaths]);
    }
  }

  /**
   * Unstages files
   * @param paths - File paths to unstage (empty array unstages all)
   */
  async unstage(paths: string[]): Promise<void> {
    const hasCommits = await this.hasCommits();
    const validPaths = paths.filter((p) => p && p.trim() !== '');

    if (hasCommits) {
      if (validPaths.length === 0) {
        if (paths.length === 0) await this.execGit(['reset', 'HEAD', '.']);
      } else {
        await this.execGit(['reset', 'HEAD', '--', ...validPaths]);
      }
    } else {
      // Fresh repo: HEAD doesn't exist yet, use git rm --cached
      if (validPaths.length === 0) {
        if (paths.length === 0) await this.execGit(['rm', '--cached', '-r', '.']);
      } else {
        await this.execGit(['rm', '--cached', '--', ...validPaths]);
      }
    }
  }

  private async hasCommits(): Promise<boolean> {
    try {
      await this.execGit(['rev-parse', 'HEAD']);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Discards changes in the working tree
   * @param paths - File paths to discard (empty array discards all)
   */
  async discardChanges(paths: string[]): Promise<void> {
    if (paths.length === 0) {
      // Discard all tracked changes
      await this.execGit(['checkout', '--', '.']);
      // Remove all untracked files
      await this.execGit(['clean', '-fd']);
    } else {
      // We need to separate tracked and untracked files because they need different commands
      // For simplicity, we try both and ignore errors for the one that doesn't apply
      try {
        await this.execGit(['checkout', '--', ...paths]);
      } catch (e) {
        // If it's not tracked, checkout will fail, so we try clean
      }
      
      try {
        await this.execGit(['clean', '-f', '--', ...paths]);
      } catch (e) {
        // If it's not untracked, clean might fail or do nothing
      }
    }
  }

  /**
   * Lists all stashes
   * @returns Array of stashes
   */
  async getStashes(): Promise<Stash[]> {
    const output = await this.execGit(['stash', 'list', '--pretty=format:%gd%n%gs%n%ar%x00']);
    if (!output.trim()) return [];

    const stashes: Stash[] = [];
    const entries = output.split('\0').filter((e) => e.trim());

    for (const entry of entries) {
      const lines = entry.trim().split('\n');
      if (lines.length < 2) continue;

      const ref = lines[0] ?? ''; // e.g. stash@{0}
      const index = parseInt(ref.match(/\d+/)?.[0] ?? '0', 10);
      const message = lines[1] ?? '';

      stashes.push({
        index,
        message,
        branch: '', 
        date: new Date(),
      });
    }

    return stashes;
  }

  /**
   * Pushes current changes to stash
   * @param message - Optional stash message
   * @param includeUntracked - Whether to include untracked files
   */
  async pushStash(message?: string, includeUntracked = true): Promise<void> {
    const args = ['stash', 'push'];
    if (includeUntracked) args.push('-u');
    if (message) args.push('-m', message);
    await this.execGit(args);
  }

  /**
   * Applies a stash
   * @param index - Stash index (defaults to 0)
   */
  async applyStash(index = 0): Promise<void> {
    await this.execGit(['stash', 'apply', `stash@{${index}}`]);
  }

  /**
   * Pops a stash
   * @param index - Stash index (defaults to 0)
   */
  async popStash(index = 0): Promise<void> {
    await this.execGit(['stash', 'pop', `stash@{${index}}`]);
  }

  /**
   * Drops a stash
   * @param index - Stash index
   */
  async dropStash(index: number): Promise<void> {
    await this.execGit(['stash', 'drop', `stash@{${index}}`]);
  }

  /**
   * Creates a commit
   * @param options - Commit options
   */
  async commit(options: CommitOptions): Promise<void> {
    const args = ['commit', '-m', options.message];

    if (options.amend) {
      args.push('--amend');
    }

    if (options.allowEmpty) {
      args.push('--allow-empty');
    }

    if (options.author) {
      args.push('--author', `${options.author.name} <${options.author.email}>`);
    }

    await this.execGit(args);
  }

  /**
   * Gets diff output
   * @param options - Diff options
   * @returns Diff output as string
   */
  async getDiff(options: DiffOptions = {}): Promise<string> {
    const args = buildDiffCommand(options);
    return await this.execGit(args);
  }

  /**
   * Gets the full diff for a specific commit (like git show)
   * @param sha - Commit SHA
   * @returns Diff output as string
   */
  async getCommitDiff(sha: string): Promise<string> {
    return this.execGit(['show', sha, '--patch', '--no-color']);
  }

  /**
   * Fetches from remote
   * @param remote - Remote name (defaults to 'origin')
   */
  async fetch(remote = 'origin'): Promise<void> {
    await this.execGit(['fetch', remote]);
  }

  /**
   * Pulls from remote
   * @param remote - Remote name (defaults to current upstream)
   */
  async pull(remote?: string): Promise<void> {
    const args = ['pull'];
    if (remote) {
      args.push(remote);
    }
    await this.execGit(args);
  }

  /**
   * Pushes to remote
   * @param remote - Remote name (defaults to current upstream)
   * @param branch - Branch name
   * @param setUpstream - Set upstream tracking
   */
  async push(remote?: string, branch?: string, setUpstream = false): Promise<void> {
    const status = await this.getStatus();
    const hasUpstream = !!status.upstream;

    const resolvedRemote = remote ?? 'origin';
    const resolvedBranch = branch ?? status.currentBranch ?? 'main';

    const args = ['push'];

    // Automatically set upstream when the branch has no tracking remote yet
    if (setUpstream || !hasUpstream) {
      args.push('-u', resolvedRemote, resolvedBranch);
    } else {
      if (remote) args.push(remote);
      if (branch) args.push(branch);
    }

    await this.execGit(args);
  }

  /**
   * Merges a branch into the current branch
   * @param branch - Branch to merge
   * @param message - Merge commit message
   */
  async merge(branch: string, message?: string): Promise<void> {
    const args = ['merge', branch];
    if (message) {
      args.push('-m', message);
    }
    await this.execGit(args);
  }

  /**
   * Checks if the repository has merge conflicts
   * @returns True if conflicts exist
   */
  async hasConflicts(): Promise<boolean> {
    const status = await this.getStatus();
    return status.files.some(
      (f) =>
        f.indexStatus === FileStatusType.UpdatedButUnmerged ||
        f.workingTreeStatus === FileStatusType.UpdatedButUnmerged
    );
  }
}
