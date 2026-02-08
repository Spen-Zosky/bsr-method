# BSR Method - Specifications

> End-to-end AI-driven development framework: BMAD (planning) + SpecKit (specs) + Ralph (execution)

## Structure

```
specs/
├── CONSTITUTION.md      # Project principles and technical standards
├── README.md            # This file
├── features/            # Feature specifications (per-feature)
│   ├── cli-with-11-commands-covering-the-full-development-lifecycle.md
│   ├── bmad-planning-phase-idea-prd-architecture.md
│   ├── speckit-specification-phase-constitution-feature-specs-api-specs.md
│   ├── ralph-execution-loop-llm-powered-task-implementation.md
│   ├── brownfield-discovery-analyze-existing-codebases.md
│   ├── task-breakdown-with-dependencies-and-priority.md
│   ├── web-dashboard-for-task-visualization.md
│   ├── mcp-server-for-claude-desktop-integration.md
│   ├── multi-llm-support-claude-openai.md
│   └── export-to-markdown-html-pdf.md
├── api/
│   └── endpoints.md     # Dashboard REST API & WebSocket specification
├── data/
│   └── models.md        # TypeScript interfaces and data formats
└── ui/
    └── components.md    # Dashboard UI specification
```

## Key Documents

| Document | Description |
|----------|-------------|
| [CONSTITUTION.md](CONSTITUTION.md) | Core principles: pipeline-first, adapter extensibility, LLM-agnostic, offline-capable |
| [api/endpoints.md](api/endpoints.md) | Dashboard REST API (tasks CRUD, project info, logs) + WebSocket protocol |
| [data/models.md](data/models.md) | BSRConfig, Task, BMADProject, ValidationResult, and all TypeScript interfaces |
| [ui/components.md](ui/components.md) | Dashboard kanban board, task cards, real-time updates |

## Features

| Feature | Spec | Status |
|---------|------|--------|
| CLI (11 commands) | [cli-with-11-commands](features/cli-with-11-commands-covering-the-full-development-lifecycle.md) | Implemented |
| BMAD Planning Phase | [bmad-planning-phase](features/bmad-planning-phase-idea-prd-architecture.md) | Implemented |
| SpecKit Specification Phase | [speckit-specification-phase](features/speckit-specification-phase-constitution-feature-specs-api-specs.md) | Implemented |
| Ralph Execution Loop | [ralph-execution-loop](features/ralph-execution-loop-llm-powered-task-implementation.md) | Implemented |
| Brownfield Discovery | [brownfield-discovery](features/brownfield-discovery-analyze-existing-codebases.md) | Implemented |
| Task Breakdown | [task-breakdown](features/task-breakdown-with-dependencies-and-priority.md) | Implemented |
| Web Dashboard | [web-dashboard](features/web-dashboard-for-task-visualization.md) | Implemented |
| MCP Server | [mcp-server](features/mcp-server-for-claude-desktop-integration.md) | Implemented (basic) |
| Multi-LLM Support | [multi-llm](features/multi-llm-support-claude-openai.md) | Partial |
| Export (MD/HTML/JSON) | [export](features/export-to-markdown-html-pdf.md) | Implemented |

## Related Documents

- [docs/prd.md](../docs/prd.md) - Product Requirements Document
- [docs/architecture.md](../docs/architecture.md) - Technical Architecture
- [tasks/breakdown.md](../tasks/breakdown.md) - Task Breakdown

---
*BSR Method - Specifications*
