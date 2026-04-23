/**
 * Tests for Repository class
 * Note: These are integration tests that require a real Git repository
 */

import { Repository } from '../../src/git/repository';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

describe('Repository', () => {
  let tempDir: string;
  let repo: Repository;

  beforeEach(async () => {
    // Create a temporary directory
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'git-gui-test-'));
  });

  afterEach(async () => {
    // Clean up
    if (tempDir) {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('open', () => {
    it('should throw error for non-existent path', async () => {
      await expect(Repository.open('/nonexistent/path')).rejects.toThrow(
        'Not a Git repository'
      );
    });

    it('should throw error for non-git directory', async () => {
      await expect(Repository.open(tempDir)).rejects.toThrow(
        'Not a Git repository'
      );
    });

    it('should open valid git repository', async () => {
      // Initialize a git repo
      const { execFile } = require('child_process');
      const { promisify } = require('util');
      const execFileAsync = promisify(execFile);

      await execFileAsync('git', ['init'], { cwd: tempDir });

      const repository = await Repository.open(tempDir);
      expect(repository).toBeInstanceOf(Repository);
      expect(repository.getPath()).toBe(tempDir);
    });
  });

  describe('Git operations (with initialized repo)', () => {
    beforeEach(async () => {
      // Initialize a git repo and configure it
      const { execFile } = require('child_process');
      const { promisify } = require('util');
      const execFileAsync = promisify(execFile);

      await execFileAsync('git', ['init'], { cwd: tempDir });
      await execFileAsync('git', ['config', 'user.name', 'Test User'], {
        cwd: tempDir,
      });
      await execFileAsync('git', ['config', 'user.email', 'test@example.com'], {
        cwd: tempDir,
      });

      repo = await Repository.open(tempDir);
    });

    describe('getStatus', () => {
      it('should return status for new repository', async () => {
        const status = await repo.getStatus();
        // New repos might have initial branch, but should have no modified files
        expect(status.currentBranch).toBeTruthy();
      });

      it('should detect untracked files', async () => {
        // Create a file
        await fs.writeFile(path.join(tempDir, 'test.txt'), 'content');

        const status = await repo.getStatus();
        expect(status.isClean).toBe(false);
        expect(status.files.length).toBeGreaterThan(0);
      });
    });

    describe('commit operations', () => {
      it('should create a commit', async () => {
        // Create and stage a file
        await fs.writeFile(path.join(tempDir, 'test.txt'), 'content');
        await repo.stage(['test.txt']);

        // Create commit
        await repo.commit({ message: 'Initial commit' });

        // Verify commit exists
        const log = await repo.getLog({ maxCount: 1 });
        expect(log).toHaveLength(1);
        expect(log[0].message).toBe('Initial commit');
      });

      it('should get commit history', async () => {
        // Create multiple commits
        for (let i = 0; i < 3; i++) {
          await fs.writeFile(
            path.join(tempDir, `file${i}.txt`),
            `content ${i}`
          );
          await repo.stage([`file${i}.txt`]);
          await repo.commit({ message: `Commit ${i}` });
        }

        const log = await repo.getLog();
        expect(log.length).toBeGreaterThanOrEqual(3);
        expect(log[0].message).toBe('Commit 2'); // Most recent first
      });

      it('should get specific commit', async () => {
        await fs.writeFile(path.join(tempDir, 'test.txt'), 'content');
        await repo.stage(['test.txt']);
        await repo.commit({ message: 'Test commit' });

        const log = await repo.getLog({ maxCount: 1 });
        const sha = log[0].sha;

        const commit = await repo.getCommit(sha);
        expect(commit).not.toBeNull();
        expect(commit?.sha).toBe(sha);
        expect(commit?.message).toBe('Test commit');
      });
    });

    describe('branch operations', () => {
      beforeEach(async () => {
        // Create initial commit (required for branches)
        await fs.writeFile(path.join(tempDir, 'test.txt'), 'content');
        await repo.stage(['test.txt']);
        await repo.commit({ message: 'Initial commit' });
      });

      it('should list branches', async () => {
        const branches = await repo.getBranches();
        expect(branches.length).toBeGreaterThan(0);
        const mainBranch = branches.find(
          (b) => b.name === 'main' || b.name === 'master'
        );
        expect(mainBranch).toBeDefined();
      });

      it('should get current branch', async () => {
        const branch = await repo.getCurrentBranch();
        expect(branch).not.toBeNull();
        expect(branch?.isCurrent).toBe(true);
      });

      it('should create a new branch', async () => {
        await repo.createBranch('feature/test');
        const branches = await repo.getBranches();
        const testBranch = branches.find((b) => b.name === 'feature/test');
        expect(testBranch).toBeDefined();
      });

      it('should checkout a branch', async () => {
        await repo.createBranch('feature/test');
        await repo.checkout('feature/test');
        const current = await repo.getCurrentBranch();
        expect(current?.name).toBe('feature/test');
      });

      it('should delete a branch', async () => {
        await repo.createBranch('feature/temp');
        await repo.deleteBranch('feature/temp');
        const branches = await repo.getBranches();
        const tempBranch = branches.find((b) => b.name === 'feature/temp');
        expect(tempBranch).toBeUndefined();
      });
    });

    describe('stage/unstage operations', () => {
      it('should stage files', async () => {
        await fs.writeFile(path.join(tempDir, 'test.txt'), 'content');
        await repo.stage(['test.txt']);

        const status = await repo.getStatus();
        const stagedFile = status.files.find((f) => f.path === 'test.txt');
        expect(stagedFile).toBeDefined();
        expect(stagedFile?.indexStatus).not.toBe(' ');
      });

      it('should stage all files', async () => {
        await fs.writeFile(path.join(tempDir, 'test1.txt'), 'content 1');
        await fs.writeFile(path.join(tempDir, 'test2.txt'), 'content 2');
        await repo.stage([]);

        const status = await repo.getStatus();
        expect(status.files.length).toBeGreaterThan(0);
      });

      it('should unstage files', async () => {
        await fs.writeFile(path.join(tempDir, 'test.txt'), 'content');
        await repo.stage(['test.txt']);
        await repo.unstage(['test.txt']);

        const status = await repo.getStatus();
        const file = status.files.find((f) => f.path === 'test.txt');
        // After unstaging a new file, it becomes untracked
        expect(file?.indexStatus).toBe('?');
      });
    });

    describe('tag operations', () => {
      beforeEach(async () => {
        // Create initial commit
        await fs.writeFile(path.join(tempDir, 'test.txt'), 'content');
        await repo.stage(['test.txt']);
        await repo.commit({ message: 'Initial commit' });
      });

      it('should create a tag', async () => {
        await repo.createTag('v1.0.0');
        const tags = await repo.getTags();
        const tag = tags.find((t) => t.name === 'v1.0.0');
        expect(tag).toBeDefined();
      });

      it('should create an annotated tag', async () => {
        await repo.createTag('v1.0.0', 'HEAD', 'Release 1.0.0');
        const tags = await repo.getTags();
        const tag = tags.find((t) => t.name === 'v1.0.0');
        expect(tag).toBeDefined();
        expect(tag?.type).toBe('annotated');
      });

      it('should delete a tag', async () => {
        await repo.createTag('v1.0.0');
        await repo.deleteTag('v1.0.0');
        const tags = await repo.getTags();
        const tag = tags.find((t) => t.name === 'v1.0.0');
        expect(tag).toBeUndefined();
      });
    });

    describe('getDiff', () => {
      it('should get diff for modified file', async () => {
        // Create initial commit
        await fs.writeFile(path.join(tempDir, 'test.txt'), 'original content');
        await repo.stage(['test.txt']);
        await repo.commit({ message: 'Initial commit' });

        // Modify file
        await fs.writeFile(path.join(tempDir, 'test.txt'), 'modified content');

        const diff = await repo.getDiff();
        expect(diff).toContain('test.txt');
        expect(diff).toContain('-original content');
        expect(diff).toContain('+modified content');
      });
    });
  });
});
