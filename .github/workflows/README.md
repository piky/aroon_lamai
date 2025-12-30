# GitHub Actions CI/CD Workflows

This directory contains GitHub Actions workflows for continuous integration and deployment.

## Workflows

### 1. Unit Tests CI (`test.yml`)

**Trigger**: Push to `main` or `develop` | Pull requests to `main` or `develop`

**What it does**:
- Checks out the repository code
- Sets up Node.js environment (tests on 18.x and 20.x)
- Installs npm dependencies
- Runs ESLint (if configured)
- Executes full Jest unit test suite with coverage
- Uploads coverage reports to Codecov
- Posts coverage summary as PR comment

**Fail conditions**:
- Any test fails
- Coverage drops significantly

**Pass conditions**:
- All tests pass on both Node.js versions

### 2. Code Quality (`code-quality.yml`)

**Trigger**: Push to `main` or `develop` | Pull requests to `main` or `develop`

**What it does**:
- Checks out the repository code
- Sets up Node.js 18.x
- Installs dependencies
- Runs ESLint for code style
- Checks code formatting with Prettier
- Runs npm security audit

**Configuration**:
- `continue-on-error: true` allows non-critical checks to fail
- Security audit warns on moderate severity issues

## Setup Requirements

### 1. Environment Variables (if needed)
Add secrets in GitHub repository settings:
- Settings → Secrets and variables → Actions

### 2. Codecov Integration
- Push coverage to Codecov for historical tracking
- View coverage badges at https://codecov.io

### 3. Branch Protection Rules (Recommended)
Configure branch protection on `main`:
1. Go to Settings → Branches
2. Add rule for `main` branch
3. Require status checks to pass before merging:
   - `test / test (18.x)`
   - `test / test (20.x)`
4. Optionally require code quality checks

## Local Testing

Run the same commands locally to verify before pushing:

```bash
# Install dependencies
npm ci

# Run tests
npm test -- --coverage

# Run linter
npm run lint

# Check formatting
npm run format:check
```

## Coverage Goals

Current coverage targets:
- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

View detailed coverage in pull request comments and Codecov dashboard.

## Troubleshooting

### Tests fail in CI but pass locally
- Check Node.js version difference
- Verify all environment variables are set
- Check for timing-dependent tests

### Coverage not uploading
- Verify Codecov token in secrets
- Check that coverage directory is generated
- Review workflow logs for errors

### PR comments not posting
- Ensure `GITHUB_TOKEN` is available (usually automatic)
- Check repository permissions

## Future Enhancements

- [ ] Add database migration tests
- [ ] Add integration tests with PostgreSQL
- [ ] Add performance benchmarks
- [ ] Add Docker image build workflow
- [ ] Add staging deployment workflow
- [ ] Add production deployment workflow
