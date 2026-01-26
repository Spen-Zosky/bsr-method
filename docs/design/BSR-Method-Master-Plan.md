# BSR-Method: Master Development Plan

**Project**: bsr-method  
**Version**: 0.1.0 (Initial)  
**Date**: 2026-01-25  
**Author**: Enzo Spenuso  
**Status**: Planning

---

## 1. Executive Summary

**BSR-Method** (BMAD + SpecKit + Ralph) è un framework open-source che integra tre metodologie di sviluppo AI-driven in un sistema unificato. Supporta sia progetti greenfield (IDEA fornita dall'utente) che brownfield (IDEA derivata da codebase esistente).

### Key Features
- 🚀 **One-liner install**: `npx bsr-method init`
- 🔄 **Dual mode**: Greenfield + Brownfield
- 🔍 **Full Discovery Engine**: Scanner completi per reverse engineering
- 📊 **Web Dashboard**: Progress tracking in tempo reale
- 🔗 **GitHub Integration**: Sync con Issues/Projects
- 📄 **Multi-format Export**: PDF, HTML, Markdown
- 🔌 **CI/CD Hooks**: Integrazione pipeline
- 🧠 **Memory Persistence**: Contesto tra sessioni
- 🌐 **Multi-LLM**: Claude, Cursor, Copilot, VS Code, altri

### Target Users
- Sviluppatori individuali
- Team di sviluppo
- Technical leads
- DevOps engineers

---

## 2. Technical Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BSR-METHOD                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   CLI        │  │   Dashboard  │  │   Plugins    │              │
│  │   (npx)      │  │   (Web UI)   │  │   (Extend)   │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                       │
│  ┌──────┴─────────────────┴─────────────────┴───────┐              │
│  │                    CORE ENGINE                    │              │
│  ├───────────────────────────────────────────────────┤              │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │              │
│  │  │ BMAD    │ │SpecKit  │ │ Ralph   │ │Discovery│ │              │
│  │  │ Bundle  │ │ Bundle  │ │ Wrapper │ │ Engine  │ │              │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ │              │
│  └───────────────────────────────────────────────────┘              │
│         │                 │                 │                       │
│  ┌──────┴─────────────────┴─────────────────┴───────┐              │
│  │                   INTEGRATIONS                    │              │
│  ├───────────────────────────────────────────────────┤              │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │              │
│  │  │ GitHub  │ │ CI/CD   │ │ Export  │ │ Memory  │ │              │
│  │  │ API     │ │ Hooks   │ │ Engine  │ │ Store   │ │              │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ │              │
│  └───────────────────────────────────────────────────┘              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Monorepo Structure

```
bsr-method/
├── packages/
│   ├── cli/                    # Main CLI package (npx entry)
│   │   ├── src/
│   │   │   ├── commands/       # CLI commands
│   │   │   ├── lib/            # CLI utilities
│   │   │   └── index.ts        # Entry point
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── core/                   # Core engine
│   │   ├── src/
│   │   │   ├── bmad/           # BMAD bundle/adapter
│   │   │   ├── speckit/        # SpecKit bundle/adapter
│   │   │   ├── ralph/          # Ralph wrapper
│   │   │   ├── workflow/       # Workflow orchestration
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── discovery/              # Brownfield discovery engine
│   │   ├── src/
│   │   │   ├── scanners/       # All scanners
│   │   │   │   ├── code/
│   │   │   │   ├── database/
│   │   │   │   ├── config/
│   │   │   │   ├── api/
│   │   │   │   ├── test/
│   │   │   │   ├── docs/
│   │   │   │   └── deps/
│   │   │   ├── analyzers/      # All analyzers
│   │   │   │   ├── architecture/
│   │   │   │   ├── intent/
│   │   │   │   ├── gap/
│   │   │   │   └── debt/
│   │   │   ├── synthesizer/    # DPS generator
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── dashboard/              # Web dashboard
│   │   ├── src/
│   │   │   ├── server/         # Express/Fastify backend
│   │   │   ├── client/         # React frontend
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── integrations/           # External integrations
│   │   ├── src/
│   │   │   ├── github/         # GitHub API
│   │   │   ├── cicd/           # CI/CD hooks
│   │   │   ├── export/         # PDF/HTML/MD export
│   │   │   └── memory/         # Persistence
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/                 # Shared types and utilities
│       ├── src/
│       │   ├── types/          # TypeScript interfaces
│       │   ├── utils/          # Common utilities
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── templates/                  # Project templates
│   ├── greenfield/
│   │   ├── CLAUDE.md
│   │   ├── .bsr/
│   │   └── ...
│   ├── brownfield/
│   │   ├── CLAUDE.md
│   │   └── ...
│   └── prompts/               # LLM-agnostic prompts
│       ├── bmad/
│       ├── speckit/
│       ├── ralph/
│       └── discovery/
│
├── docs/                      # Documentation
│   ├── en/                    # English docs
│   │   ├── getting-started.md
│   │   ├── greenfield-guide.md
│   │   ├── brownfield-guide.md
│   │   ├── api-reference.md
│   │   └── ...
│   ├── it/                    # Italian docs
│   │   ├── getting-started.md
│   │   └── ...
│   └── assets/
│
├── examples/                  # Example projects
│   ├── greenfield-demo/
│   └── brownfield-demo/
│
├── scripts/                   # Build/dev scripts
│   ├── build.ts
│   ├── release.ts
│   └── ...
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── release.yml
│   │   └── docs.yml
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
│
├── package.json               # Root package.json
├── pnpm-workspace.yaml        # Monorepo config
├── tsconfig.base.json         # Shared TS config
├── turbo.json                 # Turborepo config
├── LICENSE                    # MIT License
├── README.md                  # Main README
├── CONTRIBUTING.md
├── CHANGELOG.md
└── .gitignore
```

### 2.3 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Package Manager** | pnpm | Monorepo, fast, disk efficient |
| **Build System** | Turborepo | Monorepo builds, caching |
| **Language** | TypeScript 5.x | Type safety, DX |
| **CLI Framework** | Commander + Inquirer | Commands, interactive prompts |
| **AST Parsing** | Tree-sitter, @babel/parser | Code analysis |
| **DB Introspection** | Prisma introspection, pg-structure | Schema extraction |
| **Dashboard Backend** | Fastify | Fast, TypeScript-first |
| **Dashboard Frontend** | React + Vite + TailwindCSS | Modern, fast |
| **Real-time** | Socket.io | Live progress updates |
| **GitHub API** | Octokit | Issues, Projects sync |
| **PDF Generation** | Puppeteer + Handlebars | PDF export |
| **Markdown** | Marked + Mermaid | MD processing |
| **Memory/Persistence** | SQLite + better-sqlite3 | Local persistence |
| **Testing** | Vitest | Fast, TypeScript-native |
| **Linting** | ESLint + Prettier | Code quality |
| **Documentation** | VitePress | Static docs site |

### 2.4 Multi-LLM Support Strategy

BSR-Method è **LLM-agnostic**. I prompt sono separati dal codice:

```
templates/prompts/
├── _base/                     # Base templates (LLM-agnostic)
│   ├── bmad-analyst.md
│   ├── bmad-pm.md
│   ├── discovery-scan.md
│   └── ...
├── claude/                    # Claude-specific adaptations
│   ├── CLAUDE.md              # Claude Code instructions
│   └── overrides/
├── cursor/                    # Cursor-specific
│   ├── .cursorrules
│   └── overrides/
├── copilot/                   # GitHub Copilot
│   ├── .github/copilot-instructions.md
│   └── overrides/
├── vscode/                    # VS Code + Continue/other
│   └── ...
└── generic/                   # Generic LLM
    └── ...
```

**Strategia**:
1. Prompt base in `_base/` sono LLM-agnostic
2. Ogni LLM ha una directory con file di configurazione specifici
3. Al `bsr init`, l'utente sceglie il target LLM
4. Il sistema genera i file appropriati

---

## 3. Feature Breakdown

### 3.1 CLI Commands

| Command | Description | Phase |
|---------|-------------|-------|
| `bsr init` | Initialize BSR in current/new project | 1 |
| `bsr init --greenfield` | Start new greenfield project | 1 |
| `bsr init --brownfield` | Initialize on existing project | 1 |
| `bsr discover` | Run brownfield discovery | 2 |
| `bsr plan` | Run BMAD planning (greenfield) | 2 |
| `bsr plan --from-dps` | Run BMAD from DPS (brownfield) | 2 |
| `bsr spec` | Generate SpecKit specifications | 2 |
| `bsr tasks` | Generate task breakdown | 2 |
| `bsr run` | Start Ralph loop execution | 2 |
| `bsr status` | Show current progress | 2 |
| `bsr dashboard` | Start web dashboard | 3 |
| `bsr export` | Export reports (PDF/HTML/MD) | 3 |
| `bsr sync` | Sync with GitHub Issues/Projects | 3 |
| `bsr config` | Manage configuration | 1 |
| `bsr upgrade` | Upgrade BSR version | 4 |
| `bsr doctor` | Diagnose issues | 4 |

### 3.2 Discovery Engine Scanners

| Scanner | Input | Output | Complexity |
|---------|-------|--------|------------|
| **Code Scanner** | `src/**/*` | AST, metrics, patterns | High |
| **Database Scanner** | Connection/migrations | Schema, relationships | High |
| **Config Scanner** | `*.config.*`, `.env*` | Normalized config | Medium |
| **API Scanner** | Routes, controllers | OpenAPI-like spec | High |
| **Test Scanner** | Test files | Coverage, behaviors | Medium |
| **Docs Scanner** | `*.md`, comments | Documentation map | Low |
| **Dependency Scanner** | `package.json`, etc. | Dependency graph | Low |

### 3.3 Discovery Engine Analyzers

| Analyzer | Input | Output | Complexity |
|----------|-------|--------|------------|
| **Architecture Analyzer** | All scans | Architecture diagram | High |
| **Intent Inferrer** | Code + docs + tests | Feature descriptions | High |
| **Gap Analyzer** | Tests vs code | Coverage gaps | Medium |
| **Tech Debt Analyzer** | Code metrics | Debt report | Medium |

### 3.4 Dashboard Features

| Feature | Description | Phase |
|---------|-------------|-------|
| **Project Overview** | Status, health metrics | 3 |
| **Discovery Results** | Visualize DPS | 3 |
| **PRD Viewer** | View/edit PRD | 3 |
| **Architecture Diagrams** | Interactive diagrams | 3 |
| **Task Board** | Kanban-style tasks | 3 |
| **Progress Tracker** | Real-time Ralph progress | 3 |
| **Reports** | Generate/view reports | 3 |
| **Settings** | Configure BSR | 3 |

### 3.5 Integrations

| Integration | Description | Phase |
|-------------|-------------|-------|
| **GitHub Issues** | Create issues from stories | 3 |
| **GitHub Projects** | Sync with project boards | 3 |
| **GitHub Actions** | CI/CD workflow templates | 4 |
| **GitLab CI** | GitLab pipeline templates | 4 |
| **Jenkins** | Jenkinsfile templates | 4 |
| **Export PDF** | Professional PDF reports | 3 |
| **Export HTML** | Static HTML reports | 3 |
| **Export MD** | Markdown reports | 3 |
| **Memory SQLite** | Local context persistence | 3 |

---

## 4. Development Phases

### Phase 1: Foundation (Week 1-2)

**Goal**: Repository bootstrap, CLI skeleton, basic init command.

**Deliverables**:
- [ ] Monorepo setup (pnpm, turborepo)
- [ ] TypeScript configuration
- [ ] CLI package with basic commands
- [ ] `bsr init` command (basic)
- [ ] `bsr config` command
- [ ] Template system foundation
- [ ] CLAUDE.md for self-development
- [ ] Basic documentation structure
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] npm publish setup

