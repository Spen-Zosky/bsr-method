# BSR Method - Task Breakdown

Updated: 2026-02-08

## Progress

- **Total**: 39 tasks
- **Done**: 24 (62%)
- **To Do**: 15 (38%)

---

## Done (24)

### Setup
- [x] **TASK-001**: Project setup - monorepo structure [2h]
- [x] **TASK-002**: Configure ESLint and Prettier [1h]
- [x] **TASK-003**: Set up Vitest testing framework [1h]

### Shared Types
- [x] **TASK-005**: Shared types package (BSRConfig, LLMTarget, etc.) [1h]

### CLI Commands (11/11)
- [x] **TASK-006**: CLI framework with Commander.js [2h]
- [x] **TASK-007**: CLI: init command [2h]
- [x] **TASK-008**: CLI: discover command [4h]
- [x] **TASK-011**: CLI: plan command [3h]
- [x] **TASK-014**: CLI: spec command [2h]
- [x] **TASK-015**: CLI: tasks command [3h]
- [x] **TASK-016**: CLI: run command (Ralph Loop) [4h]
- [x] **TASK-019**: CLI: dashboard command [1h]
- [x] **TASK-020**: CLI: config command [2h]
- [x] **TASK-021**: CLI: status command [1h]
- [x] **TASK-022**: CLI: export command [3h]
- [x] **TASK-023**: CLI: sync command [4h]

### BMAD Adapter
- [x] **TASK-009**: BMAD adapter - parser [4h]
- [x] **TASK-010**: BMAD adapter - transformer [4h]

### SpecKit Adapter
- [x] **TASK-012**: SpecKit adapter - generator [4h]
- [x] **TASK-013**: SpecKit adapter - validator [3h]

### Dashboard
- [x] **TASK-017**: Dashboard - Fastify server + REST API [4h]
- [x] **TASK-018**: Dashboard - WebSocket real-time updates [3h]

### MCP
- [x] **TASK-024**: MCP server for Claude Desktop [4h]

---

## To Do - High Priority (7)

### Quality Improvements
- [ ] **TASK-025**: Improve SpecKit output quality [6h] (depends: TASK-013)
  - SpecKit generates generic specs with TBD inputs and meaningless interfaces
- [ ] **TASK-026**: Improve BMAD plan output quality [4h] (depends: TASK-010)
  - bsr plan generates generic PRD/architecture with [object Object] bugs
- [ ] **TASK-027**: Improve task breakdown output quality [4h] (depends: TASK-015)
  - bsr tasks generates repetitive template tasks per feature

### Unit Tests
- [ ] **TASK-031**: Unit tests - BMAD adapter [3h] (depends: TASK-010)
  - Parser: field variations, markdown, missing files. Transformer: priorities, architecture inference
- [ ] **TASK-032**: Unit tests - SpecKit adapter [3h] (depends: TASK-013)
  - Generator: markdown/yaml output. Validator: scoring, required fields, strict mode
- [ ] **TASK-033**: Unit tests - Dashboard API [3h] (depends: TASK-018)
  - REST endpoints CRUD, WebSocket broadcasting, error handling
- [ ] **TASK-034**: Unit tests - CLI commands [4h] (depends: TASK-023)
  - init, config, status, export: file creation, option handling, error cases

## To Do - Medium Priority (6)

### Features
- [ ] **TASK-028**: Complete Multi-LLM adapters [6h] (depends: TASK-005)
  - Claude and OpenAI adapters with streaming, prompt templates per target
- [ ] **TASK-029**: Dashboard frontend UI [8h] (depends: TASK-018)
  - Kanban board, task cards, priority badges, drag-and-drop, WebSocket updates
- [ ] **TASK-030**: Core package implementation [6h] (depends: TASK-005)
  - Move shared business logic from CLI into packages/core

### Infrastructure
- [ ] **TASK-004**: Configure CI/CD (GitHub Actions) [2h] (depends: TASK-003)
- [ ] **TASK-035**: Integration tests - full pipeline [6h] (depends: TASK-031..034)
  - Test full flow: init -> discover -> plan -> spec -> tasks -> run
- [ ] **TASK-036**: CI/CD with GitHub Actions [3h] (depends: TASK-004)

## To Do - Low Priority (2)

- [ ] **TASK-037**: npm publish setup [2h] (depends: TASK-036)
- [ ] **TASK-038**: README and documentation [3h]
- [ ] **TASK-039**: Contributing guide [1h] (depends: TASK-038)

---

## Suggested Next Steps

1. **Quality first**: TASK-025, 026, 027 - fix the output quality of bsr plan/spec/tasks
2. **Tests**: TASK-031..034 - unit tests for all implemented packages
3. **Dashboard UI**: TASK-029 - the backend API is ready, needs frontend
4. **CI/CD**: TASK-004, 036 - automate build/test/lint
5. **Multi-LLM**: TASK-028 - complete the adapter implementations

---
*BSR Method - Task Breakdown*
