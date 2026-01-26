<# 
.SYNOPSIS
    BSR-Method Bootstrap Script for Windows
.DESCRIPTION
    Creates the entire bsr-method project structure
.PARAMETER ProjectPath
    Target directory for the project
.PARAMETER GitHubUser
    Your GitHub username
.PARAMETER SkipGitInit
    Skip git initialization
.PARAMETER SkipNpmInstall
    Skip pnpm install
.EXAMPLE
    .\bootstrap-bsr-method.ps1 -ProjectPath "D:\Projects\bsr-method" -GitHubUser "Spen-Zosky"
#>

param(
    [string]$ProjectPath = "D:\enzospenuso\Projects\bsr-method",
    [string]$GitHubUser = "Spen-Zosky",
    [switch]$SkipGitInit = $false,
    [switch]$SkipNpmInstall = $false
)

$ErrorActionPreference = "Stop"

function Write-Step { param($msg) Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Info { param($msg) Write-Host "  [i] $msg" -ForegroundColor Yellow }

Write-Host ""
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "  BSR-Method Bootstrap Script" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "Project Path: $ProjectPath"
Write-Host "GitHub User: $GitHubUser"
Write-Host ""

# ============================================================================
# Step 1: Create Project Directory
# ============================================================================
Write-Step "Creating project directory structure..."

if (-not (Test-Path $ProjectPath)) {
    New-Item -ItemType Directory -Path $ProjectPath -Force | Out-Null
}

Set-Location $ProjectPath
Write-Success "Project root: $ProjectPath"

# Create directory structure
$directories = @(
    "packages/cli/src/commands",
    "packages/cli/src/lib",
    "packages/cli/src/config",
    "packages/cli/__tests__",
    "packages/core/src/greenfield/bmad",
    "packages/core/src/greenfield/speckit",
    "packages/core/src/greenfield/ralph",
    "packages/core/src/brownfield/scanners",
    "packages/core/src/brownfield/analyzers",
    "packages/core/src/brownfield/synthesizer",
    "packages/core/src/types",
    "packages/core/__tests__",
    "packages/shared/src/types",
    "packages/shared/src/utils",
    "packages/dashboard/src",
    "packages/export/src",
    "packages/integrations/src/github",
    "packages/integrations/src/cicd",
    "templates/init",
    "templates/bmad",
    "templates/speckit",
    "templates/prompts/claude",
    "templates/prompts/cursor",
    "templates/prompts/copilot",
    "docs/en",
    "docs/it",
    "examples/greenfield-demo",
    "examples/brownfield-demo",
    "scripts",
    ".github/workflows",
    ".github/ISSUE_TEMPLATE"
)

foreach ($dir in $directories) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
}
Write-Success "Created $($directories.Count) directories"

# ============================================================================
# Step 2: Create Root Configuration Files
# ============================================================================
Write-Step "Creating root configuration files..."

# package.json (root) - using variable substitution only for GitHubUser
$packageJsonContent = @'
{
  "name": "bsr-method-monorepo",
  "version": "0.1.0",
  "private": true,
  "description": "BSR Method - BMAD + SpecKit + Ralph integration framework",
  "author": "Enzo Spenuso <spen.zosky@gmail.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/GITHUB_USER_PLACEHOLDER/bsr-method.git"
  },
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck",
    "clean": "turbo run clean && rimraf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,js,json,md}\""
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "prettier": "^3.2.0",
    "rimraf": "^5.0.0",
    "tsup": "^8.0.0",
    "turbo": "^2.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.2.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.15.0"
}
'@
$packageJsonContent = $packageJsonContent -replace 'GITHUB_USER_PLACEHOLDER', $GitHubUser
Set-Content -Path "package.json" -Value $packageJsonContent -Encoding UTF8
Write-Success "package.json"

# pnpm-workspace.yaml
@'
packages:
  - 'packages/*'