### Phase 2: Core Engine (Week 3-5)

**Goal**: Full greenfield and brownfield workflows working.

**Deliverables**:
- [ ] BMAD bundle/adapter
- [ ] SpecKit bundle/adapter
- [ ] Ralph wrapper
- [ ] Workflow orchestration
- [ ] Discovery engine - all scanners
- [ ] Discovery engine - all analyzers
- [ ] DPS synthesizer
- [ ] Transform layer (BMAD → SpecKit)
- [ ] Progress tracking (progress.txt)
- [ ] `bsr discover` command
- [ ] `bsr plan` command
- [ ] `bsr spec` command
- [ ] `bsr tasks` command
- [ ] `bsr run` command
- [ ] `bsr status` command
- [ ] Multi-LLM prompt templates

### Phase 3: Dashboard & Integrations (Week 6-8)

**Goal**: Web dashboard and external integrations.

**Deliverables**:
- [ ] Dashboard backend (Fastify)
- [ ] Dashboard frontend (React)
- [ ] Real-time updates (Socket.io)
- [ ] Project overview page
- [ ] Discovery results visualization
- [ ] PRD viewer/editor
- [ ] Architecture diagram viewer
- [ ] Task board (Kanban)
- [ ] Progress tracker
- [ ] GitHub Issues integration
- [ ] GitHub Projects integration
- [ ] PDF export engine
- [ ] HTML export engine
- [ ] MD export engine
- [ ] Memory persistence (SQLite)
- [ ] `bsr dashboard` command
- [ ] `bsr export` command
- [ ] `bsr sync` command

