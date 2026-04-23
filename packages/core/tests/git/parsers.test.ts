/**
 * Tests for Git output parsers
 */

import {
  parseLogOutput,
  parseBranchOutput,
  parseRemoteOutput,
  parseStatusOutput,
  parseTagOutput,
  parseCurrentBranch,
  parseUpstreamInfo,
} from '../../src/utils/parsers';
import { FileStatusType } from '../../src/git/types';

describe('Git Parsers', () => {
  describe('parseLogOutput', () => {
    it('should parse single commit', () => {
      const output = `abc123
abc
John Doe
john@example.com
1609459200
John Doe
john@example.com
1609459200
parent1 parent2
HEAD -> main, origin/main
Initial commit

This is the commit body
\0`;

      const commits = parseLogOutput(output);
      expect(commits).toHaveLength(1);
      expect(commits[0].sha).toBe('abc123');
      expect(commits[0].shortSha).toBe('abc');
      expect(commits[0].author.name).toBe('John Doe');
      expect(commits[0].author.email).toBe('john@example.com');
      expect(commits[0].message).toBe('Initial commit\n\nThis is the commit body');
      expect(commits[0].parents).toEqual(['parent1', 'parent2']);
      expect(commits[0].refs).toContain('HEAD -> main');
    });

    it('should parse multiple commits', () => {
      const output = `abc123
abc
John Doe
john@example.com
1609459200
John Doe
john@example.com
1609459200
parent0

First commit
\0def456
def
Jane Smith
jane@example.com
1609545600
Jane Smith
jane@example.com
1609545600
abc123

Second commit
\0`;

      const commits = parseLogOutput(output);
      expect(commits).toHaveLength(2);
      expect(commits[0].sha).toBe('abc123');
      expect(commits[1].sha).toBe('def456');
    });

    it('should return empty array for empty output', () => {
      expect(parseLogOutput('')).toEqual([]);
      expect(parseLogOutput('   ')).toEqual([]);
    });
  });

  describe('parseBranchOutput', () => {
    it('should parse local branches', () => {
      const output = `refs/heads/main\t*\tabc123\trefs/remotes/origin/main
refs/heads/develop\t \tdef456\t`;

      const branches = parseBranchOutput(output);
      expect(branches).toHaveLength(2);
      expect(branches[0].name).toBe('main');
      expect(branches[0].isCurrent).toBe(true);
      expect(branches[0].isRemote).toBe(false);
      expect(branches[0].upstream).toBe('refs/remotes/origin/main');
      expect(branches[1].name).toBe('develop');
      expect(branches[1].isCurrent).toBe(false);
    });

    it('should parse remote branches', () => {
      const output = `refs/remotes/origin/main\t \tabc123\t`;

      const branches = parseBranchOutput(output);
      expect(branches).toHaveLength(1);
      expect(branches[0].name).toBe('origin/main');
      expect(branches[0].isRemote).toBe(true);
    });

    it('should return empty array for empty output', () => {
      expect(parseBranchOutput('')).toEqual([]);
    });
  });

  describe('parseRemoteOutput', () => {
    it('should parse remotes', () => {
      const output = `origin\thttps://github.com/user/repo.git (fetch)
origin\thttps://github.com/user/repo.git (push)
upstream\thttps://github.com/other/repo.git (fetch)
upstream\thttps://github.com/other/repo.git (push)`;

      const remotes = parseRemoteOutput(output);
      expect(remotes).toHaveLength(2);
      expect(remotes[0].name).toBe('origin');
      expect(remotes[0].fetchUrl).toBe('https://github.com/user/repo.git');
      expect(remotes[0].pushUrl).toBe('https://github.com/user/repo.git');
      expect(remotes[1].name).toBe('upstream');
    });

    it('should return empty array for empty output', () => {
      expect(parseRemoteOutput('')).toEqual([]);
    });
  });

  describe('parseStatusOutput', () => {
    it('should parse modified files', () => {
      const output = ' M file1.txt\0A  file2.txt\0';

      const files = parseStatusOutput(output);
      expect(files).toHaveLength(2);
      expect(files[0].path).toBe('file1.txt');
      expect(files[0].indexStatus).toBe(FileStatusType.Unmodified);
      expect(files[0].workingTreeStatus).toBe(FileStatusType.Modified);
      expect(files[1].path).toBe('file2.txt');
      expect(files[1].indexStatus).toBe(FileStatusType.Added);
    });

    it('should parse renamed files', () => {
      const output = 'R  old.txt -> new.txt\0';

      const files = parseStatusOutput(output);
      expect(files).toHaveLength(1);
      expect(files[0].path).toBe('old.txt -> new.txt');
      expect(files[0].indexStatus).toBe(FileStatusType.Renamed);
    });

    it('should return empty array for empty output', () => {
      expect(parseStatusOutput('')).toEqual([]);
    });
  });

  describe('parseTagOutput', () => {
    it('should parse tags', () => {
      const output = `v1.0.0\tabc123\tRelease 1.0.0
v1.1.0\tdef456\t`;

      const tags = parseTagOutput(output);
      expect(tags).toHaveLength(2);
      expect(tags[0].name).toBe('v1.0.0');
      expect(tags[0].commit).toBe('abc123');
      expect(tags[0].message).toBe('Release 1.0.0');
      expect(tags[0].type).toBe('annotated');
      expect(tags[1].type).toBe('lightweight');
    });

    it('should return empty array for empty output', () => {
      expect(parseTagOutput('')).toEqual([]);
    });
  });

  describe('parseCurrentBranch', () => {
    it('should parse current branch', () => {
      const output = '## main...origin/main';
      expect(parseCurrentBranch(output)).toBe('main');
    });

    it('should return null for no branch', () => {
      expect(parseCurrentBranch('')).toBeNull();
    });
  });

  describe('parseUpstreamInfo', () => {
    it('should parse upstream with ahead/behind', () => {
      const output = '## main...origin/main [ahead 2, behind 1]';
      const info = parseUpstreamInfo(output);
      expect(info.upstream).toBe('origin/main');
      expect(info.ahead).toBe(2);
      expect(info.behind).toBe(1);
    });

    it('should parse upstream with only ahead', () => {
      const output = '## main...origin/main [ahead 3]';
      const info = parseUpstreamInfo(output);
      expect(info.ahead).toBe(3);
      expect(info.behind).toBe(0);
    });

    it('should handle no upstream', () => {
      const output = '## main';
      const info = parseUpstreamInfo(output);
      expect(info.upstream).toBeNull();
      expect(info.ahead).toBe(0);
      expect(info.behind).toBe(0);
    });
  });
});