'@ | Set-Content -Path "pnpm-workspace.yaml" -Encoding UTF8
Write-Success "pnpm-workspace.yaml"

# turbo.json
@'
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
'@ | Set-Content -Path "turbo.json" -Encoding UTF8
Write-Success "turbo.json"

# tsconfig.base.json
@'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "isolatedModules": true
  }
}
'@ | Set-Content -Path "tsconfig.base.json" -Encoding UTF8
Write-Success "tsconfig.base.json"

# .eslintrc.js
@'
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
  },
  ignorePatterns: ['dist/', 'node_modules/'],
};
'@ | Set-Content -Path ".eslintrc.js" -Encoding UTF8
Write-Success ".eslintrc.js"

# .prettierrc
@'
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
'@ | Set-Content -Path ".prettierrc" -Encoding UTF8
Write-Success ".prettierrc"

# .gitignore
@'
node_modules/
dist/
*.tsbuildinfo
.turbo/
coverage/
.env
.env.local
*.log
.DS_Store
Thumbs.db
.vscode/
!.vscode/settings.json
.idea/
.bsr/
progress.txt
discovery/
'@ | Set-Content -Path ".gitignore" -Encoding UTF8
Write-Success ".gitignore"

# vitest.config.ts
@'
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
'@ | Set-Content -Path "vitest.config.ts" -Encoding UTF8
Write-Success "vitest.config.ts"

# ============================================================================
# Step 3: Create CLI Package
# ============================================================================
Write-Step "Creating CLI package..."

# packages/cli/package.json
$cliPackageJson = @'
{
  "name": "bsr-method",
  "version": "0.1.0",
  "description": "BSR Method CLI - AI-driven development framework",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "bsr": "dist/bin/bsr.js",
    "bsr-method": "dist/bin/bsr.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest run",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit",
    "clean": "rimraf dist"
  },
  "dependencies": {
    "@bsr-method/core": "workspace:*",
    "@bsr-method/shared": "workspace:*",
    "chalk": "^5.3.0",
    "commander": "^12.0.0",
    "fs-extra": "^11.2.0",
    "inquirer": "^9.2.0",
    "ora": "^8.0.0",
    "yaml": "^2.3.0"
  },
  "devDependencies": {
    "@types/fs-extra": "^11.0.0",
    "@types/inquirer": "^9.0.0",
    "tsup": "^8.0.0"
  },
  "author": "Enzo Spenuso <spen.zosky@gmail.com>",
  "license": "MIT"
}
'@
Set-Content -Path "packages/cli/package.json" -Value $cliPackageJson -Encoding UTF8
Write-Success "packages/cli/package.json"

# packages/cli/tsconfig.json
@'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/__tests__/**"]
}
'@ | Set-Content -Path "packages/cli/tsconfig.json" -Encoding UTF8

# packages/cli/tsup.config.ts
@'
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/bin/bsr.ts'],
  format: ['esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  target: 'node18',
  shims: true,
});
'@ | Set-Content -Path "packages/cli/tsup.config.ts" -Encoding UTF8

# Create bin directory
New-Item -ItemType Directory -Path "packages/cli/src/bin" -Force | Out-Null

# packages/cli/src/index.ts
@'
export { run } from './bin/bsr.js';
export * from './commands/index.js';
'@ | Set-Content -Path "packages/cli/src/index.ts" -Encoding UTF8

# packages/cli/src/bin/bsr.ts
$bsrBinContent = @'
#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';

import { initCommand } from '../commands/init.js';
import { configCommand } from '../commands/config.js';
import { statusCommand } from '../commands/status.js';

const VERSION = '0.1.0';

const program = new Command();

program
  .name('bsr')
  .description(
    chalk.bold('BSR Method') +
      ' - AI-driven development framework\n\n' +
      'Integrates BMAD (planning), SpecKit (specs), and Ralph (execution)'
  )
  .version(VERSION, '-v, --version')
  .option('--verbose', 'Enable verbose output');

