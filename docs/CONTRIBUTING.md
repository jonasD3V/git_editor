# Contributing to Git GUI

Thank you for your interest in contributing to Git GUI! This document provides guidelines and instructions for contributing to the project.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- Platform-specific tools:
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Visual Studio Build Tools
  - **Linux**: build-essential, libsecret

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/git-gui.git
cd git-gui
```

2. Install dependencies:

```bash
npm run setup
```

This will:

- Install all dependencies
- Build all packages
- Set up Git hooks

### Development Workflow

#### Running the App

```bash
# macOS
npm run dev:macos

# Windows
npm run dev:windows

# Linux
npm run dev:linux
```

#### Running Tests

```bash
# Run all tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

#### Code Quality

```bash
# Lint all code
npm run lint

# Type check
npm run typecheck

# Format code
npm run format

# Check formatting
npm run format:check
```

## Project Structure

```
git-gui/
├── packages/
│   ├── core/          # Platform-agnostic Git operations
│   ├── ui/            # Shared React components
│   ├── app-macos/     # macOS application
│   ├── app-windows/   # Windows application
│   └── app-linux/     # Linux application
├── scripts/           # Build and automation scripts
└── docs/              # Documentation
```

## Code Standards

### TypeScript

- Use TypeScript strict mode
- No `any` types (use `unknown` if necessary)
- Document public APIs with JSDoc
- Prefer interfaces over types for object shapes

### Naming Conventions

- **Files**: camelCase.ts (e.g., `repositoryStore.ts`)
- **Components**: PascalCase.tsx (e.g., `CommitGraph.tsx`)
- **Functions**: camelCase (e.g., `getCommitHistory`)
- **Types/Interfaces**: PascalCase (e.g., `Commit`, `Repository`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_COMMITS`)

### Code Style

We use Prettier for formatting and ESLint for linting. The pre-commit hook will automatically check your code.

Key style points:

- 2 spaces for indentation
- Single quotes for strings
- Semicolons required
- Trailing commas in ES5-compatible places
- 80 character line limit (soft limit, can exceed for readability)

### Comments

- Use JSDoc for public APIs:

```typescript
/**
 * Retrieves commit history for the repository
 * @param options - Log options including filters and limits
 * @returns Array of commits
 */
export async function getCommitHistory(options: LogOptions): Promise<Commit[]> {
  // ...
}
```

- Use inline comments only for non-obvious logic
- Prefer self-documenting code over comments

### Testing

- Write tests for all new features
- Maintain >80% coverage overall, >90% for core package
- Use descriptive test names:

```typescript
describe('Repository', () => {
  describe('getStatus', () => {
    it('should return clean status when no changes exist', async () => {
      // ...
    });

    it('should detect modified files in working tree', async () => {
      // ...
    });
  });
});
```

## Git Workflow

### Branches

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:

```
feat(core): add support for interactive rebase
fix(ui): resolve commit graph rendering issue on large repos
docs(contributing): update setup instructions
```

### Pull Requests

1. Create a feature branch from `develop`
2. Make your changes following the code standards
3. Write/update tests
4. Ensure all tests pass and code is formatted
5. Push your branch and create a pull request
6. Request review from maintainers

PR checklist:

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Code follows style guide
- [ ] All CI checks passing
- [ ] No breaking changes (or documented if necessary)

## Module Boundaries

Follow these import rules (enforced by ESLint):

- ✅ `ui` → `core` (UI can import core)
- ❌ `core` → `ui` (Core must be UI-agnostic)
- ❌ `app-macos` → `app-windows` (No cross-platform dependencies)
- ✅ All apps → `core`, `ui` (Apps can import shared packages)

## Performance Considerations

- Graph rendering must maintain 60fps
- Repository operations should be async and non-blocking
- Use virtualization for large lists (10k+ items)
- Profile performance-critical code

## Accessibility

- All UI must be keyboard accessible
- Provide proper ARIA labels
- Maintain sufficient color contrast
- Support screen readers

## Documentation

When adding new features:

1. Update relevant README files
2. Add JSDoc comments to public APIs
3. Update ARCHITECTURE.md if design changes
4. Create ADR (Architecture Decision Record) for major decisions

## Getting Help

- **Questions**: Open a GitHub Discussion
- **Bug reports**: Create an issue with reproduction steps
- **Feature requests**: Open an issue with use case description
- **Security issues**: Email security@gitgui.dev (do not open public issue)

## Code of Conduct

Be respectful and constructive. We aim to create a welcoming environment for all contributors.

## License

By contributing to Git GUI, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Git GUI!
