# Contributing to Advanced Client Fetch

Thank you for your interest in contributing to Advanced Client Fetch! 🚀

## 🎯 How to Contribute

### 1. Fork and Clone
```bash
git clone https://github.com/your-username/advanced-client-fetch.git
cd advanced-client-fetch
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Create a Branch
```bash
git checkout -b feature/amazing-feature
```

### 4. Make Changes
- Write your code
- Add tests for new features
- Update documentation if needed

### 5. Test Your Changes
```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @advanced-client-fetch/core test

# Run tests in watch mode
pnpm test:watch
```

### 6. Build and Lint
```bash
# Build all packages
pnpm build

# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix
```

### 7. Commit and Push
```bash
git add .
git commit -m "feat: add amazing feature"
git push origin feature/amazing-feature
```

### 8. Create Pull Request
Create a pull request on GitHub with a clear description of your changes.

## 📋 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing code patterns
- Use meaningful variable and function names
- Add JSDoc comments for public APIs

### Testing
- Write tests for all new features
- Aim for high test coverage
- Test both success and error cases
- Use descriptive test names

### Documentation
- Update README.md for user-facing changes
- Add JSDoc comments for new APIs
- Update examples if needed

## 🏗️ Project Structure

```
advanced-client-fetch/
├── packages/
│   ├── core/           # Core HTTP client
│   ├── plugins/        # Plugin collection
│   ├── axios-adapter/  # Axios compatibility
│   └── presets/        # Platform presets
├── docs/               # Documentation
├── examples/           # Usage examples
└── tests/              # Integration tests
```

## 🐛 Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, OS, etc.)
- Code example if possible

## 💡 Feature Requests

When requesting features, please include:
- Clear description of the feature
- Use case and motivation
- Proposed API design
- Examples of how it would be used

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- pnpm 8+

### Commands
```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Clean build artifacts
pnpm clean

# Type check
pnpm type-check
```

### Package-specific Commands
```bash
# Core package
pnpm --filter @advanced-client-fetch/core build
pnpm --filter @advanced-client-fetch/core test

# Plugins package
pnpm --filter @advanced-client-fetch/plugins build
pnpm --filter @advanced-client-fetch/plugins test

# Axios adapter
pnpm --filter @advanced-client-fetch/axios-adapter build
pnpm --filter @advanced-client-fetch/axios-adapter test

# Presets package
pnpm --filter @advanced-client-fetch/presets build
pnpm --filter @advanced-client-fetch/presets test
```

## 📝 Commit Convention

We use conventional commits:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

Examples:
```bash
git commit -m "feat: add retry plugin with exponential backoff"
git commit -m "fix: resolve CORS issue in browser environment"
git commit -m "docs: update README with new examples"
```

## 🚀 Release Process

1. Update version numbers in package.json files
2. Update CHANGELOG.md
3. Create release PR
4. Merge after review
5. Publish to npm

## 🤝 Community

- [GitHub Discussions](https://github.com/advanced-client-fetch/advanced-client-fetch/discussions) - General discussions
- [GitHub Issues](https://github.com/advanced-client-fetch/advanced-client-fetch/issues) - Bug reports and feature requests
- [Discord](https://discord.gg/advanced-client-fetch) - Real-time chat (coming soon)

## 📄 License

By contributing to Advanced Client Fetch, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Advanced Client Fetch! 🎉