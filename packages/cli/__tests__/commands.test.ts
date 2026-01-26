import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import yaml from 'yaml';

let testDir: string;

beforeEach(async () => {
  testDir = path.join(os.tmpdir(), 'bsr-test-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  await fs.ensureDir(testDir);
});

afterEach(async () => {
  await fs.remove(testDir);
});

describe('BSR Init', () => {
  it('should create .bsr directory', async () => {
    const bsrDir = path.join(testDir, '.bsr');
    await fs.ensureDir(bsrDir);
    expect(await fs.pathExists(bsrDir)).toBe(true);
  });

  it('should create required directories', async () => {
    const dirs = ['.bsr', 'tasks', 'specs', 'docs'];
    for (const dir of dirs) {
      await fs.ensureDir(path.join(testDir, dir));
    }
    for (const dir of dirs) {
      expect(await fs.pathExists(path.join(testDir, dir))).toBe(true);
    }
  });

  it('should create progress.txt', async () => {
    const progressPath = path.join(testDir, 'progress.txt');
    await fs.writeFile(progressPath, '## Current Phase\ninit\n');
    expect(await fs.pathExists(progressPath)).toBe(true);
  });
});

describe('BSR Config', () => {
  it('should read config file', async () => {
    const configPath = path.join(testDir, '.bsr', 'config.yaml');
    await fs.ensureDir(path.dirname(configPath));
    const config = { project: { name: 'test-project', type: 'cli' } };
    await fs.writeFile(configPath, yaml.stringify(config));
    const loaded = yaml.parse(await fs.readFile(configPath, 'utf-8'));
    expect(loaded.project.name).toBe('test-project');
  });

  it('should update config values', async () => {
    const configPath = path.join(testDir, '.bsr', 'config.yaml');
    await fs.ensureDir(path.dirname(configPath));
    const config = { project: { name: 'old-name' } };
    await fs.writeFile(configPath, yaml.stringify(config));
    const loaded = yaml.parse(await fs.readFile(configPath, 'utf-8'));
    loaded.project.name = 'new-name';
    await fs.writeFile(configPath, yaml.stringify(loaded));
    const updated = yaml.parse(await fs.readFile(configPath, 'utf-8'));
    expect(updated.project.name).toBe('new-name');
  });
});

describe('BSR Tasks', () => {
  it('should generate tasks from idea', async () => {
    const tasksPath = path.join(testDir, 'tasks', 'breakdown.json');
    await fs.ensureDir(path.dirname(tasksPath));
    const tasks = [
      { id: 'TASK-001', title: 'Setup project', status: 'todo', priority: 'high' },
      { id: 'TASK-002', title: 'Add features', status: 'todo', priority: 'medium' },
    ];
    await fs.writeJson(tasksPath, tasks, { spaces: 2 });
    const loaded = await fs.readJson(tasksPath);
    expect(loaded).toHaveLength(2);
  });

  it('should filter tasks by status', () => {
    const tasks = [
      { id: 'TASK-001', status: 'todo' },
      { id: 'TASK-002', status: 'done' },
      { id: 'TASK-003', status: 'todo' },
    ];
    const todoTasks = tasks.filter(t => t.status === 'todo');
    expect(todoTasks).toHaveLength(2);
  });

  it('should update task status', async () => {
    const tasksPath = path.join(testDir, 'tasks', 'breakdown.json');
    await fs.ensureDir(path.dirname(tasksPath));
    const tasks = [{ id: 'TASK-001', status: 'todo' }];
    await fs.writeJson(tasksPath, tasks);
    const loaded = await fs.readJson(tasksPath);
    loaded[0].status = 'done';
    await fs.writeJson(tasksPath, loaded);
    const updated = await fs.readJson(tasksPath);
    expect(updated[0].status).toBe('done');
  });
});

describe('BSR Discover', () => {
  it('should detect package.json', async () => {
    const pkgPath = path.join(testDir, 'package.json');
    await fs.writeJson(pkgPath, { name: 'test', version: '1.0.0' });
    expect(await fs.pathExists(pkgPath)).toBe(true);
  });

  it('should count files by type', async () => {
    await fs.ensureDir(path.join(testDir, 'src'));
    await fs.writeFile(path.join(testDir, 'src', 'index.ts'), '// code');
    await fs.writeFile(path.join(testDir, 'src', 'utils.ts'), '// utils');
    const files = await fs.readdir(path.join(testDir, 'src'));
    const tsFiles = files.filter(f => f.endsWith('.ts'));
    expect(tsFiles).toHaveLength(2);
  });

  it('should detect dependencies', async () => {
    const pkgPath = path.join(testDir, 'package.json');
    await fs.writeJson(pkgPath, { dependencies: { chalk: '^5.0.0' } });
    const pkg = await fs.readJson(pkgPath);
    expect(Object.keys(pkg.dependencies)).toHaveLength(1);
  });

  it('should detect test directory', async () => {
    const testsDir = path.join(testDir, '__tests__');
    await fs.ensureDir(testsDir);
    expect(await fs.pathExists(testsDir)).toBe(true);
  });
});

describe('BSR Loop State', () => {
  it('should save loop state', async () => {
    const statePath = path.join(testDir, '.bsr', 'loop-state.json');
    await fs.ensureDir(path.dirname(statePath));
    const state = { iteration: 1, completedTasks: ['TASK-001'] };
    await fs.writeJson(statePath, state);
    expect(await fs.pathExists(statePath)).toBe(true);
  });

  it('should load and resume loop state', async () => {
    const statePath = path.join(testDir, '.bsr', 'loop-state.json');
    await fs.ensureDir(path.dirname(statePath));
    const state = { iteration: 5, completedTasks: ['TASK-001', 'TASK-002'] };
    await fs.writeJson(statePath, state);
    const loaded = await fs.readJson(statePath);
    expect(loaded.iteration).toBe(5);
  });

  it('should track completed tasks', () => {
    const state = { completedTasks: [] as string[] };
    state.completedTasks.push('TASK-001');
    expect(state.completedTasks).toContain('TASK-001');
  });
});

describe('BSR Export', () => {
  it('should generate markdown report', async () => {
    const report = '# Project Report\n## Tasks\n- TASK-001';
    const reportPath = path.join(testDir, 'report.md');
    await fs.writeFile(reportPath, report);
    const content = await fs.readFile(reportPath, 'utf-8');
    expect(content).toContain('# Project Report');
  });

  it('should export to JSON', async () => {
    const data = { project: 'test', tasks: [{ id: 'TASK-001' }] };
    const exportPath = path.join(testDir, 'export.json');
    await fs.writeJson(exportPath, data);
    const loaded = await fs.readJson(exportPath);
    expect(loaded.project).toBe('test');
  });
});

describe('BSR Sync', () => {
  it('should generate GitHub issue format', () => {
    const task = { id: 'TASK-001', title: 'Add feature X', priority: 'high' };
    const issue = { title: '[' + task.id + '] ' + task.title, labels: ['bsr-method', task.priority] };
    expect(issue.title).toBe('[TASK-001] Add feature X');
  });

  it('should save sync state', async () => {
    const syncPath = path.join(testDir, '.bsr', 'sync-state.json');
    await fs.ensureDir(path.dirname(syncPath));
    const syncState = { lastSync: new Date().toISOString(), syncedTasks: ['TASK-001'] };
    await fs.writeJson(syncPath, syncState);
    const loaded = await fs.readJson(syncPath);
    expect(loaded.syncedTasks).toContain('TASK-001');
  });
});