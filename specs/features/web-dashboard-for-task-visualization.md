# Feature: Web Dashboard

**Package**: `packages/dashboard`
**Status**: Implemented
**Priority**: P1

---

## Overview

The BSR Dashboard is a Fastify-based web server providing real-time task visualization and management. It exposes a REST API for CRUD operations on tasks and a WebSocket endpoint for live updates. Started via `bsr dashboard` command.

## User Story

As a developer working through a BSR task list, I want a visual dashboard showing task status, dependencies, and progress, so that I can monitor and manage my implementation work.

## Functional Requirements

### REST API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/tasks` | GET | List all tasks |
| `/api/tasks/:id` | GET | Get task by ID |
| `/api/tasks` | POST | Create new task |
| `/api/tasks/:id` | PATCH | Update task (partial) |
| `/api/tasks/:id` | DELETE | Delete task |
| `/api/project` | GET | Project info + task stats |
| `/api/logs` | GET | Last 10 log files |

### WebSocket (`/ws`)

| Direction | Message Type | Description |
|-----------|-------------|-------------|
| Client -> Server | `update-task` | Request task update |
| Client -> Server | `refresh` | Request full task list |
| Server -> Client | `task-updated` | Broadcast after PATCH |
| Server -> Client | `task-created` | Broadcast after POST |
| Server -> Client | `task-deleted` | Broadcast after DELETE |
| Server -> Client | `tasks-refreshed` | Full task list response |

### Features
- Real-time broadcasting: all REST mutations trigger WebSocket broadcasts
- Data persistence: reads/writes `tasks/breakdown.json`
- Static file serving: `public/` directory for frontend assets
- Configurable port (default: 3000) and host (default: 127.0.0.1)
- Pino logging with pino-pretty for colored output

## Technical Design

### Architecture
```
packages/dashboard/src/
├── index.ts       # Public API: createServer(), startServer()
└── server.ts      # Fastify routes, WebSocket setup, task persistence
```

### Key Functions

| Function | Description |
|----------|-------------|
| `createServer(config)` | Configure Fastify with plugins and routes |
| `startServer(config)` | Start listening on configured port |

### Dependencies
- **Internal**: `@bsr-method/shared` (types)
- **External**: `fastify`, `@fastify/websocket`, `@fastify/static`, `pino`, `pino-pretty`

### Data Flow
```
tasks/breakdown.json <-> Fastify REST API <-> WebSocket <-> Browser
```

## Error Handling

| Error | Condition | Behavior |
|-------|-----------|----------|
| Port in use | Port already bound | Error with port number |
| No tasks file | `breakdown.json` missing | Empty array, create on first write |
| Task not found | Invalid ID in GET/PATCH/DELETE | 404 response |
| Invalid JSON body | Malformed request | 400 response |
| WebSocket disconnect | Client drops connection | Remove from broadcast set |

## Testing

| Test Case | Description |
|-----------|-------------|
| GET /api/tasks | Returns task array from JSON file |
| POST /api/tasks | Creates task, broadcasts to WS |
| PATCH /api/tasks/:id | Updates task, broadcasts to WS |
| DELETE /api/tasks/:id | Deletes task, broadcasts to WS |
| GET /api/project | Returns project info with stats |
| WebSocket connection | Client connects, receives broadcasts |
| Task not found | 404 for invalid task ID |

---
*BSR Method - Web Dashboard Feature Specification*
