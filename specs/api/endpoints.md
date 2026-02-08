# API Specification - Dashboard REST & WebSocket

**Project**: BSR Method
**Package**: `packages/dashboard`
**Date**: 2026-02-08

---

## Overview

The BSR Dashboard exposes a Fastify REST API and WebSocket endpoint for real-time task management. The server reads/writes `tasks/breakdown.json` as its data store.

**Base URL**: `http://127.0.0.1:3000` (default)

## REST Endpoints

### Tasks

#### `GET /api/tasks`
List all tasks.

**Response**: `200 OK`
```json
[
  {
    "id": "TASK-001",
    "title": "Project Setup",
    "description": "Initialize project structure",
    "status": "done",
    "priority": "high",
    "effort": 2,
    "dependencies": [],
    "assignee": null,
    "createdAt": "2026-02-08T10:00:00Z",
    "updatedAt": "2026-02-08T12:00:00Z"
  }
]
```

---

#### `GET /api/tasks/:id`
Get a specific task by ID.

**Parameters**: `id` (string) - Task identifier (e.g., "TASK-001")

**Response**: `200 OK` - Task object
**Response**: `404 Not Found` - `{ "error": "Task not found" }`

---

#### `POST /api/tasks`
Create a new task. Broadcasts `task-created` to WebSocket clients.

**Body**:
```json
{
  "title": "New task",
  "description": "Task description",
  "priority": "high",
  "effort": 3,
  "dependencies": ["TASK-001"]
}
```

**Response**: `201 Created` - Created task object (with generated id, timestamps)

---

#### `PATCH /api/tasks/:id`
Update an existing task. Broadcasts `task-updated` to WebSocket clients.

**Parameters**: `id` (string) - Task identifier

**Body** (partial update):
```json
{
  "status": "in-progress",
  "assignee": "developer-1"
}
```

**Response**: `200 OK` - Updated task object
**Response**: `404 Not Found` - `{ "error": "Task not found" }`

---

#### `DELETE /api/tasks/:id`
Delete a task. Broadcasts `task-deleted` to WebSocket clients.

**Parameters**: `id` (string) - Task identifier

**Response**: `200 OK` - `{ "success": true }`
**Response**: `404 Not Found` - `{ "error": "Task not found" }`

---

### Project

#### `GET /api/project`
Get project information and task statistics.

**Response**: `200 OK`
```json
{
  "name": "bsr-method",
  "version": "0.1.0",
  "description": "AI-driven development framework",
  "stats": {
    "total": 49,
    "todo": 30,
    "inProgress": 5,
    "blocked": 2,
    "done": 12
  }
}
```

---

### Logs

#### `GET /api/logs`
Get the last 10 log files (max 5000 chars each).

**Response**: `200 OK`
```json
[
  {
    "filename": "2026-02-08-run.log",
    "content": "..."
  }
]
```

---

## WebSocket

### Endpoint: `WS /ws`

Bidirectional WebSocket for real-time task updates.

### Client -> Server Messages

#### `update-task`
Request a task update.
```json
{
  "type": "update-task",
  "taskId": "TASK-001",
  "data": { "status": "done" }
}
```

#### `refresh`
Request full task list refresh.
```json
{
  "type": "refresh"
}
```

### Server -> Client Broadcasts

Sent to all connected clients when tasks change via REST API:

#### `task-updated`
```json
{
  "type": "task-updated",
  "task": { /* full task object */ }
}
```

#### `task-created`
```json
{
  "type": "task-created",
  "task": { /* full task object */ }
}
```

#### `task-deleted`
```json
{
  "type": "task-deleted",
  "taskId": "TASK-001"
}
```

#### `tasks-refreshed`
```json
{
  "type": "tasks-refreshed",
  "tasks": [ /* full task list */ ]
}
```

## Data Persistence

All task data is persisted to `tasks/breakdown.json` on every write operation (POST, PATCH, DELETE). The file is the single source of truth and is also consumed by the CLI (`bsr tasks`, `bsr status`, `bsr export`).

## Static Files

The server serves static files from the `public/` directory at the root path (`/`). This is where the dashboard frontend HTML/CSS/JS lives.

---
*BSR Method - Dashboard API Specification*
