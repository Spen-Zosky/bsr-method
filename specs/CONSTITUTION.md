# BSR Method - Project Constitution

> End-to-end AI-driven development framework: BMAD (planning) + SpecKit (specs) + Ralph (execution)

## Purpose

This document defines the governing principles and standards for BSR Method.
All packages, adapters, and CLI commands must adhere to these principles.

## Core Principles

### 1. Pipeline-First Design
- Every feature fits into the pipeline: init -> discover -> plan -> spec -> tasks -> run
- Data flows through well-defined formats (YAML config, JSON tasks, Markdown specs)
- Each phase produces artifacts consumable by the next phase
- No phase should require manual intervention to pass data forward

### 2. Adapter Extensibility
- External tools (BMAD, SpecKit, future integrations) are wrapped in adapters
- Adapters follow the pattern: Parse -> Internal Model -> Transform -> BSR Format
- Adding a new planning tool or spec generator means adding a new adapter package
- Core types in `packages/shared` are the contract between adapters

### 3. Brownfield-Aware
- The framework works equally well with new and existing projects
- `bsr discover` analyzes existing codebases with confidence scoring
- Discovered state feeds into the same pipeline as greenfield projects
- Never assume a clean slate

### 4. LLM-Agnostic
- LLM target is configurable (claude, cursor, copilot, vscode, generic)
- No hard dependency on any specific LLM provider
- Ralph execution loop generates LLM-appropriate prompts based on target
- API keys via environment variables, never in config files

### 5. Offline-Capable
- All spec generation, task breakdown, and validation work without network
- Only `bsr run` (Ralph loop) and `bsr sync` require external services
- Dashboard works fully offline against local `tasks/breakdown.json`

## Technical Standards

### Monorepo Structure
- Each package is independent with its own `package.json`, `tsup.config.ts`, and `tsconfig.json`
- Shared types live in `packages/shared`, never duplicated
- Adapters live under `packages/adapters/<name>`
- CLI commands are individual modules under `packages/cli/src/commands/`

### Naming Conventions
- Files: kebab-case (`bmad-adapter.ts`)
- Interfaces/Types: PascalCase (`BSRConfig`, `BMADProject`)
- Functions: camelCase (`parseBMADDirectory`, `generateSpec`)
- Constants: SCREAMING_SNAKE_CASE (`MAX_RETRIES`)
- CLI commands: lowercase single word (`init`, `discover`, `plan`)

### TypeScript Rules
- Strict mode enabled
- Prefer interfaces over type aliases for object shapes
- Unused variables prefixed with `_` (enforced by ESLint)
- `@typescript-eslint/no-explicit-any: warn` - minimize `any` usage
- ESM module system (`"type": "module"` in package.json)

### Error Handling
- CLI commands catch errors and display user-friendly messages
- Adapters return `Result` types with success/errors/warnings arrays
- Validators return structured error objects, not thrown exceptions
- File operations use async/await with proper error propagation

### Testing
- Vitest for all packages
- Unit tests for parsers, transformers, validators, generators
- Each package has `--passWithNoTests` to avoid failures during scaffold phase
- Test files colocated with source or in `__tests__/` directories

### Configuration
- Project config: `.bsr/config.yaml` (YAML for human readability)
- Task data: `tasks/breakdown.json` (JSON for machine processing)
- Specs: Markdown files in `specs/` (human-readable, version-controllable)
- Runtime state: `.bsr/loop-state.json`, `.bsr/sync-state.json`

## Definition of Done

A feature is complete when:
- [ ] Implementation matches the specification
- [ ] Unit tests written and passing
- [ ] TypeScript compiles without errors
- [ ] ESLint passes without errors
- [ ] CLI help text is accurate
- [ ] Feature works in both greenfield and brownfield contexts (where applicable)

## Change Process

1. Create or update specification in `specs/features/`
2. Update task breakdown with `bsr tasks`
3. Implement feature
4. Write tests
5. Verify full pipeline still works (`init -> discover -> plan -> spec -> tasks`)
6. Commit with descriptive message

---
*BSR Method - Project Constitution*
