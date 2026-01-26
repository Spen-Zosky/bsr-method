# BSR Method - Development Guide

## Development Setup

### Prerequisites

- Node.js 18+ 
- pnpm 8+
- Git

### Initial Setup

```bash
# Clone repository
git clone https://github.com/Spen-Zosky/bsr-method.git
cd bsr-method

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Link CLI globally for testing
cd packages/cli
pnpm link --global

# Verify installation
bsr --version
```

### Development Workflow

```bash
# Watch mode (auto-rebuild on changes)
cd packages/cli
pnpm dev

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint
```

## Project Structure

```
bsr-method/
├── packages/
│   └── cli/
│       ├── src/
│       │   ├── bin/bsr.ts          # CLI entry point
│       │   ├── commands/           # Command implementations
│       │   └── index.ts            # Package exports
│       ├── dist/                   # Compiled output
│       ├── package.json
│       ├── tsconfig.json
│       └── tsup.config.ts
├── .github/workflows/ci.yml
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## Adding a New Command

### 1. Create Command File

Create `packages/cli/src/commands/newcmd.ts`:

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';

export const newcmdCommand = new Command('newcmd')
  .description('Description of the command')
  .option('-f, --flag <value>', 'Option description', 'default')
  .option('--verbose', 'Verbose output')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n[BSR NewCmd] Title\n'));

    // 1. Check prerequisites
    if (!(await fs.pathExists('.bsr/config.yaml'))) {
      console.log(chalk.red('Error: BSR not initialized. Run bsr init first.\n'));
      process.exit(1);
    }

    // 2. Load configuration
    const config = yaml.parse(await fs.readFile('.bsr/config.yaml', 'utf-8'));

    // 3. Show progress
    const spinner = ora('Processing...').start();

    try {
      // 4. Implement command logic
      await doSomething(options);

      spinner.succeed('Completed successfully');

      // 5. Update progress
      await updateProgress(config);

    } catch (error) {
      spinner.fail('Failed');
      console.error(chalk.red(String(error)));
      process.exit(1);
    }

    // 6. Show summary
    console.log(chalk.green('\nDone!\n'));
  });

async function doSomething(options: any): Promise<void> {
  // Implementation
}

async function updateProgress(config: any): Promise<void> {
  const progressPath = '.bsr/progress.yaml';
  let progress: any = {};
  
  if (await fs.pathExists(progressPath)) {
    progress = yaml.parse(await fs.readFile(progressPath, 'utf-8'));
  }

  progress.lastUpdated = new Date().toISOString();
  // Update specific fields...

  await fs.writeFile(progressPath, yaml.stringify(progress));
}
```

### 2. Export from Index

Update `packages/cli/src/commands/index.ts`:

```typescript
export { initCommand } from './init.js';
export { configCommand } from './config.js';
// ... existing exports
export { newcmdCommand } from './newcmd.js';
```

### 3. Register in CLI

Update `packages/cli/src/bin/bsr.ts`:

```typescript
import { newcmdCommand } from '../commands/newcmd.js';

// ... in program setup
program.addCommand(newcmdCommand);
```

### 4. Build and Test

```bash
cd packages/cli
pnpm build
bsr newcmd --help
```

## Build Configuration

### tsup.config.ts

```typescript
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/bin/bsr.ts'],
  format: ['cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  target: 'node18',
  outDir: 'dist',
});
```

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Windows Development Notes

### BOM (Byte Order Mark) Issues

Windows editors may add UTF-8 BOM to files, causing Node.js shebang issues.

**Solution - PowerShell function:**

```powershell
function Write-NoBOM {
    param([string]$Path, [string]$Content)
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
    Write-Host "Written: $Path"
}

# Usage
$content = Get-Content "file.ts" -Raw
Write-NoBOM "packages/cli/src/commands/file.ts" $content
```

### Path Separators

Use `path.join()` for cross-platform compatibility:

```typescript
// ✓ Good
const filePath = path.join('.bsr', 'config.yaml');

// ✗ Bad
const filePath = '.bsr/config.yaml';
```

## Testing

### Test Structure

```
packages/cli/
└── src/
    └── commands/
        ├── init.ts
        └── __tests__/
            └── init.test.ts
```

### Example Test

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';

describe('init command', () => {
  const testDir = path.join(__dirname, 'test-project');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
    process.chdir(testDir);
  });

  afterEach(async () => {
    process.chdir(__dirname);
    await fs.remove(testDir);
  });

  it('should create .bsr directory', async () => {
    // Run init logic
    await fs.ensureDir('.bsr');
    expect(await fs.pathExists('.bsr')).toBe(true);
  });
});
```

### Running Tests

```bash
# All tests
pnpm test

# Watch mode
pnpm test -- --watch

# Coverage
pnpm test -- --coverage
```

## Code Style Guidelines

### File Naming
- Commands: `kebab-case.ts` (e.g., `my-command.ts`)
- Exports: `camelCase` (e.g., `myCommand`)

### Imports Order
1. Node.js built-ins
2. External packages
3. Internal modules

```typescript
import path from 'path';
import fs from 'fs-extra';

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';

import { someUtil } from '../utils/index.js';
```

### Error Messages

```typescript
// User-friendly with suggestion
console.log(chalk.red('Error: Configuration not found.'));
console.log(chalk.gray('Run: bsr init to initialize project\n'));

// With context
console.log(chalk.red(`Error: Failed to read ${filePath}`));
console.log(chalk.gray(`Details: ${error.message}\n`));
```

### Progress Indicators

```typescript
const spinner = ora('Loading...').start();

// Success
spinner.succeed('Loaded successfully');

// Failure
spinner.fail('Failed to load');

// Info update
spinner.text = 'Processing step 2...';
```

## Release Process

### Version Bump

```bash
cd packages/cli
npm version patch  # or minor, major
```

### Build and Publish

```bash
pnpm build
npm publish --access public
```

### Git Tags

```bash
git tag v0.1.0
git push origin v0.1.0
```

## Troubleshooting

### "Command not found" after link

```bash
# Re-link
cd packages/cli
pnpm unlink --global
pnpm link --global

# Verify
which bsr
```

### Build errors with tsup

```bash
# Clean and rebuild
pnpm clean
pnpm build
```

### TypeScript errors

```bash
# Check types without building
pnpm typecheck
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `test:` Tests
- `chore:` Maintenance
