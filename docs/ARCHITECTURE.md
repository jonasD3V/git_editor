# Git GUI Architecture

This document describes the system architecture, design decisions, and technical implementation of Git GUI.

## Overview

Git GUI is a cross-platform, native Git GUI application built with React Native Desktop. It emphasizes:
- **Developer-friendly UX**: Close to Git commands, logical workflows
- **Visual clarity**: Superior commit graph visualization
- **Maintainability**: Clean architecture, well-structured for future development
- **Native performance**: True native apps (not Electron)

## Architecture Decision

### Technology Stack

- **Electron**: Cross-platform desktop framework (macOS, Windows, Linux)
- **React**: UI framework for component-based interface
- **TypeScript**: Type safety across the entire codebase
- **Turborepo**: Monorepo build orchestration with caching
- **Git CLI**: Direct Git command execution via child processes

### Why Electron?

| Requirement | Solution |
|-------------|----------|
| Cross-platform | Single codebase for macOS, Windows, Linux |
| Code reuse | 100% shared React codebase |
| Easy installation | Simple installers for all platforms |
| Easy to maintain | One build process, proven technology |
| Developer-friendly | Excellent tooling, large ecosystem |
| Fast development | No native compilation complexity |

**Why this works for a Git GUI:**
- ✅ Proven: GitHub Desktop, GitKraken, VS Code use Electron
- ✅ Performance: Git operations are CLI-based (fast)
- ✅ UI performance: Modern React optimizations
- ✅ Distribution: Easy installers for all platforms
- ✅ Updates: Electron auto-update built-in

**Alternatives considered:**
- **React Native Desktop**: Rejected (complex setup, less mature)
- **Tauri**: Considered but Electron has better Git GUI precedent
- **Separate native apps**: Rejected (low code reuse, maintenance burden)

## System Architecture

### Layer Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Platform Apps                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  macOS   │  │ Windows  │  │  Linux   │             │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘             │
└────────┼─────────────┼─────────────┼───────────────────┘
         │             │             │
         └─────────────┼─────────────┘
                       │
┌──────────────────────┼─────────────────────────────────┐
│                   UI Layer                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ Components │  │   Screens  │  │   Stores   │       │
│  │   Graph    │  │ Repository │  │   State    │       │
│  │  Terminal  │  │  Settings  │  │  Management│       │
│  └────────────┘  └────────────┘  └────────────┘       │
└──────────────────────┼─────────────────────────────────┘
                       │
┌──────────────────────┼─────────────────────────────────┐
│                 Core Layer                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │    Git     │  │    SSH     │  │  Terminal  │       │
│  │ Operations │  │ Management │  │    PTY     │       │
│  └────────────┘  └────────────┘  └────────────┘       │
└──────────────────────┼─────────────────────────────────┘
                       │
┌──────────────────────┼─────────────────────────────────┐
│              Native Modules                             │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │  Keychain  │  │ Git Native │  │  Terminal  │       │
│  │   Bridge   │  │   Bridge   │  │   Native   │       │
│  └────────────┘  └────────────┘  └────────────┘       │
└─────────────────────────────────────────────────────────┘
```

### Module Responsibilities

#### Core Layer (`packages/core`)
**Platform-agnostic business logic**

- **Git Module** (`src/git/`)
  - Repository abstraction
  - Commit, branch, merge operations
  - Graph data processing
  - Diff and status parsing

- **SSH Module** (`src/ssh/`)
  - Key generation
  - Keychain abstraction
  - Remote authentication

- **Terminal Module** (`src/terminal/`)
  - PTY wrapper
  - Command execution
  - Event handling

**Dependencies**: nodegit, simple-git, ssh2, node-pty, zod

**Import Rule**: Cannot import from UI layer (must remain UI-agnostic)

#### UI Layer (`packages/ui`)
**Shared React components and screens**

- **Components** (`src/components/`)
  - CommitGraph: Visual graph rendering (Skia)
  - Terminal: Terminal UI component
  - Repository: Git operation UI (commit, branch panels)
  - SSH: Key management UI
  - common: Design system components

- **Screens** (`src/screens/`)
  - RepositoryScreen: Main workspace
  - SettingsScreen: App configuration
  - WelcomeScreen: Onboarding

- **Hooks** (`src/hooks/`)
  - useRepository: Git state management
  - useCommitGraph: Graph data and rendering
  - useTerminal: Terminal integration

- **Stores** (`src/stores/`)
  - repositoryStore: Repository state (Zustand)
  - sshStore: SSH key state
  - uiStore: UI preferences

**Dependencies**: react, react-native, @shopify/react-native-skia, zustand, @tanstack/react-query

**Import Rule**: Can import from Core layer, cannot be imported by Core

#### Platform Apps (`packages/app-*`)
**Platform-specific application shells**

- app-macos: macOS native code + React Native macOS
- app-windows: Windows native code + React Native Windows
- app-linux: Linux native code + React Native GTK/Qt

Each app:
- Imports UI and Core layers
- Provides platform-specific entry point
- Handles native integrations (menu bar, notifications, etc.)

**Import Rule**: Cannot import other platform apps

#### Native Modules (`packages/native-modules`)
**Platform-specific native bridges**

- **Keychain Module**: Secure key storage
  - macOS: Keychain Services API
  - Windows: Credential Manager API
  - Linux: libsecret

- **Git Native** (optional): Native Git bindings
- **Terminal Native**: Platform-specific PTY support

## Data Flow

### Git Operations

```
User Action (UI)
    ↓
useRepository Hook
    ↓
repositoryStore (Zustand)
    ↓
