# BSR-Method: Quick Start Checklist

## Immediate Actions (Today)

### Step 1: Create GitHub Repository
```bash
# On GitHub: Create new repository
# Name: bsr-method
# Organization: (your choice - personal or create org)
# Visibility: Public
# License: MIT
# Initialize: YES with README
```

### Step 2: Clone and Setup Local Directory
```bash
# On your machine
cd ~/projects  # or your preferred location
git clone https://github.com/[YOUR_USERNAME]/bsr-method.git
cd bsr-method
```

### Step 3: Initialize Monorepo
```bash
# Install pnpm if not already
npm install -g pnpm

# Initialize pnpm workspace
pnpm init

# Create workspace config
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'packages/*'
EOF
```

### Step 4: Create Directory Structure
```bash
# Create all directories
mkdir -p packages/{cli,core,discovery,dashboard,integrations,shared}/src
mkdir -p templates/{greenfield,brownfield,prompts/{_base,claude,cursor,copilot,vscode,generic}}
mkdir -p docs/{en,it,assets}
mkdir -p examples/{greenfield-demo,brownfield-demo}
mkdir -p scripts
mkdir -p .github/{workflows,ISSUE_TEMPLATE}
```

### Step 5: Create CLAUDE.md for Self-Development
This is the most important file - it tells Claude Code how to develop BSR-Method itself.

```bash
cat > CLAUDE.md << 'EOF'
# BSR-Method Development Instructions

## Project Overview
BSR-Method is a framework integrating BMAD, SpecKit, and Ralph-Loop for AI-driven development.
This project is being developed using BSR-Method itself (dogfooding).

## Technology Stack
- Language: TypeScript 5.x
- Package Manager: pnpm (monorepo)
- Build: Turborepo
- CLI: Commander + Inquirer
- Dashboard: Fastify + React + Vite
- Testing: Vitest

## Monorepo Structure
- packages/cli - Main CLI (@bsr-method/cli)
- packages/core - Core engine (@bsr-method/core)
- packages/discovery - Brownfield discovery (@bsr-method/discovery)
- packages/dashboard - Web dashboard (@bsr-method/dashboard)
- packages/integrations - External integrations (@bsr-method/integrations)
- packages/shared - Shared types/utils (@bsr-method/shared)

## Key Files
- BSR-Method-Master-Plan.md - Full development plan
- packages/*/src/ - Source code
- templates/ - Project templates
- docs/ - Documentation

## Development Commands
```
pnpm install          # Install dependencies
pnpm build            # Build all packages
pnpm test             # Run tests
pnpm lint             # Lint code
pnpm dev              # Dev mode
```

## Current Phase
Phase 1: Foundation
- Setting up monorepo
- Creating CLI skeleton
- Implementing `bsr init`

## Conventions
- Use TypeScript strict mode
- Export types from index.ts
- Tests in __tests__/ directories
- Use named exports

## When Adding New Features
1. Update shared types if needed
2. Implement in appropriate package
3. Add tests
4. Update CLI if command needed
5. Update documentation
EOF
```

### Step 6: Create Root package.json
```bash
cat > package.json << 'EOF'
{
  "name": "bsr-method-monorepo",
  "version": "0.0.1",
  "private": true,
  "description": "BSR Method - BMAD + SpecKit + Ralph integration framework",
  "author": "Enzo Spenuso <spen.zosky@gmail.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/[YOUR_USERNAME]/bsr-method.git"
  },
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "clean": "turbo run clean && rm -rf node_modules",
    "format": "prettier --write \"**/*.{ts,tsx,md,json}\"",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "prettier": "^3.1.0",
    "turbo": "^2.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  },
  "packageManager": "pnpm@8.15.0"
}
EOF
```

### Step 7: Create Turborepo Config
```bash
cat > turbo.json << 'EOF'
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
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
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
EOF
```

### Step 8: Create Base TypeScript Config
```bash
cat > tsconfig.base.json << 'EOF'
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
    "outDir": "dist",
    "rootDir": "src"
  }
}
EOF
```

### Step 9: Create CLI Package
```bash
# Initialize CLI package
cd packages/cli
cat > package.json << 'EOF'
{
  "name": "bsr-method",
  "version": "0.0.1",
  "description": "BSR Method CLI - AI-driven development framework",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "bsr": "dist/bin/bsr.js",
    "bsr-method": "dist/bin/bsr.js"
  },
  "files": [
    "dist",
    "templates"
  ],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest run",
    "lint": "eslint src/",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "inquirer": "^9.2.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.0",
    "fs-extra": "^11.2.0",
    "yaml": "^2.3.0"
  },
  "devDependencies": {
    "@types/fs-extra": "^11.0.0",
    "@types/inquirer": "^9.0.0"
  },
  "keywords": [
    "bsr",
    "bmad",
    "speckit",
    "ralph",
    "ai",
    "development",
    "cli"
  ],
  "author": "Enzo Spenuso <spen.zosky@gmail.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/[YOUR_USERNAME]/bsr-method.git",
    "directory": "packages/cli"
  }
}
EOF

cat > tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
EOF

cd ../..
```

