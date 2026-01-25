import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';

interface Feature {
  name: string;
  slug: string;
}

export const specCommand = new Command('spec')
  .description('Generate SpecKit specifications from PRD')
  .option('-f, --feature <name>', 'Generate spec for specific feature only')
  .option('--api', 'Include API specifications')
  .option('--data', 'Include data model specifications')
  .option('--ui', 'Include UI specifications')
  .option('--all', 'Generate all specification types')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n[BSR Spec] SpecKit Specification Generator\n'));

    if (!(await fs.pathExists('.bsr/config.yaml'))) {
      console.log(chalk.red('Error: BSR not initialized. Run bsr init first.\n'));
      process.exit(1);
    }

    if (!(await fs.pathExists('docs/idea.yaml'))) {
      console.log(chalk.red('Error: No idea defined. Run bsr plan first.\n'));
      process.exit(1);
    }

    const idea = yaml.parse(await fs.readFile('docs/idea.yaml', 'utf-8'));
    const projectName = idea.name || 'Project';
    const features: Feature[] = (idea.coreFeatures || []).map((f: string) => ({
      name: f,
      slug: slugify(f),
    }));

    console.log(chalk.gray(`Project: ${projectName}`));
    console.log(chalk.gray(`Features: ${features.length}\n`));

    await fs.ensureDir('specs/features');
    await fs.ensureDir('specs/api');
    await fs.ensureDir('specs/data');
    await fs.ensureDir('specs/ui');

    // Generate constitution (SpecKit core concept)
    console.log(chalk.cyan('Step 1: Generating Constitution...\n'));
    const constSpinner = ora('Creating project constitution...').start();
    const constitution = generateConstitution(idea);
    await fs.writeFile('specs/CONSTITUTION.md', constitution);
    constSpinner.succeed('Generated Constitution');
    console.log(chalk.green('Saved: specs/CONSTITUTION.md'));

    // Generate feature specs
    console.log(chalk.cyan('\nStep 2: Generating Feature Specifications...\n'));
    
    const featuresToProcess = options.feature 
      ? features.filter((f: Feature) => f.name.toLowerCase().includes(options.feature.toLowerCase()))
      : features;

    if (featuresToProcess.length === 0) {
      console.log(chalk.yellow('No features found matching criteria.'));
    }

    for (const feature of featuresToProcess) {
      const spinner = ora(`Generating spec: ${feature.name}`).start();
      const spec = generateFeatureSpec(feature, idea);
      await fs.writeFile(`specs/features/${feature.slug}.md`, spec);
      spinner.succeed(`Generated: ${feature.name}`);
    }

    // Generate API specs if requested
    if (options.api || options.all) {
      console.log(chalk.cyan('\nStep 3: Generating API Specifications...\n'));
      const apiSpinner = ora('Creating API specs...').start();
      const apiSpec = generateAPISpec(idea, features);
      await fs.writeFile('specs/api/endpoints.md', apiSpec);
      apiSpinner.succeed('Generated API specs');
      console.log(chalk.green('Saved: specs/api/endpoints.md'));
    }

    // Generate data model specs if requested
    if (options.data || options.all) {
      console.log(chalk.cyan('\nStep 4: Generating Data Model Specifications...\n'));
      const dataSpinner = ora('Creating data models...').start();
      const dataSpec = generateDataSpec(idea, features);
      await fs.writeFile('specs/data/models.md', dataSpec);
      dataSpinner.succeed('Generated data models');
      console.log(chalk.green('Saved: specs/data/models.md'));
    }

    // Generate UI specs if requested
    if (options.ui || options.all) {
      console.log(chalk.cyan('\nStep 5: Generating UI Specifications...\n'));
      const uiSpinner = ora('Creating UI specs...').start();
      const uiSpec = generateUISpec(idea, features);
      await fs.writeFile('specs/ui/components.md', uiSpec);
      uiSpinner.succeed('Generated UI specs');
      console.log(chalk.green('Saved: specs/ui/components.md'));
    }

    // Update specs README
    const readmeSpinner = ora('Updating specs index...').start();
    const specsReadme = generateSpecsReadme(idea, features, options);
    await fs.writeFile('specs/README.md', specsReadme);
    readmeSpinner.succeed('Updated specs index');

    // Update progress
    await updateProgress('specifications', 'complete');

    // Summary
    console.log(chalk.blue.bold('\n' + '='.repeat(50)));
    console.log(chalk.blue.bold('Specification Phase Complete!'));
    console.log(chalk.blue.bold('='.repeat(50)));
    console.log('\nGenerated:');
    console.log('  - specs/CONSTITUTION.md');
    featuresToProcess.forEach((f: Feature) => {
      console.log(`  - specs/features/${f.slug}.md`);
    });
    if (options.api || options.all) console.log('  - specs/api/endpoints.md');
    if (options.data || options.all) console.log('  - specs/data/models.md');
    if (options.ui || options.all) console.log('  - specs/ui/components.md');
    console.log(chalk.blue('\nNext: Run bsr tasks to generate task breakdown\n'));
  });

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function generateConstitution(idea: any): string {
  return `# ${idea.name} - Project Constitution

> ${idea.tagline}

## Purpose

This document defines the governing principles and standards for ${idea.name}.
All specifications and implementations must adhere to these principles.

## Core Principles

### 1. User-Centric Design
- All features serve the needs of: ${idea.targetUsers}
- User experience takes priority over technical convenience
- Accessibility is a requirement, not an afterthought

### 2. Code Quality
- TypeScript strict mode enabled
- All public APIs documented
- Test coverage minimum: 80%
- No any types without explicit justification

### 3. Performance
- Response time target: < 200ms
- Bundle size awareness
- Lazy loading where appropriate

### 4. Security
- Input validation on all user data
- No secrets in code
- Principle of least privilege

### 5. Maintainability
- Clear separation of concerns
- Consistent naming conventions
- Self-documenting code preferred

## Technical Standards

### Naming Conventions
- Files: kebab-case (e.g., \`user-service.ts\`)
- Classes: PascalCase (e.g., \`UserService\`)
- Functions: camelCase (e.g., \`getUserById\`)
- Constants: SCREAMING_SNAKE_CASE (e.g., \`MAX_RETRIES\`)

### File Structure
\`\`\`
src/
├── core/           # Business logic (no I/O)
├── services/       # External integrations
├── api/            # API handlers
├── utils/          # Pure utility functions
└── types/          # TypeScript types
\`\`\`

### Error Handling
- Use typed errors (custom Error classes)
- Always handle Promise rejections
- Log errors with context

### Testing
- Unit tests for business logic
- Integration tests for APIs
- E2E tests for critical paths

## Definition of Done

A feature is complete when:
- [ ] All acceptance criteria met
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] No TypeScript errors
- [ ] No linting warnings

## Change Process

1. Create specification in \`specs/features/\`
2. Review specification
3. Implement feature
4. Write tests
5. Update documentation
6. Submit for review

---
*BSR Method - SpecKit Constitution*
`;
}

