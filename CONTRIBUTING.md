# Contributing to JusticeAI

Thank you for your interest in contributing! This document provides guidelines for contributing to JusticeAI.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](./CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

Before submitting a bug report:
1. Check the [existing issues](https://github.com/zunaidahmad2004/JusticeAI/issues)
2. Collect relevant information (OS, Node version, error messages)
3. Use the **Bug Report** issue template

### Suggesting Features

1. Check if the feature is already requested
2. Open an issue using the **Feature Request** template
3. Describe the problem it solves and proposed solution

### Pull Requests

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```
3. **Make your changes** following the code style
4. **Test** your changes locally
5. **Commit** using conventional commits:
   ```
   feat: add new feature
   fix: resolve bug
   docs: update documentation
   style: formatting changes
   refactor: code refactoring
   test: add tests
   chore: maintenance tasks
   ```
6. **Push** and open a Pull Request

## Development Setup

```bash
git clone https://github.com/zunaidahmad2004/JusticeAI.git
cd JusticeAI
cd server && npm install
cd ../client && npm install
cp server/.env.example server/.env
# Edit server/.env with your credentials
cd server && npm run dev
# In another terminal:
cd client && npm run dev
```

## Code Style

- **TypeScript** — strict mode, no `any` types
- **React** — functional components, hooks only
- **Naming** — camelCase variables, PascalCase components
- **Comments** — JSDoc for public functions
- **Imports** — organize: external → internal → relative

## Project Structure

```
client/src/
  pages/        — Page-level components (one per route)
  components/   — Reusable UI components
  lib/          — API client, utilities
  store/        — Zustand state stores
  hooks/        — Custom React hooks

server/src/
  routes/       — Express route handlers
  models/       — Mongoose schemas
  services/     — Business logic (AI, etc.)
  middleware/   — Auth, error handling
```

## Questions?

Open a [GitHub Discussion](https://github.com/zunaidahmad2004/JusticeAI/discussions) or create an issue.
