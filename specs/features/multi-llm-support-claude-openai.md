# Feature: Multi-LLM Support

**Package**: `packages/shared` (types) + `packages/llm-client` (adapters)
**Status**: Partial
**Priority**: P2

---

## Overview

BSR Method supports multiple LLM targets for the Ralph execution loop. The LLM target is configured per project and determines how prompts are formatted and which API is called. Currently supported targets: Claude, OpenAI, Cursor, Copilot, VS Code, and generic.

## User Story

As a developer, I want to choose my preferred LLM provider for the execution loop, so that I can use BSR Method with whichever AI tool I have access to.

## Functional Requirements

### Supported Targets

| Target | Value | Description |
|--------|-------|-------------|
| Claude | `claude` | Anthropic Claude API (default) |
| OpenAI | `openai` | OpenAI GPT API |
| Cursor | `cursor` | Cursor IDE integration |
| Copilot | `copilot` | GitHub Copilot |
| VS Code | `vscode` | VS Code AI extensions |
| Generic | `generic` | Plain text prompts for any LLM |

### Configuration
```yaml
# .bsr/config.yaml
llm:
  target: claude  # or openai, cursor, copilot, vscode, generic
```

Set via CLI: `bsr init --target openai` or `bsr config --set llm.target=openai`

### LLMTarget Type
```typescript
type LLMTarget = 'claude' | 'cursor' | 'copilot' | 'vscode' | 'generic';
```

### Business Rules
1. Default target is `claude`
2. Target affects prompt formatting in Ralph loop
3. API keys provided via environment variables (never in config):
   - `ANTHROPIC_API_KEY` for Claude
   - `OPENAI_API_KEY` for OpenAI
4. `generic` target produces plain text prompts suitable for copy-paste
5. IDE targets (cursor, copilot, vscode) generate prompts optimized for those tools

### Adapter Pattern
```typescript
interface LLMAdapter {
  formatPrompt(task: Task, context: ProjectContext): string;
  execute?(prompt: string): Promise<string>;  // optional: direct API call
}
```

Each target has an adapter that implements prompt formatting. Direct API execution is optional (only Claude and OpenAI have it).

## Technical Design

### Architecture
```
packages/shared/src/
└── index.ts              # LLMTarget type definition

packages/llm-client/src/  # (if separate package)
├── index.ts              # Adapter factory
├── claude-adapter.ts     # Claude-specific formatting + API
├── openai-adapter.ts     # OpenAI-specific formatting + API
└── generic-adapter.ts    # Plain text prompt formatting
```

### Dependencies
- **Internal**: `@bsr-method/shared` (types)
- **External**: `@anthropic-ai/sdk` (Claude), `openai` (OpenAI)

## Current State

The `LLMTarget` type is defined in `packages/shared` and used throughout the CLI. The `bsr init --target` and `bsr config --set llm.target` commands work. The actual LLM API adapters are partially implemented in a separate `llm-client` package.

## Next Steps
- Complete Claude adapter with streaming support
- Complete OpenAI adapter with streaming support
- Add prompt templates per target
- Integration tests with mock LLM responses

## Testing

| Test Case | Description |
|-----------|-------------|
| Config target | `bsr init --target openai` sets correct config |
| Prompt formatting | Each target produces appropriately formatted prompts |
| API key validation | Missing API key produces clear error |
| Generic fallback | `generic` target works without API keys |

---
*BSR Method - Multi-LLM Support Feature Specification*
