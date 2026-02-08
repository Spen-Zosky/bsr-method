# Data Model Specification

**Project**: BSR Method
**Date**: 2026-02-08

---

## Overview

Data models for BSR Method.

## Core Entities

### Base Entity
```typescript
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
```


### CliWith11CommandsCoveringTheFullDevelopmentLifecycle
```typescript
interface CliWith11CommandsCoveringTheFullDevelopmentLifecycle extends BaseEntity {
  name: string;
  // Add fields specific to CLI with 11 commands covering the full development lifecycle
}
```


### BmadPlanningPhaseIdeaPrdArchitecture
```typescript
interface BmadPlanningPhaseIdeaPrdArchitecture extends BaseEntity {
  name: string;
  // Add fields specific to BMAD planning phase: idea -> PRD -> architecture
}
```


### SpeckitSpecificationPhaseConstitutionFeatureSpecsApiSpecs
```typescript
interface SpeckitSpecificationPhaseConstitutionFeatureSpecsApiSpecs extends BaseEntity {
  name: string;
  // Add fields specific to SpecKit specification phase: constitution, feature specs, API specs
}
```


### RalphExecutionLoopLlmPoweredTaskImplementation
```typescript
interface RalphExecutionLoopLlmPoweredTaskImplementation extends BaseEntity {
  name: string;
  // Add fields specific to Ralph execution loop: LLM-powered task implementation
}
```


### BrownfieldDiscoveryAnalyzeExistingCodebases
```typescript
interface BrownfieldDiscoveryAnalyzeExistingCodebases extends BaseEntity {
  name: string;
  // Add fields specific to Brownfield discovery: analyze existing codebases
}
```


### TaskBreakdownWithDependenciesAndPriority
```typescript
interface TaskBreakdownWithDependenciesAndPriority extends BaseEntity {
  name: string;
  // Add fields specific to Task breakdown with dependencies and priority
}
```


### WebDashboardForTaskVisualization
```typescript
interface WebDashboardForTaskVisualization extends BaseEntity {
  name: string;
  // Add fields specific to Web dashboard for task visualization
}
```


### McpServerForClaudeDesktopIntegration
```typescript
interface McpServerForClaudeDesktopIntegration extends BaseEntity {
  name: string;
  // Add fields specific to MCP server for Claude Desktop integration
}
```


### MultiLlmSupportClaudeOpenai
```typescript
interface MultiLlmSupportClaudeOpenai extends BaseEntity {
  name: string;
  // Add fields specific to Multi-LLM support (Claude, OpenAI)
}
```


### ExportToMarkdownHtmlPdf
```typescript
interface ExportToMarkdownHtmlPdf extends BaseEntity {
  name: string;
  // Add fields specific to Export to markdown, HTML, PDF
}
```


## Relationships

```
[CliWith11CommandsCoveringTheFullDevelopmentLifecycle] -- [BmadPlanningPhaseIdeaPrdArchitecture] -- [SpeckitSpecificationPhaseConstitutionFeatureSpecsApiSpecs] -- [RalphExecutionLoopLlmPoweredTaskImplementation] -- [BrownfieldDiscoveryAnalyzeExistingCodebases] -- [TaskBreakdownWithDependenciesAndPriority] -- [WebDashboardForTaskVisualization] -- [McpServerForClaudeDesktopIntegration] -- [MultiLlmSupportClaudeOpenai] -- [ExportToMarkdownHtmlPdf]
```

## Indexes

| Entity | Field | Type | Reason |
|--------|-------|------|--------|
| CliWith11CommandsCoveringTheFullDevelopmentLifecycle | id | Primary | Lookup |
| BmadPlanningPhaseIdeaPrdArchitecture | id | Primary | Lookup |
| SpeckitSpecificationPhaseConstitutionFeatureSpecsApiSpecs | id | Primary | Lookup |
| RalphExecutionLoopLlmPoweredTaskImplementation | id | Primary | Lookup |
| BrownfieldDiscoveryAnalyzeExistingCodebases | id | Primary | Lookup |
| TaskBreakdownWithDependenciesAndPriority | id | Primary | Lookup |
| WebDashboardForTaskVisualization | id | Primary | Lookup |
| McpServerForClaudeDesktopIntegration | id | Primary | Lookup |
| MultiLlmSupportClaudeOpenai | id | Primary | Lookup |
| ExportToMarkdownHtmlPdf | id | Primary | Lookup |

## Migrations

Track schema changes in `migrations/` directory.

---
*BSR Method - SpecKit Data Specification*
