# UI Specification

**Project**: BSR Method
**Date**: 2026-02-08

---

## Overview

User interface components for BSR Method.

## Design Principles

- Clean and minimal
- Consistent spacing and typography
- Accessible (WCAG 2.1 AA)
- Responsive design

## Component Library

### Base Components
- Button (primary, secondary, danger)
- Input (text, number, select)
- Card
- Modal
- Toast/Notification

### Feature Components


### CLI with 11 commands covering the full development lifecycle Components

#### CliWith11CommandsCoveringTheFullDevelopmentLifecycleList
Display list of cli-with-11-commands-covering-the-full-development-lifecycle items.

```tsx
<CliWith11CommandsCoveringTheFullDevelopmentLifecycleList 
  items={cli-with-11-commands-covering-the-full-development-lifecycleItems}
  onSelect={(item) => handleSelect(item)}
/>
```

#### CliWith11CommandsCoveringTheFullDevelopmentLifecycleForm
Create/edit cli-with-11-commands-covering-the-full-development-lifecycle item.

```tsx
<CliWith11CommandsCoveringTheFullDevelopmentLifecycleForm
  initialData={item}
  onSubmit={(data) => handleSubmit(data)}
  onCancel={() => handleCancel()}
/>
```


### BMAD planning phase: idea -> PRD -> architecture Components

#### BmadPlanningPhaseIdeaPrdArchitectureList
Display list of bmad-planning-phase-idea-prd-architecture items.

```tsx
<BmadPlanningPhaseIdeaPrdArchitectureList 
  items={bmad-planning-phase-idea-prd-architectureItems}
  onSelect={(item) => handleSelect(item)}
/>
```

#### BmadPlanningPhaseIdeaPrdArchitectureForm
Create/edit bmad-planning-phase-idea-prd-architecture item.

```tsx
<BmadPlanningPhaseIdeaPrdArchitectureForm
  initialData={item}
  onSubmit={(data) => handleSubmit(data)}
  onCancel={() => handleCancel()}
/>
```


### SpecKit specification phase: constitution, feature specs, API specs Components

#### SpeckitSpecificationPhaseConstitutionFeatureSpecsApiSpecsList
Display list of speckit-specification-phase-constitution-feature-specs-api-specs items.

```tsx
<SpeckitSpecificationPhaseConstitutionFeatureSpecsApiSpecsList 
  items={speckit-specification-phase-constitution-feature-specs-api-specsItems}
  onSelect={(item) => handleSelect(item)}
/>
```

#### SpeckitSpecificationPhaseConstitutionFeatureSpecsApiSpecsForm
Create/edit speckit-specification-phase-constitution-feature-specs-api-specs item.

```tsx
<SpeckitSpecificationPhaseConstitutionFeatureSpecsApiSpecsForm
  initialData={item}
  onSubmit={(data) => handleSubmit(data)}
  onCancel={() => handleCancel()}
/>
```


### Ralph execution loop: LLM-powered task implementation Components

#### RalphExecutionLoopLlmPoweredTaskImplementationList
Display list of ralph-execution-loop-llm-powered-task-implementation items.

```tsx
<RalphExecutionLoopLlmPoweredTaskImplementationList 
  items={ralph-execution-loop-llm-powered-task-implementationItems}
  onSelect={(item) => handleSelect(item)}
/>
```

#### RalphExecutionLoopLlmPoweredTaskImplementationForm
Create/edit ralph-execution-loop-llm-powered-task-implementation item.

```tsx
<RalphExecutionLoopLlmPoweredTaskImplementationForm
  initialData={item}
  onSubmit={(data) => handleSubmit(data)}
  onCancel={() => handleCancel()}
/>
```


### Brownfield discovery: analyze existing codebases Components

#### BrownfieldDiscoveryAnalyzeExistingCodebasesList
Display list of brownfield-discovery-analyze-existing-codebases items.

```tsx
<BrownfieldDiscoveryAnalyzeExistingCodebasesList 
  items={brownfield-discovery-analyze-existing-codebasesItems}
  onSelect={(item) => handleSelect(item)}
/>
```

