import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';

interface ExportData {
  project: any;
  idea: any;
  tasks: any[];
  specs: string[];
  discovery: any;
  loopState: any;
}

export const exportCommand = new Command('export')
  .description('Export reports (PDF/HTML/MD)')
  .option('-f, --format <fmt>', 'Output format: md, html, json', 'md')
  .option('-o, --output <file>', 'Output file path')
  .option('--full', 'Include all sections')
  .option('--tasks-only', 'Export only tasks')
  .option('--specs-only', 'Export only specifications')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n[BSR Export] Report Generator\n'));

    if (!(await fs.pathExists('.bsr/config.yaml'))) {
      console.log(chalk.red('Error: BSR not initialized. Run bsr init first.\n'));
      process.exit(1);
    }

    const spinner = ora('Collecting project data...').start();

    // Load all project data
    const data = await collectExportData();
    spinner.succeed('Data collected');

    // Generate report
    const format = options.format.toLowerCase();
    let content: string;
    let extension: string;

    if (options.tasksOnly) {
      content = generateTasksReport(data, format);
      extension = format;
    } else if (options.specsOnly) {
      content = generateSpecsReport(data, format);
      extension = format;
    } else {
      content = generateFullReport(data, format);
      extension = format;
    }

    // Determine output path
    const timestamp = new Date().toISOString().split('T')[0];
    const projectName = data.project?.name || 'project';
    const defaultFilename = `${projectName}-report-${timestamp}.${extension}`;
    const outputPath = options.output || path.join('exports', defaultFilename);

    // Save report
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, content);

    console.log(chalk.green(`\nExported: ${outputPath}`));
    console.log(chalk.gray(`Format: ${format.toUpperCase()}`));
    console.log(chalk.gray(`Size: ${(content.length / 1024).toFixed(1)} KB\n`));
  });

async function collectExportData(): Promise<ExportData> {
  const data: ExportData = {
    project: null,
    idea: null,
    tasks: [],
    specs: [],
    discovery: null,
    loopState: null,
  };

  try {
    if (await fs.pathExists('.bsr/config.yaml')) {
      data.project = yaml.parse(await fs.readFile('.bsr/config.yaml', 'utf-8'));
    }
  } catch {}

  try {
    if (await fs.pathExists('docs/idea.yaml')) {
      data.idea = yaml.parse(await fs.readFile('docs/idea.yaml', 'utf-8'));
    }
  } catch {}

  try {
    if (await fs.pathExists('tasks/breakdown.json')) {
      data.tasks = await fs.readJson('tasks/breakdown.json');
    }
  } catch {}

  try {
    if (await fs.pathExists('specs')) {
      const specsDir = await fs.readdir('specs', { recursive: true });
      data.specs = specsDir.filter((f: any) => String(f).endsWith('.md')).map(String);
    }
  } catch {}

  try {
    if (await fs.pathExists('discovery/project-context.yaml')) {
      data.discovery = yaml.parse(await fs.readFile('discovery/project-context.yaml', 'utf-8'));
    }
  } catch {}

  try {
    if (await fs.pathExists('.bsr/loop-state.json')) {
      data.loopState = await fs.readJson('.bsr/loop-state.json');
    }
  } catch {}

  return data;
}

function generateFullReport(data: ExportData, format: string): string {
  if (format === 'json') {
    return JSON.stringify(data, null, 2);
  }

  if (format === 'html') {
    return generateHTMLReport(data);
  }

  // Markdown (default)
  return generateMarkdownReport(data);
}

function generateMarkdownReport(data: ExportData): string {
  const projectName = data.project?.project?.name || data.idea?.name || 'Project';
  const tasks = data.tasks || [];
  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  let report = `# ${projectName} - Project Report

**Generated**: ${new Date().toISOString()}
**BSR Method Version**: 0.1.0

---

## Executive Summary

| Metric | Value |
|--------|-------|
| Project Type | ${data.project?.project?.type || 'N/A'} |
| LLM | ${data.project?.llm?.default || 'N/A'} |
| Total Tasks | ${tasks.length} |
| Completed | ${doneCount} |
| Progress | ${progress}% |

`;

  if (data.idea) {
    report += `## Project Idea

**Name**: ${data.idea.name}
**Tagline**: ${data.idea.tagline || 'N/A'}
**Domain**: ${data.idea.domain || 'N/A'}

### Problem Statement
${data.idea.problem || 'Not defined'}

### Target Users
${data.idea.targetUsers || 'Not defined'}

### Core Features
${(data.idea.coreFeatures || []).map((f: string) => `- ${f}`).join('\n') || 'None defined'}

`;
  }

  if (tasks.length > 0) {
    report += `## Task Breakdown

### Summary
- **Todo**: ${todoCount}
- **Done**: ${doneCount}
- **Blocked**: ${tasks.filter(t => t.status === 'blocked').length}

### All Tasks

| ID | Title | Status | Priority |
|----|-------|--------|----------|
${tasks.map(t => `| ${t.id} | ${t.title || '-'} | ${t.status} | ${t.priority || '-'} |`).join('\n')}

`;
  }

  if (data.loopState) {
    report += `## Ralph Loop Status

- **Iterations**: ${data.loopState.iteration || 0}
- **Completed Tasks**: ${data.loopState.completedTasks?.length || 0}
- **Blocked Tasks**: ${data.loopState.blockedTasks?.length || 0}
- **Started**: ${data.loopState.startedAt || 'N/A'}

`;
  }

  if (data.discovery) {
    report += `## Discovery Results

- **Languages**: ${data.discovery.technologyStack?.languages?.join(', ') || 'N/A'}
- **Framework**: ${data.discovery.technologyStack?.framework?.name || 'N/A'}
- **Total Files**: ${data.discovery.structure?.totalFiles || 'N/A'}
- **Code Files**: ${data.discovery.structure?.codeFiles || 'N/A'}

`;
  }

  if (data.specs.length > 0) {
    report += `## Specifications

${data.specs.map(s => `- ${s}`).join('\n')}

`;
  }

  report += `---

*Generated by BSR Method - AI-driven development framework*
`;

  return report;
}