program.addCommand(initCommand);
program.addCommand(configCommand);
program.addCommand(statusCommand);

// Placeholder commands
const placeholders = [
  ['discover', 'Analyze existing codebase (brownfield)'],
  ['plan', 'Run BMAD planning phase'],
  ['spec', 'Generate SpecKit specifications'],
  ['tasks', 'Generate task breakdown'],
  ['run', 'Start Ralph loop execution'],
  ['dashboard', 'Open web dashboard'],
  ['export', 'Export reports (PDF/HTML/MD)'],
  ['sync', 'Sync with GitHub Issues/Projects'],
];

for (const [name, desc] of placeholders) {
  program
    .command(name)
    .description(desc + chalk.gray(' [coming soon]'))
    .action(() => {
      console.log(chalk.yellow(`\nCommand '${name}' is not yet implemented.\n`));
    });
}

export function run() {
  program.parse();
}

run();
'@
Set-Content -Path "packages/cli/src/bin/bsr.ts" -Value $bsrBinContent -Encoding UTF8
Write-Success "packages/cli/src/bin/bsr.ts"

# packages/cli/src/commands/index.ts
@'
export { initCommand } from './init.js';
export { configCommand } from './config.js';
export { statusCommand } from './status.js';
'@ | Set-Content -Path "packages/cli/src/commands/index.ts" -Encoding UTF8

# packages/cli/src/commands/init.ts
$initCommandContent = @'
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';

