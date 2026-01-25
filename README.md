# BSR-Method

**AI-Driven Development Framework**

Integrates BMAD, SpecKit, and Ralph for seamless project development.

## Installation

```bash
npx bsr-method init
```

## Quick Start

### Greenfield (New Project)
```bash
mkdir my-project && cd my-project
npx bsr-method init --greenfield
bsr plan
bsr spec
bsr run
```

### Brownfield (Existing Project)
```bash
cd my-existing-project
npx bsr-method init --brownfield
bsr discover
bsr plan --from-dps
bsr spec
bsr run
```

## Features

- ðŸš€ **Greenfield**: Start from IDEA to implementation
- ðŸ” **Brownfield**: Analyze existing code, derive IDEA
- ðŸ“Š **Dashboard**: Web-based progress tracking
- ðŸ“„ **Export**: PDF, HTML, Markdown reports
- ðŸ”— **GitHub**: Issues and Projects sync

## Supported LLMs

- Claude (Claude Code)
- Cursor
- GitHub Copilot
- VS Code
- Generic

## License

MIT - Enzo Spenuso
