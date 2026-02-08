import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import yaml from 'yaml';

interface Task {
  id: string;
  title: string;
  description: string;
  feature: string;
  type: 'setup' | 'feature' | 'test' | 'docs' | 'refactor';
  priority: 'high' | 'medium' | 'low';
  estimate: string;
  dependencies: string[];
  status: 'todo' | 'in-progress' | 'done';
}

interface Feature {
  name: string;
  slug: string;
}

export const tasksCommand = new Command('tasks')
  .description('Generate task breakdown from specifications')
  .option('-f, --feature <n>', 'Generate tasks for specific feature')
  .option('--format <fmt>', 'Output format: md, json, csv', 'md')
  .option('--github', 'Format for GitHub Issues')
  .option('--estimate', 'Include time estimates')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n[BSR Tasks] Task Breakdown Generator\n'));

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

    // Generate tasks
    console.log(chalk.cyan('Generating task breakdown...\n'));
    const spinner = ora('Analyzing specifications...').start();

    const allTasks: Task[] = [];
    let taskCounter = 1;

    // Setup tasks
    const setupTasks = generateSetupTasks(projectName, taskCounter);
    allTasks.push(...setupTasks);
    taskCounter += setupTasks.length;

    // Feature tasks
    const featuresToProcess = options.feature
      ? features.filter((f: Feature) => f.name.toLowerCase().includes(options.feature.toLowerCase()))
      : features;

    for (const feature of featuresToProcess) {
      const featureTasks = generateFeatureTasks(feature, taskCounter, options.estimate);
      allTasks.push(...featureTasks);
      taskCounter += featureTasks.length;
    }

    // Testing tasks
    const testTasks = generateTestTasks(projectName, featuresToProcess, taskCounter);
    allTasks.push(...testTasks);
    taskCounter += testTasks.length;

    // Documentation tasks
    const docTasks = generateDocTasks(projectName, taskCounter);
    allTasks.push(...docTasks);

    spinner.succeed(`Generated ${allTasks.length} tasks`);

    // Output tasks
    await fs.ensureDir('tasks');

    if (options.format === 'json') {
      await fs.writeFile('tasks/breakdown.json', JSON.stringify(allTasks, null, 2));
      console.log(chalk.green('\nSaved: tasks/breakdown.json'));
    } else if (options.format === 'csv') {
      const csv = generateCSV(allTasks);
      await fs.writeFile('tasks/breakdown.csv', csv);
      console.log(chalk.green('\nSaved: tasks/breakdown.csv'));
    } else {
      const markdown = generateTasksMarkdown(allTasks, projectName, options);
      await fs.writeFile('tasks/breakdown.md', markdown);
      console.log(chalk.green('\nSaved: tasks/breakdown.md'));
    }

    // GitHub Issues format
    if (options.github) {
      const githubMd = generateGitHubIssues(allTasks, projectName);
      await fs.writeFile('tasks/github-issues.md', githubMd);
      console.log(chalk.green('Saved: tasks/github-issues.md'));
    }

    // Update progress.txt with task list
    await updateProgressWithTasks(allTasks);

    // Summary
    console.log(chalk.blue.bold('\n' + '='.repeat(50)));
    console.log(chalk.blue.bold('Task Breakdown Complete!'));
    console.log(chalk.blue.bold('='.repeat(50)));

    // Stats
    const stats = {
      total: allTasks.length,
      setup: allTasks.filter(t => t.type === 'setup').length,
      feature: allTasks.filter(t => t.type === 'feature').length,
      test: allTasks.filter(t => t.type === 'test').length,
      docs: allTasks.filter(t => t.type === 'docs').length,
      high: allTasks.filter(t => t.priority === 'high').length,
      medium: allTasks.filter(t => t.priority === 'medium').length,
      low: allTasks.filter(t => t.priority === 'low').length,
    };

    console.log('\nTask Summary:');
    console.log(`  Total: ${stats.total}`);
    console.log(`  - Setup: ${stats.setup}`);
    console.log(`  - Features: ${stats.feature}`);
    console.log(`  - Tests: ${stats.test}`);
    console.log(`  - Docs: ${stats.docs}`);
    console.log(`\nPriority:`);
    console.log(`  - High: ${stats.high}`);
    console.log(`  - Medium: ${stats.medium}`);
    console.log(`  - Low: ${stats.low}`);

    if (options.estimate) {
      const totalHours = allTasks.reduce((sum, t) => {
        const match = t.estimate.match(/(\d+)/);
        return sum + (match ? parseInt(match[1]) : 0);
      }, 0);
      console.log(`\nEstimated Total: ~${totalHours} hours (~${Math.ceil(totalHours / 8)} days)`);
    }

    console.log(chalk.blue('\nNext: Run bsr run to start implementation with Ralph loop\n'));
  });

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function generateSetupTasks(projectName: string, startId: number): Task[] {
  return [
    {
      id: `TASK-${String(startId).padStart(3, '0')}`,
      title: 'Project Setup',
      description: 'Initialize project structure, install dependencies, configure TypeScript',
      feature: 'setup',
      type: 'setup',
      priority: 'high',
      estimate: '2h',
      dependencies: [],
      status: 'todo',
    },
    {
      id: `TASK-${String(startId + 1).padStart(3, '0')}`,
      title: 'Configure ESLint and Prettier',
      description: 'Set up linting and formatting rules',
      feature: 'setup',
      type: 'setup',
      priority: 'medium',
      estimate: '1h',
      dependencies: [`TASK-${String(startId).padStart(3, '0')}`],
      status: 'todo',
    },
    {
      id: `TASK-${String(startId + 2).padStart(3, '0')}`,
      title: 'Set up testing framework',
      description: 'Configure Vitest, set up test utilities',
      feature: 'setup',
      type: 'setup',
      priority: 'high',
      estimate: '1h',
      dependencies: [`TASK-${String(startId).padStart(3, '0')}`],
      status: 'todo',
    },
    {
      id: `TASK-${String(startId + 3).padStart(3, '0')}`,
      title: 'Configure CI/CD',
      description: 'Set up GitHub Actions for build, test, lint',
      feature: 'setup',
      type: 'setup',
      priority: 'medium',
      estimate: '2h',
      dependencies: [`TASK-${String(startId + 2).padStart(3, '0')}`],
      status: 'todo',
    },
  ];
}

