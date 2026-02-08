# Feature: Ralph Execution Loop

**Package**: `packages/cli` (command: `bsr run`)
**Status**: Implemented
**Priority**: P0

---

## Overview

The Ralph Loop is the execution engine of BSR Method. It iterates through pending tasks from `tasks/breakdown.json`, generates LLM-appropriate prompts for each task, tracks execution state, and persists progress between runs. Named after the "do the work" phase of the BSR pipeline.

## User Story

As a developer with a task breakdown, I want to execute tasks automatically with LLM guidance, so that I can implement features systematically following my plan.

## Functional Requirements

### Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| Task list | `tasks/breakdown.json` | Yes | Task breakdown with dependencies |
| Loop state | `.bsr/loop-state.json` | No | Previous execution state (resume) |
| `--task` | string | No | Execute specific task by ID |
| `--limit` | number | No | Max number of tasks to process |
| `--dry-run` | boolean | No | Preview task selection without executing |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| Updated tasks | JSON | Task statuses updated in `breakdown.json` |
| Loop state | JSON | Execution state in `.bsr/loop-state.json` |
| Console output | text | Progress and results per task |

### Execution Rules
1. Tasks are processed in dependency order (topological sort)
2. A task is only eligible if all its dependencies are `done`
3. `blocked` tasks are skipped with a warning
4. Loop state tracks: current task, completed tasks, errors, timestamp
5. Interrupted runs can resume from loop state
6. `--dry-run` shows which tasks would be selected without executing

### Loop State Schema
```typescript
interface LoopState {
  currentTask: string | null;
  completedTasks: string[];
  failedTasks: string[];
  startedAt: string;
  lastUpdatedAt: string;
  iteration: number;
}
```

## Technical Design

### Implementation
The `run` command in `packages/cli/src/commands/run.ts`:
1. Loads `tasks/breakdown.json`
2. Loads or creates `.bsr/loop-state.json`
3. Filters eligible tasks (pending, dependencies met)
4. For each task: generates prompt, displays task info, updates state
5. Persists updated task statuses and loop state

### Dependencies
- **Internal**: `@bsr-method/shared` (types, file utilities)
- **External**: `js-yaml`, `chalk`

## Error Handling

| Error | Condition | Behavior |
|-------|-----------|----------|
| No tasks file | `breakdown.json` missing | Error message, exit |
| Circular dependency | Task depends on itself (transitively) | Error with cycle details |
| All tasks blocked | No eligible tasks | Warning, exit cleanly |
| Task execution failure | LLM or runtime error | Mark task as failed, continue |

## Testing

| Test Case | Description |
|-----------|-------------|
| Execute single task | `--task TASK-001` processes only that task |
| Respect dependencies | Task with unmet deps is skipped |
| Dry run | `--dry-run` lists tasks without modifying state |
| Resume from state | Loop state correctly resumes after interruption |
| Limit batch size | `--limit 3` processes at most 3 tasks |

---
*BSR Method - Ralph Execution Loop Feature Specification*
