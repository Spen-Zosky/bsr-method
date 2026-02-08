# Feature: BMAD Planning Phase

**Package**: `packages/adapters/bmad`
**Status**: Implemented
**Priority**: P0

---

## Overview

The BMAD (Breakthrough Method for Architecture Design) adapter parses BMAD output directories and transforms them into BSR format. It converts project files, personas, epics, and stories into a unified `idea.yaml` that feeds the rest of the BSR pipeline.

## User Story

As a developer using BMAD for project planning, I want to import my BMAD output into BSR, so that my planning artifacts automatically flow into specifications and task breakdowns.

## Functional Requirements

### Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| BMAD directory | string (path) | Yes | Directory containing BMAD output files |
| Options | `TransformOptions` | No | Include personas, stories, custom version |

### BMAD Directory Structure (expected)
```
bmad-dir/
├── project.yaml (or project.yml, project.md)
├── features.yaml
├── personas/
│   └── *.yaml
├── epics/
│   └── *.yaml
└── stories/
    └── *.yaml
```

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `idea.yaml` | YAML file | BSR idea with features, personas, architecture, milestones |
| `ParseResult` | Object | Success flag, errors[], warnings[] |
| `TransformResult` | Object | Success flag, transformed idea, errors[], warnings[] |

### Business Rules
1. Parser handles field name variations: `asA`/`as_a`, `iWant`/`i_want`, `soThat`/`so_that`
2. Priorities normalized to P0-P3 (fallback: HIGH->P0, MEDIUM->P1, LOW->P2)
3. Architecture inferred from text content (detects: microservices, monolith, serverless, api-first)
4. Components inferred from keywords (frontend, backend, database, auth, cli)
5. Integrations detected from mentions (github, slack, stripe, email, oauth)
6. Epics are converted to milestones in BSR format

## Technical Design

### Architecture
```
packages/adapters/bmad/src/
├── index.ts           # Public API: bmadToBSR(), bmadFileToBSR(), convertBMADtoBSR()
├── parser.ts          # parseBMADDirectory(), parseBMADFile(), findFile()
├── transformer.ts     # transformToBSR(), inferArchitecture()
└── types.ts           # BMADProject, BMADFeature, BMADPersona, BMADEpic, BMADUserStory
```

### Key Functions

| Function | Description |
|----------|-------------|
| `parseBMADDirectory(path)` | Scan directory, parse YAML/Markdown files |
| `parseBMADFile(filePath)` | Parse single YAML or Markdown file |
| `transformToBSR(project, options)` | Convert BMADProject to BSR idea |
| `inferArchitecture(text)` | Detect architecture type, components, integrations from text |
| `bmadToBSR(dirPath)` | One-call parse + transform pipeline |
| `convertBMADtoBSR(dirPath, outputPath, options)` | Full pipeline with file write |

### Dependencies
- **Internal**: `@bsr-method/shared` (BSRConfig, types)
- **External**: `js-yaml` (YAML parsing)

## Error Handling

| Error | Condition | Behavior |
|-------|-----------|----------|
| Directory not found | Path doesn't exist | ParseResult with error message |
| No project file | Missing project.yaml/yml/md | ParseResult with error, partial result |
| Invalid YAML | Malformed YAML syntax | ParseResult with error at file level |
| Missing features | No features defined | TransformResult with warning |

## Testing

| Test Case | Description |
|-----------|-------------|
| Parse valid BMAD dir | All files parsed, no errors |
| Parse with field variations | `as_a` and `asA` both work |
| Transform features | Features preserved with correct priorities |
| Infer architecture | "microservices" text -> type: microservices |
| Handle missing files | Graceful partial result with warnings |
| Markdown project parsing | Extract sections from `# headings` |

---
*BSR Method - BMAD Adapter Feature Specification*