### Phase 4: Polish & Release (Week 9-10)

**Goal**: Production-ready release.

**Deliverables**:
- [ ] Complete English documentation
- [ ] Complete Italian documentation
- [ ] VitePress documentation site
- [ ] Example projects (greenfield, brownfield)
- [ ] CI/CD hook templates
- [ ] `bsr upgrade` command
- [ ] `bsr doctor` command
- [ ] Performance optimization
- [ ] Security audit
- [ ] npm publish (v1.0.0)
- [ ] GitHub release
- [ ] Announcement

---

## 5. Detailed TODO List

### 5.1 Phase 1: Foundation

#### 5.1.1 Repository Setup
```
[ ] Create GitHub repository: bsr-method/bsr-method
[ ] Initialize with MIT license
[ ] Create .gitignore (Node, TypeScript, IDE)
[ ] Create README.md (initial)
[ ] Create CONTRIBUTING.md
[ ] Create CODE_OF_CONDUCT.md
[ ] Create CHANGELOG.md
[ ] Setup branch protection rules
```

#### 5.1.2 Monorepo Configuration
```
[ ] Initialize pnpm workspace
    [ ] pnpm-workspace.yaml
    [ ] Root package.json
[ ] Configure Turborepo
    [ ] turbo.json
    [ ] Pipeline definitions
[ ] TypeScript setup
    [ ] tsconfig.base.json
    [ ] Path aliases configuration
[ ] ESLint + Prettier
    [ ] .eslintrc.js
    [ ] .prettierrc
    [ ] Shared config package
[ ] Vitest setup
    [ ] vitest.config.ts
    [ ] Test utilities
```

