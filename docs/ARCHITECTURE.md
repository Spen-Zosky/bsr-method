# BSR Method - Architecture Documentation

## System Overview

BSR Method is a monorepo-structured CLI application built with TypeScript, designed to orchestrate AI-assisted software development workflows.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        BSR Method CLI                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Command Layer                          │  │
│  │  ┌─────┐ ┌──────┐ ┌────┐ ┌────┐ ┌─────┐ ┌───────────┐   │  │
│  │  │init │ │config│ │plan│ │spec│ │tasks│ │run/dash/..│   │  │
│  │  └──┬──┘ └──┬───┘ └─┬──┘ └─┬──┘ └──┬──┘ └─────┬─────┘   │  │
│  └─────┼───────┼───────┼──────┼───────┼──────────┼──────────┘  │
│        │       │       │      │       │          │              │
│  ┌─────┴───────┴───────┴──────┴───────┴──────────┴──────────┐  │
│  │                    Service Layer                          │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────────┐    │  │
│  │  │Config      │ │File        │ │Template            │    │  │
│  │  │Manager     │ │Generator   │ │Engine              │    │  │
│  │  └────────────┘ └────────────┘ └────────────────────┘    │  │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────────┐    │  │
│  │  │Progress    │ │Discovery   │ │Dashboard           │    │  │
│  │  │Tracker     │ │Analyzer    │ │Server              │    │  │
│  │  └────────────┘ └────────────┘ └────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────┴──────────────────────────────┐  │
│  │                    Data Layer                             │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐     │  │
│  │  │.bsr/    │  │docs/    │  │specs/   │  │tasks/   │     │  │
│  │  │config   │  │idea     │  │features │  │breakdown│     │  │
│  │  │progress │  │prd      │  │api/data │  │github   │     │  │
│  │  │prompts  │  │arch     │  │ui       │  │         │     │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Node.js 18+ | JavaScript execution environment |
| Language | TypeScript 5.x | Type-safe development |
| CLI Framework | Commander.js | Command parsing and routing |
| User Input | Inquirer.js | Interactive prompts |
| Output | Chalk, Ora | Colored output and spinners |
| File System | fs-extra | Enhanced file operations |
| Data Format | YAML, JSON | Configuration and data storage |
| Build | tsup | Fast TypeScript bundler |
| Package Manager | pnpm | Monorepo workspace management |
| Testing | Vitest | Unit and integration tests |

## Directory Structure

```
bsr-method/
├── packages/
│   ├── cli/                    # Main CLI package
│   │   ├── src/
│   │   │   ├── bin/
│   │   │   │   └── bsr.ts      # Entry point
│   │   │   ├── commands/       # Command implementations
│   │   │   │   ├── init.ts
│   │   │   │   ├── config.ts
│   │   │   │   ├── status.ts
│   │   │   │   ├── discover.ts
│   │   │   │   ├── plan.ts
│   │   │   │   ├── spec.ts
│   │   │   │   ├── tasks.ts
│   │   │   │   ├── run.ts
│   │   │   │   ├── dashboard.ts
│   │   │   │   ├── export.ts
│   │   │   │   ├── sync.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── dist/               # Compiled output
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── tsup.config.ts
│   ├── core/                   # Core utilities (future)
│   └── shared/                 # Shared types (future)
├── .github/
│   └── workflows/
│       └── ci.yml              # CI/CD pipeline
├── package.json                # Root workspace config
├── pnpm-workspace.yaml         # Workspace definition
└── README.md
```

## Command Architecture

Each command follows a consistent pattern:

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import yaml from 'yaml';

export const exampleCommand = new Command('example')
  .description('Command description')
  .option('-f, --flag <value>', 'Option description')
  .action(async (options) => {
    // 1. Validate prerequisites
    if (!(await fs.pathExists('.bsr/config.yaml'))) {
      console.log(chalk.red('Error: BSR not initialized.'));
      process.exit(1);
    }

    // 2. Show progress
    const spinner = ora('Processing...').start();

    // 3. Execute logic
    try {
      // ... command implementation
      spinner.succeed('Done');
    } catch (error) {
      spinner.fail('Failed');
      console.error(chalk.red(String(error)));
    }

    // 4. Update progress tracking
    await updateProgress('example', 'completed');
  });
```

## Data Flow

### Initialization Flow

```
User Input → init command → Config Generation → Directory Creation → Progress Init
     │                            │                    │                   │
     ▼                            ▼                    ▼                   ▼
  Options              .bsr/config.yaml         docs/, specs/      .bsr/progress.yaml
