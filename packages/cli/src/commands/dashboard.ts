import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';
import http from 'http';
import { exec } from 'child_process';

interface ProjectData {
  config: any;
  idea: any;
  tasks: any[];
  loopState: any;
  discovery: any;
}

export const dashboardCommand = new Command('dashboard')
  .description('Open web dashboard')
  .option('-p, --port <port>', 'Port number', '3847')
  .option('--no-open', 'Do not auto-open browser')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n[BSR Dashboard] Starting web server...\n'));

    if (!(await fs.pathExists('.bsr/config.yaml'))) {
      console.log(chalk.red('Error: BSR not initialized. Run bsr init first.\n'));
      process.exit(1);
    }

    const port = parseInt(options.port);
    const projectPath = process.cwd();

    // Load project data
    const data = await loadProjectData(projectPath);

    // Create server
    const server = http.createServer(async (req, res) => {
      const url = new URL(req.url || '/', `http://localhost:${port}`);

      if (url.pathname === '/api/data') {
        // API endpoint
        res.writeHead(200, { 'Content-Type': 'application/json' });
        const freshData = await loadProjectData(projectPath);
        res.end(JSON.stringify(freshData));
      } else if (url.pathname === '/api/task/update' && req.method === 'POST') {
        // Update task status
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const { taskId, status } = JSON.parse(body);
            await updateTaskStatus(taskId, status);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: String(e) }));
          }
        });
      } else {
        // Serve dashboard HTML
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(generateDashboardHTML(data));
      }
    });

    server.listen(port, () => {
      const url = `http://localhost:${port}`;
      console.log(chalk.green(`Dashboard running at: ${url}`));
      console.log(chalk.gray('Press Ctrl+C to stop\n'));

      if (options.open !== false) {
        openBrowser(url);
      }
    });

    // Handle shutdown
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\nShutting down dashboard...'));
      server.close();
      process.exit(0);
    });
  });

async function loadProjectData(projectPath: string): Promise<ProjectData> {
  const data: ProjectData = {
    config: null,
    idea: null,
    tasks: [],
    loopState: null,
    discovery: null,
  };

  try {
    if (await fs.pathExists(path.join(projectPath, '.bsr/config.yaml'))) {
      data.config = yaml.parse(await fs.readFile(path.join(projectPath, '.bsr/config.yaml'), 'utf-8'));
    }
  } catch {}

  try {
    if (await fs.pathExists(path.join(projectPath, 'docs/idea.yaml'))) {
      data.idea = yaml.parse(await fs.readFile(path.join(projectPath, 'docs/idea.yaml'), 'utf-8'));
    }
  } catch {}

  try {
    if (await fs.pathExists(path.join(projectPath, 'tasks/breakdown.json'))) {
      data.tasks = await fs.readJson(path.join(projectPath, 'tasks/breakdown.json'));
    }
  } catch {}

  try {
    if (await fs.pathExists(path.join(projectPath, '.bsr/loop-state.json'))) {
      data.loopState = await fs.readJson(path.join(projectPath, '.bsr/loop-state.json'));
    }
  } catch {}

  try {
    if (await fs.pathExists(path.join(projectPath, 'discovery/project-context.yaml'))) {
      data.discovery = yaml.parse(await fs.readFile(path.join(projectPath, 'discovery/project-context.yaml'), 'utf-8'));
    }
  } catch {}

  return data;
}

async function updateTaskStatus(taskId: string, status: string): Promise<void> {
  if (await fs.pathExists('tasks/breakdown.json')) {
    const tasks = await fs.readJson('tasks/breakdown.json');
    const task = tasks.find((t: any) => t.id === taskId);
    if (task) {
      task.status = status;
      await fs.writeJson('tasks/breakdown.json', tasks, { spaces: 2 });
    }
  }
}

function openBrowser(url: string): void {
  const cmd = process.platform === 'win32' ? 'start' :
              process.platform === 'darwin' ? 'open' : 'xdg-open';
  exec(`${cmd} ${url}`);
}

function generateDashboardHTML(data: ProjectData): string {
  const projectName = data.config?.project?.name || data.idea?.name || 'BSR Project';
  const projectType = data.config?.project?.type || 'unknown';
  const llm = data.config?.llm?.default || 'not configured';

  const tasks = data.tasks || [];
  const todoCount = tasks.filter(t => t.status === 'todo').length;
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const blockedCount = tasks.filter(t => t.status === 'blocked').length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const loopIterations = data.loopState?.iteration || 0;
  const loopCompleted = data.loopState?.completedTasks?.length || 0;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName} - BSR Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            bsr: { primary: '#3b82f6', secondary: '#10b981', accent: '#f59e0b' }
          }
        }
      }
    }
  </script>
  <style>
    .task-card:hover { transform: translateY(-2px); }
    .progress-bar { transition: width 0.5s ease; }
  </style>
