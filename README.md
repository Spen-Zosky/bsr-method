# BSR Method

**AI-driven development framework integrating BMAD, SpecKit, and Ralph**

[![npm version](https://img.shields.io/npm/v/bsr-method.svg)](https://www.npmjs.com/package/bsr-method)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

BSR Method is a comprehensive CLI tool that guides developers through the entire software development lifecycle using AI-assisted workflows. It combines three powerful methodologies:

- **BMAD** (Business, Market, Architecture, Design) - Strategic planning phase
- **SpecKit** - Technical specifications and documentation
- **Ralph** - Iterative execution loop with LLM assistance

## Installation

```bash
# Global installation
npm install -g bsr-method

# Or use directly with npx
npx bsr-method init
```

## Quick Start

```bash
# 1. Initialize a new project
bsr init --greenfield --llm claude

# 2. Create project plan (PRD, Architecture)
bsr plan

# 3. Generate specifications
bsr spec --all

# 4. Break down into tasks
bsr tasks --estimate --github

# 5. Execute with Ralph loop
bsr run

# 6. Monitor progress
bsr dashboard
```

## Commands

### `bsr init`

Initialize a new BSR project.

```bash
bsr init [options]

Options:
  --greenfield       Start fresh project
  --brownfield       Existing codebase
  --llm <provider>   LLM provider (claude, openai, local)
  -y, --yes          Skip prompts, use defaults
```

### `bsr config`

Manage project configuration.

```bash
bsr config [options]

Options:
  --get <key>        Get config value
  --set <key=value>  Set config value
  --list             List all config
  --reset            Reset to defaults
```

### `bsr status`

Show project status and progress.

```bash
bsr status [options]

Options:
  --json    Output as JSON
  --full    Show detailed status
```

### `bsr discover`

Analyze existing codebase (brownfield projects).

```bash
bsr discover [options]

Options:
  --deep      Deep analysis
  --output    Output format (yaml, json, md)
```

**Generates:**
- `discovery/project-context.yaml` - Structured analysis
- `discovery/DISCOVERY.md` - Human-readable report

### `bsr plan`

BMAD planning phase - generates strategic documents.

```bash
bsr plan [options]

Options:
  --from-dps    Derive from discovery (brownfield)
```

**Generates:**
- `docs/idea.yaml` - Structured idea definition
- `docs/idea.md` - Human-readable idea document
- `docs/prd.md` - Product Requirements Document
- `docs/architecture.md` - Technical architecture

### `bsr spec`

SpecKit specifications phase.

```bash
bsr spec [options]

Options:
  --api       Generate API specifications
  --data      Generate data models
  --ui        Generate UI components spec
  --all       Generate all specifications
```

**Generates:**
- `specs/CONSTITUTION.md` - Project principles and standards
- `specs/features/*.md` - Feature specifications
- `specs/api/endpoints.md` - API documentation
- `specs/data/models.md` - Data model definitions
- `specs/ui/components.md` - UI component specs

### `bsr tasks`

Generate task breakdown from specifications.

```bash
bsr tasks [options]

Options:
  --format <fmt>   Output format (md, json, csv)
  --github         Generate GitHub Issues format
  --estimate       Include time estimates
```

**Generates:**
- `tasks/breakdown.md` - Task list in markdown
- `tasks/breakdown.json` - Structured task data
- `tasks/github-issues.md` - GitHub-ready format

### `bsr run`

Execute Ralph loop - interactive task execution.

```bash
bsr run [options]

Options:
  --task <id>           Start with specific task
  --dry-run             Preview without execution
  --max-iterations <n>  Limit iterations (default: 10)
```

**Features:**
- Interactive task selection
- LLM prompt generation
- Progress tracking
- Loop state persistence

### `bsr dashboard`

Launch web-based project dashboard.

```bash
bsr dashboard [options]

Options:
  -p, --port <port>  Port number (default: 3847)
  --no-open          Don't auto-open browser
```

**Features:**
- Real-time project status
- Kanban task board
- Progress metrics
- Task quick actions

### `bsr export`

Export project reports.

```bash
bsr export [options]

Options:
  -f, --format <fmt>   Format: md, html, json (default: md)
  -o, --output <file>  Output file path
  --full               Include all sections
  --tasks-only         Export only tasks
  --specs-only         Export only specifications
```

### `bsr sync`

Synchronize with GitHub Issues.

```bash
bsr sync [options]

Options:
  --export-issues  Export tasks as GitHub Issues
  --import         Import issues from GitHub
  --status         Show sync status
  --dry-run        Preview changes
```

## Project Structure

After initialization, BSR creates this structure:

```
project/
├── .bsr/
│   ├── config.yaml        # Project configuration
│   ├── progress.yaml      # Progress tracking
│   ├── loop-state.json    # Ralph loop state
│   └── prompts/           # Generated LLM prompts
├── docs/
│   ├── idea.yaml          # Structured idea
│   ├── idea.md            # Idea document
│   ├── prd.md             # Product requirements
│   └── architecture.md    # Technical architecture
├── specs/
│   ├── CONSTITUTION.md    # Project standards
│   ├── README.md          # Specs index
│   ├── features/          # Feature specs
│   ├── api/               # API documentation
│   ├── data/              # Data models
│   └── ui/                # UI components
├── tasks/
│   ├── breakdown.md       # Task list
│   ├── breakdown.json     # Structured tasks
│   └── github-issues.md   # GitHub format
├── discovery/             # Brownfield analysis
│   ├── project-context.yaml
│   └── DISCOVERY.md
├── exports/               # Generated reports
└── sync/                  # GitHub sync files
```

## Configuration

BSR configuration is stored in `.bsr/config.yaml`:

```yaml
version: "1.0"
project:
  name: my-project
  type: greenfield
  domain: web-app

llm:
  default: claude
  providers:
    claude:
      model: claude-sonnet-4-20250514
    openai:
      model: gpt-4

phases:
  current: planning
  completed:
    - init

settings:
  autoCommit: false
  verbose: false
```

## Workflow

### Greenfield Project

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  init   │───▶│  plan   │───▶│  spec   │───▶│  tasks  │───▶│   run   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
                   │              │              │              │
                   ▼              ▼              ▼              ▼
              idea.yaml     CONSTITUTION    breakdown.md   prompts/
              prd.md        features/*.md   breakdown.json loop-state
              architecture  api/data/ui
```

### Brownfield Project

```
┌─────────┐    ┌──────────┐    ┌─────────┐    ┌─────────┐
│  init   │───▶│ discover │───▶│  plan   │───▶│  spec   │───▶ ...
│brownfield    └──────────┘    │--from-dps    └─────────┘
└─────────┘         │          └─────────┘
                    ▼
              DISCOVERY.md
              project-context.yaml
```

## Requirements

- Node.js >= 18.0.0
- npm or pnpm
- Git (optional, for sync features)
- GitHub CLI (optional, for GitHub integration)

## Development

```bash
# Clone repository
git clone https://github.com/Spen-Zosky/bsr-method.git
cd bsr-method

# Install dependencies
pnpm install

# Build
pnpm build

# Link globally for testing
pnpm link --global

# Run tests
pnpm test
```

## License

MIT © [Enzo Spenuso](https://github.com/Spen-Zosky)

## Links

- [GitHub Repository](https://github.com/Spen-Zosky/bsr-method)
- [Issue Tracker](https://github.com/Spen-Zosky/bsr-method/issues)
- [npm Package](https://www.npmjs.com/package/bsr-method)
