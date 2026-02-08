# Feature: CLI with 11 Commands

**Package**: `packages/cli`
**Status**: Implemented
**Priority**: P0

---

## Overview

The BSR CLI (`bsr`) is the primary interface for the framework, built with Commander.js. It provides 11 commands covering the full development lifecycle: project initialization, codebase discovery, planning, specification, task management, execution, monitoring, configuration, reporting, and GitHub integration.

## Commands

### `bsr init`
Initialize a new BSR project.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--type` | `greenfield\|brownfield` | `greenfield` | Project type |
| `--target` | `LLMTarget` | `claude` | LLM target |
| `--autocommit` | boolean | false | Auto-commit changes |

**Output**: `.bsr/config.yaml`, directory structure

### `bsr discover`
Analyze existing codebase (brownfield projects).

| Option | Type | Description |
|--------|------|-------------|
| `--deep` | boolean | Thorough analysis with confidence scoring |

**Output**: `discovery/project-context.yaml`

### `bsr plan`
Generate idea, PRD, and architecture via BMAD adapter.

| Option | Type | Description |
|--------|------|-------------|
| `--bmad-dir` | string | Path to BMAD directory |
| `--idea` | string | Path to idea YAML file |
| `--from-dps` | boolean | Derive from discovered project state |
| `--save` | boolean | Save output files |
| `--validate` | boolean | Validate BMAD input |
| `--yes` | boolean | Skip confirmation prompts |

**Output**: `docs/idea.yaml`, `docs/prd.md`, `docs/architecture.md`

### `bsr spec`
Generate specifications via SpecKit adapter.

| Option | Type | Description |
|--------|------|-------------|
| `--format` | `md\|yaml` | Output format |
| `--output` | string | Output file path |
| `--validate` | boolean | Validate idea before generating |
| `--all` | boolean | Generate all spec types |

**Output**: `specs/` directory (constitution, features, API, data, UI)

### `bsr tasks`
Generate task breakdown from idea.

| Option | Type | Description |
|--------|------|-------------|
| `--priority` | string | Filter by priority |
| `--effort` | string | Filter by effort |
| `--estimate` | boolean | Include effort estimates |
| `--github` | boolean | Generate GitHub issue format |
| `--dry-run` | boolean | Preview without writing |

**Output**: `tasks/breakdown.json`, `tasks/breakdown.md`, `tasks/github-issues.md`

### `bsr run`
Execute Ralph Loop for LLM-powered task implementation.

| Option | Type | Description |
|--------|------|-------------|
| `--task` | string | Execute specific task by ID |
| `--limit` | number | Max tasks to execute |
| `--dry-run` | boolean | Preview without executing |

**Output**: Updated task statuses, `.bsr/loop-state.json`

### `bsr dashboard`
Start web dashboard for task visualization.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--port` | number | 3000 | Server port |
| `--open` | boolean | false | Auto-open browser |

**Output**: Fastify server at `http://127.0.0.1:<port>`

### `bsr config`
Manage project configuration.

| Option | Type | Description |
|--------|------|-------------|
| `--list` | boolean | Show all config |
| `--get` | string | Get value by dot notation key |
| `--set` | string | Set value (`key=value`) |

### `bsr status`
Display project status and progress.

| Option | Type | Description |
|--------|------|-------------|
| `--json` | boolean | JSON output |

### `bsr export`
Generate reports in multiple formats.

| Option | Type | Description |
|--------|------|-------------|
| `--format` | `md\|html\|json` | Output format |
| `--output` | string | Output file path |
| `--full` | boolean | Include all data |
| `--tasks-only` | boolean | Only task data |
| `--specs-only` | boolean | Only spec data |

**Output**: `exports/<timestamp>.<format>`

### `bsr sync`
Bidirectional GitHub Issues integration.

| Option | Type | Description |
|--------|------|-------------|
| `--export-issues` | boolean | Export tasks as GitHub Issues |
| `--import` | boolean | Import GitHub Issues as tasks |
| `--status` | boolean | Show sync status |
| `--dry-run` | boolean | Preview without executing |

**Output**: `.bsr/sync-state.json`, generated bash scripts

## Technical Design

### Architecture
```
packages/cli/src/
├── index.ts              # Commander program setup, register all commands
└── commands/
    ├── init.ts           # Project initialization
    ├── discover.ts       # Brownfield analysis
    ├── plan.ts           # BMAD integration
    ├── spec.ts           # SpecKit integration
    ├── tasks.ts          # Task breakdown
    ├── run.ts            # Ralph execution loop
    ├── dashboard.ts      # Web dashboard launcher
    ├── config.ts         # Config management
    ├── status.ts         # Status display
    ├── export.ts         # Report generation
    └── sync.ts           # GitHub sync
```

### Dependencies
- **Internal**: `@bsr-method/shared` (types), `@bsr-method/bmad-adapter`, `@bsr-method/speckit-adapter`, `@bsr-method/dashboard`
- **External**: `commander`, `js-yaml`, `chalk`, `open`

### Error Handling
Each command wraps its logic in try/catch and displays user-friendly error messages via `console.error`. Non-zero exit codes for failures.

## Testing

| Test Case | Description |
|-----------|-------------|
| init creates config | `bsr init` creates `.bsr/config.yaml` with defaults |
| init respects options | `--type brownfield --target cursor` sets correct values |
| config get/set | Dot notation read/write works correctly |
| status reads progress | Displays correct phase from progress file |
| export formats | Each format (md, html, json) produces valid output |

---
*BSR Method - CLI Feature Specification*