Core Git Module (nodegit/CLI)
    ↓
Git Repository
    ↓
Update Store
    ↓
Re-render UI
```

### Commit Graph Rendering

```
Repository Commits
    ↓
Core Graph Module (data processing)
    ↓
Layout Engine (topological sort + lane assignment)
    ↓
Graph Renderer (Skia)
    ↓
Canvas Output
```

## Key Design Decisions

### ADR 001: Hybrid Git Approach

**Context**: Need reliable Git operations with good performance

**Decision**: Use both nodegit (libgit2) and Git CLI

**Rationale**:
- nodegit (libgit2): Fast, programmatic API, no Git installation required
- Git CLI: Full feature support, well-tested, handles edge cases
- Hybrid: Use nodegit for common operations, fallback to CLI for complex ones

**Consequences**:
- ✅ Best of both worlds
- ✅ Reliability for edge cases
- ❌ Slightly more complex
- ❌ Need to maintain both interfaces

### ADR 002: React Native for Desktop

**Context**: Need native apps with shared codebase

**Decision**: Use React Native for macOS/Windows/Linux

**Rationale**:
- React Native macOS/Windows are official Microsoft projects
- True native compilation (not webview)
- 80-90% code reuse across platforms
- React ecosystem and tooling
- Native performance

**Consequences**:
- ✅ High code reuse
- ✅ Native performance
- ✅ Single UI codebase
- ❌ Linux support less mature
- ❌ Learning curve for native modules

### ADR 003: Turborepo Monorepo

**Context**: Multiple packages need coordinated builds

**Decision**: Use Turborepo for monorepo management

**Rationale**:
- Intelligent build caching
- Parallel task execution
- Clear dependency graph
- Better than Lerna for build performance

**Consequences**:
- ✅ Fast incremental builds
- ✅ Clear package boundaries
- ✅ Simple configuration
- ❌ Learning curve for contributors

### ADR 004: Zustand for State Management

**Context**: Need lightweight state management for React

**Decision**: Use Zustand instead of Redux or Context

**Rationale**:
- Minimal boilerplate
- TypeScript-first
- No provider hell
- Simple API
- Good DevTools support

**Consequences**:
- ✅ Easy to learn
- ✅ Less code
- ✅ Good TypeScript support
- ❌ Less ecosystem than Redux
- ❌ Not as established for large apps

### ADR 005: Skia for Graph Rendering

**Context**: Need high-performance commit graph visualization

**Decision**: Use React Native Skia for graph rendering

**Rationale**:
- GPU-accelerated
- 60fps performance
- Full control over rendering
- Native integration with React Native
- Better than SVG for large graphs

**Consequences**:
- ✅ Excellent performance
- ✅ Smooth animations
- ✅ Native feel
- ❌ Custom implementation required
- ❌ More complex than declarative SVG

## Performance Considerations

### Commit Graph
- **Target**: 60fps for 10k+ commits
- **Strategies**:
  - Virtualization (only render visible commits)
  - Layout caching
  - GPU acceleration via Skia
  - Incremental loading
  - Web Workers for layout calculation

### Repository Operations
- **Target**: <2s load time for large repos
- **Strategies**:
  - Async/non-blocking operations
  - Progressive loading
  - Background workers
  - Optimistic UI updates

### Memory Management
- **Target**: <200MB for typical use
- **Strategies**:
  - Lazy loading
  - Cleanup on unmount
  - Limited history cache
  - Efficient data structures

## Testing Strategy

### Unit Tests (Jest)
- **Core module**: >90% coverage
- **UI components**: >80% coverage
- Focus on business logic and edge cases

### Component Tests (React Native Testing Library)
- User interaction flows
- Component rendering
- State updates

### E2E Tests (Playwright/Detox)
- Platform-specific per app
- Critical user journeys
- Git workflow scenarios

### Performance Tests
- Graph rendering benchmarks
- Large repository stress tests
- Memory leak detection

## Security Considerations

### SSH Key Storage
- **macOS**: Keychain Services (encrypted)
- **Windows**: Credential Manager (encrypted)
- **Linux**: libsecret (encrypted)
- Never store unencrypted private keys in memory longer than necessary

### Git Operations
- Validate all user input
- Sanitize Git command arguments
- Use libgit2 where possible (safer than CLI)
- Prevent command injection

### Terminal
- Sandboxed PTY
- No automatic command execution
- Clear distinction between user input and output

## Deployment

### macOS
- Code-signed `.dmg`
- Notarized for Gatekeeper
- Homebrew Cask distribution
- Auto-update via Sparkle

### Windows
- Code-signed `.exe`/`.msi`
- Winget and Chocolatey packages
- Auto-update via Squirrel.Windows

### Linux
- AppImage (universal)
- Snap package
- Flatpak package
- Distro-specific packages (.deb, .rpm, AUR)

## Future Extensibility

The architecture supports:
- **Plugin system**: Core API exposed for extensions
- **Custom themes**: Design token system
- **AI features**: Commit message generation, code review
- **Platform integrations**: GitHub/GitLab APIs
- **Team features**: Multi-user workflows
- **Cloud sync**: Settings and SSH keys across devices

## References

- [React Native macOS](https://microsoft.github.io/react-native-windows/)
- [React Native Windows](https://microsoft.github.io/react-native-windows/)
- [Turborepo](https://turbo.build/)
- [nodegit](https://github.com/nodegit/nodegit)
- [React Native Skia](https://shopify.github.io/react-native-skia/)

---

**Last Updated**: 2026-04-22
**Version**: 0.1.0
