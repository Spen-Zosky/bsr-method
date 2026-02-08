# UI Specification - Dashboard

**Project**: BSR Method
**Package**: `packages/dashboard`
**Date**: 2026-02-08

---

## Overview

The BSR Dashboard is a single-page web application served by the Fastify server. It provides real-time task visualization and management through a WebSocket connection.

## Design Principles

- Clean and minimal (developer-focused tool)
- Real-time updates via WebSocket (no page refreshes)
- Works fully offline against local `tasks/breakdown.json`
- Responsive for desktop use (primary target)

## Page: Task Dashboard

The dashboard is a single page with the following sections:

### Header
- Project name and version (from `GET /api/project`)
- Task statistics: total, todo, in-progress, blocked, done
- Connection status indicator (WebSocket connected/disconnected)

### Task Board
Kanban-style board with 4 columns:

| Column | Status | Color |
|--------|--------|-------|
| To Do | `todo` | Gray |
| In Progress | `in-progress` | Blue |
| Blocked | `blocked` | Red |
| Done | `done` | Green |

### Task Card
Each task displayed as a card showing:
- **Title** (bold)
- **Priority badge**: high (red), medium (yellow), low (gray)
- **Effort** in story points
- **Dependencies** as linked task IDs
- **Assignee** (if set)

### Task Actions
- Click card to view details
- Change status via dropdown or drag between columns
- Edit task fields inline
- Create new task via form

### Sidebar (optional)
- Filter by priority (high/medium/low)
- Filter by assignee
- Search by title/description
- Dependency graph view

## Real-Time Behavior

1. Client connects to `WS /ws` on page load
2. Server broadcasts changes when tasks are modified via REST API
3. Client updates UI in-place without full page refresh
4. Reconnection logic with exponential backoff on disconnect

## Technology

- HTML/CSS/JS served as static files from `public/` directory
- No build step required for frontend (vanilla JS or lightweight framework)
- Tailwind CSS for styling (consistent with export reports)
- WebSocket native API

## Responsive Breakpoints

| Name | Min Width | Layout |
|------|-----------|--------|
| sm | 640px | Single column (stacked) |
| md | 768px | 2-column board |
| lg | 1024px | 4-column kanban board |

## Accessibility

- Semantic HTML elements
- Keyboard navigation for task cards
- Color + icon for status (not color-only)
- ARIA labels on interactive elements

---
*BSR Method - Dashboard UI Specification*
