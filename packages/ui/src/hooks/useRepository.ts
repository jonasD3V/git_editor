/**
 * React hook for repository operations
 * Connects UI to core Git operations
 */

import { useCallback } from 'react';
import { Repository } from '@git-gui/core/git';
import type { Branch } from '@git-gui/core/git/types';
import { useRepositoryStore } from '../stores/repositoryStore';

export function useRepository() {
  const store = useRepositoryStore();
  const {
    repository,
    repositoryPath,
    commits,
    branches,
    remotes,
    stashes,
    currentBranch,
    status,
    isLoading,
    isLoadingCommits,
    isLoadingBranches,
    isLoadingStatus,
    isLoadingRemotes,
    isLoadingStashes,
    error,
    setRepository,
    setCommits,
    setBranches,
    setStatus,
    setCurrentBranch,
    setRemotes,
    setStashes,
    setLoading,
    setLoadingCommits,
    setLoadingBranches,
    setLoadingStatus,
    setLoadingRemotes,
    setLoadingStashes,
    setError,
    reset,
  } = store;

  /**
   * Load commits
   */
  const loadCommits = useCallback(async (repo: Repository | null = null, maxCount = 100) => {
    // Always use the latest repository from store if not provided
    const activeRepo = repo || useRepositoryStore.getState().repository;
    if (!activeRepo) {
      console.warn('loadCommits called but no repository is available');
      return;
    }

    console.log('Loading commits...');
    setLoadingCommits(true);

    try {
      const commitList = await activeRepo.getLog({ maxCount });
      console.log('Loaded', commitList.length, 'commits');
      setCommits(commitList);
    } catch (err) {
      console.error('Failed to load commits:', err);
    } finally {
      setLoadingCommits(false);
    }
  }, [setCommits, setLoadingCommits]);

  /**
   * Load branches
   */
  const loadBranches = useCallback(async (repo: Repository | null = null) => {
    const activeRepo = repo || useRepositoryStore.getState().repository;
    if (!activeRepo) {
      console.warn('loadBranches called but no repository is available');
      return;
    }

    console.log('Loading branches...');
    setLoadingBranches(true);

    try {
      const branchList = await activeRepo.getBranches();
      console.log('Loaded', branchList.length, 'branches');
      setBranches(branchList);

      const current = branchList.find((b: Branch) => b.isCurrent);
      setCurrentBranch(current || null);
    } catch (err) {
      console.error('Failed to load branches:', err);
    } finally {
      setLoadingBranches(false);
    }
  }, [setBranches, setCurrentBranch, setLoadingBranches]);

  /**
   * Load repository status
   */
  const loadStatus = useCallback(async (repo: Repository | null = null) => {
    const activeRepo = repo || useRepositoryStore.getState().repository;
    if (!activeRepo) {
      console.warn('loadStatus called but no repository is available');
      return;
    }

    console.log('Loading status at', new Date().toLocaleTimeString());
    setLoadingStatus(true);

    try {
      const repoStatus = await activeRepo.getStatus();
      console.log('Loaded status:', repoStatus);
      setStatus(repoStatus);
    } catch (err) {
      console.error('Failed to load status:', err);
    } finally {
      setLoadingStatus(false);
    }
  }, [setStatus, setLoadingStatus]);

  /**
   * Load remotes
   */
  const loadRemotes = useCallback(async (repo: Repository | null = null) => {
    const activeRepo = repo || useRepositoryStore.getState().repository;
    if (!activeRepo) {
      console.warn('loadRemotes called but no repository is available');
      return;
    }

    console.log('Loading remotes...');
    setLoadingRemotes(true);

    try {
      const remoteList = await activeRepo.getRemotes();
      console.log('Loaded', remoteList.length, 'remotes');
      setRemotes(remoteList);
    } catch (err) {
      console.error('Failed to load remotes:', err);
    } finally {
      setLoadingRemotes(false);
    }
  }, [setRemotes, setLoadingRemotes]);

  /**
   * Load stashes
   */
  const loadStashes = useCallback(async (repo: Repository | null = null) => {
    const activeRepo = repo || useRepositoryStore.getState().repository;
    if (!activeRepo) {
      console.warn('loadStashes called but no repository is available');
      return;
    }

    console.log('Loading stashes...');
    setLoadingStashes(true);

    try {
      const stashList = await activeRepo.getStashes();
      console.log('Loaded', stashList.length, 'stashes');
      setStashes(stashList);
    } catch (err) {
      console.error('Failed to load stashes:', err);
    } finally {
      setLoadingStashes(false);
    }
  }, [setStashes, setLoadingStashes]);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async (repo: Repository | null = null) => {
    const activeRepo = repo || useRepositoryStore.getState().repository;
    console.log('Refresh triggered at', new Date().toLocaleTimeString(), 'for:', activeRepo?.getPath());
    
    if (!activeRepo) {
      console.warn('Refresh called but no active repository found');
      return;
    }

    try {
      await Promise.all([
        loadCommits(activeRepo),
        loadBranches(activeRepo),
        loadStatus(activeRepo),
        loadRemotes(activeRepo),
        loadStashes(activeRepo),
      ]);
      console.log('Refresh completed successfully');
    } catch (err) {
      console.error('Refresh failed:', err);
    }
  }, [loadCommits, loadBranches, loadStatus, loadRemotes, loadStashes]);

  /**
   * Open a repository
   */
  const openRepository = useCallback(async (path: string) => {
    console.log('Opening repository at path:', path);
    setLoading(true);
    setError(null);

    try {
      const repo = await Repository.open(path);
      console.log('Repository opened successfully:', repo);
      setRepository(repo, path);
      setLoading(false);
      
      // Load initial data immediately using the new repo instance
      console.log('Loading initial data for new repository...');
      await refresh(repo);
    } catch (err) {
      console.error('Failed to open repository:', err);
      const message = err instanceof Error ? err.message : 'Failed to open repository';
      setError(message);
      setLoading(false);
    }
  }, [setRepository, setError, setLoading, refresh]);

  /**
   * Initialize a new repository
   */
  const initRepository = useCallback(async (path: string) => {
    console.log('Initializing repository at path:', path);
    setLoading(true);
    setError(null);

    try {
      const repo = await Repository.init(path);
      console.log('Repository initialized successfully:', repo);
      setRepository(repo, path);
      setLoading(false);
      await refresh(repo);
    } catch (err) {
      console.error('Failed to initialize repository:', err);
      const message = err instanceof Error ? err.message : 'Failed to initialize repository';
      setError(message);
      setLoading(false);
    }
  }, [setRepository, setError, setLoading, refresh]);

  /**
   * Create a branch
   */
  const createBranch = useCallback(async (name: string) => {
    const activeRepo = useRepositoryStore.getState().repository;
    if (!activeRepo) return;

    setError(null);

    try {
      await activeRepo.createBranch(name);
      await loadBranches();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create branch';
      setError(message);
      throw err;
    }
  }, [loadBranches, setError]);

  /**
   * Delete a branch
   */
  const deleteBranch = useCallback(async (name: string, force = false) => {
    const activeRepo = useRepositoryStore.getState().repository;
    if (!activeRepo) return;
    setError(null);
    try {
      await activeRepo.deleteBranch(name, force);
      await loadBranches();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete branch';
      setError(message);
      throw err;
    }
  }, [loadBranches, setError]);

  /**
   * Create a commit
   */
  const createCommit = useCallback(async (message: string) => {
    const activeRepo = useRepositoryStore.getState().repository;
    if (!activeRepo) return;

    setError(null);

    try {
      await activeRepo.commit({ message });
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create commit';
      setError(message);
      throw err;
    }
  }, [refresh, setError]);

  /**
   * Stage files
   */
  const stageFiles = useCallback(async (paths: string[]) => {
    const activeRepo = useRepositoryStore.getState().repository;
    if (!activeRepo) return;

    setError(null);

    try {
      await activeRepo.stage(paths);
      await loadStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stage files';
      setError(message);
      throw err;
    }
  }, [loadStatus, setError]);

  /**
   * Unstage files
   */
  const unstageFiles = useCallback(async (paths: string[]) => {
    const activeRepo = useRepositoryStore.getState().repository;
    if (!activeRepo) return;

    setError(null);

    try {
      await activeRepo.unstage(paths);
      await loadStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to unstage files';
      setError(message);
      throw err;
    }
  }, [loadStatus, setError]);

  /**
   * Discard changes
   */
  const discardChanges = useCallback(async (paths: string[]) => {
    const activeRepo = useRepositoryStore.getState().repository;
    if (!activeRepo) return;
    setError(null);
    try {
      await activeRepo.discardChanges(paths);
      await loadStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to discard changes';
      setError(message);
      throw err;
    }
  }, [loadStatus, setError]);

  /**
   * Checkout branch
   */
  const checkoutBranch = useCallback(async (branchName: string) => {
    const activeRepo = useRepositoryStore.getState().repository;
    if (!activeRepo) return;

    setError(null);

    try {
      await activeRepo.checkout(branchName);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to checkout branch';
      setError(message);
      throw err;
    }
  }, [refresh, setError]);

  /**
   * Fetch from remote
   */
  const fetch = useCallback(async (remoteName?: string) => {
    const activeRepo = useRepositoryStore.getState().repository;
    if (!activeRepo) return;
    setError(null);
    try {
      await activeRepo.fetch(remoteName);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch';
      setError(message);
      throw err;
    }
  }, [refresh, setError]);

  /**
   * Pull from remote
   */
  const pull = useCallback(async (remoteName?: string) => {
    const activeRepo = useRepositoryStore.getState().repository;
    if (!activeRepo) return;
    setError(null);
    try {
      await activeRepo.pull(remoteName);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pull';
      setError(message);
      throw err;
    }
  }, [refresh, setError]);

  /**
   * Push to remote
   */
  const push = useCallback(async (remoteName?: string, branchName?: string) => {
    const activeRepo = useRepositoryStore.getState().repository;
    if (!activeRepo) return;
    setError(null);
    try {
      await activeRepo.push(remoteName, branchName);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to push';
      setError(message);
      throw err;
    }
  }, [refresh, setError]);

  /**
   * Add a remote
   */
  const addRemote = useCallback(async (name: string, url: string) => {
    const activeRepo = useRepositoryStore.getState().repository;
    if (!activeRepo) return;
    setError(null);
    try {
      await activeRepo.addRemote(name, url);
      await loadRemotes();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add remote';
      setError(message);
      throw err;
    }
  }, [loadRemotes, setError]);

  /**
   * Remove a remote
   */
  const removeRemote = useCallback(async (name: string) => {
    const activeRepo = useRepositoryStore.getState().repository;
    if (!activeRepo) return;
    setError(null);
    try {
      await activeRepo.removeRemote(name);
      await loadRemotes();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove remote';
      setError(message);
      throw err;
    }
  }, [loadRemotes, setError]);

  /**
   * Set remote URL
   */
  const setRemoteUrl = useCallback(async (name: string, url: string) => {
    const activeRepo = useRepositoryStore.getState().repository;
    if (!activeRepo) return;
    setError(null);
    try {
      await activeRepo.setRemoteUrl(name, url);
      await loadRemotes();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to set remote URL';
      setError(message);
      throw err;
    }
  }, [loadRemotes, setError]);

  /**
   * Push stash
   */
  const pushStash = useCallback(async (message?: string) => {
    const activeRepo = useRepositoryStore.getState().repository;
    if (!activeRepo) return;
    setError(null);
    try {
      await activeRepo.pushStash(message);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to push stash';
      setError(message);
      throw err;
    }
  }, [refresh, setError]);

  /**
   * Pop stash
   */
  const popStash = useCallback(async (index = 0) => {
    const activeRepo = useRepositoryStore.getState().repository;
    if (!activeRepo) return;
    setError(null);
    try {
      await activeRepo.popStash(index);
      await refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pop stash';
      setError(message);
      throw err;
    }
  }, [refresh, setError]);

  /**
   * Apply stash
   */
  const applyStash = useCallback(async (index = 0) => {
    const activeRepo = useRepositoryStore.getState().repository;
    if (!activeRepo) return;
    setError(null);
    try {
      await activeRepo.applyStash(index);
      await loadStatus();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to apply stash';
      setError(message);
      throw err;
    }
  }, [loadStatus, setError]);

  /**
   * Drop stash
   */
  const dropStash = useCallback(async (index: number) => {
    const activeRepo = useRepositoryStore.getState().repository;
    if (!activeRepo) return;
    setError(null);
    try {
      await activeRepo.dropStash(index);
      await loadStashes();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to drop stash';
      setError(message);
      throw err;
    }
  }, [loadStashes, setError]);

  /**
   * Get diff for a working-tree or staged file
   */
  const getFileDiff = useCallback(async (filePath: string, staged: boolean): Promise<string> => {
    const activeRepo = useRepositoryStore.getState().repository;
    if (!activeRepo) return '';
    try {
      return await activeRepo.getDiff({ cached: staged, paths: [filePath] });
    } catch (err) {
      console.error('Failed to get file diff:', err);
      return '';
    }
  }, []);

  /**
   * Get diff for a specific commit (git show)
   */
  const getCommitDiff = useCallback(async (sha: string): Promise<string> => {
    const activeRepo = useRepositoryStore.getState().repository;
    if (!activeRepo) return '';
    try {
      return await activeRepo.getCommitDiff(sha);
    } catch (err) {
      console.error('Failed to get commit diff:', err);
      return '';
    }
  }, []);

  return {
    // State
    repository,
    repositoryPath,
    commits,
    branches,
    remotes,
    stashes,
    status,
    currentBranch,
    isLoading,
    isLoadingCommits,
    isLoadingBranches,
    isLoadingStatus,
    isLoadingRemotes,
    isLoadingStashes,
    error,

    // Actions
    openRepository,
    initRepository,
    loadCommits,
    loadBranches,
    loadStatus,
    loadRemotes,
    loadStashes,
    refresh,
    createBranch,
    deleteBranch,
    createCommit,
    stageFiles,
    unstageFiles,
    discardChanges,
    checkoutBranch,
    fetch,
    pull,
    push,
    addRemote,
    removeRemote,
    setRemoteUrl,
    pushStash,
    popStash,
    applyStash,
    dropStash,
    getFileDiff,
    getCommitDiff,
    reset,
  };
}