export const initCommand = new Command('init')
  .description('Initialize BSR Method in a project')
  .option('-g, --greenfield', 'Start a new greenfield project')
  .option('-b, --brownfield', 'Initialize on existing project')
  .option('-l, --llm <target>', 'Target LLM (claude, cursor, copilot, vscode, generic)', 'claude')
  .option('-n, --name <name>', 'Project name')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n🚀 BSR Method Initialization\n'));

    let projectType = options.greenfield ? 'greenfield' : options.brownfield ? 'brownfield' : null;
    let llmTarget = options.llm;
    let projectName = options.name || path.basename(process.cwd());

    if (!projectType && !options.yes) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'projectType',
          message: 'What type of project is this?',
          choices: [
            { name: 'Greenfield - New project from scratch', value: 'greenfield' },
            { name: 'Brownfield - Existing project to analyze', value: 'brownfield' },
          ],
        },
      ]);
      projectType = answers.projectType;
    }

    if (!options.llm && !options.yes) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'llm',
          message: 'Which LLM/IDE will you use?',
          choices: [
            { name: 'Claude (Claude Code CLI)', value: 'claude' },
            { name: 'Cursor', value: 'cursor' },
            { name: 'GitHub Copilot', value: 'copilot' },
            { name: 'VS Code', value: 'vscode' },
            { name: 'Generic', value: 'generic' },
          ],
        },
      ]);
      llmTarget = answers.llm;
    }

    projectType = projectType || 'greenfield';
    llmTarget = llmTarget || 'claude';

    const spinner = ora('Setting up BSR Method...').start();

    try {
      await fs.ensureDir('.bsr');

      const config = {
        version: '1.0',
        project: {
          name: projectName,
          type: projectType,
          created: new Date().toISOString(),
        },
        llm: { target: llmTarget },
        workflow: {
          auto_commit: true,
          commit_prefix: '[BSR]',
          progress_file: 'progress.txt',
        },
        discovery: {
          enabled: projectType === 'brownfield',
          scanners: { code: true, database: true, config: true, api: true, test: true, docs: true, deps: true },
          exclude: ['node_modules', 'dist', '.git'],
        },
        dashboard: { port: 3456, auto_open: true },
        export: { formats: ['md', 'html', 'pdf'], output_dir: '.bsr/reports' },
        memory: { enabled: true, database: '.bsr/memory.db' },
      };

      await fs.writeFile('.bsr/config.yaml', yaml.stringify(config));

      const instructionsFile =
        llmTarget === 'claude' ? 'CLAUDE.md' :
        llmTarget === 'cursor' ? '.cursorrules' :
        llmTarget === 'copilot' ? '.github/copilot-instructions.md' :
        'BSR-INSTRUCTIONS.md';

      if (instructionsFile.includes('/')) {
        await fs.ensureDir(path.dirname(instructionsFile));
      }

      const instructions = `# ${projectName} - Development Instructions

## Overview
This is a **${projectType}** project using BSR Method.

## BSR Commands
- \`bsr discover\` - Analyze codebase (brownfield)
- \`bsr plan\` - Run BMAD planning
- \`bsr spec\` - Generate specifications
- \`bsr tasks\` - Generate task breakdown
- \`bsr run\` - Start Ralph loop
- \`bsr status\` - Check progress
- \`bsr dashboard\` - Open web UI

## Key Files
- \`.bsr/config.yaml\` - Configuration
- \`progress.txt\` - Progress tracking
- \`docs/\` - Generated documentation
- \`specs/\` - Specifications

## Current Status
Check \`progress.txt\` for current phase.
`;

      await fs.writeFile(instructionsFile, instructions);

      const progressContent = `# BSR Method Progress Tracker
# Project: ${projectName}
# Type: ${projectType}
# Started: ${new Date().toISOString()}

## Current Phase
initialization

## Status
pending

## Next Steps
${projectType === 'greenfield'
  ? '1. Define your IDEA\n2. Run: bsr plan'
  : '1. Run: bsr discover\n2. Review discovery results\n3. Run: bsr plan --from-dps'}
`;

      await fs.writeFile('progress.txt', progressContent);
      await fs.ensureDir('docs');

      spinner.succeed('BSR Method initialized!');

      console.log(chalk.green('\n✅ Created:'));
      console.log(`   • .bsr/config.yaml`);
      console.log(`   • ${instructionsFile}`);
      console.log(`   • progress.txt`);

      console.log(chalk.blue('\n📋 Next steps:'));
      if (projectType === 'greenfield') {
        console.log(`   1. Define your IDEA in ${instructionsFile}`);
        console.log(`   2. Run: ${chalk.yellow('bsr plan')}`);
      } else {
        console.log(`   1. Run: ${chalk.yellow('bsr discover')}`);
        console.log(`   2. Review: discovery/project-context.yaml`);
      }
      console.log('');
    } catch (error) {
      spinner.fail('Failed to initialize');
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });
'@
Set-Content -Path "packages/cli/src/commands/init.ts" -Value $initCommandContent -Encoding UTF8
Write-Success "packages/cli/src/commands/init.ts"

# packages/cli/src/commands/config.ts
$configCommandContent = @'
import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import yaml from 'yaml';

export const configCommand = new Command('config')
  .description('View or modify BSR configuration')
  .option('-l, --list', 'List all configuration')
  .option('-g, --get <key>', 'Get a value (dot notation)')
  .option('-s, --set <keyvalue>', 'Set a value (key=value)')
  .action(async (options) => {
    const configPath = '.bsr/config.yaml';

    if (!(await fs.pathExists(configPath))) {
      console.log(chalk.red('\n❌ BSR not initialized. Run `bsr init` first.\n'));
      process.exit(1);
    }

    const content = await fs.readFile(configPath, 'utf-8');

    if (options.get) {
      const config = yaml.parse(content);
      const keys = options.get.split('.');
      let value: unknown = config;
      for (const k of keys) {
        if (value && typeof value === 'object') {
          value = (value as Record<string, unknown>)[k];
        } else {
          value = undefined;
          break;
        }
      }
      console.log(value !== undefined ? (typeof value === 'object' ? yaml.stringify(value) : value) : 'Not found');
      return;
    }

    console.log(chalk.blue.bold('\nBSR Configuration:\n'));
    console.log(content);
  });
