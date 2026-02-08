# GitHub Issues for BSR Method

Only remaining (todo) tasks are listed. Done tasks have been omitted.

---

## TASK-004: Configure CI/CD (GitHub Actions)

**Labels**: type:infra, priority:medium

### Description
Set up GitHub Actions for build, test, lint, typecheck on push/PR

### Acceptance Criteria
- [ ] Workflow runs on push to main and PR
- [ ] Build, test, lint, typecheck all pass
- [ ] Turborepo caching configured

### Dependencies
Blocked by: TASK-003

---

## TASK-025: Improve SpecKit output quality

**Labels**: type:improvement, priority:high

### Description
SpecKit generates overly generic specs (TBD inputs, meaningless interfaces like `CliWith11CommandsCoveringTheFullDevelopmentLifecycleInput`). Improve templates to produce project-specific content with real inputs/outputs, meaningful interfaces, and accurate technical design.

### Acceptance Criteria
- [ ] Generated specs have real inputs/outputs (not TBD)
- [ ] Interfaces use meaningful names based on actual project types
- [ ] User stories are specific, not "I want to [feature name]"
- [ ] Test cases are specific to the feature

### Dependencies
Blocked by: TASK-013

---

## TASK-026: Improve BMAD plan output quality

**Labels**: type:improvement, priority:high

### Description
`bsr plan` generates generic PRD/architecture with placeholders (`[object Object]` in tech stack, "Feature works as expected" for all acceptance criteria, wrong directory structure). Fix templates to produce accurate documents.

### Acceptance Criteria
- [ ] Tech stack renders as table, not [object Object]
- [ ] Acceptance criteria are feature-specific
- [ ] Architecture reflects actual monorepo structure
- [ ] Directory tree matches real project layout

### Dependencies
Blocked by: TASK-010

---

## TASK-027: Improve task breakdown output quality

**Labels**: type:improvement, priority:high

### Description
`bsr tasks` generates repetitive template tasks (types -> core -> validation -> tests for every feature). Make smarter task generation that considers what's already implemented and generates meaningful, non-repetitive tasks.

### Acceptance Criteria
- [ ] Tasks are specific, not "Implement main functionality for [feature name]"
- [ ] Already-implemented features are marked as done
- [ ] Task count is reasonable (not 49 for a project with 10 features)

### Dependencies
Blocked by: TASK-015

---

## TASK-028: Complete Multi-LLM adapters

**Labels**: type:feature, priority:medium

### Description
Finish Claude and OpenAI adapters with streaming support, prompt templates per target, API key validation. Currently only the `LLMTarget` type is defined.

### Acceptance Criteria
- [ ] Claude adapter with streaming API calls
- [ ] OpenAI adapter with streaming API calls
- [ ] Prompt templates per LLM target
- [ ] Clear error message when API key is missing
- [ ] Generic target produces copy-paste prompts

### Dependencies
Blocked by: TASK-005

---

## TASK-029: Dashboard frontend UI

**Labels**: type:feature, priority:medium

### Description
Build kanban board UI for the dashboard. Backend REST API and WebSocket are already implemented. Needs frontend with task cards, priority badges, drag-and-drop status changes, and real-time WebSocket updates.

### Acceptance Criteria
- [ ] Kanban board with 4 columns (todo, in-progress, blocked, done)
- [ ] Task cards show title, priority badge, effort, dependencies
- [ ] Status changes via drag or dropdown
- [ ] Real-time updates via WebSocket
- [ ] Responsive layout

### Dependencies
Blocked by: TASK-018

---

## TASK-030: Core package implementation

**Labels**: type:refactor, priority:medium

### Description
Move shared business logic from CLI commands into `packages/core` (currently a placeholder package). This includes config loading, task processing, file operations that are duplicated across commands.

### Acceptance Criteria
- [ ] Common logic extracted from CLI commands
- [ ] CLI commands import from core instead of duplicating
- [ ] All tests still pass after refactor

