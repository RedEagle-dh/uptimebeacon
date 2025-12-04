# Contributing to UptimeBeacon

Thank you for your interest in contributing to UptimeBeacon! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.3.0+
- [Docker](https://www.docker.com/)
- [Git](https://git-scm.com/)

### Setting Up Your Development Environment

1. Fork the repository on GitHub

2. Clone your fork:

    ```bash
    git clone https://github.com/YOUR_USERNAME/uptimebeacon.git
    cd uptimebeacon
    ```

3. Add the upstream remote:

    ```bash
    git remote add upstream https://github.com/ORIGINAL_OWNER/uptimebeacon.git
    ```

4. Install dependencies:

    ```bash
    bun install
    ```

5. Set up environment variables:

    ```bash
    cp apps/frontend/.env.example apps/frontend/.env
    cp apps/backend/.env.example apps/backend/.env
    ```

6. Start the database:

    ```bash
    docker compose up -d
    ```

7. Set up the database schema:

    ```bash
    bun db:generate
    bun db:push
    ```

8. Start the development servers:
    ```bash
    bun dev
    ```

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check existing issues to avoid duplicates.

When filing an issue, include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior vs actual behavior
- Your environment (OS, Bun version, etc.)
- Screenshots if applicable

### Suggesting Features

Feature requests are welcome! Please provide:

- A clear description of the feature
- The problem it solves or use case
- Any implementation ideas you may have

### Submitting Changes

1. Create a new branch for your changes:

    ```bash
    git checkout -b feature/your-feature-name
    # or
    git checkout -b fix/your-bug-fix
    ```

2. Make your changes and commit them:

    ```bash
    git add .
    git commit -m "feat: add new feature"
    ```

3. Push your branch to your fork:

    ```bash
    git push origin feature/your-feature-name
    ```

4. Open a Pull Request against the `main` branch

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:

```
feat: add Discord notification channel
fix: resolve monitor timeout issue
docs: update deployment guide
```

## Development Guidelines

### Code Style

We use [Biome](https://biomejs.dev/) for linting and formatting:

```bash
bun check          # Check for issues
bun check:write    # Auto-fix issues
```

### Type Safety

Run TypeScript checks before submitting:

```bash
bun typecheck
```

### Database Changes

When modifying the Prisma schema:

1. Update `packages/database/prisma/schema.prisma`
2. Generate the client: `bun db:generate`
3. Push changes to dev database: `bun db:push`
4. For production, create a migration: `bun db:migrate`

### Project Structure

- `apps/frontend` - Next.js web application
- `apps/backend` - Elysia monitoring service
- `packages/database` - Shared Prisma schema and client

### Adding New Features

1. **Frontend changes**: Add components to `apps/frontend/src/components/`
2. **API changes**: Add or modify routers in `apps/frontend/src/server/api/routers/`
3. **Backend changes**: Add services in `apps/backend/src/services/`
4. **Database changes**: Update `packages/database/prisma/schema.prisma`

## Pull Request Process

1. Ensure your code passes linting and type checks
2. Update documentation if needed
3. Add tests for new functionality when applicable
4. Fill out the pull request template completely
5. Request review from maintainers

## Questions?

Feel free to open an issue for any questions about contributing.

Thank you for helping make UptimeBeacon better!