#### 5.1.3 CLI Package (@bsr-method/cli)
```
[ ] Package initialization
    [ ] package.json
    [ ] tsconfig.json
[ ] CLI framework setup
    [ ] Commander configuration
    [ ] Inquirer integration
[ ] Entry point (bin/bsr.ts)
[ ] Command structure
    [ ] src/commands/init.ts
    [ ] src/commands/config.ts
    [ ] src/commands/help.ts
[ ] Utilities
    [ ] src/lib/logger.ts
    [ ] src/lib/config.ts
    [ ] src/lib/fs.ts
[ ] Tests
    [ ] __tests__/init.test.ts
    [ ] __tests__/config.test.ts
```

#### 5.1.4 Shared Package (@bsr-method/shared)
```
[ ] Package initialization
[ ] Types definitions
    [ ] src/types/config.ts
    [ ] src/types/project.ts
    [ ] src/types/dps.ts
    [ ] src/types/workflow.ts
[ ] Utilities
    [ ] src/utils/fs.ts
    [ ] src/utils/git.ts
    [ ] src/utils/template.ts
```

#### 5.1.5 Template System
```
[ ] Create templates/greenfield/
    [ ] CLAUDE.md template
    [ ] .bsr/config.yaml template
    [ ] Project structure template
[ ] Create templates/brownfield/
    [ ] CLAUDE.md template
    [ ] .bsr/config.yaml template
[ ] Create templates/prompts/_base/
    [ ] bmad-analyst.md
    [ ] bmad-pm.md
    [ ] bmad-architect.md
    [ ] speckit-constitution.md
    [ ] speckit-plan.md
    [ ] ralph-loop.md
    [ ] discovery-scan.md
[ ] LLM-specific templates
    [ ] templates/prompts/claude/
    [ ] templates/prompts/cursor/
    [ ] templates/prompts/copilot/
    [ ] templates/prompts/vscode/
```

#### 5.1.6 CI/CD Setup
```
[ ] GitHub Actions workflows
    [ ] .github/workflows/ci.yml (lint, test, build)
    [ ] .github/workflows/release.yml (npm publish)
    [ ] .github/workflows/docs.yml (deploy docs)
[ ] Issue templates
    [ ] .github/ISSUE_TEMPLATE/bug_report.md
    [ ] .github/ISSUE_TEMPLATE/feature_request.md
[ ] PR template
    [ ] .github/PULL_REQUEST_TEMPLATE.md
```

