# Feature: SpecKit Specification Phase

**Package**: `packages/adapters/speckit`
**Status**: Implemented
**Priority**: P0

---

## Overview

The SpecKit adapter generates and validates project specifications from a BSR idea. It produces a comprehensive specification document (Markdown or YAML) covering vision, architecture, features, personas, milestones, and constraints. It also validates ideas against a schema with completeness scoring.

## User Story

As a developer with a BSR idea file, I want to generate complete specifications automatically, so that I have documented requirements before starting implementation.

## Functional Requirements

### Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| Idea file | string (path) | Yes | Path to `docs/idea.yaml` |
| Options | `GeneratorOptions` | No | Format, include task breakdown, include acceptance criteria |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| Specification | string | Markdown or YAML formatted spec |
| `ValidationResult` | Object | valid, errors[], warnings[], completenessScore (0-100) |

### Generator Output (Markdown format)
1. **Overview** - Project summary
2. **Vision** - Project vision statement
3. **Goals** - Project goals
4. **Architecture** - System architecture with components and integrations
5. **Components** - Detailed component descriptions
6. **Integrations** - Third-party service integrations
7. **Technical Decisions** - Architecture decisions
8. **Features** - Grouped by priority (P0, P1, P2, P3)
9. **Personas** - User personas with needs and behaviors
10. **Milestones** - Project phases and timeline
11. **Constraints** - Technical and business constraints

### Validation Rules
| Check | Level | Condition |
|-------|-------|-----------|
| Project name | Error | Required, non-empty |
| Version | Error | Required, semver format |
| Description | Error | Required, non-empty |
| Vision | Warning | Missing vision statement |
| Architecture | Warning | Missing architecture section |
| Personas | Warning | No personas defined |
| Milestones | Warning | No milestones defined |
| Feature IDs | Error | Must be unique |
| Feature priority | Warning | Should be P0-P3 format |
| Feature count | Warning | Minimum 1 feature required |

### Completeness Score (0-100)
Calculated from: required fields completion + optional sections inclusion + content quality indicators.

## Technical Design

### Architecture
```
packages/adapters/speckit/src/
├── index.ts           # Public API: ideaToSpec(), checkIdea(), createSpec()
├── generator.ts       # generateSpec(), generateMarkdownSpec(), generateYAMLSpec()
└── validator.ts       # validateIdea(), validateIdeaFile(), completeness scoring
```

### Key Functions

| Function | Description |
|----------|-------------|
| `ideaToSpec(ideaPath, options)` | Load -> validate -> generate pipeline |
| `checkIdea(ideaPath, options)` | Validate idea file only |
| `createSpec(idea, options)` | Generate spec from idea object |
| `generateSpec(idea, options)` | Generate in specified format |
| `generateMarkdownSpec(idea)` | Comprehensive Markdown spec |
| `generateYAMLSpec(idea)` | Structured YAML spec |
| `validateIdea(idea, options)` | Validate against schema |
| `groupByPriority(features)` | Group features by P0/P1/P2/P3 |

### Dependencies
- **Internal**: `@bsr-method/shared` (types)
- **External**: `js-yaml` (YAML parsing)

## Error Handling

| Error | Condition | Behavior |
|-------|-----------|----------|
| File not found | Idea YAML doesn't exist | Thrown error with path |
| Invalid YAML | Malformed idea file | Thrown error with parse details |
| Validation failure | Missing required fields | ValidationResult with errors |
| Strict mode | Warnings treated as errors | ValidationResult with converted errors |

## Testing

| Test Case | Description |
|-----------|-------------|
| Generate Markdown spec | Complete Markdown output with all sections |
| Generate YAML spec | Structured YAML output |
| Validate valid idea | Score > 80, no errors |
| Validate incomplete idea | Appropriate warnings, lower score |
| Validate missing required | Error for missing name/version |
| Feature priority grouping | Correct grouping by P0-P3 |
| Strict mode | Warnings become errors |

---
*BSR Method - SpecKit Adapter Feature Specification*