### Dependencies
Blocked by: TASK-005

---

## TASK-031: Unit tests - BMAD adapter

**Labels**: type:test, priority:high

### Description
Unit tests for the BMAD adapter parser and transformer.

### Acceptance Criteria
- [ ] Parser: valid BMAD directory, field name variations (asA/as_a), markdown parsing, missing files
- [ ] Transformer: priority normalization, architecture inference, epic-to-milestone conversion
- [ ] Coverage > 80%

### Dependencies
Blocked by: TASK-010

---

## TASK-032: Unit tests - SpecKit adapter

**Labels**: type:test, priority:high

### Description
Unit tests for the SpecKit generator and validator.

### Acceptance Criteria
- [ ] Generator: Markdown output with all sections, YAML output, feature grouping by priority
- [ ] Validator: completeness scoring, required field errors, warning-to-error strict mode
- [ ] Coverage > 80%

### Dependencies
Blocked by: TASK-013

---

## TASK-033: Unit tests - Dashboard API

**Labels**: type:test, priority:high

### Description
Unit tests for the dashboard Fastify REST API and WebSocket.

### Acceptance Criteria
- [ ] CRUD: GET/POST/PATCH/DELETE /api/tasks
- [ ] GET /api/project returns correct stats
- [ ] WebSocket broadcasts on mutations
- [ ] 404 for missing tasks
- [ ] Coverage > 80%

### Dependencies
Blocked by: TASK-018

---

## TASK-034: Unit tests - CLI commands

**Labels**: type:test, priority:high

### Description
Unit tests for CLI commands (init, config, status, export).

### Acceptance Criteria
- [ ] init: creates config file, respects --type and --target options
- [ ] config: get/set with dot notation
- [ ] status: reads progress file correctly
- [ ] export: generates valid md/html/json output
- [ ] Coverage > 80%

### Dependencies
Blocked by: TASK-023

---

## TASK-035: Integration tests - full pipeline

**Labels**: type:test, priority:medium

### Description
Integration test of the full BSR pipeline: init -> discover -> plan -> spec -> tasks -> run using test fixtures.

### Acceptance Criteria
- [ ] End-to-end flow completes without errors
- [ ] Output files are generated at each step
- [ ] Data flows correctly between phases

### Dependencies
Blocked by: TASK-031, TASK-032, TASK-033, TASK-034

---

## TASK-036: CI/CD with GitHub Actions

**Labels**: type:infra, priority:medium

### Description
GitHub Actions workflows for automated build, test, lint, typecheck. Turborepo caching for faster CI.

### Acceptance Criteria
- [ ] Workflow triggers on push and PR
- [ ] All checks pass
- [ ] Turborepo remote caching enabled

### Dependencies
Blocked by: TASK-004

---

## TASK-037: npm publish setup

**Labels**: type:infra, priority:low

### Description
Configure npm publishing for all packages under @bsr-method scope. Set up 2FA.

### Acceptance Criteria
- [ ] All packages publishable under @bsr-method scope
- [ ] 2FA configured
- [ ] Publish script in root package.json

### Dependencies
Blocked by: TASK-036

---

## TASK-038: README and documentation

**Labels**: type:docs, priority:medium

### Description
Comprehensive README with installation, quick start guide, command reference, and architecture overview.

### Acceptance Criteria
- [ ] Installation instructions (npm/pnpm)
- [ ] Quick start (init -> plan -> spec -> tasks -> run)
- [ ] All 11 commands documented with examples
- [ ] Architecture diagram

---

## TASK-039: Contributing guide

**Labels**: type:docs, priority:low

### Description
Document contribution guidelines, development setup, and PR process.

### Acceptance Criteria
- [ ] Development setup instructions
- [ ] Code style guide reference
- [ ] PR template and process

### Dependencies
Blocked by: TASK-038

---
*BSR Method - GitHub Issues*
