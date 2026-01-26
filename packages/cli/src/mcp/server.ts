#!/usr/bin/env node
/**
 * BSR Method - MCP Server
 * Model Context Protocol server for Claude Desktop integration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// BSR project path (can be overridden via env)
const BSR_PROJECT_PATH = process.env.BSR_PROJECT_PATH || process.cwd();

/**
 * MCP Server for BSR Method
 */
class BSRMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'bsr-method',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'bsr_status',
          description: 'Get current BSR project status including tasks, progress, and loop state',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Path to BSR project (optional, uses current dir)',
              },
            },
          },
        },
        {
          name: 'bsr_list_tasks',
          description: 'List all tasks with their status, priority, and type',
          inputSchema: {
            type: 'object',
            properties: {
              status: {
                type: 'string',
                enum: ['all', 'todo', 'done', 'blocked', 'in-progress'],
                description: 'Filter by status',
              },
              priority: {
                type: 'string',
                enum: ['all', 'high', 'medium', 'low'],
                description: 'Filter by priority',
              },
            },
          },
        },
        {
          name: 'bsr_get_task',
          description: 'Get detailed information about a specific task',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: {
                type: 'string',
                description: 'Task ID (e.g., TASK-001)',
              },
            },
            required: ['taskId'],
          },
        },
        {
          name: 'bsr_update_task',
          description: 'Update task status',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: {
                type: 'string',
                description: 'Task ID to update',
              },
              status: {
                type: 'string',
                enum: ['todo', 'in-progress', 'done', 'blocked'],
                description: 'New status',
              },
            },
            required: ['taskId', 'status'],
          },
        },
        {
          name: 'bsr_get_spec',
          description: 'Get specification document for a feature',
          inputSchema: {
            type: 'object',
            properties: {
              feature: {
                type: 'string',
                description: 'Feature name or slug',
              },
            },
            required: ['feature'],
          },
        },
        {
          name: 'bsr_get_idea',
          description: 'Get the project idea/vision document',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'bsr_run_command',
          description: 'Execute a BSR CLI command',
          inputSchema: {
            type: 'object',
            properties: {
              command: {
                type: 'string',
                enum: ['init', 'status', 'plan', 'spec', 'tasks', 'discover', 'export'],
                description: 'BSR command to run',
              },
              args: {
                type: 'string',
                description: 'Additional arguments',
              },
            },
            required: ['command'],
          },
        },
        {
          name: 'bsr_save_implementation',
          description: 'Save implementation code for a task',
          inputSchema: {
            type: 'object',
            properties: {
              taskId: {
                type: 'string',
                description: 'Task ID',
              },
              filename: {
                type: 'string',
                description: 'Target filename (relative to src/)',
              },
              code: {
                type: 'string',
                description: 'Implementation code',
              },
              description: {
                type: 'string',
                description: 'Brief description of the implementation',
              },
            },
            required: ['taskId', 'filename', 'code'],
          },
        },
      ],
    }));

    // List resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => ({
      resources: [
        {
          uri: 'bsr://config',
          name: 'BSR Configuration',
          description: 'Current BSR project configuration',
          mimeType: 'application/yaml',
        },
        {
          uri: 'bsr://tasks',
          name: 'Task Breakdown',
          description: 'All project tasks',
          mimeType: 'application/json',
        },
        {
          uri: 'bsr://idea',
          name: 'Project Idea',
          description: 'Project vision and goals',
          mimeType: 'application/yaml',
        },
        {
          uri: 'bsr://loop-state',
          name: 'Ralph Loop State',
          description: 'Current execution loop state',
          mimeType: 'application/json',
        },
        {
          uri: 'bsr://progress',
          name: 'Progress',
          description: 'Project progress tracking',
          mimeType: 'text/plain',
        },
      ],
    }));

    // Read resource
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;

      switch (uri) {
        case 'bsr://config': {
          const configPath = path.join(BSR_PROJECT_PATH, '.bsr/config.yaml');
          if (await fs.pathExists(configPath)) {
            const content = await fs.readFile(configPath, 'utf-8');
            return { contents: [{ uri, mimeType: 'application/yaml', text: content }] };
          }
          return { contents: [{ uri, mimeType: 'text/plain', text: 'Not initialized' }] };
        }

        case 'bsr://tasks': {
          const tasksPath = path.join(BSR_PROJECT_PATH, 'tasks/breakdown.json');
          if (await fs.pathExists(tasksPath)) {
            const content = await fs.readFile(tasksPath, 'utf-8');
            return { contents: [{ uri, mimeType: 'application/json', text: content }] };
          }
          return { contents: [{ uri, mimeType: 'application/json', text: '[]' }] };
        }

        case 'bsr://idea': {
          const ideaPath = path.join(BSR_PROJECT_PATH, 'docs/idea.yaml');
          if (await fs.pathExists(ideaPath)) {
            const content = await fs.readFile(ideaPath, 'utf-8');
            return { contents: [{ uri, mimeType: 'application/yaml', text: content }] };
          }
          return { contents: [{ uri, mimeType: 'text/plain', text: 'No idea defined' }] };
        }

        case 'bsr://loop-state': {
          const statePath = path.join(BSR_PROJECT_PATH, '.bsr/loop-state.json');
          if (await fs.pathExists(statePath)) {
            const content = await fs.readFile(statePath, 'utf-8');
            return { contents: [{ uri, mimeType: 'application/json', text: content }] };
          }
          return { contents: [{ uri, mimeType: 'application/json', text: '{}' }] };
        }

        case 'bsr://progress': {
          const progressPath = path.join(BSR_PROJECT_PATH, 'progress.txt');
          if (await fs.pathExists(progressPath)) {
            const content = await fs.readFile(progressPath, 'utf-8');
            return { contents: [{ uri, mimeType: 'text/plain', text: content }] };
          }
          return { contents: [{ uri, mimeType: 'text/plain', text: 'No progress tracked' }] };
        }

        default:
          throw new Error(`Unknown resource: ${uri}`);
      }
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'bsr_status':
          return this.handleStatus(args);

        case 'bsr_list_tasks':
          return this.handleListTasks(args);

        case 'bsr_get_task':
          return this.handleGetTask(args);

        case 'bsr_update_task':
          return this.handleUpdateTask(args);

        case 'bsr_get_spec':
          return this.handleGetSpec(args);

        case 'bsr_get_idea':
          return this.handleGetIdea();

        case 'bsr_run_command':
          return this.handleRunCommand(args);

        case 'bsr_save_implementation':
          return this.handleSaveImplementation(args);

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async handleStatus(args: any): Promise<any> {
    const projectPath = args?.projectPath || BSR_PROJECT_PATH;

    const status: any = {
      initialized: false,
      projectName: null,
      tasks: { total: 0, todo: 0, done: 0, blocked: 0 },
      loopState: null,
    };

    // Check if initialized
    const configPath = path.join(projectPath, '.bsr/config.yaml');
    if (await fs.pathExists(configPath)) {
      status.initialized = true;
      const config = yaml.parse(await fs.readFile(configPath, 'utf-8'));
      status.projectName = config.project?.name;
      status.llm = config.llm?.default;
    }

    // Load tasks
    const tasksPath = path.join(projectPath, 'tasks/breakdown.json');
    if (await fs.pathExists(tasksPath)) {
      const tasks = await fs.readJson(tasksPath);
      status.tasks.total = tasks.length;
      status.tasks.todo = tasks.filter((t: any) => t.status === 'todo').length;
      status.tasks.done = tasks.filter((t: any) => t.status === 'done').length;
      status.tasks.blocked = tasks.filter((t: any) => t.status === 'blocked').length;
      status.tasks.inProgress = tasks.filter((t: any) => t.status === 'in-progress').length;
    }

    // Load loop state
    const statePath = path.join(projectPath, '.bsr/loop-state.json');
    if (await fs.pathExists(statePath)) {
      status.loopState = await fs.readJson(statePath);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  }

  private async handleListTasks(args: any): Promise<any> {
    const tasksPath = path.join(BSR_PROJECT_PATH, 'tasks/breakdown.json');

    if (!(await fs.pathExists(tasksPath))) {
      return {
        content: [{ type: 'text', text: 'No tasks found. Run bsr tasks first.' }],
      };
    }

    let tasks = await fs.readJson(tasksPath);

    // Filter by status
    if (args?.status && args.status !== 'all') {
      tasks = tasks.filter((t: any) => t.status === args.status);
    }

    // Filter by priority
    if (args?.priority && args.priority !== 'all') {
      tasks = tasks.filter((t: any) => t.priority === args.priority);
    }

    const summary = tasks.map((t: any) => ({
      id: t.id,
      title: t.title,
      status: t.status,
      priority: t.priority,
      type: t.type,
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(summary, null, 2),
        },
      ],
    };
  }

  private async handleGetTask(args: any): Promise<any> {
    if (!args?.taskId) {
      return { content: [{ type: 'text', text: 'Error: taskId is required' }] };
    }

    const tasksPath = path.join(BSR_PROJECT_PATH, 'tasks/breakdown.json');
    if (!(await fs.pathExists(tasksPath))) {
      return { content: [{ type: 'text', text: 'No tasks found' }] };
    }

    const tasks = await fs.readJson(tasksPath);
    const task = tasks.find((t: any) => t.id === args.taskId);

    if (!task) {
      return { content: [{ type: 'text', text: `Task ${args.taskId} not found` }] };
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(task, null, 2) }],
    };
  }

  private async handleUpdateTask(args: any): Promise<any> {
    if (!args?.taskId || !args?.status) {
      return { content: [{ type: 'text', text: 'Error: taskId and status are required' }] };
    }

    const tasksPath = path.join(BSR_PROJECT_PATH, 'tasks/breakdown.json');
    if (!(await fs.pathExists(tasksPath))) {
      return { content: [{ type: 'text', text: 'No tasks found' }] };
    }

    const tasks = await fs.readJson(tasksPath);
    const task = tasks.find((t: any) => t.id === args.taskId);

    if (!task) {
      return { content: [{ type: 'text', text: `Task ${args.taskId} not found` }] };
    }

    const oldStatus = task.status;
    task.status = args.status;
    await fs.writeJson(tasksPath, tasks, { spaces: 2 });

    return {
      content: [
        {
          type: 'text',
          text: `Task ${args.taskId} updated: ${oldStatus} → ${args.status}`,
        },
      ],
    };
  }

  private async handleGetSpec(args: any): Promise<any> {
    if (!args?.feature) {
      return { content: [{ type: 'text', text: 'Error: feature is required' }] };
    }

    const specsDir = path.join(BSR_PROJECT_PATH, 'specs');
    if (!(await fs.pathExists(specsDir))) {
      return { content: [{ type: 'text', text: 'No specs directory found' }] };
    }

    // Try to find matching spec file
    const slug = args.feature.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const possibleNames = [
      `${slug}.md`,
      `${slug}-spec.md`,
      `spec-${slug}.md`,
      `${args.feature}.md`,
    ];

    for (const name of possibleNames) {
      const specPath = path.join(specsDir, name);
      if (await fs.pathExists(specPath)) {
        const content = await fs.readFile(specPath, 'utf-8');
        return { content: [{ type: 'text', text: content }] };
      }
    }

    // List available specs
    const files = await fs.readdir(specsDir);
    const specs = files.filter(f => f.endsWith('.md'));

    return {
      content: [
        {
          type: 'text',
          text: `Spec for "${args.feature}" not found.\n\nAvailable specs:\n${specs.map(s => `- ${s}`).join('\n')}`,
        },
      ],
    };
  }

  private async handleGetIdea(): Promise<any> {
    const ideaPath = path.join(BSR_PROJECT_PATH, 'docs/idea.yaml');

    if (!(await fs.pathExists(ideaPath))) {
      return { content: [{ type: 'text', text: 'No idea defined. Run bsr plan first.' }] };
    }

    const content = await fs.readFile(ideaPath, 'utf-8');
    return { content: [{ type: 'text', text: content }] };
  }

  private async handleRunCommand(args: any): Promise<any> {
    if (!args?.command) {
      return { content: [{ type: 'text', text: 'Error: command is required' }] };
    }

    const allowedCommands = ['init', 'status', 'plan', 'spec', 'tasks', 'discover', 'export'];
    if (!allowedCommands.includes(args.command)) {
      return {
        content: [
          {
            type: 'text',
            text: `Command not allowed. Allowed: ${allowedCommands.join(', ')}`,
          },
        ],
      };
    }

    try {
      const cmdArgs = args.args ? ` ${args.args}` : '';
      const { stdout, stderr } = await execAsync(
        `npx bsr ${args.command}${cmdArgs}`,
        { cwd: BSR_PROJECT_PATH, timeout: 60000 }
      );

      return {
        content: [{ type: 'text', text: stdout || stderr || 'Command completed' }],
      };
    } catch (error: any) {
      return {
        content: [{ type: 'text', text: `Error: ${error.message}` }],
      };
    }
  }

  private async handleSaveImplementation(args: any): Promise<any> {
    if (!args?.taskId || !args?.filename || !args?.code) {
      return {
        content: [{ type: 'text', text: 'Error: taskId, filename, and code are required' }],
      };
    }

    // Ensure src directory exists
    const srcDir = path.join(BSR_PROJECT_PATH, 'src');
    await fs.ensureDir(srcDir);

    // Determine full path
    const targetPath = path.join(srcDir, args.filename);
    await fs.ensureDir(path.dirname(targetPath));

    // Write file
    await fs.writeFile(targetPath, args.code);

    // Log implementation
    const logPath = path.join(BSR_PROJECT_PATH, '.bsr/implementations.json');
    let log: any[] = [];
    if (await fs.pathExists(logPath)) {
      log = await fs.readJson(logPath);
    }

    log.push({
      taskId: args.taskId,
      filename: args.filename,
      description: args.description || '',
      timestamp: new Date().toISOString(),
      size: args.code.length,
    });

    await fs.writeJson(logPath, log, { spaces: 2 });

    return {
      content: [
        {
          type: 'text',
          text: `Saved: src/${args.filename} (${args.code.length} bytes)\nTask: ${args.taskId}`,
        },
      ],
    };
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('BSR Method MCP Server running on stdio');
  }
}

// Start server
const server = new BSRMCPServer();
server.run().catch(console.error);
