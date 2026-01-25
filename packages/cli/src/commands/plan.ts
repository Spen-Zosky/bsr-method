import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';

interface IdeaDefinition {
  name: string;
  tagline: string;
  domain: string;
  problemStatement: string;
  targetUsers: string;
  coreFeatures: string[];
  techPreferences: string;
  constraints: string;
}

export const planCommand = new Command('plan')
  .description('Run BMAD planning phase - generate PRD and Architecture')
  .option('--from-dps', 'Use Discovered Project State (brownfield)')
  .option('--idea <file>', 'Load idea from file')
  .option('-y, --yes', 'Use defaults where possible')
  .option('--skip-architecture', 'Skip architecture generation')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n[BSR Plan] BMAD Planning Phase\n'));

    if (!(await fs.pathExists('.bsr/config.yaml'))) {
      console.log(chalk.red('Error: BSR not initialized. Run bsr init first.\n'));
      process.exit(1);
    }

    const config = yaml.parse(await fs.readFile('.bsr/config.yaml', 'utf-8'));
    const projectName = config.project?.name || path.basename(process.cwd());
    const projectType = config.project?.type || 'greenfield';

    console.log(chalk.gray(`Project: ${projectName} (${projectType})\n`));

    let idea: IdeaDefinition;

    if (options.fromDps && projectType === 'brownfield') {
      const dpsPath = 'discovery/project-context.yaml';
      if (!(await fs.pathExists(dpsPath))) {
        console.log(chalk.red('DPS not found. Run bsr discover first.'));
        process.exit(1);
      }
      const dps = yaml.parse(await fs.readFile(dpsPath, 'utf-8'));
      idea = deriveIdeaFromDPS(dps, projectName);
      console.log(chalk.green('\nDerived IDEA from existing codebase:\n'));
      displayIdea(idea);
    } else if (options.idea) {
      if (!(await fs.pathExists(options.idea))) {
        console.log(chalk.red(`Idea file not found: ${options.idea}`));
        process.exit(1);
      }
      idea = yaml.parse(await fs.readFile(options.idea, 'utf-8'));
      console.log(chalk.green('Loaded idea from file\n'));
      displayIdea(idea);
    } else {
      console.log(chalk.cyan('Step 1: Define Your IDEA\n'));
      idea = await collectIdea(projectName);
    }

    await fs.ensureDir('docs');
    await fs.writeFile('docs/idea.yaml', yaml.stringify(idea));
    await fs.writeFile('docs/idea.md', generateIdeaMarkdown(idea));
    console.log(chalk.green('\nSaved: docs/idea.yaml, docs/idea.md'));

    console.log(chalk.cyan('\nStep 2: Generating PRD...\n'));
    const spinner = ora('BMAD PM Agent working...').start();
    const prd = generatePRD(idea);
    await fs.writeFile('docs/prd.md', prd);
    spinner.succeed('Generated PRD');
    console.log(chalk.green('Saved: docs/prd.md'));

    if (!options.skipArchitecture) {
      console.log(chalk.cyan('\nStep 3: Generating Architecture...\n'));
      const archSpinner = ora('BMAD Architect Agent working...').start();
      const architecture = generateArchitecture(idea);
      await fs.writeFile('docs/architecture.md', architecture);
      archSpinner.succeed('Generated Architecture');
      console.log(chalk.green('Saved: docs/architecture.md'));
    }

    console.log(chalk.cyan('\nStep 4: Generating Specs Outline...\n'));
    const specsSpinner = ora('Creating specs structure...').start();
    await fs.ensureDir('specs');
    await fs.ensureDir('specs/features');
    const specsOutline = generateSpecsOutline(idea);
    await fs.writeFile('specs/README.md', specsOutline);
    specsSpinner.succeed('Generated specs outline');
    console.log(chalk.green('Saved: specs/README.md'));

    await updateProgress('planning', 'complete');

    console.log(chalk.blue.bold('\n' + '='.repeat(50)));
    console.log(chalk.blue.bold('Planning Phase Complete!'));
    console.log(chalk.blue.bold('='.repeat(50)));
    console.log('\nGenerated:');
    console.log('  - docs/idea.yaml');
    console.log('  - docs/idea.md');
    console.log('  - docs/prd.md');
    if (!options.skipArchitecture) console.log('  - docs/architecture.md');
    console.log('  - specs/README.md');
    console.log(chalk.blue('\nNext: Run bsr spec to generate detailed specifications\n'));
  });