function generateFeatureSpec(feature: Feature, idea: any): string {
  const date = new Date().toISOString().split('T')[0];
  
  return `# Feature Specification: ${feature.name}

**Project**: ${idea.name}
**Feature**: ${feature.name}
**Date**: ${date}
**Status**: Draft

---

## Overview

### Description
Implementation of "${feature.name}" functionality for ${idea.name}.

### User Story
As a ${idea.targetUsers || 'user'},
I want to ${feature.name.toLowerCase()},
So that I can accomplish my goals efficiently.

### Acceptance Criteria
- [ ] Feature is accessible from the main interface
- [ ] Feature handles edge cases gracefully
- [ ] Feature provides appropriate feedback
- [ ] Feature is performant (< 200ms response)
- [ ] Feature is accessible (keyboard navigation, screen readers)

---

## Functional Requirements

### Inputs
| Input | Type | Required | Description |
|-------|------|----------|-------------|
| TBD | TBD | TBD | Define inputs |

### Outputs
| Output | Type | Description |
|--------|------|-------------|
| TBD | TBD | Define outputs |

### Business Rules
1. Define business rules for ${feature.name}
2. Add validation rules
3. Add constraints

---

## Technical Design

### Components
\`\`\`
${feature.slug}/
├── index.ts           # Public exports
├── ${feature.slug}.ts         # Main implementation
├── ${feature.slug}.test.ts    # Tests
└── types.ts           # Types for this feature
\`\`\`

### Dependencies
- Internal: core utilities, types
- External: TBD

### Interfaces

\`\`\`typescript
// ${feature.name} Types
interface ${toPascalCase(feature.slug)}Input {
  // Define input type
}

interface ${toPascalCase(feature.slug)}Output {
  // Define output type
}

// Main function signature
function ${toCamelCase(feature.slug)}(
  input: ${toPascalCase(feature.slug)}Input
): Promise<${toPascalCase(feature.slug)}Output>;
\`\`\`

---

## Error Handling

| Error | Condition | User Message |
|-------|-----------|--------------|
| ValidationError | Invalid input | "Please check your input" |
| NotFoundError | Resource missing | "Item not found" |

---

## Testing Strategy

### Unit Tests
- Test happy path
- Test edge cases
- Test error conditions

### Integration Tests
- Test with real dependencies
- Test API endpoints

### Test Cases
| ID | Description | Expected Result |
|----|-------------|-----------------|
| TC-001 | Basic functionality | Success |
| TC-002 | Invalid input | Validation error |
| TC-003 | Edge case | Graceful handling |

---

## Implementation Notes

### Estimated Effort
- Development: 2-4 hours
- Testing: 1-2 hours
- Documentation: 30 min

### Risks
- TBD

### Open Questions
- TBD

---
*BSR Method - SpecKit Feature Specification*
`;
}

