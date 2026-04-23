/**
 * Git output parser utilities
 * Parses Git CLI output into structured data
 */

import {
  Commit,
  Branch,
  Remote,
  FileStatus,
  FileStatusType,
  Tag,
} from '../git/types';

/**
 * Parses git log output into Commit objects
 */
export function parseLogOutput(output: string): Commit[] {
  if (!output.trim()) {
    return [];
  }

  const commits: Commit[] = [];
  const commitBlocks = output.split('\0').filter((block) => block.trim());

  for (const block of commitBlocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 10) continue;

    const sha = lines[0];
    const shortSha = lines[1];
    const authorName = lines[2];
    const authorEmail = lines[3];
    const authorDate = lines[4];
    const committerName = lines[5];
    const committerEmail = lines[6];
    const committerDate = lines[7];
    const parents = lines[8];
    const refs = lines[9];
    const messageLines = lines.slice(10);

    if (sha === undefined || shortSha === undefined || authorName === undefined ||
        authorEmail === undefined || authorDate === undefined || committerName === undefined ||
        committerEmail === undefined || committerDate === undefined ||
        parents === undefined || refs === undefined) {
      continue;
    }

    const commit: Commit = {
      sha: sha.trim(),
      shortSha: shortSha.trim(),
      author: {
        name: authorName.trim(),
        email: authorEmail.trim(),
        date: new Date(parseInt(authorDate.trim(), 10) * 1000),
      },
      committer: {
        name: committerName.trim(),
        email: committerEmail.trim(),
        date: new Date(parseInt(committerDate.trim(), 10) * 1000),
      },
      date: new Date(parseInt(authorDate.trim(), 10) * 1000),
      parents: parents.trim() ? parents.trim().split(' ') : [],
      refs: parseRefs(refs.trim()),
      message: messageLines.join('\n').trim(),
    };

    commits.push(commit);
  }

  return commits;
}

/**
 * Parses ref string into array of ref names
 */
function parseRefs(refsString: string): string[] {
  if (!refsString) return [];

  return refsString
    .split(',')
    .map((ref) => ref.trim())
    .filter((ref) => ref.length > 0);
}

/**
 * Parses git branch output into Branch objects
 */
export function parseBranchOutput(output: string): Branch[] {
  if (!output.trim()) {
    return [];
  }

  const branches: Branch[] = [];
  const lines = output.trim().split('\n');

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 3) continue;

    const fullName = parts[0];
    const head = parts[1];
    const commit = parts[2];
    const upstream = parts[3];

    if (!fullName || !head || !commit) continue;

    const isCurrent = head === '*';
    const isRemote = fullName.startsWith('refs/remotes/');
    const name = fullName.replace(/^refs\/(heads|remotes)\//, '');

    const branch: Branch = {
      name,
      fullName,
      isCurrent,
      isRemote,
      commit: commit.trim(),
      upstream: upstream?.trim() || undefined,
    };

    branches.push(branch);
  }

  return branches;
}

/**
 * Parses git remote output into Remote objects
 */
export function parseRemoteOutput(output: string): Remote[] {
  if (!output.trim()) {
    return [];
  }

  const remoteMap = new Map<string, { fetchUrl?: string; pushUrl?: string }>();
  const lines = output.trim().split('\n');

  for (const line of lines) {
    const match = line.match(/^(\S+)\s+(\S+)\s+\((fetch|push)\)$/);
    if (!match) continue;

    const name = match[1];
    const url = match[2];
    const type = match[3];

    if (!name || !url || !type) continue;

    const remote = remoteMap.get(name) || {};

    if (type === 'fetch') {
      remote.fetchUrl = url;
    } else if (type === 'push') {
      remote.pushUrl = url;
    }

    remoteMap.set(name, remote);
  }

  const remotes: Remote[] = [];
  for (const [name, { fetchUrl, pushUrl }] of remoteMap) {
    if (fetchUrl && pushUrl) {
      remotes.push({
        name,
        fetchUrl,
        pushUrl,
      });
    }
  }

  return remotes;
}

/**
 * Parses git status --porcelain output into FileStatus objects
 * Assumes -z format is used
 */
export function parseStatusOutput(output: string): FileStatus[] {
  console.log('Parsing status output (length):', output.length);
  if (!output || output.length === 0) {
    return [];
  }

  const files: FileStatus[] = [];
  const entries = output.split('\0');
  console.log('Total status entries found:', entries.length);

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry) continue;

    // Skip branch line
    if (entry.startsWith('## ')) {
      console.log('Skipping branch line:', entry);
      continue;
    }

    if (entry.length < 3) {
      console.log('Skipping short entry:', entry);
      continue;
    }

    const indexStatus = entry[0] as FileStatusType;
    const workingTreeStatus = entry[1] as FileStatusType;
    const path = entry.substring(3);
    
    console.log(`Parsed file: [${indexStatus}${workingTreeStatus}] ${path}`);

    // Handle renamed/copied files in -z format
    // They are followed by another NUL-terminated string for the original path
    let actualPath = path;
    let originalPath: string | undefined;

    if (indexStatus === FileStatusType.Renamed || 
        indexStatus === FileStatusType.Copied ||
        workingTreeStatus === FileStatusType.Renamed ||
        workingTreeStatus === FileStatusType.Copied) {
      i++;
      if (i < entries.length) {
        originalPath = entries[i];
      }
    }

    const fileStatus: FileStatus = {
      path: actualPath,
      indexStatus,
      workingTreeStatus,
      originalPath,
    };

    files.push(fileStatus);
  }

  return files;
}

/**
 * Parses git tag output into Tag objects
 */
export function parseTagOutput(output: string): Tag[] {
  if (!output.trim()) {
    return [];
  }

  const tags: Tag[] = [];
  const lines = output.trim().split('\n');

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 2) continue;

    const name = parts[0];
    const commit = parts[1];
    const message = parts[2];

    if (!name || !commit) continue;

    const tag: Tag = {
      name: name.trim(),
      commit: commit.trim(),
      message: message?.trim() || undefined,
      type: message ? 'annotated' : 'lightweight',
    };

    tags.push(tag);
  }

  return tags;
}

/**
 * Parses current branch name from git status
 */
export function parseCurrentBranch(output: string): string | null {
  // Handle "No commits yet on branch"
  const noCommitsMatch = output.match(/^## No commits yet on ([^\s\0]+)/m);
  if (noCommitsMatch) return noCommitsMatch[1] || null;

  // Handle "Initial commit on branch" (older git versions)
  const initialCommitMatch = output.match(/^## Initial commit on ([^\s\0]+)/m);
  if (initialCommitMatch) return initialCommitMatch[1] || null;

  // If -z is used, the first entry is the branch line, ending with \0
  // regex should handle \0 by using [^\s\0]+ or similar
  const match = output.match(/^## ([^\s\0.]+)/m);
  return match?.[1] || null;
}

/**
 * Parses upstream tracking information
 */
export function parseUpstreamInfo(output: string): {
  upstream: string | null;
  ahead: number;
  behind: number;
} {
  const match = output.match(/^## [^\s\0.]+\.\.\.([^\s\0]+)(?: \[(?:ahead (\d+))?(?:, )?(?:behind (\d+))?\])?/m);

  if (!match) {
    return { upstream: null, ahead: 0, behind: 0 };
  }

  return {
    upstream: match[1] || null,
    ahead: match[2] ? parseInt(match[2], 10) : 0,
    behind: match[3] ? parseInt(match[3], 10) : 0,
  };
}