### Step 10: Create CLI Entry Point
```bash
mkdir -p packages/cli/src/{bin,commands,lib}

# Main entry
cat > packages/cli/src/index.ts << 'EOF'
export { run } from './bin/bsr.js';
export * from './commands/index.js';
EOF

# CLI binary
cat > packages/cli/src/bin/bsr.ts << 'EOF'
#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from '../commands/init.js';
import { configCommand } from '../commands/config.js';

const program = new Command();

program
  .name('bsr')
  .description('BSR Method - AI-driven development framework')
  .version('0.0.1');

program.addCommand(initCommand);
program.addCommand(configCommand);

program.parse();

export function run() {
  program.parse();
}
EOF

# Init command
cat > packages/cli/src/commands/init.ts << 'EOF'
import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';

export const initCommand = new Command('init')
  .description('Initialize BSR Method in a project')
  .option('-g, --greenfield', 'Start a new greenfield project')
  .option('-b, --brownfield', 'Initialize on existing project')
  .option('-l, --llm <target>', 'Target LLM (claude, cursor, copilot, vscode, generic)')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n🚀 BSR Method Initialization\n'));
    
    let projectType = options.greenfield ? 'greenfield' : 
                      options.brownfield ? 'brownfield' : null;
    let llmTarget = options.llm || null;
    
    // Interactive prompts if not provided
    if (!projectType && !options.yes) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'projectType',
          message: 'What type of project is this?',
          choices: [
            { name: 'Greenfield - New project from scratch', value: 'greenfield' },
            { name: 'Brownfield - Existing project to analyze', value: 'brownfield' }
          ]
        }
      ]);
      projectType = answers.projectType;
    }
    
    if (!llmTarget && !options.yes) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'llm',
          message: 'Which LLM/IDE will you use?',
          choices: [
            { name: 'Claude (Claude Code CLI)', value: 'claude' },
            { name: 'Cursor', value: 'cursor' },
            { name: 'GitHub Copilot', value: 'copilot' },
            { name: 'VS Code (Continue/other)', value: 'vscode' },
            { name: 'Generic (manual prompts)', value: 'generic' }
          ]
        }
      ]);
      llmTarget = answers.llm;
    }
    
    // Apply defaults if still not set
    projectType = projectType || 'greenfield';
    llmTarget = llmTarget || 'claude';
    
    const spinner = ora('Setting up BSR Method...').start();
    
    try {
      // Create .bsr directory
      await fs.ensureDir('.bsr');
      
      // Create config file
      const config = {
        version: '1.0',
        project: {
          name: path.basename(process.cwd()),
          type: projectType,
          created: new Date().toISOString()
        },
        llm: {
          target: llmTarget
        },
        workflow: {
          auto_commit: true,
          progress_file: 'progress.txt'
        }
      };
      
      await fs.writeFile('.bsr/config.yaml', 
        `# BSR Method Configuration\n` +
        `# Generated: ${new Date().toISOString()}\n\n` +
        JSON.stringify(config, null, 2).replace(/[{}"]/g, '')
          .replace(/,\n/g, '\n')
          .replace(/^\s+/gm, (m) => '  '.repeat(m.length / 2))
      );
      
      // Create CLAUDE.md or appropriate LLM config
      const instructionsFile = llmTarget === 'claude' ? 'CLAUDE.md' :
                               llmTarget === 'cursor' ? '.cursorrules' :
                               llmTarget === 'copilot' ? '.github/copilot-instructions.md' :
                               'BSR-INSTRUCTIONS.md';
      
      const instructions = generateInstructions(projectType, llmTarget);
      
      if (instructionsFile.includes('/')) {
        await fs.ensureDir(path.dirname(instructionsFile));
      }
      await fs.writeFile(instructionsFile, instructions);
      
      // Create progress.txt
      await fs.writeFile('progress.txt', 
        `# BSR Method Progress Tracker\n` +
        `# Project: ${path.basename(process.cwd())}\n` +
        `# Type: ${projectType}\n` +
        `# Started: ${new Date().toISOString()}\n\n` +
        `## Current Phase\ninitialization\n\n` +
        `## Status\npending\n`
      );
      
      spinner.succeed('BSR Method initialized successfully!');
      
      console.log(chalk.green('\n✅ Created files:'));
      console.log(`   • .bsr/config.yaml`);
      console.log(`   • ${instructionsFile}`);
      console.log(`   • progress.txt`);
      
      console.log(chalk.blue('\n📋 Next steps:'));
      if (projectType === 'greenfield') {
        console.log(`   1. Define your project IDEA`);
        console.log(`   2. Run: ${chalk.yellow('bsr plan')}`);
      } else {
        console.log(`   1. Run: ${chalk.yellow('bsr discover')}`);
        console.log(`   2. Review: discovery/project-context.yaml`);
        console.log(`   3. Run: ${chalk.yellow('bsr plan --from-dps')}`);
      }
      console.log('');
      
    } catch (error) {
      spinner.fail('Failed to initialize BSR Method');
      console.error(chalk.red(error));
      process.exit(1);
    }
  });

