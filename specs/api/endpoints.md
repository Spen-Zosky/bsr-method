# API Specification

**Project**: BSR Method
**Date**: 2026-02-08
**Version**: 1.0

---

## Overview

REST API for BSR Method.

Base URL: `/api/v1`

## Authentication

```
Authorization: Bearer <token>
```

## Endpoints


### 1. CLI with 11 commands covering the full development lifecycle

#### GET /api/v1/cli-with-11-commands-covering-the-full-development-lifecycle
List all cli-with-11-commands-covering-the-full-development-lifecycle items.

**Response**
```json
{
  "data": [],
  "meta": { "total": 0, "page": 1 }
}
```

#### POST /api/v1/cli-with-11-commands-covering-the-full-development-lifecycle
Create new cli-with-11-commands-covering-the-full-development-lifecycle item.

**Request**
```json
{
  "name": "string"
}
```

#### GET /api/v1/cli-with-11-commands-covering-the-full-development-lifecycle/:id
Get single cli-with-11-commands-covering-the-full-development-lifecycle item.

#### PUT /api/v1/cli-with-11-commands-covering-the-full-development-lifecycle/:id
Update cli-with-11-commands-covering-the-full-development-lifecycle item.

#### DELETE /api/v1/cli-with-11-commands-covering-the-full-development-lifecycle/:id
Delete cli-with-11-commands-covering-the-full-development-lifecycle item.

---

### 2. BMAD planning phase: idea -> PRD -> architecture

#### GET /api/v1/bmad-planning-phase-idea-prd-architecture
List all bmad-planning-phase-idea-prd-architecture items.

**Response**
```json
{
  "data": [],
  "meta": { "total": 0, "page": 1 }
}
```

#### POST /api/v1/bmad-planning-phase-idea-prd-architecture
Create new bmad-planning-phase-idea-prd-architecture item.

**Request**
```json
{
  "name": "string"
}
```

#### GET /api/v1/bmad-planning-phase-idea-prd-architecture/:id
Get single bmad-planning-phase-idea-prd-architecture item.

#### PUT /api/v1/bmad-planning-phase-idea-prd-architecture/:id
Update bmad-planning-phase-idea-prd-architecture item.

#### DELETE /api/v1/bmad-planning-phase-idea-prd-architecture/:id
Delete bmad-planning-phase-idea-prd-architecture item.

---

### 3. SpecKit specification phase: constitution, feature specs, API specs

#### GET /api/v1/speckit-specification-phase-constitution-feature-specs-api-specs
List all speckit-specification-phase-constitution-feature-specs-api-specs items.

**Response**
```json
{
  "data": [],
  "meta": { "total": 0, "page": 1 }
}
```

#### POST /api/v1/speckit-specification-phase-constitution-feature-specs-api-specs
Create new speckit-specification-phase-constitution-feature-specs-api-specs item.

**Request**
```json
{
  "name": "string"
}
```

#### GET /api/v1/speckit-specification-phase-constitution-feature-specs-api-specs/:id
Get single speckit-specification-phase-constitution-feature-specs-api-specs item.

#### PUT /api/v1/speckit-specification-phase-constitution-feature-specs-api-specs/:id
Update speckit-specification-phase-constitution-feature-specs-api-specs item.

#### DELETE /api/v1/speckit-specification-phase-constitution-feature-specs-api-specs/:id
Delete speckit-specification-phase-constitution-feature-specs-api-specs item.

---

### 4. Ralph execution loop: LLM-powered task implementation

#### GET /api/v1/ralph-execution-loop-llm-powered-task-implementation
List all ralph-execution-loop-llm-powered-task-implementation items.

**Response**
```json
{
  "data": [],
  "meta": { "total": 0, "page": 1 }
}
```

#### POST /api/v1/ralph-execution-loop-llm-powered-task-implementation
Create new ralph-execution-loop-llm-powered-task-implementation item.

**Request**
```json
{
  "name": "string"
}
```

#### GET /api/v1/ralph-execution-loop-llm-powered-task-implementation/:id
Get single ralph-execution-loop-llm-powered-task-implementation item.

#### PUT /api/v1/ralph-execution-loop-llm-powered-task-implementation/:id
Update ralph-execution-loop-llm-powered-task-implementation item.

#### DELETE /api/v1/ralph-execution-loop-llm-powered-task-implementation/:id
Delete ralph-execution-loop-llm-powered-task-implementation item.

---

### 5. Brownfield discovery: analyze existing codebases

#### GET /api/v1/brownfield-discovery-analyze-existing-codebases
List all brownfield-discovery-analyze-existing-codebases items.

**Response**
```json
{
  "data": [],
  "meta": { "total": 0, "page": 1 }
}
```

#### POST /api/v1/brownfield-discovery-analyze-existing-codebases
Create new brownfield-discovery-analyze-existing-codebases item.