'@
Set-Content -Path "packages/cli/src/commands/config.ts" -Value $configCommandContent -Encoding UTF8
Write-Success "packages/cli/src/commands/config.ts"

# packages/cli/src/commands/status.ts
$statusCommandContent = @'
import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import yaml from 'yaml';

export const statusCommand = new Command('status')
  .description('Show current BSR project status')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    const configPath = '.bsr/config.yaml';

    if (!(await fs.pathExists(configPath))) {
      console.log(chalk.red('\n❌ BSR not initialized. Run `bsr init` first.\n'));
      process.exit(1);
    }

    const config = yaml.parse(await fs.readFile(configPath, 'utf-8'));

    let phase = 'unknown';
    let status = 'unknown';

    if (await fs.pathExists('progress.txt')) {
      const progress = await fs.readFile('progress.txt', 'utf-8');
      const phaseMatch = progress.match(/## Current Phase\n(\w+)/);
      const statusMatch = progress.match(/## Status\n(\w+)/);
      if (phaseMatch) phase = phaseMatch[1];
      if (statusMatch) status = statusMatch[1];
    }

    const result = {
      project: config.project.name,
      type: config.project.type,
      llm: config.llm.target,
      phase,
      status,
      created: config.project.created,
    };

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(chalk.blue.bold('\n📊 BSR Project Status\n'));
    console.log(`  Project:  ${chalk.white(result.project)}`);
    console.log(`  Type:     ${chalk.cyan(result.type)}`);
    console.log(`  LLM:      ${chalk.magenta(result.llm)}`);
    console.log(`  Phase:    ${chalk.yellow(result.phase)}`);
    console.log(`  Status:   ${result.status === 'complete' ? chalk.green(result.status) : chalk.gray(result.status)}`);
    console.log('');
  });
'@
Set-Content -Path "packages/cli/src/commands/status.ts" -Value $statusCommandContent -Encoding UTF8
Write-Success "packages/cli/src/commands/status.ts"

# ============================================================================
# Step 4: Create Shared Package
# ============================================================================
Write-Step "Creating shared package..."

@'
{
  "name": "@bsr-method/shared",
  "version": "0.1.0",
  "description": "Shared types and utilities for BSR Method",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "clean": "rimraf dist"
  },
  "devDependencies": {
    "tsup": "^8.0.0"
  },
  "license": "MIT"
}
'@ | Set-Content -Path "packages/shared/package.json" -Encoding UTF8

@'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src/**/*"]
}
'@ | Set-Content -Path "packages/shared/tsconfig.json" -Encoding UTF8

@'
import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
});
'@ | Set-Content -Path "packages/shared/tsup.config.ts" -Encoding UTF8

@'
export * from './types/index.js';
export * from './utils/index.js';
'@ | Set-Content -Path "packages/shared/src/index.ts" -Encoding UTF8

@'
export * from './config.js';
export * from './dps.js';
'@ | Set-Content -Path "packages/shared/src/types/index.ts" -Encoding UTF8

$configTypesContent = @'
export type LLMTarget = 'claude' | 'cursor' | 'copilot' | 'vscode' | 'generic';
export type ProjectType = 'greenfield' | 'brownfield';

export interface BSRConfig {
  version: string;
  project: {
    name: string;
    type: ProjectType;
    created: string;
  };
  llm: {
    target: LLMTarget;
  };
  workflow: {
    auto_commit: boolean;
    commit_prefix?: string;
    progress_file: string;
  };
  discovery?: {
    enabled: boolean;
    scanners: Record<string, boolean>;
    exclude: string[];
  };
  dashboard?: {
    port: number;
    auto_open: boolean;
  };
  export?: {
    formats: string[];
    output_dir: string;
  };
  memory?: {
    enabled: boolean;
    database: string;
  };
}
'@
Set-Content -Path "packages/shared/src/types/config.ts" -Value $configTypesContent -Encoding UTF8