```

### Planning Flow

```
Config + User Input → plan command → Template Processing → File Generation
        │                                    │                    │
        ▼                                    ▼                    ▼
   idea prompts              Markdown templates         docs/idea.yaml
                                                        docs/idea.md
                                                        docs/prd.md
                                                        docs/architecture.md
```

### Execution Flow (Ralph Loop)

```
tasks/breakdown.json → run command → Task Selection → Prompt Generation → User Action
         │                                │                  │                 │
         ▼                                ▼                  ▼                 ▼
   Task list              Interactive menu      .bsr/prompts/     done/blocked/skip
                                                                        │
                                                                        ▼
                                                              .bsr/loop-state.json
```

## File Formats

### Configuration (.bsr/config.yaml)

```yaml
version: "1.0"
project:
  name: string
  type: greenfield | brownfield
  domain: web-app | cli | api | desktop
llm:
  default: claude | openai | local
  providers:
    claude:
      model: string
      apiKey: string (optional)
phases:
  current: string
  completed: string[]
settings:
  autoCommit: boolean
  verbose: boolean
```

### Progress Tracking (.bsr/progress.yaml)

```yaml
startedAt: ISO datetime
lastUpdated: ISO datetime
phases:
  init: { status, completedAt }
  planning: { status, completedAt }
  specs: { status, completedAt }
  tasks: { status, completedAt }
  execution: { status, iteration, completedTasks }
```

### Task Definition (tasks/breakdown.json)

```json
[
  {
    "id": "TASK-001",
    "title": "Task title",
    "description": "Detailed description",
    "type": "setup | feature | test | docs | refactor",
    "priority": "high | medium | low",
    "status": "todo | in-progress | done | blocked",
    "feature": "feature-name",
    "estimate": "2h",
    "dependencies": ["TASK-000"]
  }
]
```

### Loop State (.bsr/loop-state.json)

```json
{
  "iteration": 5,
  "startedAt": "2026-01-26T10:00:00Z",
  "currentTask": "TASK-003",
  "completedTasks": ["TASK-001", "TASK-002"],
  "blockedTasks": [],
  "history": [
    { "task": "TASK-001", "action": "done", "timestamp": "..." }
  ]
}
```

## Dashboard Architecture

The dashboard is a self-contained HTTP server:

```
┌─────────────────────────────────────────────────┐
│              Dashboard Server                    │
│                 (port 3847)                      │
├─────────────────────────────────────────────────┤
│                                                  │
│  GET /          → HTML Dashboard                │
│  GET /api/data  → JSON Project Data             │
│  POST /api/task/update → Update Task Status     │
│                                                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │            Frontend (HTML)               │   │
│  │  - Tailwind CSS (CDN)                   │   │
│  │  - Vanilla JavaScript                    │   │
│  │  - Auto-refresh (30s)                   │   │
│  │  - Kanban board layout                  │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
└─────────────────────────────────────────────────┘
```

## Error Handling

All commands implement consistent error handling:

1. **Prerequisite Validation** - Check for required files/config
2. **Graceful Degradation** - Continue with defaults when possible
3. **User Feedback** - Clear error messages with suggested actions
4. **Exit Codes** - Non-zero exit for failures

```typescript
try {
  // Operation
} catch (error) {
  spinner.fail('Operation failed');
  console.error(chalk.red(`Error: ${error.message}`));
  console.log(chalk.gray('Try: bsr init to initialize project'));
  process.exit(1);
}
```

## Extension Points

### Adding New Commands

1. Create `packages/cli/src/commands/newcmd.ts`
2. Export from `packages/cli/src/commands/index.ts`
3. Import and register in `packages/cli/src/bin/bsr.ts`
4. Rebuild with `pnpm build`

### Adding LLM Providers

Configuration supports multiple providers:

```yaml
llm:
  default: custom
  providers:
    custom:
      model: model-name
      endpoint: https://api.example.com
      apiKey: ${CUSTOM_API_KEY}
```

### Custom Templates

Future support for user-defined templates in `.bsr/templates/`.

## Security Considerations

- API keys stored in config can use environment variable references
- No sensitive data in generated prompts
- GitHub tokens handled via `gh` CLI authentication
- Dashboard binds to localhost only by default

## Performance

- Build time: ~100-200ms (tsup)
- CLI startup: <100ms
- File generation: Synchronous for reliability
- Dashboard: Lightweight HTTP server, minimal memory footprint