#### 5.1.7 npm Publish Setup
```
[ ] Configure npm publishing
    [ ] .npmrc
    [ ] npm token secret in GitHub
[ ] Package configuration
    [ ] "files" in package.json
    [ ] "bin" configuration
    [ ] "publishConfig"
[ ] Test local install (npm link)
[ ] Test npx execution
```

### 5.2 Phase 2: Core Engine

#### 5.2.1 Core Package (@bsr-method/core)
```
[ ] Package initialization
[ ] BMAD integration
    [ ] src/bmad/agents/analyst.ts
    [ ] src/bmad/agents/pm.ts
    [ ] src/bmad/agents/architect.ts
    [ ] src/bmad/agents/developer.ts
    [ ] src/bmad/workflows/planning.ts
    [ ] src/bmad/templates/project-brief.ts
    [ ] src/bmad/templates/prd.ts
    [ ] src/bmad/templates/architecture.ts
[ ] SpecKit integration
    [ ] src/speckit/constitution.ts
    [ ] src/speckit/specify.ts
    [ ] src/speckit/plan.ts
    [ ] src/speckit/tasks.ts
    [ ] src/speckit/validate.ts
[ ] Ralph integration
    [ ] src/ralph/loop.ts
    [ ] src/ralph/progress.ts
    [ ] src/ralph/completion.ts
[ ] Workflow orchestration
    [ ] src/workflow/greenfield.ts
    [ ] src/workflow/brownfield.ts
    [ ] src/workflow/transform.ts
[ ] Tests for all modules
```

#### 5.2.2 Discovery Package (@bsr-method/discovery)
```
[ ] Package initialization
[ ] Scanners
    [ ] src/scanners/code/index.ts
    [ ] src/scanners/code/typescript.ts
    [ ] src/scanners/code/javascript.ts
    [ ] src/scanners/code/python.ts
    [ ] src/scanners/code/java.ts
    [ ] src/scanners/database/index.ts
    [ ] src/scanners/database/postgresql.ts
    [ ] src/scanners/database/mysql.ts
    [ ] src/scanners/database/sqlite.ts
    [ ] src/scanners/database/prisma.ts
    [ ] src/scanners/database/typeorm.ts
    [ ] src/scanners/config/index.ts
    [ ] src/scanners/config/env.ts
    [ ] src/scanners/config/package.ts
    [ ] src/scanners/config/docker.ts
    [ ] src/scanners/api/index.ts
    [ ] src/scanners/api/express.ts
    [ ] src/scanners/api/fastify.ts
    [ ] src/scanners/api/nextjs.ts
    [ ] src/scanners/api/openapi.ts
    [ ] src/scanners/test/index.ts
    [ ] src/scanners/test/jest.ts
    [ ] src/scanners/test/vitest.ts
    [ ] src/scanners/test/playwright.ts
    [ ] src/scanners/docs/index.ts
    [ ] src/scanners/docs/markdown.ts
    [ ] src/scanners/docs/jsdoc.ts
    [ ] src/scanners/deps/index.ts
    [ ] src/scanners/deps/npm.ts
    [ ] src/scanners/deps/yarn.ts
    [ ] src/scanners/deps/pnpm.ts
[ ] Analyzers
    [ ] src/analyzers/architecture/index.ts
    [ ] src/analyzers/architecture/layers.ts
    [ ] src/analyzers/architecture/patterns.ts
    [ ] src/analyzers/architecture/diagram.ts
    [ ] src/analyzers/intent/index.ts
    [ ] src/analyzers/intent/features.ts
    [ ] src/analyzers/intent/rules.ts
    [ ] src/analyzers/gap/index.ts
    [ ] src/analyzers/gap/test-coverage.ts
    [ ] src/analyzers/gap/documentation.ts
    [ ] src/analyzers/gap/security.ts
    [ ] src/analyzers/debt/index.ts
    [ ] src/analyzers/debt/complexity.ts
    [ ] src/analyzers/debt/duplication.ts
    [ ] src/analyzers/debt/scoring.ts
[ ] Synthesizer
    [ ] src/synthesizer/index.ts
    [ ] src/synthesizer/dps-generator.ts
    [ ] src/synthesizer/idea-derivation.ts
    [ ] src/synthesizer/confidence.ts
[ ] Tests for all modules
```

