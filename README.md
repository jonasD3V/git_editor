# Git GUI

A cross-platform Git GUI built entirely with [Claude Code](https://claude.ai/code) — no manual coding, just vibe.

> **Experiment:** This project was written 100% through AI-assisted development ("vibecoding") using Claude Code as the sole developer. Every component, every bug fix, every architectural decision was done through conversation with Claude — no line of code was written by hand.

![Electron](https://img.shields.io/badge/Electron-30-47848F?logo=electron)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript)
![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey)
![License](https://img.shields.io/badge/License-Apache%202.0-blue)

---

## What it does

A fully functional Git GUI application with:

- **Repository management** — open existing repos or `git init` new ones
- **Commit history** — scrollable commit list with author, date, and refs
- **Diff viewer** — click any commit or changed file to see a syntax-highlighted diff
- **Staging area** — stage / unstage individual files or all at once (`git add .`)
- **Commit** — write a message and commit staged changes
- **Branch management** — create, delete, and checkout branches
- **Stash** — push, pop, apply, and drop stashes
- **Remote management** — add, remove, and update remote URLs
- **SSH key management** — view existing keys, generate new Ed25519 or RSA keys, copy public keys
- **Git identity** — set global and per-repo `user.name` / `user.email`
- **Startup check** — detects if Git is missing and links to the installer for your OS

---

## The vibecoding experiment

The entire codebase — monorepo structure, Electron main process, React UI, TypeScript types, git command parsing, SSH management, build config — was generated and iterated through natural language prompts in Claude Code.

Some things that came out of it:

- The architecture emerged organically. The monorepo split (`core` / `ui` / `app`) wasn't planned upfront — it got there through conversation.
- Bugs were fixed by describing the symptom. "The refresh button doesn't work" turned into tracking down a missing destructured variable and a broken `useEffect` condition.
- The diff viewer, SSH panel, and Git identity panel were each added in a single prompt session.
- TypeScript strict mode (`noUncheckedIndexedAccess`, `noUnusedLocals`, etc.) caught a lot of issues — Claude had to fix them all too.

---

## Tech stack

| Layer | Tech |
|---|---|
| Shell | Electron 30 |
| UI | React 18 + Zustand |
| Language | TypeScript 5.4 (strict) |
| Bundler | Vite + vite-plugin-electron-renderer |
| Monorepo | Turborepo |
| Git ops | Node.js `child_process` → `git` CLI |
| SSH | Node.js `fs` + `ssh-keygen` CLI |

---

## Requirements

- **Git** must be installed and in your `PATH`
  - macOS: comes with Xcode Command Line Tools
  - Windows: [Git for Windows](https://git-scm.com/download/win) (also includes `ssh-keygen`)
  - Linux: `sudo apt install git` / `sudo dnf install git`
- Node.js ≥ 18 (only needed to build from source)

---

## Run from source

```bash
# Install dependencies
npm install

# Start in development mode
npm run dev:macos     # macOS
npm run dev:windows   # Windows
npm run dev:linux     # Linux
```

## Build a distributable

```bash
cd packages/app
npm run build

# Then package for your platform:
npx electron-builder --mac    # → build/Git GUI-x.x.x-arm64.dmg
npx electron-builder --win    # → build/Git GUI Setup x.x.x.exe
npx electron-builder --linux  # → build/Git GUI-x.x.x.AppImage
```

> Build on the target platform for best results. Cross-compilation (e.g. Windows `.exe` from macOS) is unreliable.

**First launch on macOS:** the app isn't code-signed, so macOS will block it. Go to **System Settings → Privacy & Security → Open Anyway**.

---

## Project structure

```
git-gui/
├── packages/
│   ├── core/     # Git operations, SSH manager, parsers — no UI dependencies
│   ├── ui/       # React components, hooks, Zustand store
│   └── app/      # Electron main process + Vite renderer entry point
└── turbo.json
```

---

## License

[Apache 2.0](LICENSE) — free to use, modify, and distribute, including in commercial projects. Modified versions must carry attribution and a copy of the license.
