# CI/CD Pipeline Documentation

This repository uses GitHub Actions for automated CI/CD workflows. The pipeline automates code reviews, testing, building, and deployment processes.

## Workflows Overview

### 1. **CI Workflow** (`ci.yml`)
**Triggers:** Push to `main`/`develop`, Pull Requests

A comprehensive continuous integration workflow that runs on every push and pull request.

**Jobs:**
- **Lint and Type Check**: Validates TypeScript types and checks for code vulnerabilities
- **Build**: Compiles the application and creates production artifacts
- **Test**: Runs unit tests (when configured)
- **Preview**: Starts a preview server for pull requests
- **Status Check**: Aggregates results and provides a summary

### 2. **Pull Request Checks** (`pr-checks.yml`)
**Triggers:** Pull Requests, PR Reviews

Automated code review workflow that runs on incoming pull requests.

**Features:**
- TypeScript type checking
- Code style validation
- Build verification
- Security vulnerability scanning
- Automated PR comments with results

### 3. **Unit Tests** (`unit-tests.yml`)
**Triggers:** Push, Pull Requests, Manual

Runs unit tests across multiple Node.js versions.

**Matrix Strategy:**
- Node.js 18
- Node.js 20

**Setup Instructions:**
To add unit testing, install a testing framework:
```bash
# For Vitest (recommended for Vite projects)
npm install -D vitest @vitest/ui

# Or for Jest
npm install -D jest @types/jest ts-jest
```

Then add test scripts to `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### 4. **Build Workflow** (`build.yml`)
**Triggers:** Push, Pull Requests, Manual

Ensures the application can be built reliably.

**Features:**
- Builds the application
- Verifies build output
- Uploads build artifacts
- Generates build summary

### 5. **Integration Tests** (`integration-tests.yml`)
**Triggers:** Push, Pull Requests, Manual

Runs integration and end-to-end tests.

**Setup Instructions:**
To add E2E testing, install Playwright or Cypress:

```bash
# For Playwright (recommended)
npm install -D @playwright/test

# Or for Cypress
npm install -D cypress
```

Then add E2E test scripts to `package.json`:
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### 6. **Deployment Workflow** (`deploy.yml`)
**Triggers:** Push to `main`, Manual with environment selection

Automatically deploys the application after successful builds.

**Features:**
- Builds production-ready artifacts
- Deploys to GitHub Pages (if configured)
- Supports manual deployment to staging/production
- Uploads deployment packages

## Configuration

### Environment Variables

Set up the following secrets in your repository settings (Settings → Secrets and variables → Actions):

| Secret | Description | Required |
|--------|-------------|----------|
| `GITHUB_TOKEN` | Automatically provided by GitHub | Yes |
| `GEMINI_API_KEY` | Google Gemini API key for the app | For runtime |
| `CUSTOM_DOMAIN` | Custom domain for GitHub Pages | Optional |

### Deployment Targets

The deployment workflow includes a placeholder for various platforms. Uncomment and configure your target:

#### GitHub Pages
Already configured - requires Pages to be enabled in repository settings.

#### Netlify
```yaml
- name: Deploy to Netlify
  uses: nwtgck/actions-netlify@v2
  with:
    publish-dir: './dist'
    production-deploy: true
  env:
    NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
    NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

#### Vercel
```yaml
- name: Deploy to Vercel
  uses: amondnet/vercel-action@v25
  with:
    vercel-token: ${{ secrets.VERCEL_TOKEN }}
    vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
    vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
    working-directory: ./
```

#### AWS S3
```yaml
- name: Deploy to S3
  run: |
    aws s3 sync ./dist s3://${{ secrets.S3_BUCKET }} --delete
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    AWS_REGION: ${{ secrets.AWS_REGION }}
```

## Workflow Status Badges

Add these badges to your README.md to show workflow status:

```markdown
![CI](https://github.com/aggregatemy/Str/workflows/CI/badge.svg)
![Build](https://github.com/aggregatemy/Str/workflows/Build/badge.svg)
![Deploy](https://github.com/aggregatemy/Str/workflows/Deploy/badge.svg)
```

## Manual Workflow Triggers

Some workflows support manual triggers via the GitHub Actions tab:

1. Go to the "Actions" tab in your repository
2. Select the workflow you want to run
3. Click "Run workflow"
4. Select the branch and any required inputs
5. Click "Run workflow"

## Branch Protection Rules

To enforce CI/CD checks, set up branch protection rules:

1. Go to Settings → Branches
2. Add rule for `main` branch
3. Enable:
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Select status checks: CI, Build, Unit Tests

## Troubleshooting

### Build Failures
- Check that all dependencies are properly listed in `package.json`
- Ensure TypeScript types are correct
- Verify environment variables are set

### Deployment Failures
- Verify deployment secrets are configured
- Check that the deployment target is properly set up
- Review deployment logs for specific errors

### Test Failures
- Ensure test framework is properly installed
- Verify test scripts in `package.json`
- Check that test files follow the correct naming convention

## Future Improvements

Consider adding:
- **Code coverage reporting** (Codecov, Coveralls)
- **Performance testing** (Lighthouse CI)
- **Visual regression testing** (Percy, Chromatic)
- **Dependency updates** (Dependabot)
- **Automated releases** (Semantic Release)
- **Docker containerization** for consistent environments
- **Multi-environment deployments** (dev, staging, production)

## Support

For issues with the CI/CD pipeline:
1. Check workflow logs in the Actions tab
2. Review this documentation
3. Check GitHub Actions documentation: https://docs.github.com/en/actions
