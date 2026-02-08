# Feature: Task Breakdown

**Package**: `packages/cli` (command: `bsr tasks`)
**Status**: Implemented
**Priority**: P0

---

## Overview

The task breakdown feature generates a structured task list from a BSR idea, with priorities, effort estimates, and dependency tracking. Tasks are stored in JSON format for machine consumption and Markdown for human review. An optional GitHub Issues format is available for project management integration.

## User Story

As a developer with a BSR idea, I want to automatically generate a prioritized task list with dependencies, so that I can plan my implementation work systematically.

## Functional Requirements

### Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `docs/idea.yaml` | YAML | Yes | BSR idea with features |
| `--priority` | string | No | Filter by priority level |
| `--effort` | string | No | Filter by effort range |
| `--estimate` | boolean | No | Include effort estimates (hours) |
| `--github` | boolean | No | Generate GitHub Issues markdown |
| `--dry-run` | boolean | No | Preview without writing files |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `tasks/breakdown.json` | JSON | Machine-readable task list |
| `tasks/breakdown.md` | Markdown | Human-readable task overview |
| `tasks/github-issues.md` | Markdown | GitHub issue templates (with `--github`) |

### Task Schema
```typescript
interface Task {
  id: string;               // "TASK-001"
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'blocked' | 'done';
  priority: 'high' | 'medium' | 'low';
  effort: number;           // hours estimate
  dependencies: string[];   // task IDs
  assignee?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Task Generation Rules
1. **Setup tasks** (TASK-001 to TASK-004): Project init, ESLint, testing, CI/CD
2. **Feature tasks**: For each feature, generate: types, core logic, validation, unit tests
3. **Integration tasks**: Cross-feature integration tests
4. **Documentation tasks**: API docs, README, contributing guide
5. Dependencies follow the pattern: types -> core -> validation/tests
6. Priority derived from feature priority in idea.yaml
7. Effort estimates based on task type (types: 1h, core: 4h, validation: 2h, tests: 2h)

### GitHub Issue Format
When `--github` is used, generates `tasks/github-issues.md` with:
- Issue title from task title
- Labels from task priority and type
- Description with acceptance criteria
- Dependencies noted as "Blocked by: TASK-XXX"

## Technical Design

### Implementation
The `tasks` command in `packages/cli/src/commands/tasks.ts`:
1. Loads `docs/idea.yaml`
2. Generates task list following the rules above
3. Writes `tasks/breakdown.json` and `tasks/breakdown.md`
4. Optionally writes `tasks/github-issues.md`

### Dependencies
- **Internal**: `@bsr-method/shared` (types, file utilities)
- **External**: `js-yaml`, `chalk`

## Error Handling

| Error | Condition | Behavior |
|-------|-----------|----------|
| No idea file | `docs/idea.yaml` missing | Error: run `bsr plan` first |
| Invalid idea | YAML parse error | Error with details |
| No features | Idea has empty features list | Warning, generate only setup tasks |

## Testing

| Test Case | Description |
|-----------|-------------|
| Generate from valid idea | Correct number of tasks, proper IDs |
| Dependency graph | No circular dependencies, correct ordering |
| Priority filtering | `--priority high` returns only high tasks |
| Effort estimates | `--estimate` adds hour values |
| GitHub format | `--github` produces valid issue markdown |
| Dry run | `--dry-run` outputs to console only |

---
*BSR Method - Task Breakdown Feature Specification*
