/**
 * BSR Dashboard - Server
 * Local web server for task visualization
 */

import Fastify, { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyWebsocket from '@fastify/websocket';
import type { WebSocket } from 'ws';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface DashboardConfig {
  port: number;
  host: string;
  projectPath: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'blocked';
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  effort?: string;
  dependencies?: string[];
  assignee?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskBreakdown {
  version: string;
  created: string;
  tasks: Task[];
}

const DEFAULT_CONFIG: DashboardConfig = {
  port: 3000,
  host: '127.0.0.1',
  projectPath: process.cwd(),
};

const wsClients: Set<WebSocket> = new Set();

/**
 * Create and configure Fastify server
 */
export async function createServer(config: Partial<DashboardConfig> = {}): Promise<FastifyInstance> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: { colorize: true }
      }
    }
  });

  // Register WebSocket
  await fastify.register(fastifyWebsocket);

  // Register static files
  const publicPath = path.join(__dirname, '..', 'public');
  if (fs.existsSync(publicPath)) {
    await fastify.register(fastifyStatic, {
      root: publicPath,
      prefix: '/',
    });
  }

  // Store project path in decorator
  fastify.decorate('projectPath', cfg.projectPath);

  // WebSocket endpoint
  fastify.get('/ws', { websocket: true }, (connection, _req) => {
    const socket = connection as unknown as WebSocket;
    wsClients.add(socket);
    
    socket.on('message', (message: Buffer) => {
      try {
        const data = JSON.parse(message.toString());
        handleWebSocketMessage(socket, data, cfg.projectPath);
      } catch {
        socket.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });

    socket.on('close', () => {
      wsClients.delete(socket);
    });

    // Send initial state
    const tasks = loadTasks(cfg.projectPath);
    socket.send(JSON.stringify({ type: 'init', tasks }));
  });

  // REST API routes
  registerAPIRoutes(fastify, cfg.projectPath);

  return fastify;
}

/**
 * Start the dashboard server
 */
export async function startServer(config: Partial<DashboardConfig> = {}): Promise<void> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const server = await createServer(cfg);

  try {
    await server.listen({ port: cfg.port, host: cfg.host });
    console.log(`\n🚀 BSR Dashboard running at http://${cfg.host}:${cfg.port}\n`);
    console.log(`   Project: ${cfg.projectPath}\n`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

/**
 * Register REST API routes
 */
function registerAPIRoutes(fastify: FastifyInstance, projectPath: string): void {
  // Get all tasks
  fastify.get('/api/tasks', async (_req, _reply) => {
    const tasks = loadTasks(projectPath);
    return { tasks };
  });

  // Get single task
  fastify.get<{ Params: { id: string } }>('/api/tasks/:id', async (req, reply) => {
    const tasks = loadTasks(projectPath);
    const task = tasks.find(t => t.id === req.params.id);
    if (!task) {
      reply.code(404);
      return { error: 'Task not found' };
    }
    return task;
  });

  // Update task
  fastify.patch<{ Params: { id: string }; Body: Partial<Task> }>('/api/tasks/:id', async (req, reply) => {
    const result = updateTask(projectPath, req.params.id, req.body);
    if (!result.success) {
      reply.code(400);
      return { error: result.error };
    }
    
    // Broadcast update
    broadcastUpdate({ type: 'task-updated', task: result.task });
    
    return result.task;
  });

  // Create task
  fastify.post<{ Body: Partial<Task> }>('/api/tasks', async (req, reply) => {
    const result = createTask(projectPath, req.body);
    if (!result.success) {
      reply.code(400);
      return { error: result.error };
    }
    
    // Broadcast update
    broadcastUpdate({ type: 'task-created', task: result.task });
    
    reply.code(201);
    return result.task;
  });

  // Delete task
  fastify.delete<{ Params: { id: string } }>('/api/tasks/:id', async (req, reply) => {
    const result = deleteTask(projectPath, req.params.id);
    if (!result.success) {
      reply.code(400);
      return { error: result.error };
    }
    
    // Broadcast update
    broadcastUpdate({ type: 'task-deleted', taskId: req.params.id });
    
    return { success: true };
  });

  // Get project info
  fastify.get('/api/project', async (_req, _reply) => {
    return getProjectInfo(projectPath);
  });

  // Get logs
  fastify.get('/api/logs', async (_req, _reply) => {
    return { logs: loadLogs(projectPath) };
  });
}

/**
 * Handle WebSocket messages
 */
function handleWebSocketMessage(socket: WebSocket, data: any, projectPath: string): void {
  switch (data.type) {
    case 'update-task':
      const result = updateTask(projectPath, data.taskId, data.updates);
      if (result.success) {
        broadcastUpdate({ type: 'task-updated', task: result.task });
      } else {
        socket.send(JSON.stringify({ type: 'error', error: result.error }));
      }
      break;
      
    case 'refresh':
      const tasks = loadTasks(projectPath);
      socket.send(JSON.stringify({ type: 'init', tasks }));
      break;
      
    default:
      socket.send(JSON.stringify({ type: 'error', error: 'Unknown message type' }));
  }
}

/**
 * Broadcast update to all WebSocket clients
 */
function broadcastUpdate(data: any): void {
  const message = JSON.stringify(data);
  for (const client of wsClients) {
    try {
      client.send(message);
    } catch { /* ignore dead connections */ }
  }
}

// Data access functions

function getTasksFilePath(projectPath: string): string {
  return path.join(projectPath, 'tasks', 'breakdown.json');
}

function loadTasks(projectPath: string): Task[] {
  const filePath = getTasksFilePath(projectPath);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content) as TaskBreakdown;
    return data.tasks || [];
  } catch {
    return [];
  }
}