function generateFeatureTasks(feature: Feature, startId: number, _includeEstimate: boolean): Task[] {
  const tasks: Task[] = [
    {
      id: `TASK-${String(startId).padStart(3, '0')}`,
      title: `[${feature.name}] Create types and interfaces`,
      description: `Define TypeScript types for ${feature.name}`,
      feature: feature.slug,
      type: 'feature',
      priority: 'high',
      estimate: '1h',
      dependencies: [],
      status: 'todo',
    },
    {
      id: `TASK-${String(startId + 1).padStart(3, '0')}`,
      title: `[${feature.name}] Implement core logic`,
      description: `Implement main functionality for ${feature.name}`,
      feature: feature.slug,
      type: 'feature',
      priority: 'high',
      estimate: '4h',
      dependencies: [`TASK-${String(startId).padStart(3, '0')}`],
      status: 'todo',
    },
    {
      id: `TASK-${String(startId + 2).padStart(3, '0')}`,
      title: `[${feature.name}] Add validation`,
      description: `Input validation and error handling for ${feature.name}`,
      feature: feature.slug,
      type: 'feature',
      priority: 'medium',
      estimate: '2h',
      dependencies: [`TASK-${String(startId + 1).padStart(3, '0')}`],
      status: 'todo',
    },
    {
      id: `TASK-${String(startId + 3).padStart(3, '0')}`,
      title: `[${feature.name}] Write unit tests`,
      description: `Unit tests for ${feature.name}`,
      feature: feature.slug,
      type: 'test',
      priority: 'high',
      estimate: '2h',
      dependencies: [`TASK-${String(startId + 1).padStart(3, '0')}`],
      status: 'todo',
    },
  ];

  return tasks;
}

function generateTestTasks(projectName: string, features: Feature[], startId: number): Task[] {
  return [
    {
      id: `TASK-${String(startId).padStart(3, '0')}`,
      title: 'Integration tests',
      description: 'Write integration tests for feature interactions',
      feature: 'testing',
      type: 'test',
      priority: 'medium',
      estimate: '4h',
      dependencies: features.map((_, i) => `TASK-${String(startId - features.length * 4 + i * 4 + 3).padStart(3, '0')}`),
      status: 'todo',
    },
    {
      id: `TASK-${String(startId + 1).padStart(3, '0')}`,
      title: 'E2E tests setup',
      description: 'Set up end-to-end testing (if applicable)',
      feature: 'testing',
      type: 'test',
      priority: 'low',
      estimate: '3h',
      dependencies: [`TASK-${String(startId).padStart(3, '0')}`],
      status: 'todo',
    },
  ];
}