async function collectIdea(defaultName: string): Promise<IdeaDefinition> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      default: defaultName,
    },
    {
      type: 'input',
      name: 'tagline',
      message: 'One-line tagline:',
      validate: (input: string) => (input && input.length > 0) || 'Required',
    },
    {
      type: 'list',
      name: 'domain',
      message: 'Project domain:',
      choices: ['Web Application', 'Mobile App', 'CLI Tool', 'API/Backend', 'Library/Package', 'Desktop Application', 'Other'],
    },
    {
      type: 'input',
      name: 'problemStatement',
      message: 'What problem does it solve?',
      default: 'Describe the main problem...',
    },
    {
      type: 'input',
      name: 'targetUsers',
      message: 'Who are the target users?',
      default: 'Developers',
    },
    {
      type: 'input',
      name: 'featuresRaw',
      message: 'Core features (comma-separated):',
      validate: (input: string) => (input && input.length > 0) || 'At least one feature required',
    },
    {
      type: 'input',
      name: 'techPreferences',
      message: 'Tech preferences (optional):',
      default: '',
    },
    {
      type: 'input',
      name: 'constraints',
      message: 'Constraints (optional):',
      default: 'None',
    },
  ]);

  return {
    name: answers.name,
    tagline: answers.tagline,
    domain: answers.domain,
    problemStatement: answers.problemStatement,
    targetUsers: answers.targetUsers,
    coreFeatures: answers.featuresRaw.split(',').map((s: string) => s.trim()).filter(Boolean),
    techPreferences: answers.techPreferences,
    constraints: answers.constraints,
  };
}

function deriveIdeaFromDPS(dps: any, projectName: string): IdeaDefinition {
  const derivedIdea = dps.derivedIdea || {};
  const techStack = dps.technologyStack || {};
  const capabilities = derivedIdea.coreCapabilities || [];
  const parts: string[] = [];
  if (techStack.runtime?.name) parts.push(techStack.runtime.name);
  if (techStack.framework?.name) parts.push(techStack.framework.name);
  if (techStack.database?.type) parts.push(techStack.database.type);

  return {
    name: projectName,
    tagline: derivedIdea.summary || `${projectName} - derived from codebase`,
    domain: derivedIdea.domain || 'Web Application',
    problemStatement: `Analyzed from existing codebase. ${derivedIdea.summary || ''}`,
    targetUsers: 'Existing users',
    coreFeatures: capabilities.length > 0 ? capabilities : ['Core functionality'],
    techPreferences: parts.join(', ') || 'TBD',
    constraints: 'Maintain compatibility with existing codebase',
  };
}

function displayIdea(idea: IdeaDefinition): void {
  console.log(`  Name: ${idea.name}`);
  console.log(`  Tagline: ${idea.tagline}`);
  console.log(`  Domain: ${idea.domain}`);
  console.log(`  Features: ${idea.coreFeatures.join(', ')}`);
}

function generateIdeaMarkdown(idea: IdeaDefinition): string {
  return `# ${idea.name}

> ${idea.tagline}

## Overview
- **Domain**: ${idea.domain}
- **Target Users**: ${idea.targetUsers}

## Problem Statement
${idea.problemStatement}

## Core Features
${idea.coreFeatures.map((f) => `- ${f}`).join('\n')}

## Technical Preferences
${idea.techPreferences || 'TBD'}

## Constraints
${idea.constraints || 'None'}

---
*Generated by BSR Method*
`;
}

function generatePRD(idea: IdeaDefinition): string {
  const date = new Date().toISOString().split('T')[0];
  return `# Product Requirements Document

**Project**: ${idea.name}
**Date**: ${date}
**Status**: Draft

## 1. Executive Summary

### Vision
${idea.tagline}

### Problem
${idea.problemStatement}

### Target Users
${idea.targetUsers}

## 2. Functional Requirements

${idea.coreFeatures.map((f, i) => `### 2.${i + 1} ${f}
- Description: Implementation of ${f}
- Priority: High
- Acceptance: Feature works as expected
`).join('\n')}

## 3. Non-Functional Requirements
- Performance: < 200ms response time
- Security: Input validation, secure data handling
- Maintainability: Clean code, tests

## 4. Timeline
| Phase | Duration |
|-------|----------|
| Planning | 1 week |
| Implementation | 2-4 weeks |
| Testing | 1 week |
| Release | 1 week |

---
*Generated by BSR Method - BMAD PM Agent*
`;
}

function generateArchitecture(idea: IdeaDefinition): string {
  const date = new Date().toISOString().split('T')[0];
  return `# Technical Architecture

**Project**: ${idea.name}
**Date**: ${date}

## 1. Overview

System for: ${idea.tagline}

## 2. Technology Stack

${idea.techPreferences ? `Specified: ${idea.techPreferences}` : 'To be determined based on requirements.'}

## 3. Components

\`\`\`
${idea.name}/
├── src/
│   ├── core/       # Business logic
│   ├── api/        # API layer
│   └── utils/      # Utilities
├── tests/
└── docs/
\`\`\`

## 4. Data Flow
1. User input
2. Validation
3. Processing
4. Storage/Response

## 5. Security
- Input validation
- Authentication (if needed)
- Data encryption

---
*Generated by BSR Method - BMAD Architect Agent*
`;
}

function generateSpecsOutline(idea: IdeaDefinition): string {
  return `# ${idea.name} - Specifications

> ${idea.tagline}

## Features

${idea.coreFeatures.map((f, i) => `### ${i + 1}. ${f}
- Status: Not Started
- Spec: specs/features/${slugify(f)}.md
`).join('\n')}

## Next Steps
1. Run \`bsr spec\` for detailed specs
2. Run \`bsr tasks\` for task breakdown
3. Run \`bsr run\` to implement

---
*Generated by BSR Method*
`;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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