#### BrownfieldDiscoveryAnalyzeExistingCodebasesForm
Create/edit brownfield-discovery-analyze-existing-codebases item.

```tsx
<BrownfieldDiscoveryAnalyzeExistingCodebasesForm
  initialData={item}
  onSubmit={(data) => handleSubmit(data)}
  onCancel={() => handleCancel()}
/>
```


### Task breakdown with dependencies and priority Components

#### TaskBreakdownWithDependenciesAndPriorityList
Display list of task-breakdown-with-dependencies-and-priority items.

```tsx
<TaskBreakdownWithDependenciesAndPriorityList 
  items={task-breakdown-with-dependencies-and-priorityItems}
  onSelect={(item) => handleSelect(item)}
/>
```

#### TaskBreakdownWithDependenciesAndPriorityForm
Create/edit task-breakdown-with-dependencies-and-priority item.

```tsx
<TaskBreakdownWithDependenciesAndPriorityForm
  initialData={item}
  onSubmit={(data) => handleSubmit(data)}
  onCancel={() => handleCancel()}
/>
```


### Web dashboard for task visualization Components

#### WebDashboardForTaskVisualizationList
Display list of web-dashboard-for-task-visualization items.

```tsx
<WebDashboardForTaskVisualizationList 
  items={web-dashboard-for-task-visualizationItems}
  onSelect={(item) => handleSelect(item)}
/>
```

#### WebDashboardForTaskVisualizationForm
Create/edit web-dashboard-for-task-visualization item.

```tsx
<WebDashboardForTaskVisualizationForm
  initialData={item}
  onSubmit={(data) => handleSubmit(data)}
  onCancel={() => handleCancel()}
/>
```


### MCP server for Claude Desktop integration Components

#### McpServerForClaudeDesktopIntegrationList
Display list of mcp-server-for-claude-desktop-integration items.

```tsx
<McpServerForClaudeDesktopIntegrationList 
  items={mcp-server-for-claude-desktop-integrationItems}
  onSelect={(item) => handleSelect(item)}
/>
```

#### McpServerForClaudeDesktopIntegrationForm
Create/edit mcp-server-for-claude-desktop-integration item.

```tsx
<McpServerForClaudeDesktopIntegrationForm
  initialData={item}
  onSubmit={(data) => handleSubmit(data)}
  onCancel={() => handleCancel()}
/>
```


### Multi-LLM support (Claude, OpenAI) Components

#### MultiLlmSupportClaudeOpenaiList
Display list of multi-llm-support-claude-openai items.

```tsx
<MultiLlmSupportClaudeOpenaiList 
  items={multi-llm-support-claude-openaiItems}
  onSelect={(item) => handleSelect(item)}
/>
```

#### MultiLlmSupportClaudeOpenaiForm
Create/edit multi-llm-support-claude-openai item.

```tsx
<MultiLlmSupportClaudeOpenaiForm
  initialData={item}
  onSubmit={(data) => handleSubmit(data)}
  onCancel={() => handleCancel()}
/>
```


### Export to markdown, HTML, PDF Components

#### ExportToMarkdownHtmlPdfList
Display list of export-to-markdown-html-pdf items.

```tsx
<ExportToMarkdownHtmlPdfList 
  items={export-to-markdown-html-pdfItems}
  onSelect={(item) => handleSelect(item)}
/>
```

#### ExportToMarkdownHtmlPdfForm
Create/edit export-to-markdown-html-pdf item.

```tsx
<ExportToMarkdownHtmlPdfForm
  initialData={item}
  onSubmit={(data) => handleSubmit(data)}
  onCancel={() => handleCancel()}
/>
```


## Layout

```
┌─────────────────────────────────────┐
│            Header/Nav               │
├─────────────────────────────────────┤
│  Sidebar  │      Main Content       │
│           │                         │
│           │                         │
├───────────┴─────────────────────────┤
│              Footer                 │
└─────────────────────────────────────┘
```

## Responsive Breakpoints

| Name | Min Width | Description |
|------|-----------|-------------|
| sm | 640px | Mobile |
| md | 768px | Tablet |
| lg | 1024px | Desktop |
| xl | 1280px | Large desktop |

---
*BSR Method - SpecKit UI Specification*
