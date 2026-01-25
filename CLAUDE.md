# BSR-Method Development Instructions

## Overview
BSR-Method integrates BMAD + SpecKit + Ralph for AI-driven development.
Supports greenfield (new) and brownfield (existing) projects.

## Tech Stack
- TypeScript 5.x, Node.js 18+
- pnpm monorepo + Turborepo
- Commander.js + Inquirer.js (CLI)
- Vitest (testing)

## Structure
```
packages/
â”œâ”€â”€ cli/      # Main CLI (bsr-method)
â”œâ”€â”€ core/     # Core engine
â”œâ”€â”€ shared/   # Types & utils
```

## Commands
```bash
pnpm install    # Install deps
pnpm build      # Build all
pnpm dev        # Watch mode
pnpm test       # Run tests
pnpm lint       # Lint code
```

## Current Phase: Foundation
- [x] Monorepo setup
- [x] CLI with init, config, status
- [ ] Core engine (Phase 2)
- [ ] Discovery engine (Phase 3)

## Conventions
- TypeScript strict mode
- Named exports from index.ts
- Tests in __tests__/ directories