$dpsTypesContent = @'
export interface DiscoveredProjectState {
  metadata: {
    discoveryDate: string;
    repository: string;
    confidenceScore: number;
  };
  derivedIdea: {
    domain: string;
    summary: string;
    coreCapabilities: string[];
  };
  technologyStack: {
    runtime: { name: string; version: string };
    framework?: { name: string; version: string };
    database?: { type: string };
  };
  architecture: {
    style: string;
    layers: Array<{ name: string; path: string }>;
  };
  gapsAndDebt: {
    critical: Array<{ type: string; description: string }>;
    high: Array<{ type: string; description: string }>;
  };
}
'@
Set-Content -Path "packages/shared/src/types/dps.ts" -Value $dpsTypesContent -Encoding UTF8

@'
export * from './fs.js';
'@ | Set-Content -Path "packages/shared/src/utils/index.ts" -Encoding UTF8

$fsUtilsContent = @'
import fs from 'fs/promises';

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}
'@
Set-Content -Path "packages/shared/src/utils/fs.ts" -Value $fsUtilsContent -Encoding UTF8
Write-Success "packages/shared"

# ============================================================================
# Step 5: Create Core Package (placeholder)
# ============================================================================
Write-Step "Creating core package placeholder..."

@'
{
  "name": "@bsr-method/core",
  "version": "0.1.0",
  "description": "Core engine for BSR Method",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "clean": "rimraf dist"
  },
  "dependencies": {
    "@bsr-method/shared": "workspace:*"
  },
  "devDependencies": {
    "tsup": "^8.0.0"
  },
  "license": "MIT"
}
'@ | Set-Content -Path "packages/core/package.json" -Encoding UTF8

@'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": { "outDir": "dist", "rootDir": "src" },
  "include": ["src/**/*"]
}
'@ | Set-Content -Path "packages/core/tsconfig.json" -Encoding UTF8

@'
import { defineConfig } from 'tsup';
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
});
'@ | Set-Content -Path "packages/core/tsup.config.ts" -Encoding UTF8

@'
// BSR Method Core Engine
// Will contain: BMAD, SpecKit, Ralph, Discovery Engine
export const VERSION = '0.1.0';
export const placeholder = { status: 'Coming soon in Phase 2' };
'@ | Set-Content -Path "packages/core/src/index.ts" -Encoding UTF8
Write-Success "packages/core"

# ============================================================================
# Step 6: Create CLAUDE.md
# ============================================================================
Write-Step "Creating CLAUDE.md..."

$claudeMdContent = @'
# BSR-Method Development Instructions

## Overview
BSR-Method integrates BMAD + SpecKit + Ralph for AI-driven development.
Supports greenfield (new) and brownfield (existing) projects.

## Tech Stack
- TypeScript 5.x, Node.js 18+
- pnpm monorepo + Turborepo
- Commander.js + Inquirer.js (CLI)
- Vitest (testing)

## Structure
```
packages/
├── cli/      # Main CLI (bsr-method)
├── core/     # Core engine
├── shared/   # Types & utils
```

## Commands
```bash
pnpm install    # Install deps
pnpm build      # Build all
pnpm dev        # Watch mode
pnpm test       # Run tests
pnpm lint       # Lint code
```

## Current Phase: Foundation
- [x] Monorepo setup
- [x] CLI with init, config, status
- [ ] Core engine (Phase 2)
- [ ] Discovery engine (Phase 3)

## Conventions
- TypeScript strict mode
- Named exports from index.ts
- Tests in __tests__/ directories
'@
Set-Content -Path "CLAUDE.md" -Value $claudeMdContent -Encoding UTF8
Write-Success "CLAUDE.md"

# ============================================================================
# Step 7: Create README.md
# ============================================================================
Write-Step "Creating README.md..."

