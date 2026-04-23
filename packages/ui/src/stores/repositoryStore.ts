/**
 * Repository state management with Zustand
 */

import { create } from 'zustand';
import type { Commit, Branch, RepositoryStatus, Remote, Stash } from '@git-gui/core/git/types';
import type { Repository } from '@git-gui/core/git';

interface RepositoryState {
  // Current repository
  repository: Repository | null;
  repositoryPath: string | null;

  // Repository data
  commits: Commit[];
  branches: Branch[];
  remotes: Remote[];
  stashes: Stash[];
  status: RepositoryStatus | null;
  currentBranch: Branch | null;

  // Loading states
  isLoading: boolean;
  isLoadingCommits: boolean;
  isLoadingBranches: boolean;
  isLoadingStatus: boolean;
  isLoadingRemotes: boolean;
  isLoadingStashes: boolean;

  // Error state
  error: string | null;

  // Actions
  setRepository: (repo: Repository, path: string) => void;
  setCommits: (commits: Commit[]) => void;
  setBranches: (branches: Branch[]) => void;
  setRemotes: (remotes: Remote[]) => void;
  setStashes: (stashes: Stash[]) => void;
  setStatus: (status: RepositoryStatus) => void;
  setCurrentBranch: (branch: Branch | null) => void;
  setLoading: (isLoading: boolean) => void;
  setLoadingCommits: (isLoading: boolean) => void;
  setLoadingBranches: (isLoading: boolean) => void;
  setLoadingStatus: (isLoading: boolean) => void;
  setLoadingRemotes: (isLoading: boolean) => void;
  setLoadingStashes: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  repository: null,
  repositoryPath: null,
  commits: [],
  branches: [],
  remotes: [],
  stashes: [],
  status: null,
  currentBranch: null,
  isLoading: false,
  isLoadingCommits: false,
  isLoadingBranches: false,
  isLoadingStatus: false,
  isLoadingRemotes: false,
  isLoadingStashes: false,
  error: null,
};

export const useRepositoryStore = create<RepositoryState>((set) => ({
  ...initialState,

  setRepository: (repo: Repository, path: string) => set({ repository: repo, repositoryPath: path }),
  setCommits: (commits: Commit[]) => set({ commits }),
  setBranches: (branches: Branch[]) => set({ branches }),
  setRemotes: (remotes: Remote[]) => set({ remotes }),
  setStashes: (stashes: Stash[]) => set({ stashes }),
  setStatus: (status: RepositoryStatus) => set({ status }),
  setCurrentBranch: (branch: Branch | null) => set({ currentBranch: branch }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setLoadingCommits: (isLoadingCommits: boolean) => set({ isLoadingCommits }),
  setLoadingBranches: (isLoadingBranches: boolean) => set({ isLoadingBranches }),
  setLoadingStatus: (isLoadingStatus: boolean) => set({ isLoadingStatus }),
  setLoadingRemotes: (isLoadingRemotes: boolean) => set({ isLoadingRemotes }),
  setLoadingStashes: (isLoadingStashes: boolean) => set({ isLoadingStashes }),
  setError: (error: string | null) => set({ error }),
  reset: () => set(initialState),
}));