function generateHTMLReport(data: ExportData): string {
  const projectName = data.project?.project?.name || data.idea?.name || 'Project';
  const tasks = data.tasks || [];
  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName} - Report</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 text-gray-900 p-8">
  <div class="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
    <header class="border-b pb-6 mb-6">
      <h1 class="text-3xl font-bold">${projectName}</h1>
      <p class="text-gray-500">Project Report - ${new Date().toLocaleDateString()}</p>
    </header>

    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-4">Executive Summary</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-blue-50 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-blue-600">${progress}%</div>
          <div class="text-sm text-gray-600">Progress</div>
        </div>
        <div class="bg-green-50 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-green-600">${doneCount}</div>
          <div class="text-sm text-gray-600">Completed</div>
        </div>
        <div class="bg-yellow-50 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-yellow-600">${todoCount}</div>
          <div class="text-sm text-gray-600">Todo</div>
        </div>
        <div class="bg-purple-50 p-4 rounded-lg text-center">
          <div class="text-2xl font-bold text-purple-600">${tasks.length}</div>
          <div class="text-sm text-gray-600">Total Tasks</div>
        </div>
      </div>
    </section>

    ${data.idea ? `
    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-4">Project Overview</h2>
      <div class="bg-gray-50 p-4 rounded-lg">
        <p class="text-lg font-medium">${data.idea.tagline || ''}</p>
        <p class="text-gray-600 mt-2">${data.idea.problem || ''}</p>
        <div class="mt-4">
          <span class="text-sm font-medium">Core Features:</span>
          <ul class="list-disc list-inside text-gray-600">
            ${(data.idea.coreFeatures || []).map((f: string) => `<li>${f}</li>`).join('')}
          </ul>
        </div>
      </div>
    </section>
    ` : ''}

    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-4">Tasks</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-4 py-2 text-left">ID</th>
              <th class="px-4 py-2 text-left">Title</th>
              <th class="px-4 py-2 text-left">Status</th>
              <th class="px-4 py-2 text-left">Priority</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(t => `
              <tr class="border-b">
                <td class="px-4 py-2 font-mono text-xs">${t.id}</td>
                <td class="px-4 py-2">${t.title || '-'}</td>
                <td class="px-4 py-2">
                  <span class="px-2 py-1 rounded text-xs ${
                    t.status === 'done' ? 'bg-green-100 text-green-800' :
                    t.status === 'blocked' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }">${t.status}</span>
                </td>
                <td class="px-4 py-2">${t.priority || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <footer class="text-center text-gray-500 text-sm pt-6 border-t">
      Generated by BSR Method v0.1.0
    </footer>
  </div>
</body>
</html>`;
}

function generateTasksReport(data: ExportData, format: string): string {
  const tasks = data.tasks || [];

  if (format === 'json') {
    return JSON.stringify(tasks, null, 2);
  }

  if (format === 'html') {
    return generateHTMLReport({ ...data, idea: null, discovery: null, specs: [] });
  }

  // Markdown
  return `# Tasks Report

**Generated**: ${new Date().toISOString()}

## Summary

- Total: ${tasks.length}
- Todo: ${tasks.filter(t => t.status === 'todo').length}
- Done: ${tasks.filter(t => t.status === 'done').length}
- Blocked: ${tasks.filter(t => t.status === 'blocked').length}

## Tasks

${tasks.map(t => `### ${t.id}: ${t.title || 'Untitled'}

- **Status**: ${t.status}
- **Priority**: ${t.priority || 'medium'}
- **Type**: ${t.type || 'feature'}
${t.description ? `\n${t.description}` : ''}
`).join('\n')}

---
*BSR Method*
`;
}

function generateSpecsReport(data: ExportData, format: string): string {
  if (format === 'json') {
    return JSON.stringify({ specs: data.specs }, null, 2);
  }

  return `# Specifications Report

**Generated**: ${new Date().toISOString()}

## Specification Files

${data.specs.map(s => `- ${s}`).join('\n') || 'No specifications found.'}

---
*BSR Method*
`;
}
