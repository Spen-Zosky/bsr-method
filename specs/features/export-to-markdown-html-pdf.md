# Feature: Export & Reporting

**Package**: `packages/cli` (command: `bsr export`)
**Status**: Implemented
**Priority**: P1

---

## Overview

The export feature generates comprehensive project reports in multiple formats (Markdown, HTML, JSON). Reports aggregate data from config, idea, tasks, specs, and discovery, providing a complete snapshot of the project state.

## User Story

As a developer or team lead, I want to export project status and documentation in various formats, so that I can share progress with stakeholders or archive project state.

## Functional Requirements

### Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `--format` | `md\|html\|json` | No | Output format (default: md) |
| `--output` | string | No | Custom output file path |
| `--full` | boolean | No | Include all available data |
| `--tasks-only` | boolean | No | Export only task data |
| `--specs-only` | boolean | No | Export only specification data |

### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `exports/<timestamp>.md` | Markdown | Human-readable report |
| `exports/<timestamp>.html` | HTML | Styled report with Tailwind CSS |
| `exports/<timestamp>.json` | JSON | Machine-readable data export |

### Report Contents

#### Full Report Sections
1. **Project Info** - Name, version, type, LLM target, created date
2. **Configuration** - Full `.bsr/config.yaml` dump
3. **Idea Summary** - From `docs/idea.yaml` (features, architecture, milestones)
4. **Task Overview** - Statistics (total, by status, by priority) + task list
5. **Specifications** - Included spec content or links
6. **Discovery** - Brownfield analysis results (if available)

#### Tasks-Only Report
- Task statistics
- Full task list with status, priority, dependencies

#### Specs-Only Report
- Constitution summary
- Feature spec list with status

### Format-Specific Features

| Format | Features |
|--------|----------|
| Markdown | Clean formatting, tables, code blocks |
| HTML | Tailwind CSS styling, responsive layout, printable |
| JSON | Structured data, suitable for programmatic consumption |

### Business Rules
1. Output directory `exports/` is created if it doesn't exist
2. Filenames include timestamp: `bsr-export-2026-02-08T10-00-00.md`
3. HTML reports are self-contained (inline CSS via Tailwind CDN)
4. Missing data sections are omitted (not shown as empty)
5. Scoped exports (`--tasks-only`, `--specs-only`) exclude irrelevant sections

## Technical Design

### Implementation
The `export` command in `packages/cli/src/commands/export.ts`:
1. Reads all available project data files
2. Aggregates into unified report structure
3. Formats according to `--format` option
4. Writes to `exports/` with timestamped filename

### Dependencies
- **Internal**: `@bsr-method/shared` (types, `ensureDir`)
- **External**: `js-yaml`, `chalk`

## Error Handling

| Error | Condition | Behavior |
|-------|-----------|----------|
| No project data | No config, idea, or tasks found | Warning: nothing to export |
| Write failure | Can't write to exports directory | Error with path details |
| Invalid format | Unsupported format value | Error: supported formats are md, html, json |

## Testing

| Test Case | Description |
|-----------|-------------|
| Export Markdown | Valid .md file with all sections |
| Export HTML | Valid .html with Tailwind styling |
| Export JSON | Valid JSON, parseable, complete data |
| Tasks only | Only task data in output |
| Specs only | Only spec data in output |
| Missing data | Graceful handling when some files don't exist |
| Timestamped filename | Correct filename format |

---
*BSR Method - Export Feature Specification*
