# Data Model Specification

**Project**: BSR Method
**Date**: 2026-02-08

---

## Overview

BSR Method uses TypeScript interfaces as data contracts between packages. Types are defined in `packages/shared` and consumed by all other packages. Runtime data is stored in YAML (config), JSON (tasks, state), and Markdown (specs).

## Core Types (`packages/shared`)

### LLMTarget
```typescript
type LLMTarget = 'claude' | 'cursor' | 'copilot' | 'vscode' | 'generic';
```

### ProjectType
```typescript
type ProjectType = 'greenfield' | 'brownfield';
```

### BSRConfig
Main project configuration stored in `.bsr/config.yaml`.
```typescript
interface BSRConfig {
  version: string;
  project: {
    name: string;
    type: ProjectType;
    created: string;          // ISO date string
  };
  llm: {
    target: LLMTarget;
  };
  workflow: {
    auto_commit: boolean;
    commit_prefix?: string;
    progress_file: string;    // default: "progress.txt"
  };
  discovery?: {
    enabled: boolean;
    scanners: Record<string, boolean>;
    exclude: string[];        // glob patterns to exclude
  };
  dashboard?: {
    port: number;             // default: 3000
    auto_open: boolean;
  };
  export?: {
    formats: string[];        // ['md', 'html', 'json']
    output_dir: string;       // default: "exports"
  };
  memory?: {
    enabled: boolean;
    database: string;
  };
}
```

### DiscoveredProjectState
Output of `bsr discover`, stored in `discovery/project-context.yaml`.
```typescript
interface DiscoveredProjectState {
  metadata: {
    name: string;
    path: string;
    analyzedAt: string;
  };
  derivedIdea: object;
  technologyStack: object;
  architecture: object;
  gapsAndDebt: object;
}
```

## BMAD Adapter Types (`packages/adapters/bmad`)

### BMADProject
Top-level structure parsed from a BMAD directory.
```typescript
interface BMADProject {
  name: string;
  description?: string;
  vision?: string;
  features: BMADFeature[];
  personas?: BMADPersona[];
  epics?: BMADEpic[];
  stories?: BMADUserStory[];
}
```

### BMADFeature
```typescript
interface BMADFeature {
  id: string;
  name: string;
  description: string;
  priority?: string;        // P0-P3 or HIGH/MEDIUM/LOW
  stories?: string[];       // linked story IDs
}
```

### BMADPersona
```typescript
interface BMADPersona {
  name: string;
  role: string;
  needs: string[];
  behaviors?: string[];
}
```

### BMADEpic / BMADUserStory
```typescript
interface BMADEpic {
  id: string;
  title: string;
  description: string;
  stories?: string[];
}

interface BMADUserStory {
  id: string;
  asA: string;             // also handles as_a
  iWant: string;           // also handles i_want
  soThat: string;          // also handles so_that
  acceptanceCriteria?: string[];
}
```

### ParseResult / TransformResult
```typescript
interface ParseResult {
  success: boolean;
  project?: BMADProject;
  errors: string[];
  warnings: string[];
}

interface TransformResult {
  success: boolean;
  idea?: BSRIdea;
  errors: string[];
  warnings: string[];
}
```

## SpecKit Adapter Types (`packages/adapters/speckit`)

### ValidationResult
```typescript
interface ValidationResult {
  valid: boolean;
  errors: Array<{ field: string; message: string }>;
  warnings: Array<{ field: string; message: string }>;
  completenessScore: number;  // 0-100
}
```

### GeneratorOptions
```typescript
interface GeneratorOptions {
  format: 'markdown' | 'yaml';
  includeTaskBreakdown?: boolean;
  includeAcceptanceCriteria?: boolean;
}
```

## Dashboard Types (`packages/dashboard`)

### Task
The primary data model for the web dashboard, stored in `tasks/breakdown.json`.
```typescript
interface Task {
  id: string;                // e.g., "TASK-001"
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'blocked' | 'done';
  priority: 'high' | 'medium' | 'low';
  effort: number;            // story points or hours
  dependencies: string[];    // array of task IDs
  assignee?: string;
  createdAt: string;         // ISO date string
  updatedAt: string;         // ISO date string
}
```

### DashboardConfig
```typescript
interface DashboardConfig {
  port: number;              // default: 3000
  host: string;              // default: "127.0.0.1"
  projectRoot: string;       // path to project root
}
```

### WebSocket Message Types
```typescript
type WSClientMessage =
  | { type: 'update-task'; taskId: string; data: Partial<Task> }
  | { type: 'refresh' };

type WSServerMessage =
  | { type: 'task-updated'; task: Task }
  | { type: 'task-created'; task: Task }
  | { type: 'task-deleted'; taskId: string }
  | { type: 'tasks-refreshed'; tasks: Task[] };
```

## File Format Summary

| File | Format | Location | Purpose |
|------|--------|----------|---------|
| `config.yaml` | YAML | `.bsr/` | Project configuration |
| `progress.txt` | Plain text | `.bsr/` | Current phase tracking |
| `loop-state.json` | JSON | `.bsr/` | Ralph loop execution state |
| `sync-state.json` | JSON | `.bsr/` | GitHub sync tracking |
| `idea.yaml` | YAML | `docs/` | BSR idea from planning phase |
| `breakdown.json` | JSON | `tasks/` | Task list with dependencies |
| `project-context.yaml` | YAML | `discovery/` | Brownfield analysis results |
| `*.md` | Markdown | `specs/` | Generated specifications |
| `*.md/.html/.json` | Various | `exports/` | Generated reports |

---
*BSR Method - Data Model Specification*
