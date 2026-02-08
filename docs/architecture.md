# Technical Architecture

**Project**: BSR Method
**Date**: 2026-02-08

## 1. Overview

BSR Method is a TypeScript monorepo providing an end-to-end AI-driven development pipeline. The system is organized as a set of independent packages coordinated by a CLI, following a pipeline architecture: Input (idea/codebase) -> Planning (BMAD) -> Specification (SpecKit) -> Execution (Ralph).

## 2. Technology Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (strict mode) |
| Runtime | Node.js >= 18 |
| Package Manager | pnpm (workspaces) |
| Build Orchestrator | Turborepo |
| Build Tool | tsup (per package) |
| Test Framework | Vitest |
| Linting | ESLint 9 (flat config) + Prettier |
| CLI Framework | Commander.js |
| Web Server | Fastify + @fastify/websocket |
| Config Format | YAML (js-yaml) |
| Module System | ESM |

## 3. Monorepo Structure

```
bsr-method/
├── packages/
│   ├── cli/                    # CLI entry point (bsr command)
│   │   └── src/
│   │       ├── index.ts        # Commander program setup
│   │       └── commands/       # 11 command modules
│   │           ├── init.ts
│   │           ├── discover.ts
│   │           ├── plan.ts
│   │           ├── spec.ts
│   │           ├── tasks.ts
│   │           ├── run.ts
│   │           ├── dashboard.ts
│   │           ├── config.ts
│   │           ├── status.ts
│   │           ├── export.ts
│   │           └── sync.ts
│   │
│   ├── core/                   # Core business logic (placeholder)
│   │   └── src/
│   │       └── index.ts
│   │
│   ├── shared/                 # Shared types and utilities
│   │   └── src/
│   │       ├── index.ts        # Type exports
│   │       └── utils.ts        # fileExists, ensureDir
│   │
│   ├── dashboard/              # Web dashboard server
│   │   └── src/
│   │       ├── index.ts        # createServer, startServer
│   │       └── server.ts       # Fastify routes + WebSocket
│   │
│   └── adapters/
│       ├── bmad/               # BMAD planning adapter
│       │   └── src/
│       │       ├── index.ts    # Public API: bmadToBSR, convertBMADtoBSR
│       │       ├── parser.ts   # YAML/Markdown directory parser
│       │       ├── transformer.ts  # BMAD -> BSR idea transformer
│       │       └── types.ts    # BMADProject, BMADFeature, etc.
│       │
│       └── speckit/            # SpecKit specification adapter
│           └── src/
│               ├── index.ts    # Public API: ideaToSpec, checkIdea
│               ├── generator.ts    # Spec generator (MD/YAML)
│               └── validator.ts    # Idea validator with scoring
│
├── .bsr/                       # Runtime project state
│   ├── config.yaml
│   ├── progress.txt
│   ├── loop-state.json
│   └── sync-state.json
│
├── docs/                       # Generated planning docs
│   ├── idea.yaml
│   ├── prd.md
│   └── architecture.md
│
├── specs/                      # Generated specifications
│   ├── CONSTITUTION.md
│   ├── features/
│   ├── api/
│   ├── data/
│   └── ui/
│
├── tasks/                      # Task breakdown
│   ├── breakdown.json
│   └── breakdown.md
│
└── exports/                    # Generated reports
```

## 4. Package Dependency Graph

```
cli
├── shared (types)
├── adapters/bmad (plan command)
├── adapters/speckit (spec command)
└── dashboard (dashboard command)

dashboard
└── shared (types)

adapters/bmad
└── shared (types)

adapters/speckit
└── shared (types)

core
└── shared (types)
```

## 5. Data Flow

### 5.1 Greenfield Pipeline

```
bsr init          bsr plan          bsr spec          bsr tasks         bsr run
   │                 │                 │                 │                │
   ▼                 ▼                 ▼                 ▼                ▼
.bsr/config.yaml → docs/idea.yaml → specs/**/*.md → tasks/breakdown.json → LLM execution
                                                                          │
                                                                          ▼
                                                                   .bsr/loop-state.json
```

### 5.2 Brownfield Pipeline

```
bsr init --type brownfield → bsr discover → (same as greenfield from plan onward)
                                  │
                                  ▼
                        discovery/project-context.yaml
```

### 5.3 Dashboard Data Flow

```
tasks/breakdown.json ← → Fastify REST API ← → WebSocket ← → Browser Client
                              │
                              ├── GET/POST/PATCH/DELETE /api/tasks
                              ├── GET /api/project
                              ├── GET /api/logs
                              └── WS /ws (real-time broadcasts)
```

## 6. Key Interfaces

### BSRConfig (project configuration)
```typescript
interface BSRConfig {
  version: string;
  project: { name: string; type: 'greenfield' | 'brownfield'; created: string };
  llm: { target: LLMTarget };
  workflow: { auto_commit: boolean; commit_prefix?: string; progress_file: string };
  discovery?: { enabled: boolean; scanners: Record<string, boolean>; exclude: string[] };
  dashboard?: { port: number; auto_open: boolean };
  export?: { formats: string[]; output_dir: string };
  memory?: { enabled: boolean; database: string };
}
```

### Task (dashboard task model)
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'blocked' | 'done';
  priority: 'high' | 'medium' | 'low';
  effort: number;
  dependencies: string[];
  assignee?: string;
  createdAt: string;
  updatedAt: string;
}
```

### DiscoveredProjectState (brownfield analysis)
```typescript
interface DiscoveredProjectState {
  metadata: { name: string; path: string; analyzedAt: string };
  derivedIdea: object;
  technologyStack: object;
  architecture: object;
  gapsAndDebt: object;
}
```

## 7. Adapter Pattern

Each external integration (BMAD, SpecKit) follows the adapter pattern:

```
External Format → Parser → Internal Model → Transformer → BSR Format
```

**BMAD Adapter**: Parses BMAD YAML/Markdown directories, handles field name variations (camelCase/snake_case), infers architecture from content, normalizes priorities to P0-P3.

**SpecKit Adapter**: Generates specs from BSR idea with validation. Completeness scoring (0-100) based on required fields, optional sections, and content quality indicators.

## 8. Build & Development

```bash
pnpm install          # Install all dependencies
pnpm run build        # Build all packages (turborepo)
pnpm run test         # Run all tests (vitest)
pnpm run lint         # Lint all packages (eslint 9)
pnpm run typecheck    # TypeScript type checking
```

Each package builds independently with tsup producing ESM output.

## 9. Security Considerations

- No API keys or secrets stored in `.bsr/config.yaml`
- LLM API keys expected via environment variables
- Input validation on all CLI arguments (Commander.js)
- Dashboard binds to localhost (127.0.0.1) by default
- GitHub sync generates scripts for review before execution

---
*BSR Method - Technical Architecture*