function generateAPISpec(idea: any, features: Feature[]): string {
  const date = new Date().toISOString().split('T')[0];
  
  return `# API Specification

**Project**: ${idea.name}
**Date**: ${date}
**Version**: 1.0

---

## Overview

REST API for ${idea.name}.

Base URL: \`/api/v1\`

## Authentication

\`\`\`
Authorization: Bearer <token>
\`\`\`

## Endpoints

${features.map((f, i) => `
### ${i + 1}. ${f.name}

#### GET /api/v1/${f.slug}
List all ${f.slug} items.

**Response**
\`\`\`json
{
  "data": [],
  "meta": { "total": 0, "page": 1 }
}
\`\`\`

#### POST /api/v1/${f.slug}
Create new ${f.slug} item.

**Request**
\`\`\`json
{
  "name": "string"
}
\`\`\`

#### GET /api/v1/${f.slug}/:id
Get single ${f.slug} item.

#### PUT /api/v1/${f.slug}/:id
Update ${f.slug} item.

#### DELETE /api/v1/${f.slug}/:id
Delete ${f.slug} item.
`).join('\n---\n')}

## Error Responses

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
\`\`\`

| Code | Status | Description |
|------|--------|-------------|
| VALIDATION_ERROR | 400 | Invalid input |
| UNAUTHORIZED | 401 | Authentication required |
| NOT_FOUND | 404 | Resource not found |
| SERVER_ERROR | 500 | Internal error |

---
*BSR Method - SpecKit API Specification*
`;
}

function generateDataSpec(idea: any, features: Feature[]): string {
  const date = new Date().toISOString().split('T')[0];
  
  return `# Data Model Specification

**Project**: ${idea.name}
**Date**: ${date}

---

## Overview

Data models for ${idea.name}.

## Core Entities

### Base Entity
\`\`\`typescript
interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
\`\`\`

${features.map((f) => `
### ${toPascalCase(f.slug)}
\`\`\`typescript
interface ${toPascalCase(f.slug)} extends BaseEntity {
  name: string;
  // Add fields specific to ${f.name}
}
\`\`\`
`).join('\n')}

