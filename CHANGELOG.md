# Changelog

All notable changes to BSR Method will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-26

### Added

#### Core Commands
- **`bsr init`** - Project initialization
  - Greenfield mode for new projects
  - Brownfield mode for existing codebases
  - LLM provider selection (Claude, OpenAI, local)
  - Interactive and non-interactive modes (`-y` flag)
  - Automatic directory structure creation

- **`bsr config`** - Configuration management
  - Get/set individual values
  - List all configuration
  - Reset to defaults

- **`bsr status`** - Project status display
  - Progress percentage
  - Phase tracking
  - Task statistics
  - JSON output option

#### BMAD Planning Phase
- **`bsr discover`** - Brownfield codebase analyzer
  - Package manager detection (npm, yarn, pnpm)
  - Source code scanning
  - Framework detection
  - Test coverage analysis
  - CI/CD configuration detection
  - Generates `discovery/project-context.yaml` and `DISCOVERY.md`

- **`bsr plan`** - Strategic planning
  - Interactive IDEA collection
  - Generates `docs/idea.yaml` and `docs/idea.md`
  - PRD generation (`docs/prd.md`)
  - Architecture document (`docs/architecture.md`)
  - `--from-dps` flag for brownfield derivation

#### SpecKit Specifications Phase
- **`bsr spec`** - Technical specifications
  - Constitution document (`specs/CONSTITUTION.md`)
  - Feature specifications (`specs/features/*.md`)
  - API documentation (`--api` → `specs/api/endpoints.md`)
  - Data models (`--data` → `specs/data/models.md`)
  - UI components (`--ui` → `specs/ui/components.md`)
  - `--all` flag for complete suite

#### Task Management
- **`bsr tasks`** - Task breakdown generator
  - Automatic task generation from specifications
  - Multiple output formats (md, json, csv)
  - GitHub Issues format (`--github`)
  - Time estimates (`--estimate`)
  - Priority assignment
  - Dependency tracking

#### Ralph Execution Loop
- **`bsr run`** - Interactive execution
  - Task selection interface
  - LLM prompt generation
  - Status tracking (done, blocked, skip)
  - Loop state persistence
  - `--dry-run` mode
  - `--max-iterations` limit
  - `--task <id>` direct start

#### Monitoring & Export
- **`bsr dashboard`** - Web UI
  - Real-time project status
  - Kanban task board (Todo/In Progress/Done)
  - Progress metrics
  - Auto-refresh (30s)
  - Dark theme with Tailwind CSS
  - API endpoints for data and updates

- **`bsr export`** - Report generation
  - Markdown format (default)
  - HTML format with Tailwind styling
  - JSON format for programmatic use
  - `--tasks-only` and `--specs-only` filters

- **`bsr sync`** - GitHub integration
  - Export tasks as GitHub Issues
  - Import issues from GitHub
  - Sync status display
  - `gh` CLI integration

### Technical
- TypeScript 5.x with strict mode
- Commander.js for CLI framework
- Inquirer.js for interactive prompts
- tsup for fast builds (~100ms)
- pnpm workspace monorepo structure
- Vitest for testing
- GitHub Actions CI/CD

### Project Structure
```
.bsr/           - Configuration and state
docs/           - Planning documents
specs/          - Technical specifications
tasks/          - Task breakdowns
discovery/      - Brownfield analysis
exports/        - Generated reports
sync/           - GitHub sync files
```

## [Unreleased]

### Planned
- Direct LLM API integration
- MCP server for Claude Desktop
- Custom template support
- Plugin system
- Team collaboration features
- VS Code extension

---

## Version History Summary

| Version | Date | Highlights |
|---------|------|------------|
| 0.1.0 | 2026-01-26 | Initial release with 11 commands |
