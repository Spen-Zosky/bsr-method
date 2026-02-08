# Feature: Brownfield Discovery

**Package**: `packages/cli` (command: `bsr discover`)
**Status**: Implemented
**Priority**: P0

---

## Overview

The discovery phase analyzes existing codebases to extract project state, technology stack, architecture patterns, and gaps/debt. This enables BSR Method to work with brownfield projects by deriving an idea from the existing codebase rather than starting from scratch.

## User Story

As a developer with an existing codebase, I want to analyze it automatically, so that BSR can generate a project context and feed it into the planning pipeline.

## Functional Requirements

### Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| Project root | string (path) | Yes | Working directory (auto-detected) |
| `--deep` | boolean | No | Thorough analysis with more scanners |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `discovery/project-context.yaml` | YAML | Complete project analysis |

### Output Schema (`DiscoveredProjectState`)
```yaml
metadata:
  name: "project-name"
  path: "/path/to/project"
  analyzedAt: "2026-02-08T10:00:00Z"

derivedIdea:
  name: "project-name"
  description: "Derived from codebase analysis"
  features: [...]

technologyStack:
  languages: ["TypeScript", "JavaScript"]
  frameworks: ["Fastify", "Commander.js"]
  buildTools: ["tsup", "turborepo"]
  packageManager: "pnpm"

architecture:
  type: "monorepo"
  packages: [...]
  patterns: ["adapter", "pipeline"]

gapsAndDebt:
  missingTests: [...]
  todoComments: [...]
  configIssues: [...]
```

### Discovery Scanners
1. **Package scanner** - Reads `package.json` for dependencies, scripts, metadata
2. **TypeScript scanner** - Analyzes `tsconfig.json`, source structure
3. **Git scanner** - Recent commits, contributors, branch info
4. **Structure scanner** - Directory layout, file patterns
5. **Deep scanner** (with `--deep`) - Source code analysis, TODO/FIXME detection, test coverage estimation

### Business Rules
1. Discovery only works for brownfield projects (`project.type === 'brownfield'`)
2. Confidence scores (0-1) are attached to derived information
3. Existing `discovery/project-context.yaml` is overwritten on re-run
4. Scanner results are merged into a unified `DiscoveredProjectState`
5. Scanners that fail are skipped with warnings (partial results OK)

## Technical Design

### Implementation
The `discover` command in `packages/cli/src/commands/discover.ts`:
1. Reads `.bsr/config.yaml` to verify brownfield project
2. Runs enabled scanners against project root
3. Merges scanner results with confidence scoring
4. Writes `discovery/project-context.yaml`

### Dependencies
- **Internal**: `@bsr-method/shared` (`DiscoveredProjectState`, `fileExists`, `ensureDir`)
- **External**: `js-yaml`, `chalk`, `glob`

## Error Handling

| Error | Condition | Behavior |
|-------|-----------|----------|
| Not brownfield | Project type is greenfield | Warning message, exit |
| No config | `.bsr/config.yaml` missing | Error: run `bsr init` first |
| Scanner failure | Individual scanner error | Warning, continue with other scanners |
| Empty project | No recognizable files | Low confidence result with warnings |

## Testing

| Test Case | Description |
|-----------|-------------|
| Discover Node.js project | Detects package.json, TypeScript, dependencies |
| Detect monorepo | Identifies pnpm workspaces, turborepo |
| Deep scan | Finds TODOs, missing tests |
| Handle missing config | Error message when no `.bsr/config.yaml` |
| Partial scanner failure | Continues with remaining scanners |

---
*BSR Method - Brownfield Discovery Feature Specification*
