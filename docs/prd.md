# Product Requirements Document

**Project**: BSR Method
**Date**: 2026-02-08
**Status**: Active Development

## 1. Executive Summary

### Vision
BSR Method is an end-to-end AI-driven development framework that provides a structured pipeline from idea to implementation. It integrates three phases: **BMAD** (planning), **SpecKit** (specification), and **Ralph** (execution) into a unified CLI workflow.

### Problem
Software development with LLMs lacks a structured methodology. Developers jump between planning, coding, and testing without a coherent workflow. Existing tools are fragmented: planning tools don't connect to spec generators, spec generators don't connect to task managers, and task managers don't connect to LLM executors.

### Solution
BSR Method provides a CLI tool (`bsr`) with 11 commands covering the full development lifecycle:
1. **init** - Bootstrap a new project with config
2. **discover** - Analyze existing codebases (brownfield)
3. **plan** - Generate PRD and architecture via BMAD
4. **spec** - Generate specifications via SpecKit
5. **tasks** - Break down work into prioritized tasks
6. **run** - Execute tasks via Ralph Loop (LLM-powered)
7. **dashboard** - Real-time web UI for task tracking
8. **config** - Manage project configuration
9. **status** - View project progress
10. **export** - Generate reports (Markdown, HTML, JSON)
11. **sync** - Bidirectional GitHub Issues integration

### Target Users
- Solo developers using AI-assisted development
- Small teams wanting structured LLM-driven workflows
- Developers working on both greenfield and brownfield projects

## 2. Functional Requirements

### 2.1 Project Initialization (`bsr init`)
- **Priority**: P0 - Critical
- **Status**: Implemented
- Creates `.bsr/config.yaml` with project metadata
- Supports `--type greenfield|brownfield` and `--target <llm>` options
- Sets up directory structure and Git tracking
- **Acceptance**: Config file created, directories scaffolded, Git initialized

### 2.2 Brownfield Discovery (`bsr discover`)
- **Priority**: P0 - Critical
- **Status**: Implemented
- Analyzes existing codebase to extract project state
- Generates `discovery/project-context.yaml` with confidence scores
- Outputs: metadata, derived idea, technology stack, architecture patterns, gaps/debt
- Supports `--deep` flag for thorough analysis
- **Acceptance**: Context file generated with accurate tech stack detection, >70% confidence

### 2.3 BMAD Planning Phase (`bsr plan`)
- **Priority**: P0 - Critical
- **Status**: Implemented
- Converts BMAD output or idea YAML to BSR format using the BMAD adapter
- Parses BMAD directory structures (project files, personas, epics, stories)
- Generates `docs/idea.yaml` with features, personas, architecture, milestones
- Generates `docs/prd.md` and `docs/architecture.md`
- **Acceptance**: Idea file generated with all features extracted, priorities normalized

### 2.4 SpecKit Specification Phase (`bsr spec`)
- **Priority**: P0 - Critical
- **Status**: Implemented
- Generates specifications from BSR idea using SpecKit adapter
- Produces: constitution, feature specs, API specs, data models, UI specs
- Supports Markdown and YAML output formats
- Includes validation with completeness scoring (0-100)
- **Acceptance**: Specs generated covering all features, validation score > 60

### 2.5 Task Breakdown (`bsr tasks`)
- **Priority**: P0 - Critical
- **Status**: Implemented
- Creates `tasks/breakdown.json` with hierarchical task structure
- Each task has: id, title, description, status, priority, effort, dependencies
- Supports filtering by `--priority` and `--effort`
- Supports `--estimate` for effort estimation and `--github` for issue format
- **Acceptance**: Tasks generated with correct dependency graph, no circular deps

### 2.6 Ralph Execution Loop (`bsr run`)
- **Priority**: P0 - Critical
- **Status**: Implemented
- Iterates through pending tasks and executes with LLM guidance
- Tracks loop state in `.bsr/loop-state.json`
- Supports `--task <id>` for single task, `--limit <num>` for batch size
- Supports `--dry-run` for preview without execution
- **Acceptance**: Tasks executed in dependency order, state persisted between runs