#### 5.2.3 CLI Commands (Phase 2)
```
[ ] src/commands/discover.ts
[ ] src/commands/plan.ts
[ ] src/commands/spec.ts
[ ] src/commands/tasks.ts
[ ] src/commands/run.ts
[ ] src/commands/status.ts
[ ] Integration tests
```

### 5.3 Phase 3: Dashboard & Integrations

#### 5.3.1 Dashboard Package (@bsr-method/dashboard)
```
[ ] Package initialization
[ ] Backend (Fastify)
    [ ] src/server/index.ts
    [ ] src/server/routes/project.ts
    [ ] src/server/routes/discovery.ts
    [ ] src/server/routes/workflow.ts
    [ ] src/server/routes/export.ts
    [ ] src/server/websocket/progress.ts
[ ] Frontend (React + Vite)
    [ ] src/client/main.tsx
    [ ] src/client/App.tsx
    [ ] src/client/pages/Dashboard.tsx
    [ ] src/client/pages/Discovery.tsx
    [ ] src/client/pages/PRD.tsx
    [ ] src/client/pages/Architecture.tsx
    [ ] src/client/pages/Tasks.tsx
    [ ] src/client/pages/Progress.tsx
    [ ] src/client/pages/Reports.tsx
    [ ] src/client/pages/Settings.tsx
    [ ] src/client/components/... (many)
    [ ] src/client/hooks/...
    [ ] src/client/store/...
[ ] Styling (TailwindCSS)
[ ] Tests
```

#### 5.3.2 Integrations Package (@bsr-method/integrations)
```
[ ] Package initialization
[ ] GitHub integration
    [ ] src/github/client.ts
    [ ] src/github/issues.ts
    [ ] src/github/projects.ts
    [ ] src/github/sync.ts
[ ] CI/CD hooks
    [ ] src/cicd/github-actions.ts
    [ ] src/cicd/gitlab-ci.ts
    [ ] src/cicd/jenkins.ts
[ ] Export engine
    [ ] src/export/pdf.ts
    [ ] src/export/html.ts
    [ ] src/export/markdown.ts
    [ ] src/export/templates/...
[ ] Memory/Persistence
    [ ] src/memory/store.ts
    [ ] src/memory/sqlite.ts
    [ ] src/memory/queries.ts
[ ] Tests
```

#### 5.3.3 CLI Commands (Phase 3)
```
[ ] src/commands/dashboard.ts
[ ] src/commands/export.ts
[ ] src/commands/sync.ts
[ ] Integration tests
```

### 5.4 Phase 4: Polish & Release

#### 5.4.1 Documentation
```
[ ] VitePress setup
    [ ] docs/.vitepress/config.ts
    [ ] docs/.vitepress/theme/
[ ] English documentation
    [ ] docs/en/index.md
    [ ] docs/en/getting-started.md
    [ ] docs/en/installation.md
    [ ] docs/en/greenfield-guide.md
    [ ] docs/en/brownfield-guide.md
    [ ] docs/en/cli-reference.md
    [ ] docs/en/api-reference.md
    [ ] docs/en/dashboard-guide.md
    [ ] docs/en/integrations/github.md
    [ ] docs/en/integrations/cicd.md
    [ ] docs/en/integrations/export.md
    [ ] docs/en/configuration.md
    [ ] docs/en/troubleshooting.md
    [ ] docs/en/faq.md
    [ ] docs/en/contributing.md
[ ] Italian documentation
    [ ] docs/it/index.md
    [ ] docs/it/getting-started.md
    [ ] ... (mirror of English)
```

#### 5.4.2 Examples
```
[ ] examples/greenfield-demo/
    [ ] README.md
    [ ] Pre-configured BSR setup
    [ ] Sample IDEA
    [ ] Expected outputs
[ ] examples/brownfield-demo/
    [ ] README.md
    [ ] Sample codebase
    [ ] Pre-run discovery results
    [ ] Expected outputs
```

#### 5.4.3 Final Commands
```
[ ] src/commands/upgrade.ts
[ ] src/commands/doctor.ts
```

#### 5.4.4 Release
```
[ ] Version bump (1.0.0)
[ ] CHANGELOG update
[ ] npm publish
[ ] GitHub release
[ ] Documentation deploy
[ ] Announcement
    [ ] Twitter/X
    [ ] Reddit (r/programming, r/typescript)
    [ ] Hacker News
    [ ] Dev.to article
```

---

## 6. Configuration Schema