## Relationships

\`\`\`
${features.map(f => `[${toPascalCase(f.slug)}]`).join(' -- ')}
\`\`\`

## Indexes

| Entity | Field | Type | Reason |
|--------|-------|------|--------|
${features.map(f => `| ${toPascalCase(f.slug)} | id | Primary | Lookup |`).join('\n')}

## Migrations

Track schema changes in \`migrations/\` directory.

---
*BSR Method - SpecKit Data Specification*
`;
}

function generateUISpec(idea: any, features: Feature[]): string {
  const date = new Date().toISOString().split('T')[0];
  
  return `# UI Specification

**Project**: ${idea.name}
**Date**: ${date}

---

## Overview

User interface components for ${idea.name}.

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

${features.map((f) => `
### ${f.name} Components

#### ${toPascalCase(f.slug)}List
Display list of ${f.slug} items.

\`\`\`tsx
<${toPascalCase(f.slug)}List 
  items={${f.slug}Items}
  onSelect={(item) => handleSelect(item)}
/>
\`\`\`

#### ${toPascalCase(f.slug)}Form
Create/edit ${f.slug} item.

\`\`\`tsx
<${toPascalCase(f.slug)}Form
  initialData={item}
  onSubmit={(data) => handleSubmit(data)}
  onCancel={() => handleCancel()}
/>
\`\`\`
`).join('\n')}

## Layout

\`\`\`
┌─────────────────────────────────────┐
│            Header/Nav               │
├─────────────────────────────────────┤
│  Sidebar  │      Main Content       │
│           │                         │
│           │                         │
├───────────┴─────────────────────────┤
│              Footer                 │
└─────────────────────────────────────┘
\`\`\`

## Responsive Breakpoints

| Name | Min Width | Description |
|------|-----------|-------------|
| sm | 640px | Mobile |
| md | 768px | Tablet |
| lg | 1024px | Desktop |
| xl | 1280px | Large desktop |

---
*BSR Method - SpecKit UI Specification*
`;
}

function generateSpecsReadme(idea: any, features: Feature[], options: any): string {
  return `# ${idea.name} - Specifications

> ${idea.tagline}

## Structure

\`\`\`
specs/
├── CONSTITUTION.md      # Project principles
├── README.md            # This file
├── features/            # Feature specs
${features.map(f => `│   └── ${f.slug}.md`).join('\n')}
${options.api || options.all ? '├── api/\n│   └── endpoints.md    # API specs' : ''}
${options.data || options.all ? '├── data/\n│   └── models.md       # Data models' : ''}
${options.ui || options.all ? '└── ui/\n    └── components.md   # UI specs' : ''}
\`\`\`

## Features

| Feature | Spec | Status |
|---------|------|--------|
${features.map(f => `| ${f.name} | [${f.slug}.md](features/${f.slug}.md) | Draft |`).join('\n')}

## Next Steps

1. Review each specification
2. Run \`bsr tasks\` to generate task breakdown
3. Run \`bsr run\` to start implementation

---
*Generated by BSR Method - SpecKit*
`;
}

function toPascalCase(str: string): string {
  return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

async function updateProgress(phase: string, status: string): Promise<void> {
  const progressPath = 'progress.txt';
  let content = await fs.pathExists(progressPath) ? await fs.readFile(progressPath, 'utf-8') : '';
  content = content.replace(/## Current Phase\n\w+/, `## Current Phase\n${phase}`);
  content = content.replace(/## Status\n\w+/, `## Status\n${status}`);
  const timestamp = new Date().toISOString();
  if (!content.includes('## History')) content += '\n## History\n';
  content += `- [${timestamp}] ${phase}: ${status}\n`;
  await fs.writeFile(progressPath, content);
}