### 2.7 Web Dashboard (`bsr dashboard`)
- **Priority**: P1 - High
- **Status**: Implemented
- Fastify server with WebSocket real-time updates
- REST API: CRUD operations on tasks + project info + logs
- Real-time task status broadcasting to all connected clients
- Default port 3000, supports `--port` and `--open` (auto-launch browser)
- **Acceptance**: Dashboard loads, tasks displayed, real-time updates work

### 2.8 Configuration Management (`bsr config`)
- **Priority**: P1 - High
- **Status**: Implemented
- View/modify BSR configuration with dot notation
- `--list` shows all config, `--get <key>`, `--set <key=value>`
- Reads/writes `.bsr/config.yaml`
- **Acceptance**: Config values readable and writable, YAML round-trip safe

### 2.9 Project Status (`bsr status`)
- **Priority**: P1 - High
- **Status**: Implemented
- Displays current phase, LLM target, task progress
- Reads from `progress.txt` and config
- Supports `--json` for machine-readable output
- **Acceptance**: Accurate phase and progress display

### 2.10 Export & Reporting (`bsr export`)
- **Priority**: P1 - High
- **Status**: Implemented
- Generates Markdown, HTML, and JSON reports
- Aggregates: config, idea, tasks, specs, discovery data
- HTML reports include Tailwind CSS styling
- Supports `--full`, `--tasks-only`, `--specs-only` scopes
- Output to `exports/` directory with timestamped filenames
- **Acceptance**: Reports generated in all formats, data complete and formatted

### 2.11 GitHub Sync (`bsr sync`)
- **Priority**: P1 - High
- **Status**: Implemented
- Bidirectional sync with GitHub Issues
- Export: Creates GitHub Issues with labels (priority, type, feature)
- Import: Converts GitHub Issues back to BSR tasks
- Generates executable bash script for bulk operations
- Maintains `.bsr/sync-state.json` for tracking
- **Acceptance**: Issues created matching BSR tasks, labels correct, sync state tracked

### 2.12 MCP Server for Claude Desktop
- **Priority**: P2 - Medium
- **Status**: Implemented (basic)
- Exposes BSR tools as MCP server for Claude Desktop integration
- **Acceptance**: Claude Desktop can invoke BSR commands via MCP

### 2.13 Multi-LLM Support
- **Priority**: P2 - Medium
- **Status**: Partial (llm-client package exists with Claude/OpenAI adapters)
- LLM target configurable: claude, cursor, copilot, vscode, generic
- Adapter pattern for provider-specific implementations
- **Acceptance**: At least Claude and OpenAI providers working

## 3. Non-Functional Requirements

- **Performance**: CLI commands complete in < 5s (excluding LLM calls)
- **Portability**: Works on macOS, Linux, Windows (Node.js 18+)
- **Extensibility**: Adapter pattern for new LLM providers and planning tools
- **Reliability**: Graceful error handling, state recovery after interrupted runs
- **Security**: No secrets stored in config files, input validation on all user data

## 4. Technical Constraints

- TypeScript strict mode
- pnpm monorepo with Turborepo
- ESM modules
- Node.js >= 18
- Vitest for testing
- ESLint 9 flat config + Prettier

## 5. Current Project State

| Feature | Status | Package |
|---------|--------|---------|
| CLI (11 commands) | Implemented | `packages/cli` |
| BMAD Adapter | Implemented | `packages/adapters/bmad` |
| SpecKit Adapter | Implemented | `packages/adapters/speckit` |
| Dashboard | Implemented | `packages/dashboard` |
| Shared Types | Implemented | `packages/shared` |
| Core Logic | Placeholder | `packages/core` |
| Multi-LLM Client | Partial | `packages/llm-client` (separate) |

---
*BSR Method - Product Requirements Document*