function saveTasks(projectPath: string, tasks: Task[]): void {
  const filePath = getTasksFilePath(projectPath);
  const dir = path.dirname(filePath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const data: TaskBreakdown = {
    version: '0.2.0',
    created: new Date().toISOString().split('T')[0],
    tasks,
  };
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function updateTask(projectPath: string, taskId: string, updates: Partial<Task>): { success: boolean; task?: Task; error?: string } {
  const tasks = loadTasks(projectPath);
  const index = tasks.findIndex(t => t.id === taskId);
  
  if (index === -1) {
    return { success: false, error: 'Task not found' };
  }
  
  tasks[index] = { 
    ...tasks[index], 
    ...updates, 
    updatedAt: new Date().toISOString() 
  };
  
  saveTasks(projectPath, tasks);
  return { success: true, task: tasks[index] };
}

function createTask(projectPath: string, taskData: Partial<Task>): { success: boolean; task?: Task; error?: string } {
  if (!taskData.title) {
    return { success: false, error: 'Title is required' };
  }
  
  const tasks = loadTasks(projectPath);
  
  // Generate ID
  const maxId = tasks.reduce((max, t) => {
    const num = parseInt(t.id.replace(/\D/g, '')) || 0;
    return Math.max(max, num);
  }, 0);
  
  const task: Task = {
    id: `T${maxId + 1}`,
    title: taskData.title,
    description: taskData.description,
    status: taskData.status || 'pending',
    priority: taskData.priority || 'P1',
    effort: taskData.effort,
    dependencies: taskData.dependencies || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  tasks.push(task);
  saveTasks(projectPath, tasks);
  
  return { success: true, task };
}

function deleteTask(projectPath: string, taskId: string): { success: boolean; error?: string } {
  const tasks = loadTasks(projectPath);
  const index = tasks.findIndex(t => t.id === taskId);
  
  if (index === -1) {
    return { success: false, error: 'Task not found' };
  }
  
  tasks.splice(index, 1);
  saveTasks(projectPath, tasks);
  
  return { success: true };
}

function getProjectInfo(projectPath: string): any {
  const packageJsonPath = path.join(projectPath, 'package.json');
  const ideaPath = path.join(projectPath, 'docs', 'idea.yaml');
  
  const info: any = {
    path: projectPath,
    name: path.basename(projectPath),
  };
  
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      info.name = pkg.name;
      info.version = pkg.version;
      info.description = pkg.description;
    } catch { /* ignore */ }
  }
  
  if (fs.existsSync(ideaPath)) {
    info.hasIdea = true;
  }
  
  const tasks = loadTasks(projectPath);
  info.taskStats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
  };
  
  return info;
}

function loadLogs(projectPath: string): string[] {
  const logsDir = path.join(projectPath, 'logs');
  if (!fs.existsSync(logsDir)) {
    return [];
  }
  
  try {
    const files = fs.readdirSync(logsDir)
      .filter(f => f.endsWith('.log'))
      .slice(-10);
    
    return files.map(f => {
      const content = fs.readFileSync(path.join(logsDir, f), 'utf-8');
      return content.slice(-5000); // Last 5000 chars
    });
  } catch {
    return [];
  }
}

// CLI entry point
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = parseInt(process.env.PORT || '3000');
  const projectPath = process.argv[2] || process.cwd();
  
  startServer({ port, projectPath });
}