function generateInstructions(projectType: string, llmTarget: string): string {
  const header = projectType === 'greenfield' 
    ? `# Project Instructions - Greenfield

## Overview
This is a new project being developed with BSR Method.
The IDEA will be provided by the user and refined through BMAD planning.`
    : `# Project Instructions - Brownfield

## Overview
This is an existing project being documented and improved with BSR Method.
Run \`bsr discover\` to analyze the codebase and derive the project context.`;

  return `${header}

## BSR Method Workflow

### Key Files
- \`.bsr/config.yaml\` - BSR configuration
- \`progress.txt\` - Current progress tracking
- \`docs/\` - BMAD generated documents (after planning)
- \`specs/\` - SpecKit specifications (after spec generation)

### Commands
- \`bsr discover\` - Analyze existing codebase (brownfield)
- \`bsr plan\` - Run BMAD planning
- \`bsr spec\` - Generate SpecKit specifications
- \`bsr tasks\` - Generate task breakdown
- \`bsr run\` - Start Ralph loop execution
- \`bsr status\` - Check current progress
- \`bsr dashboard\` - Open web dashboard

### Workflow
${projectType === 'greenfield' ? `
1. Define IDEA → bsr plan → PRD + Architecture
2. Transform → bsr spec → SpecKit specs
3. Execute → bsr run → Ralph loop implementation
` : `
1. Discover → bsr discover → DPS (Derived IDEA)
2. Plan → bsr plan --from-dps → PRD + Architecture
3. Spec → bsr spec → SpecKit specs
4. Execute → bsr run → Ralph loop implementation
`}

## Quality Gates
- All tests must pass before completing tasks
- Follow patterns defined in specs
- Update progress.txt after each milestone

## Current Status
Check \`progress.txt\` for current phase and task.
`;
}
EOF

# Config command
cat > packages/cli/src/commands/config.ts << 'EOF'
import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';

export const configCommand = new Command('config')
  .description('View or modify BSR configuration')
  .option('-l, --list', 'List all configuration')
  .option('-g, --get <key>', 'Get a configuration value')
  .option('-s, --set <key=value>', 'Set a configuration value')
  .action(async (options) => {
    const configPath = '.bsr/config.yaml';
    
    if (!await fs.pathExists(configPath)) {
      console.log(chalk.red('BSR not initialized. Run `bsr init` first.'));
      process.exit(1);
    }
    
    if (options.list || (!options.get && !options.set)) {
      const config = await fs.readFile(configPath, 'utf-8');
      console.log(chalk.blue.bold('\nBSR Configuration:\n'));
      console.log(config);
    }
    
    // TODO: Implement get and set
  });
EOF

# Commands index
cat > packages/cli/src/commands/index.ts << 'EOF'
export { initCommand } from './init.js';
export { configCommand } from './config.js';
EOF
```

### Step 11: Create Shared Package (Types)
```bash
cd packages/shared

cat > package.json << 'EOF'
{
  "name": "@bsr-method/shared",
  "version": "0.0.1",
  "description": "Shared types and utilities for BSR Method",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  },
  "license": "MIT"
}
EOF

cat > tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
EOF

mkdir -p src/types

cat > src/types/config.ts << 'EOF'
export interface BSRConfig {
  version: string;
  project: {
    name: string;
    type: 'greenfield' | 'brownfield';
    created: string;
  };
  llm: {
    target: 'claude' | 'cursor' | 'copilot' | 'vscode' | 'generic';
    custom_instructions?: string;
  };
  workflow: {
    auto_commit: boolean;
    commit_prefix?: string;
    progress_file: string;
  };
  discovery?: {
    enabled: boolean;
    scanners: {
      code: boolean;
      database: boolean;
      config: boolean;
      api: boolean;
      test: boolean;
      docs: boolean;
      deps: boolean;
    };
    exclude: string[];
  };
  github?: {
    enabled: boolean;
    repo: string;
    issues?: {
      create: boolean;
      labels: string[];
    };
    projects?: {
      sync: boolean;
      project_id: number;
    };
  };
  dashboard?: {
    port: number;
    auto_open: boolean;
  };
  export?: {
    formats: ('md' | 'html' | 'pdf')[];
    output_dir: string;
  };
  memory?: {
    enabled: boolean;
    database: string;
  };
}
EOF

