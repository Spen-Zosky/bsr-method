# BSR Method

[![CI](https://github.com/Spen-Zosky/bsr-method/actions/workflows/ci.yml/badge.svg)](https://github.com/Spen-Zosky/bsr-method/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)](https://www.typescriptlang.org/)

**AI-driven development framework integrating BMAD, SpecKit, and Ralph.**

BSR Method provides a structured end-to-end pipeline from idea to implementation for AI-assisted software development. It unifies three phases into a single CLI workflow:

| Phase | Tool | Purpose |
|-------|------|---------|
| **Planning** | BMAD | Generate PRD and architecture from an idea |
| **Specification** | SpecKit | Generate constitution, feature specs, API specs |
| **Execution** | Ralph | LLM-powered task implementation loop |

## Quick Start

```bash
git clone https://github.com/Spen-Zosky/bsr-method.git
cd bsr-method
pnpm install
pnpm run build
```

```bash
bsr init --type greenfield --target claude
bsr plan --save
bsr spec --all
bsr tasks --estimate
bsr run
bsr dashboard --open
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `bsr init` | Bootstrap a new project |
| `bsr discover` | Analyze existing codebases (brownfield) |
| `bsr plan` | Generate PRD and architecture via BMAD |
| `bsr spec` | Generate specifications via SpecKit |
| `bsr tasks` | Break down work into prioritized tasks |
| `bsr run` | Execute tasks via Ralph Loop |
| `bsr dashboard` | Real-time web UI for task tracking |
| `bsr config` | Manage project configuration |
| `bsr status` | View project progress |
| `bsr export` | Generate reports (Markdown, HTML, JSON) |
| `bsr sync` | Bidirectional GitHub Issues integration |

## Tech Stack

- **Language**: TypeScript (strict mode)
- - **Runtime**: Node.js >= 18
  - - **Monorepo**: pnpm workspaces + Turborepo
    - - **Build**: tsup (ESM)
      - - **Test**: Vitest
        - - **CLI**: Commander.js
          - - **Dashboard**: Fastify + WebSocket
           
            - ## Project Structure
           
            - ```
              bsr-method/
              ├── packages/
              │   ├── cli/            # CLI entry point (11 commands)
              │   ├── core/           # Core business logic
              │   ├── shared/         # Shared types and utilities
              │   ├── dashboard/      # Web dashboard (Fastify + WS)
              │   └── adapters/
              │       ├── bmad/       # BMAD planning adapter
              │       └── speckit/    # SpecKit specification adapter
              ├── docs/               # Planning documents
              ├── specs/              # Specifications
              └── tasks/              # Task breakdown
              ```

              ## Development

              ```bash
              pnpm run build       # Build all packages
              pnpm run test        # Run all tests
              pnpm run lint        # Lint all packages
              pnpm run typecheck   # TypeScript type checking
              ```

              ## Documentation

              See the [Wiki](https://github.com/Spen-Zosky/bsr-method/wiki) for full documentation:

              - [Getting Started](https://github.com/Spen-Zosky/bsr-method/wiki/Getting-Started)
              - - [Architecture](https://github.com/Spen-Zosky/bsr-method/wiki/Architecture)
                - - [CLI Reference](https://github.com/Spen-Zosky/bsr-method/wiki/CLI-Reference)
                  - - [Adapters](https://github.com/Spen-Zosky/bsr-method/wiki/Adapters)
                    - - [Dashboard](https://github.com/Spen-Zosky/bsr-method/wiki/Dashboard)
                      - - [Contributing](https://github.com/Spen-Zosky/bsr-method/wiki/Contributing)
                       
                        - ## License
                       
                        - MIT
