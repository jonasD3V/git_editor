# Git GUI

A cross-platform Git GUI application built with Electron, React, and TypeScript.

## Features

- Open and initialize Git repositories
- View commit history, branches, remotes, and stashes
- Stage, unstage, and discard file changes
- Create commits with a message
- Create and delete branches (branch names with spaces are auto-converted to hyphens)
- Fetch, pull, and push to remotes
- Manage remotes (add, remove, update URL)
- Stash management (push, pop, apply, drop)

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git (must be available in `PATH`)
- macOS: Xcode Command Line Tools (`xcode-select --install`)

## Setup

```bash
# Install all dependencies
npm install
```

## Development

Starts Vite (React) and Electron in parallel with hot reload:

```bash
npm run dev:macos
```

The app window opens automatically once Vite is ready on `http://localhost:5173`.

## Building a distributable

Always run the build step first, then package:

```bash
cd packages/app
npm run build
```

### macOS → `.dmg`

Run on a **Mac**:

```bash
npx electron-builder --mac
```

Output: `packages/app/build/Git GUI-0.1.0-arm64.dmg`

Double-click the `.dmg`, drag the app to `/Applications`, and open it.

> **First launch on macOS**: Because the app is not code-signed, macOS blocks it. Go to **System Settings → Privacy & Security** and click **Open Anyway**.

### Windows → `.exe` installer

Run on a **Windows machine**:

```bash
npx electron-builder --win
```

Output: `packages/app/build/Git GUI Setup 0.1.0.exe` (NSIS installer) and a portable `.exe`.

### Linux → `.AppImage` / `.deb`

Run on a **Linux machine**:

```bash
npx electron-builder --linux
```

Output: `packages/app/build/Git GUI-0.1.0.AppImage` and `git-gui_0.1.0_amd64.deb`.

> **Note on cross-compilation**: electron-builder can attempt to build for other platforms from macOS, but results are unreliable (especially Windows NSIS installers). The safest approach is to build on the target OS, or use a CI pipeline (e.g. GitHub Actions with `macos-latest`, `windows-latest`, `ubuntu-latest` runners).

## Project Structure

```
git-gui/
├── packages/
│   ├── core/       # Git operations (Repository class, parsers, types)
│   ├── ui/         # React components, hooks, Zustand store, screens
│   └── app/        # Electron main process + Vite/React renderer
├── turbo.json      # Turborepo pipeline
└── package.json    # Root workspace
```

### Key files

| File | Purpose |
|---|---|
| `packages/core/src/git/repository.ts` | All Git commands (open, init, log, branch, stash, …) |
| `packages/core/src/utils/parsers.ts` | Parses raw `git` output into typed objects |
| `packages/ui/src/hooks/useRepository.ts` | React hook — connects UI to core Git operations |
| `packages/ui/src/stores/repositoryStore.ts` | Zustand store for repository state |
| `packages/ui/src/screens/RepositoryScreen.tsx` | Main application screen |
| `packages/app/electron/main.ts` | Electron main process (window, IPC handlers) |

## Other scripts

```bash
# Type-check all packages
npm run typecheck

# Run tests
npm run test

# Lint
npm run lint

# Format
npm run format
```

## Tech Stack

- **Electron** — desktop shell
- **React 18** — UI
- **TypeScript** (strict mode + `noUncheckedIndexedAccess`) — throughout
- **Vite** — frontend bundler
- **Zustand** — state management
- **Turborepo** — monorepo task runner