cat > src/types/dps.ts << 'EOF'
export interface DiscoveredProjectState {
  metadata: {
    discovery_date: string;
    discovery_version: string;
    repository: string;
    commit?: string;
    confidence_score: number;
  };
  derived_idea: {
    domain: string;
    summary: string;
    core_capabilities: string[];
    target_users: string;
    current_state: string;
  };
  technology_stack: {
    runtime: { name: string; version: string };
    framework?: { name: string; version: string };
    database?: { type: string; version: string; orm?: string };
    frontend?: { framework: string; styling?: string };
    testing?: { unit?: string; e2e?: string };
    deployment?: { containerization?: string; ci_cd?: string };
  };
  architecture: {
    style: string;
    layers: Array<{ name: string; path: string; components: number }>;
    diagram?: string;
  };
  domains: Array<{
    name: string;
    entities: string[];
    features: string[];
    endpoints: string[];
    confidence: number;
  }>;
  database_schema?: {
    tables: Array<{
      name: string;
      columns: number;
      relationships: string[];
    }>;
    relationships: Array<{
      from: string;
      to: string;
      type: string;
    }>;
  };
  api_surface?: {
    total_endpoints: number;
    by_domain: Record<string, number>;
    authentication: string;
    documentation_coverage: number;
  };
  test_coverage?: {
    overall: number;
    unit: number;
    integration: number;
    e2e: number;
    uncovered_areas: string[];
  };
  gaps_and_debt: {
    critical: Array<{ type: string; description: string; location: string }>;
    high: Array<{ type: string; description: string }>;
    medium: Array<{ type: string; description: string }>;
    remediation_hours: number;
  };
  inferred_requirements: {
    functional: Array<{
      id: string;
      description: string;
      source: string;
      confidence: number;
    }>;
    non_functional: Array<{
      id: string;
      category: string;
      description: string;
      source: string;
    }>;
  };
  recommendations: {
    immediate: string[];
    short_term: string[];
    long_term: string[];
    suggested_epics: Array<{
      name: string;
      priority: number;
      rationale: string;
    }>;
  };
}
EOF

cat > src/index.ts << 'EOF'
export * from './types/config.js';
export * from './types/dps.js';
EOF

cd ../..
```

### Step 12: Create Initial Git Commit
```bash
# Create .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
*.tsbuildinfo

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Test
coverage/

# Environment
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*
pnpm-debug.log*

# BSR generated (for dev only)
.bsr/
progress.txt
discovery/
EOF

# Initial commit
git add .
git commit -m "Initial commit: BSR Method monorepo structure"
```

### Step 13: Install Dependencies and Build
```bash
# Install all dependencies
pnpm install

# Build CLI package
pnpm build

# Test local execution
cd packages/cli
pnpm link --global

# Test it works
bsr --help
bsr init --help
```

---

## Verification Checklist

After completing all steps, verify:

- [ ] Repository created on GitHub
- [ ] Local clone working
- [ ] pnpm workspace configured
- [ ] `pnpm install` succeeds
- [ ] `pnpm build` succeeds
- [ ] `bsr --help` shows commands
- [ ] `bsr init` creates files correctly
- [ ] CLAUDE.md generated
- [ ] .bsr/config.yaml generated
- [ ] progress.txt generated

---

## What You'll Have After This

```
bsr-method/
├── .github/
├── packages/
│   ├── cli/          ✅ Working CLI with init + config
│   └── shared/       ✅ Types defined
├── templates/        📁 Empty (Phase 2)
├── docs/             📁 Empty (Phase 4)
├── examples/         📁 Empty (Phase 4)
├── CLAUDE.md         ✅ Self-development instructions
├── package.json      ✅ Root config
├── pnpm-workspace.yaml ✅
├── turbo.json        ✅
├── tsconfig.base.json ✅
└── .gitignore        ✅
```

---

## Next Session: Phase 2

After completing Phase 1, the next session will focus on:
1. Core engine (BMAD, SpecKit, Ralph adapters)
2. Discovery engine (scanners, analyzers)
3. Remaining CLI commands

You'll be able to run:
```bash
bsr discover          # Analyze brownfield project
bsr plan              # Run BMAD planning
bsr spec              # Generate SpecKit specs
bsr tasks             # Generate task breakdown
bsr run               # Start Ralph loop
```
