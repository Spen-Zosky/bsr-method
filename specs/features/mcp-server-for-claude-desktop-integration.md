# Feature: MCP Server for Claude Desktop

**Package**: `packages/mcp-server` (or integrated in CLI)
**Status**: Implemented (basic)
**Priority**: P2

---

## Overview

The MCP (Model Context Protocol) server exposes BSR Method tools to Claude Desktop, allowing users to invoke BSR commands directly from the Claude Desktop chat interface. This enables a conversational development workflow where Claude can plan, spec, and manage tasks without leaving the chat.

## User Story

As a developer using Claude Desktop, I want to invoke BSR commands from the chat interface, so that I can manage my development pipeline without switching to a terminal.

## Functional Requirements

### Exposed Tools

| Tool | BSR Command | Description |
|------|-------------|-------------|
| `bsr_init` | `bsr init` | Initialize new project |
| `bsr_discover` | `bsr discover` | Analyze existing codebase |
| `bsr_plan` | `bsr plan` | Generate planning documents |
| `bsr_spec` | `bsr spec` | Generate specifications |
| `bsr_tasks` | `bsr tasks` | Generate task breakdown |
| `bsr_run` | `bsr run` | Execute Ralph Loop |
| `bsr_status` | `bsr status` | Show project status |
| `bsr_config` | `bsr config` | Manage configuration |

### MCP Configuration
```json
{
  "mcpServers": {
    "bsr-method": {
      "command": "node",
      "args": ["path/to/mcp-server/dist/index.js"],
      "env": {
        "BSR_PROJECT_ROOT": "/path/to/project"
      }
    }
  }
}
```

### Business Rules
1. MCP server runs as a stdio transport (stdin/stdout)
2. Project root passed via `BSR_PROJECT_ROOT` environment variable
3. Each tool maps to a CLI command with equivalent options
4. Tool responses include structured output (JSON) for Claude to interpret
5. Long-running operations (discover, run) stream progress updates

## Technical Design

### Dependencies
- **Internal**: All BSR packages (cli, shared, adapters)
- **External**: `@modelcontextprotocol/sdk`

### Protocol
- Transport: stdio (standard input/output)
- Format: JSON-RPC 2.0 (MCP standard)
- Tools registered with schemas matching CLI option types

## Error Handling

| Error | Condition | Behavior |
|-------|-----------|----------|
| No project root | `BSR_PROJECT_ROOT` not set | Error response in MCP |
| Command failure | Underlying CLI command fails | Error response with details |
| Invalid arguments | Wrong tool parameters | Validation error response |

## Testing

| Test Case | Description |
|-----------|-------------|
| Tool registration | All tools listed in MCP capabilities |
| bsr_status tool | Returns valid project status JSON |
| bsr_tasks tool | Generates task breakdown |
| Error handling | Invalid project root returns error |

---
*BSR Method - MCP Server Feature Specification*
