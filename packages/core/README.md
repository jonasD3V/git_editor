# @git-gui/core

Core business logic library for Git GUI application.

## Overview

This package provides platform-agnostic Git operations, SSH key management, and terminal integration. It serves as the foundation for the Git GUI application across all platforms.

## Features

- **Git Operations**: Repository management, commits, branches, merges, and more
- **SSH Key Management**: Generate, store, and manage SSH keys securely
- **Terminal Integration**: PTY-based terminal for running Git commands directly

## Installation

```bash
npm install @git-gui/core
```

## Usage

```typescript
import { git, ssh, terminal } from '@git-gui/core';

// Git operations (Phase 2)
// const repo = new git.Repository('/path/to/repo');
// const status = await repo.status();

// SSH key management (Phase 6)
// const keyManager = new ssh.KeyManager();
// const keys = await keyManager.listKeys();

// Terminal integration (Phase 5)
// const term = new terminal.Terminal({ cwd: '/path/to/repo' });
// term.write('git status\n');
```

## Development

```bash
# Build
npm run build

# Test
npm run test

# Watch mode
npm run dev
```

## API Documentation

Full API documentation is available in the TypeScript definitions and JSDoc comments.

## License

MIT