$readmeContent = @"
# BSR-Method

**AI-Driven Development Framework**

Integrates BMAD, SpecKit, and Ralph for seamless project development.

## Installation

``````bash
npx bsr-method init
``````

## Quick Start

### Greenfield (New Project)
``````bash
mkdir my-project && cd my-project
npx bsr-method init --greenfield
bsr plan
bsr spec
bsr run
``````

### Brownfield (Existing Project)
``````bash
cd my-existing-project
npx bsr-method init --brownfield
bsr discover
bsr plan --from-dps
bsr spec
bsr run
``````

## Features

- 🚀 **Greenfield**: Start from IDEA to implementation
- 🔍 **Brownfield**: Analyze existing code, derive IDEA
- 📊 **Dashboard**: Web-based progress tracking
- 📄 **Export**: PDF, HTML, Markdown reports
- 🔗 **GitHub**: Issues and Projects sync

## Supported LLMs

- Claude (Claude Code)
- Cursor
- GitHub Copilot
- VS Code
- Generic

## License

MIT - Enzo Spenuso
"@
Set-Content -Path "README.md" -Value $readmeContent -Encoding UTF8
Write-Success "README.md"

# ============================================================================
# Step 8: Create LICENSE
# ============================================================================
Write-Step "Creating LICENSE..."

$year = (Get-Date).Year
$licenseContent = @"
MIT License

Copyright (c) $year Enzo Spenuso

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
"@
Set-Content -Path "LICENSE" -Value $licenseContent -Encoding UTF8
Write-Success "LICENSE"

# ============================================================================
# Step 9: Create GitHub CI
# ============================================================================
Write-Step "Creating GitHub Actions..."

$ciYamlContent = @'
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm build
      - run: pnpm test
'@
Set-Content -Path ".github/workflows/ci.yml" -Value $ciYamlContent -Encoding UTF8
Write-Success ".github/workflows/ci.yml"

# ============================================================================
# Step 10: Create CONTRIBUTING.md
# ============================================================================
@'
# Contributing to BSR-Method

## Setup
1. Fork and clone
2. `pnpm install`
3. `pnpm build`
4. `pnpm test`

## Standards
- TypeScript strict mode
- ESLint + Prettier
- Tests for new features

## Pull Requests
1. Create feature branch
2. Make changes
3. Run `pnpm lint && pnpm test`
4. Submit PR
'@ | Set-Content -Path "CONTRIBUTING.md" -Encoding UTF8
Write-Success "CONTRIBUTING.md"

# ============================================================================
# Step 11: Initialize Git
# ============================================================================
if (-not $SkipGitInit) {
    Write-Step "Initializing Git..."
    
    git init 2>&1 | Out-Null
    git add . 2>&1 | Out-Null
    git commit -m "Initial commit: BSR-Method monorepo" 2>&1 | Out-Null
    
    Write-Success "Git initialized"
    Write-Info "Run: git remote add origin https://github.com/$GitHubUser/bsr-method.git"
}

# ============================================================================
# Step 12: Install Dependencies
# ============================================================================
if (-not $SkipNpmInstall) {
    Write-Step "Installing dependencies with pnpm..."
    
    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Write-Info "Installing pnpm..."
        npm install -g pnpm
    }
    
    pnpm install
    
    Write-Success "Dependencies installed"
}

# ============================================================================
# Summary
# ============================================================================
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Bootstrap Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Project: $ProjectPath"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Create GitHub repo: https://github.com/new (name: bsr-method)"
Write-Host "  2. git remote add origin https://github.com/$GitHubUser/bsr-method.git"
Write-Host "  3. git push -u origin main"
Write-Host "  4. pnpm build"
Write-Host "  5. cd packages/cli && pnpm link --global"
Write-Host "  6. bsr --help"
Write-Host ""
Write-Host "Happy coding!" -ForegroundColor Green