function generateDocTasks(projectName: string, startId: number): Task[] {
  return [
    {
      id: `TASK-${String(startId).padStart(3, '0')}`,
      title: 'API documentation',
      description: 'Document all public APIs',
      feature: 'docs',
      type: 'docs',
      priority: 'medium',
      estimate: '2h',
      dependencies: [],
      status: 'todo',
    },
    {
      id: `TASK-${String(startId + 1).padStart(3, '0')}`,
      title: 'README and getting started',
      description: 'Write comprehensive README with examples',
      feature: 'docs',
      type: 'docs',
      priority: 'high',
      estimate: '2h',
      dependencies: [],
      status: 'todo',
    },
    {
      id: `TASK-${String(startId + 2).padStart(3, '0')}`,
      title: 'Contributing guide',
      description: 'Document contribution guidelines',
      feature: 'docs',
      type: 'docs',
      priority: 'low',
      estimate: '1h',
      dependencies: [],
      status: 'todo',
    },
  ];
}

function generateTasksMarkdown(tasks: Task[], projectName: string, options: any): string {
  const byType: Record<string, Task[]> = {};
  tasks.forEach(t => {
    if (!byType[t.type]) byType[t.type] = [];
    byType[t.type].push(t);
  });

  const sections = Object.entries(byType).map(([type, typeTasks]) => {
    const typeTitle = type.charAt(0).toUpperCase() + type.slice(1);
    const taskList = typeTasks.map(t => {
      const deps = t.dependencies.length > 0 ? ` (depends: ${t.dependencies.join(', ')})` : '';
      const est = options.estimate ? ` [${t.estimate}]` : '';
      return `- [ ] **${t.id}**: ${t.title}${est}${deps}\n  - ${t.description}`;
    }).join('\n');
    return `## ${typeTitle} Tasks\n\n${taskList}`;
  }).join('\n\n');

  return `# ${projectName} - Task Breakdown

Generated: ${new Date().toISOString().split('T')[0]}

## Overview

Total tasks: ${tasks.length}

${sections}

---
*Generated by BSR Method - Task Breakdown*
`;
}

function generateCSV(tasks: Task[]): string {
  const headers = ['ID', 'Title', 'Description', 'Feature', 'Type', 'Priority', 'Estimate', 'Dependencies', 'Status'];
  const rows = tasks.map(t => [
    t.id,
    `"${t.title}"`,
    `"${t.description}"`,
    t.feature,
    t.type,
    t.priority,
    t.estimate,
    t.dependencies.join(';'),
    t.status,
  ]);
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

function generateGitHubIssues(tasks: Task[], projectName: string): string {
  const issues = tasks.map(t => {
    const labels = [`type:${t.type}`, `priority:${t.priority}`];
    if (t.feature !== 'setup' && t.feature !== 'testing' && t.feature !== 'docs') {
      labels.push(`feature:${t.feature}`);
    }

    return `## ${t.id}: ${t.title}

**Labels**: ${labels.join(', ')}

### Description
${t.description}

### Acceptance Criteria
- [ ] Implementation complete
- [ ] Tests passing
- [ ] Documentation updated

${t.dependencies.length > 0 ? `### Dependencies\nBlocked by: ${t.dependencies.join(', ')}` : ''}

---`;
  }).join('\n\n');

  return `# GitHub Issues for ${projectName}

Copy each section below to create issues in GitHub.

${issues}
`;
}

async function updateProgressWithTasks(tasks: Task[]): Promise<void> {
  const progressPath = 'progress.txt';
  let content = await fs.pathExists(progressPath) ? await fs.readFile(progressPath, 'utf-8') : '';

  // Update phase
  content = content.replace(/## Current Phase\n\w+/, '## Current Phase\ntasks');
  content = content.replace(/## Status\n\w+/, '## Status\ncomplete');

  // Add task summary
  if (!content.includes('## Task Summary')) {
    content += '\n## Task Summary\n';
  }

  const todoTasks = tasks.filter(t => t.status === 'todo');
  content += `\nTotal: ${tasks.length} tasks\n`;
  content += `Todo: ${todoTasks.length}\n`;
  content += `\n### Next Tasks (High Priority)\n`;
  const highPriority = todoTasks.filter(t => t.priority === 'high').slice(0, 5);
  highPriority.forEach(t => {
    content += `- [ ] ${t.id}: ${t.title}\n`;
  });

  const timestamp = new Date().toISOString();
  if (!content.includes('## History')) content += '\n## History\n';
  content += `- [${timestamp}] tasks: complete (${tasks.length} tasks generated)\n`;

  await fs.writeFile(progressPath, content);
}