</head>
<body class="bg-gray-900 text-gray-100 min-h-screen">
  <nav class="bg-gray-800 border-b border-gray-700 px-6 py-4">
    <div class="flex items-center justify-between max-w-7xl mx-auto">
      <div class="flex items-center gap-3">
        <span class="text-2xl">🚀</span>
        <h1 class="text-xl font-bold">BSR Dashboard</h1>
      </div>
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-400">LLM: ${llm}</span>
        <span class="px-3 py-1 bg-blue-600 rounded-full text-sm">${projectType}</span>
        <button onclick="refreshData()" class="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm">
          ↻ Refresh
        </button>
      </div>
    </div>
  </nav>

  <main class="max-w-7xl mx-auto p-6">
    <!-- Project Header -->
    <div class="mb-8">
      <h2 class="text-3xl font-bold mb-2">${projectName}</h2>
      <p class="text-gray-400">${data.idea?.tagline || 'AI-driven development project'}</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="bg-gray-800 rounded-lg p-5 border border-gray-700">
        <div class="text-gray-400 text-sm mb-1">Progress</div>
        <div class="text-3xl font-bold text-blue-400">${progress}%</div>
        <div class="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div class="progress-bar h-full bg-blue-500 rounded-full" style="width: ${progress}%"></div>
        </div>
      </div>
      <div class="bg-gray-800 rounded-lg p-5 border border-gray-700">
        <div class="text-gray-400 text-sm mb-1">Tasks</div>
        <div class="text-3xl font-bold">${totalCount}</div>
        <div class="text-sm text-gray-500 mt-1">${todoCount} todo, ${doneCount} done</div>
      </div>
      <div class="bg-gray-800 rounded-lg p-5 border border-gray-700">
        <div class="text-gray-400 text-sm mb-1">Ralph Iterations</div>
        <div class="text-3xl font-bold text-green-400">${loopIterations}</div>
        <div class="text-sm text-gray-500 mt-1">${loopCompleted} completed</div>
      </div>
      <div class="bg-gray-800 rounded-lg p-5 border border-gray-700">
        <div class="text-gray-400 text-sm mb-1">Blocked</div>
        <div class="text-3xl font-bold ${blockedCount > 0 ? 'text-red-400' : 'text-gray-500'}">${blockedCount}</div>
        <div class="text-sm text-gray-500 mt-1">${blockedCount > 0 ? 'needs attention' : 'all clear'}</div>
      </div>
    </div>

    <!-- Tasks Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <!-- Todo -->
      <div class="bg-gray-800 rounded-lg border border-gray-700">
        <div class="px-4 py-3 border-b border-gray-700 flex items-center gap-2">
          <span class="w-3 h-3 bg-yellow-500 rounded-full"></span>
          <h3 class="font-semibold">Todo (${todoCount})</h3>
        </div>
        <div class="p-4 space-y-3 max-h-96 overflow-y-auto" id="todo-tasks">
          ${tasks.filter(t => t.status === 'todo').map(t => taskCard(t)).join('')}
        </div>
      </div>

      <!-- In Progress -->
      <div class="bg-gray-800 rounded-lg border border-gray-700">
        <div class="px-4 py-3 border-b border-gray-700 flex items-center gap-2">
          <span class="w-3 h-3 bg-blue-500 rounded-full"></span>
          <h3 class="font-semibold">In Progress (${tasks.filter(t => t.status === 'in-progress').length})</h3>
        </div>
        <div class="p-4 space-y-3 max-h-96 overflow-y-auto" id="progress-tasks">
          ${tasks.filter(t => t.status === 'in-progress').map(t => taskCard(t)).join('')}
        </div>
      </div>

      <!-- Done -->
      <div class="bg-gray-800 rounded-lg border border-gray-700">
        <div class="px-4 py-3 border-b border-gray-700 flex items-center gap-2">
          <span class="w-3 h-3 bg-green-500 rounded-full"></span>
          <h3 class="font-semibold">Done (${doneCount})</h3>
        </div>
        <div class="p-4 space-y-3 max-h-96 overflow-y-auto" id="done-tasks">
          ${tasks.filter(t => t.status === 'done').map(t => taskCard(t)).join('')}
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-gray-800 rounded-lg border border-gray-700 p-6">
      <h3 class="font-semibold mb-4">Quick Actions</h3>
      <div class="flex flex-wrap gap-3">
        <code class="px-3 py-2 bg-gray-700 rounded text-sm">bsr run</code>
        <code class="px-3 py-2 bg-gray-700 rounded text-sm">bsr tasks --estimate</code>
        <code class="px-3 py-2 bg-gray-700 rounded text-sm">bsr status</code>
        <code class="px-3 py-2 bg-gray-700 rounded text-sm">bsr spec --all</code>
      </div>
    </div>
  </main>

  <footer class="text-center py-6 text-gray-500 text-sm">
    BSR Method v0.1.0 - AI-driven development framework
  </footer>

  <script>
    async function refreshData() {
      try {
        const res = await fetch('/api/data');
        const data = await res.json();
        location.reload();
      } catch (e) {
        console.error('Refresh failed:', e);
      }
    }

    async function updateTask(taskId, status) {
      try {
        await fetch('/api/task/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, status })
        });
        refreshData();
      } catch (e) {
        console.error('Update failed:', e);
      }
    }

    // Auto-refresh every 30 seconds
    setInterval(refreshData, 30000);
  </script>
</body>
</html>`;
}

function taskCard(task: any): string {
  const priorityColors: Record<string, string> = {
    high: 'bg-red-500/20 text-red-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-green-500/20 text-green-400',
  };
  const priorityClass = priorityColors[task.priority] || priorityColors.medium;

  return `
    <div class="task-card bg-gray-700/50 rounded-lg p-3 border border-gray-600 transition-transform">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <div class="font-medium text-sm truncate">${task.title || task.id}</div>
          <div class="text-xs text-gray-400 mt-1">${task.id}</div>
        </div>
        <span class="px-2 py-0.5 rounded text-xs ${priorityClass}">${task.priority || 'medium'}</span>
      </div>
      ${task.estimate ? `<div class="text-xs text-gray-500 mt-2">Est: ${task.estimate}</div>` : ''}
    </div>
  `;
}