**Request**
```json
{
  "name": "string"
}
```

#### GET /api/v1/brownfield-discovery-analyze-existing-codebases/:id
Get single brownfield-discovery-analyze-existing-codebases item.

#### PUT /api/v1/brownfield-discovery-analyze-existing-codebases/:id
Update brownfield-discovery-analyze-existing-codebases item.

#### DELETE /api/v1/brownfield-discovery-analyze-existing-codebases/:id
Delete brownfield-discovery-analyze-existing-codebases item.

---

### 6. Task breakdown with dependencies and priority

#### GET /api/v1/task-breakdown-with-dependencies-and-priority
List all task-breakdown-with-dependencies-and-priority items.

**Response**
```json
{
  "data": [],
  "meta": { "total": 0, "page": 1 }
}
```

#### POST /api/v1/task-breakdown-with-dependencies-and-priority
Create new task-breakdown-with-dependencies-and-priority item.

**Request**
```json
{
  "name": "string"
}
```

#### GET /api/v1/task-breakdown-with-dependencies-and-priority/:id
Get single task-breakdown-with-dependencies-and-priority item.

#### PUT /api/v1/task-breakdown-with-dependencies-and-priority/:id
Update task-breakdown-with-dependencies-and-priority item.

#### DELETE /api/v1/task-breakdown-with-dependencies-and-priority/:id
Delete task-breakdown-with-dependencies-and-priority item.

---

### 7. Web dashboard for task visualization

#### GET /api/v1/web-dashboard-for-task-visualization
List all web-dashboard-for-task-visualization items.

**Response**
```json
{
  "data": [],
  "meta": { "total": 0, "page": 1 }
}
```

#### POST /api/v1/web-dashboard-for-task-visualization
Create new web-dashboard-for-task-visualization item.

**Request**
```json
{
  "name": "string"
}
```

#### GET /api/v1/web-dashboard-for-task-visualization/:id
Get single web-dashboard-for-task-visualization item.

#### PUT /api/v1/web-dashboard-for-task-visualization/:id
Update web-dashboard-for-task-visualization item.

#### DELETE /api/v1/web-dashboard-for-task-visualization/:id
Delete web-dashboard-for-task-visualization item.

---

### 8. MCP server for Claude Desktop integration

#### GET /api/v1/mcp-server-for-claude-desktop-integration
List all mcp-server-for-claude-desktop-integration items.

**Response**
```json
{
  "data": [],
  "meta": { "total": 0, "page": 1 }
}
```

#### POST /api/v1/mcp-server-for-claude-desktop-integration
Create new mcp-server-for-claude-desktop-integration item.

**Request**
```json
{
  "name": "string"
}
```

#### GET /api/v1/mcp-server-for-claude-desktop-integration/:id
Get single mcp-server-for-claude-desktop-integration item.

#### PUT /api/v1/mcp-server-for-claude-desktop-integration/:id
Update mcp-server-for-claude-desktop-integration item.

#### DELETE /api/v1/mcp-server-for-claude-desktop-integration/:id
Delete mcp-server-for-claude-desktop-integration item.

---

### 9. Multi-LLM support (Claude, OpenAI)

#### GET /api/v1/multi-llm-support-claude-openai
List all multi-llm-support-claude-openai items.

**Response**
```json
{
  "data": [],
  "meta": { "total": 0, "page": 1 }
}
```

#### POST /api/v1/multi-llm-support-claude-openai
Create new multi-llm-support-claude-openai item.

**Request**
```json
{
  "name": "string"
}
```

#### GET /api/v1/multi-llm-support-claude-openai/:id
Get single multi-llm-support-claude-openai item.

#### PUT /api/v1/multi-llm-support-claude-openai/:id
Update multi-llm-support-claude-openai item.

#### DELETE /api/v1/multi-llm-support-claude-openai/:id
Delete multi-llm-support-claude-openai item.

---

### 10. Export to markdown, HTML, PDF

#### GET /api/v1/export-to-markdown-html-pdf
List all export-to-markdown-html-pdf items.

**Response**
```json
{
  "data": [],
  "meta": { "total": 0, "page": 1 }
}
```

#### POST /api/v1/export-to-markdown-html-pdf
Create new export-to-markdown-html-pdf item.

**Request**
```json
{
  "name": "string"
}
```

#### GET /api/v1/export-to-markdown-html-pdf/:id
Get single export-to-markdown-html-pdf item.

#### PUT /api/v1/export-to-markdown-html-pdf/:id
Update export-to-markdown-html-pdf item.

#### DELETE /api/v1/export-to-markdown-html-pdf/:id
Delete export-to-markdown-html-pdf item.


## Error Responses

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Invalid input |
| UNAUTHORIZED | 401 | Authentication required |
| NOT_FOUND | 404 | Resource not found |
| SERVER_ERROR | 500 | Internal error |

---
*BSR Method - SpecKit API Specification*