### 6.1 Project Configuration (.bsr/config.yaml)

```yaml
# BSR Method Configuration
version: "1.0"

project:
  name: "my-project"
  type: "greenfield" | "brownfield"
  created: "2026-01-25T10:00:00Z"

llm:
  target: "claude" | "cursor" | "copilot" | "vscode" | "generic"
  custom_instructions: ".bsr/custom-instructions.md"

workflow:
  auto_commit: true
  commit_prefix: "[BSR]"
  progress_file: "progress.txt"

discovery:
  enabled: true  # for brownfield
  scanners:
    code: true
    database: true
    config: true
    api: true
    test: true
    docs: true
    deps: true
  exclude:
    - "node_modules"
    - "dist"
    - ".git"

github:
  enabled: false
  repo: "owner/repo"
  issues:
    create: true
    labels: ["bsr", "auto-generated"]
  projects:
    sync: true
    project_id: 123

dashboard:
  port: 3456
  auto_open: true

export:
  formats:
    - "md"
    - "html"
    - "pdf"
  output_dir: ".bsr/reports"

memory:
  enabled: true
  database: ".bsr/memory.db"
```

### 6.2 Global Configuration (~/.bsr/config.yaml)

```yaml
# Global BSR Configuration
defaults:
  llm: "claude"
  auto_update_check: true

github:
  token: "${GITHUB_TOKEN}"  # or stored in keychain

telemetry:
  enabled: false  # opt-in telemetry

updates:
  channel: "stable" | "beta"
```

---

## 7. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| BMAD/SpecKit API changes | Medium | High | Version lock, adapter layer |
| Claude Code changes | Medium | Medium | LLM-agnostic design |
| Scope creep | High | High | Strict phase gates |
| npm publish issues | Low | Medium | Thorough testing |
| Performance (large codebases) | Medium | Medium | Streaming, chunking |
| Security (secrets in scans) | Medium | High | Explicit exclude patterns |

---

## 8. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| npm weekly downloads | > 1,000 | npm stats |
| GitHub stars | > 500 (6 months) | GitHub |
| Issue resolution time | < 48 hours | GitHub |
| Documentation coverage | 100% | Manual |
| Test coverage | > 80% | Vitest |
| CLI response time | < 2s (init) | Benchmark |
| Discovery time (medium project) | < 5 minutes | Benchmark |

---

## 9. Open Questions

1. **BMAD Bundling**: Fork completo o adapter su BMAD installato?
   - Recommendation: Adapter iniziale, fork se necessario

2. **SpecKit Bundling**: Stesso approccio
   - Recommendation: Adapter iniziale

3. **Dashboard Hosting**: Locale only o opzione cloud?
   - Recommendation: Locale only per v1, cloud in roadmap

4. **Pricing/Sponsorship**: Open source puro o sponsor tier?
   - Recommendation: MIT puro, GitHub Sponsors

---

## 10. Next Actions (Immediate)

1. **Creare repository GitHub**: bsr-method/bsr-method
2. **Setup monorepo base**: pnpm, turborepo, tsconfig
3. **Implementare `bsr init`**: Comando base funzionante
4. **Creare CLAUDE.md**: Per self-development
5. **Pubblicare v0.0.1**: Placeholder su npm

---

## Appendix A: Command Examples

```bash
# Greenfield: New project from scratch
mkdir my-new-app
cd my-new-app
npx bsr-method init --greenfield --llm claude
# Answer prompts about project idea
bsr plan
bsr spec
bsr tasks
bsr run

# Brownfield: Existing project
cd my-existing-app
npx bsr-method init --brownfield --llm cursor
bsr discover
# Review discovery/project-context.yaml
bsr plan --from-dps
bsr spec
bsr tasks
bsr run

# Dashboard
bsr dashboard
# Opens http://localhost:3456

# Export
bsr export --format pdf --output ./reports/

# GitHub sync
bsr sync --github
```

---

## Appendix B: File Size Estimates

| Package | Estimated Size |
|---------|---------------|
| @bsr-method/cli | ~50KB |
| @bsr-method/core | ~200KB |
| @bsr-method/discovery | ~300KB |
| @bsr-method/dashboard | ~2MB (with frontend) |
| @bsr-method/integrations | ~100KB |
| @bsr-method/shared | ~20KB |
| **Total (bundled)** | **~3MB** |

---

*Document created: 2026-01-25*
*Last updated: 2026-01-25*
