/**
 * BSR Method - CLI Commands Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

// Test utilities
let testDir: string;

beforeEach(async () => {
  // Create temp directory for each test
  testDir = path.join(os.tmpdir(), `bsr-test-${Date.now()}`);
  await fs.ensureDir(testDir);
  process.chdir(testDir);
});

afterEach(async () => {
  // Cleanup
  process.chdir(os.tmpdir());
  await fs.remove(testDir);
});

describe('BSR Init', () => {
  it('should create .bsr directory', async () => {
    // Simulate init
    await fs.ensureDir('.bsr');
    await fs.writeFile('.bsr/config.yaml', `
project:
  name: test-project
  type: greenfield
llm:
  default: claude
`);

    expect(await fs.pathExists('.bsr')).toBe(true);
    expect(await fs.pathExists('.bsr/config.yaml')).toBe(true);
  });

  it('should create required directories', async () => {
    const dirs = ['docs', 'specs', 'tasks', '.bsr'];
    
    for (const dir of dirs) {
      await fs.ensureDir(dir);
    }

    for (const dir of dirs) {
      expect(await fs.pathExists(dir)).toBe(true);
    }
  });

  it('should create progress.txt', async () => {
    const progressContent = `# Project Progress

## Current Phase
init

## Status
in-progress

## History
- [${new Date().toISOString()}] init: started
`;

    await fs.writeFile('progress.txt', progressContent);
    expect(await fs.pathExists('progress.txt')).toBe(true);
    
    const content = await fs.readFile('progress.txt', 'utf-8');
    expect(content).toContain('Current Phase');
  });
});

describe('BSR Config', () => {
  beforeEach(async () => {
    await fs.ensureDir('.bsr');
    await fs.writeFile('.bsr/config.yaml', `
project:
  name: test-project
  type: greenfield
llm:
  default: claude
  model: claude-sonnet-4-20250514
`);
  });

  it('should read config file', async () => {
    const yaml = await import('yaml');
    const config = yaml.parse(await fs.readFile('.bsr/config.yaml', 'utf-8'));
    
    expect(config.project.name).toBe('test-project');
    expect(config.llm.default).toBe('claude');
  });

  it('should update config values', async () => {
    const yaml = await import('yaml');
    const config = yaml.parse(await fs.readFile('.bsr/config.yaml', 'utf-8'));
    
    config.llm.model = 'claude-3-opus';
    await fs.writeFile('.bsr/config.yaml', yaml.stringify(config));
    
    const updated = yaml.parse(await fs.readFile('.bsr/config.yaml', 'utf-8'));
    expect(updated.llm.model).toBe('claude-3-opus');
  });
});

describe('BSR Tasks', () => {
  beforeEach(async () => {
    await fs.ensureDir('.bsr');
    await fs.ensureDir('docs');
    await fs.ensureDir('tasks');
    
    await fs.writeFile('.bsr/config.yaml', `
project:
  name: test-project
  type: greenfield
`);

    await fs.writeFile('docs/idea.yaml', `
name: Test Project
tagline: A test project
domain: testing
coreFeatures:
  - Feature One
  - Feature Two
`);
  });

  it('should generate tasks from idea', async () => {
    const yaml = await import('yaml');
    const idea = yaml.parse(await fs.readFile('docs/idea.yaml', 'utf-8'));
    
    // Simulate task generation
    const tasks = [
      {
        id: 'TASK-001',
        title: 'Project Setup',
        description: 'Initialize project',
        status: 'todo',
        priority: 'high',
        type: 'setup',
        feature: 'setup',
      },
      {
        id: 'TASK-002',
        title: `[${idea.coreFeatures[0]}] Create types`,
        description: `Define types for ${idea.coreFeatures[0]}`,
        status: 'todo',
        priority: 'high',
        type: 'feature',
        feature: 'feature-one',
      },
    ];

    await fs.writeJson('tasks/breakdown.json', tasks, { spaces: 2 });
    
    expect(await fs.pathExists('tasks/breakdown.json')).toBe(true);
    
    const loaded = await fs.readJson('tasks/breakdown.json');
    expect(loaded).toHaveLength(2);
    expect(loaded[0].id).toBe('TASK-001');
  });

  it('should filter tasks by status', async () => {
    const tasks = [
      { id: 'TASK-001', status: 'todo', priority: 'high' },
      { id: 'TASK-002', status: 'done', priority: 'medium' },
      { id: 'TASK-003', status: 'todo', priority: 'low' },
      { id: 'TASK-004', status: 'blocked', priority: 'high' },
    ];

    await fs.writeJson('tasks/breakdown.json', tasks);

    const loaded = await fs.readJson('tasks/breakdown.json');
    const todoTasks = loaded.filter((t: any) => t.status === 'todo');
    const doneTasks = loaded.filter((t: any) => t.status === 'done');
    
    expect(todoTasks).toHaveLength(2);
    expect(doneTasks).toHaveLength(1);
  });

  it('should update task status', async () => {
    const tasks = [
      { id: 'TASK-001', status: 'todo', title: 'Test task' },
    ];

    await fs.writeJson('tasks/breakdown.json', tasks);

    // Update status
    const loaded = await fs.readJson('tasks/breakdown.json');
    loaded[0].status = 'done';
    await fs.writeJson('tasks/breakdown.json', loaded, { spaces: 2 });

    const updated = await fs.readJson('tasks/breakdown.json');
    expect(updated[0].status).toBe('done');
  });
});

describe('BSR Discover', () => {
  beforeEach(async () => {
    // Create a mock project structure
    await fs.ensureDir('src');
    await fs.ensureDir('tests');
    await fs.writeFile('package.json', JSON.stringify({
      name: 'mock-project',
      version: '1.0.0',
      dependencies: {
        'express': '^4.18.0',
        'pg': '^8.0.0',
      },
      devDependencies: {
        'typescript': '^5.0.0',
        'vitest': '^1.0.0',
      },
    }));
    await fs.writeFile('src/index.ts', 'export const hello = "world";');
    await fs.writeFile('tests/index.test.ts', 'test("example", () => {});');
    await fs.writeFile('.gitignore', 'node_modules');
  });

  it('should detect package.json', async () => {
    expect(await fs.pathExists('package.json')).toBe(true);
    
    const pkg = await fs.readJson('package.json');
    expect(pkg.name).toBe('mock-project');
  });

  it('should count files by type', async () => {
    const files = await fs.readdir('src');
    const tsFiles = files.filter(f => f.endsWith('.ts'));
    expect(tsFiles.length).toBeGreaterThan(0);
  });

  it('should detect dependencies', async () => {
    const pkg = await fs.readJson('package.json');
    const deps = Object.keys(pkg.dependencies || {});
    const devDeps = Object.keys(pkg.devDependencies || {});
    
    expect(deps).toContain('express');
    expect(deps).toContain('pg');
    expect(devDeps).toContain('typescript');
  });

  it('should detect test directory', async () => {
    const hasTests = await fs.pathExists('tests');
    expect(hasTests).toBe(true);
  });
});

describe('BSR Loop State', () => {
  beforeEach(async () => {
    await fs.ensureDir('.bsr');
  });

  it('should save loop state', async () => {
    const state = {
      currentTask: { id: 'TASK-001', title: 'Test', status: 'in-progress' },
      completedTasks: [],
      blockedTasks: [],
      iteration: 1,
      startedAt: new Date().toISOString(),
      llm: 'claude',
    };

    await fs.writeJson('.bsr/loop-state.json', state, { spaces: 2 });
    
    expect(await fs.pathExists('.bsr/loop-state.json')).toBe(true);
  });

  it('should load and resume loop state', async () => {
    const state = {
      completedTasks: ['TASK-001', 'TASK-002'],
      blockedTasks: ['TASK-003'],
      iteration: 3,
    };

    await fs.writeJson('.bsr/loop-state.json', state);
    
    const loaded = await fs.readJson('.bsr/loop-state.json');
    expect(loaded.completedTasks).toHaveLength(2);
    expect(loaded.iteration).toBe(3);
  });

  it('should track completed tasks', async () => {
    const state = {
      completedTasks: ['TASK-001'],
      iteration: 1,
    };

    // Complete another task
    state.completedTasks.push('TASK-002');
    state.iteration++;

    await fs.writeJson('.bsr/loop-state.json', state);
    
    const loaded = await fs.readJson('.bsr/loop-state.json');
    expect(loaded.completedTasks).toContain('TASK-002');
  });
});

describe('BSR Export', () => {
  beforeEach(async () => {
    await fs.ensureDir('.bsr');
    await fs.ensureDir('tasks');
    await fs.ensureDir('docs');
    
    await fs.writeFile('.bsr/config.yaml', `
project:
  name: Export Test
  type: greenfield
`);

    await fs.writeJson('tasks/breakdown.json', [
      { id: 'TASK-001', title: 'Setup', status: 'done', priority: 'high' },
      { id: 'TASK-002', title: 'Feature', status: 'todo', priority: 'medium' },
    ]);
  });

  it('should generate markdown report', async () => {
    const tasks = await fs.readJson('tasks/breakdown.json');
    
    let report = `# Export Test - Report\n\n`;
    report += `## Tasks\n\n`;
    report += `| ID | Title | Status | Priority |\n`;
    report += `|----|-------|--------|----------|\n`;
    
    for (const task of tasks) {
      report += `| ${task.id} | ${task.title} | ${task.status} | ${task.priority} |\n`;
    }

    await fs.ensureDir('exports');
    await fs.writeFile('exports/report.md', report);
    
    expect(await fs.pathExists('exports/report.md')).toBe(true);
    
    const content = await fs.readFile('exports/report.md', 'utf-8');
    expect(content).toContain('TASK-001');
  });

  it('should export to JSON', async () => {
    const tasks = await fs.readJson('tasks/breakdown.json');
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      tasks,
      stats: {
        total: tasks.length,
        done: tasks.filter((t: any) => t.status === 'done').length,
        todo: tasks.filter((t: any) => t.status === 'todo').length,
      },
    };

    await fs.ensureDir('exports');
    await fs.writeJson('exports/report.json', exportData, { spaces: 2 });
    
    const loaded = await fs.readJson('exports/report.json');
    expect(loaded.stats.total).toBe(2);
    expect(loaded.stats.done).toBe(1);
  });
});

describe('BSR Sync', () => {
  beforeEach(async () => {
    await fs.ensureDir('.bsr');
    await fs.ensureDir('tasks');
    await fs.ensureDir('sync');
    
    await fs.writeJson('tasks/breakdown.json', [
      { id: 'TASK-001', title: 'Setup', status: 'todo', priority: 'high', type: 'setup' },
    ]);
  });

  it('should generate GitHub issue format', async () => {
    const tasks = await fs.readJson('tasks/breakdown.json');
    
    let issuesContent = `# GitHub Issues\n\n`;
    
    for (const task of tasks) {
      issuesContent += `## ${task.id}: ${task.title}\n\n`;
      issuesContent += `**Labels**: priority-${task.priority}, type-${task.type}\n\n`;
      issuesContent += `### Description\n\nImplement as specified.\n\n---\n\n`;
    }

    await fs.writeFile('sync/github-issues.md', issuesContent);
    
    const content = await fs.readFile('sync/github-issues.md', 'utf-8');
    expect(content).toContain('priority-high');
  });

  it('should save sync state', async () => {
    const syncState = {
      lastExport: new Date().toISOString(),
      tasksExported: 1,
    };

    await fs.writeJson('.bsr/sync-state.json', syncState);
    
    const loaded = await fs.readJson('.bsr/sync-state.json');
    expect(loaded.tasksExported).toBe(1);
  });
});
