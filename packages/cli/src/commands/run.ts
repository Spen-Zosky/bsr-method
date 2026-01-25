import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';
import inquirer from 'inquirer';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  feature: string;
  type: string;
  priority: string;
}

interface LoopState {
  currentTask: Task | null;
  completedTasks: string[];
  blockedTasks: string[];
  iteration: number;
  startedAt: string;
  llm: string;
}

export const runCommand = new Command('run')
  .description('Start Ralph loop execution')
  .option('-t, --task <id>', 'Start with specific task')
  .option('--auto', 'Auto-approve simple tasks')
  .option('--dry-run', 'Show what would be done without executing')
  .option('--max-iterations <n>', 'Maximum iterations', '10')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n[BSR Run] Ralph Loop Execution\n'));

    // Check prerequisites
    if (!(await fs.pathExists('.bsr/config.yaml'))) {
      console.log(chalk.red('Error: BSR not initialized. Run bsr init first.\n'));
      process.exit(1);
    }

    if (!(await fs.pathExists('tasks/breakdown.md')) && !(await fs.pathExists('tasks/breakdown.json'))) {
      console.log(chalk.red('Error: No tasks found. Run bsr tasks first.\n'));
      process.exit(1);
    }

    const config = yaml.parse(await fs.readFile('.bsr/config.yaml', 'utf-8'));
    const llm = config.llm?.default || 'claude';

    console.log(chalk.gray(`LLM: ${llm}`));
    console.log(chalk.gray(`Mode: ${options.dryRun ? 'Dry Run' : 'Execute'}`));
    console.log(chalk.gray(`Max iterations: ${options.maxIterations}\n`));

    // Load tasks
    const tasks = await loadTasks();
    const todoTasks = tasks.filter(t => t.status === 'todo');

    if (todoTasks.length === 0) {
      console.log(chalk.green('All tasks completed!\n'));
      process.exit(0);
    }

    console.log(chalk.cyan(`Found ${todoTasks.length} pending tasks\n`));

    // Initialize loop state
    const state: LoopState = {
      currentTask: null,
      completedTasks: [],
      blockedTasks: [],
      iteration: 0,
      startedAt: new Date().toISOString(),
      llm,
    };

    // Select starting task
    let startTask: Task | undefined;
    if (options.task) {
      startTask = todoTasks.find(t => t.id === options.task);
      if (!startTask) {
        console.log(chalk.red(`Task ${options.task} not found or not in todo status.\n`));
        process.exit(1);
      }
    } else {
      // Interactive selection
      const { selectedTask } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedTask',
          message: 'Select task to start:',
          choices: todoTasks.slice(0, 10).map(t => ({
            name: `${t.id}: ${t.title} [${t.priority}]`,
            value: t,
          })),
        },
      ]);
      startTask = selectedTask;
    }

    if (!startTask) {
      console.log(chalk.red('No task selected.\n'));
      process.exit(1);
    }

    // Start Ralph Loop
    console.log(chalk.blue.bold('\n' + '='.repeat(50)));
    console.log(chalk.blue.bold('Starting Ralph Loop'));
    console.log(chalk.blue.bold('='.repeat(50) + '\n'));

    const maxIterations = parseInt(options.maxIterations);
    state.currentTask = startTask;

    while (state.iteration < maxIterations && state.currentTask) {
      state.iteration++;

      console.log(chalk.cyan(`\n--- Iteration ${state.iteration} ---\n`));
      console.log(chalk.bold(`Task: ${state.currentTask.id}`));
      console.log(chalk.gray(`Title: ${state.currentTask.title}`));
      console.log(chalk.gray(`Description: ${state.currentTask.description}\n`));

      if (options.dryRun) {
        console.log(chalk.yellow('[DRY RUN] Would execute task...\n'));
        
        // Simulate completion
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'Simulate outcome:',
            choices: [
              { name: 'Mark as done', value: 'done' },
              { name: 'Mark as blocked', value: 'blocked' },
              { name: 'Skip to next', value: 'skip' },
              { name: 'Exit loop', value: 'exit' },
            ],
          },
        ]);

        if (action === 'exit') break;
        if (action === 'done') {
          state.completedTasks.push(state.currentTask.id);
          console.log(chalk.green(`✓ Task ${state.currentTask.id} marked as done`));
        } else if (action === 'blocked') {
          state.blockedTasks.push(state.currentTask.id);
          console.log(chalk.yellow(`⚠ Task ${state.currentTask.id} marked as blocked`));
        }
      } else {
        // Generate implementation prompt
        const prompt = generateImplementationPrompt(state.currentTask, config);
        
        console.log(chalk.cyan('Generated prompt for LLM:\n'));
        console.log(chalk.gray('─'.repeat(40)));
        console.log(prompt.slice(0, 500) + (prompt.length > 500 ? '...' : ''));
        console.log(chalk.gray('─'.repeat(40) + '\n'));

        // Save prompt to file
        await fs.ensureDir('.bsr/prompts');
        const promptFile = `.bsr/prompts/${state.currentTask.id}-${Date.now()}.md`;
        await fs.writeFile(promptFile, prompt);
        console.log(chalk.green(`Prompt saved: ${promptFile}\n`));

        // Ask for action
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              { name: 'Copy prompt to clipboard and mark done', value: 'copy-done' },
              { name: 'Open prompt file', value: 'open' },
              { name: 'Mark task as done', value: 'done' },
              { name: 'Mark task as blocked', value: 'blocked' },
              { name: 'Skip to next task', value: 'skip' },
              { name: 'Exit loop', value: 'exit' },
            ],
          },
        ]);

        if (action === 'exit') break;

        if (action === 'copy-done' || action === 'done') {
          state.completedTasks.push(state.currentTask.id);
          await updateTaskStatus(state.currentTask.id, 'done');
          console.log(chalk.green(`\n✓ Task ${state.currentTask.id} completed`));
        } else if (action === 'blocked') {
          state.blockedTasks.push(state.currentTask.id);
          await updateTaskStatus(state.currentTask.id, 'blocked');
          console.log(chalk.yellow(`\n⚠ Task ${state.currentTask.id} blocked`));
        }

        if (action === 'open') {
          console.log(chalk.gray(`Open file: ${path.resolve(promptFile)}`));
        }
      }

      // Find next task
      const remainingTasks = todoTasks.filter(
        t => !state.completedTasks.includes(t.id) && 
             !state.blockedTasks.includes(t.id) &&
             t.id !== state.currentTask?.id
      );

      if (remainingTasks.length === 0) {
        console.log(chalk.green('\nNo more tasks to process!'));
        break;
      }

      // Auto-select next or prompt
      const { continueLoop } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continueLoop',
          message: `Continue to next task? (${remainingTasks.length} remaining)`,
          default: true,
        },
      ]);

      if (!continueLoop) break;

      // Select next task (first by priority)
      const highPriority = remainingTasks.filter(t => t.priority === 'high');
      state.currentTask = highPriority.length > 0 ? highPriority[0] : remainingTasks[0];
    }

    // Save loop state
    await fs.writeFile('.bsr/loop-state.json', JSON.stringify(state, null, 2));

    // Summary
    console.log(chalk.blue.bold('\n' + '='.repeat(50)));
    console.log(chalk.blue.bold('Ralph Loop Summary'));
    console.log(chalk.blue.bold('='.repeat(50)));

    console.log(`\nIterations: ${state.iteration}`);
    console.log(`Completed: ${state.completedTasks.length}`);
    console.log(`Blocked: ${state.blockedTasks.length}`);

    if (state.completedTasks.length > 0) {
      console.log(chalk.green('\nCompleted tasks:'));
      state.completedTasks.forEach(id => console.log(`  ✓ ${id}`));
    }

    if (state.blockedTasks.length > 0) {
      console.log(chalk.yellow('\nBlocked tasks:'));
      state.blockedTasks.forEach(id => console.log(`  ⚠ ${id}`));
    }

    // Update progress
    await updateProgress(state);

    console.log(chalk.blue('\nLoop state saved to .bsr/loop-state.json'));
    console.log(chalk.blue('Run bsr status to see current progress\n'));
  });

async function loadTasks(): Promise<Task[]> {
  // Try JSON first
  if (await fs.pathExists('tasks/breakdown.json')) {
    return await fs.readJson('tasks/breakdown.json');
  }

  // Parse from markdown
  if (await fs.pathExists('tasks/breakdown.md')) {
    const content = await fs.readFile('tasks/breakdown.md', 'utf-8');
    const tasks: Task[] = [];
    
    const taskRegex = /- \[([ x])\] \*\*([A-Z]+-\d+)\*\*: (.+?)(?:\n|$)/g;
    let match;
    
    while ((match = taskRegex.exec(content)) !== null) {
      tasks.push({
        id: match[2],
        title: match[3].split('[')[0].trim(),
        description: '',
        status: match[1] === 'x' ? 'done' : 'todo',
        feature: 'general',
        type: 'feature',
        priority: 'medium',
      });
    }
    
    return tasks;
  }

  return [];
}

async function updateTaskStatus(taskId: string, status: 'done' | 'blocked'): Promise<void> {
  // Update JSON if exists
  if (await fs.pathExists('tasks/breakdown.json')) {
    const tasks = await fs.readJson('tasks/breakdown.json');
    const task = tasks.find((t: Task) => t.id === taskId);
    if (task) {
      task.status = status;
      await fs.writeJson('tasks/breakdown.json', tasks, { spaces: 2 });
    }
  }

  // Update markdown
  if (await fs.pathExists('tasks/breakdown.md')) {
    let content = await fs.readFile('tasks/breakdown.md', 'utf-8');
    const checkMark = status === 'done' ? 'x' : ' ';
    content = content.replace(
      new RegExp(`- \\[[ x]\\] \\*\\*${taskId}\\*\\*`),
      `- [${checkMark}] **${taskId}**`
    );
    await fs.writeFile('tasks/breakdown.md', content);
  }
}

function generateImplementationPrompt(task: Task, config: any): string {
  const projectName = config.project?.name || 'Project';
  
  return `# Implementation Task: ${task.id}

## Context
Project: ${projectName}
Task: ${task.title}
Type: ${task.type}
Priority: ${task.priority}

## Description
${task.description || 'Implement the feature as specified in the task title.'}

## Requirements
1. Follow the project's coding standards and conventions
2. Write clean, maintainable TypeScript code
3. Include appropriate error handling
4. Add JSDoc comments for public APIs
5. Write unit tests if applicable

## Instructions
Please implement this task following these steps:

1. **Analyze**: Review the task requirements and identify the affected files
2. **Plan**: Outline the implementation approach
3. **Implement**: Write the code changes
4. **Test**: Verify the implementation works correctly
5. **Document**: Update any relevant documentation

## Expected Output
- List of files modified/created
- Code implementation
- Test cases (if applicable)
- Any notes or concerns

## Project Structure Reference
\`\`\`
src/
├── commands/      # CLI commands
├── lib/           # Core libraries
├── utils/         # Utility functions
└── types/         # TypeScript types
\`\`\`

---
Generated by BSR Method - Ralph Loop
Task ID: ${task.id}
Generated: ${new Date().toISOString()}
`;
}

async function updateProgress(state: LoopState): Promise<void> {
  const progressPath = 'progress.txt';
  let content = await fs.pathExists(progressPath) ? await fs.readFile(progressPath, 'utf-8') : '';
  
  content = content.replace(/## Current Phase\n\w+/, '## Current Phase\nexecution');
  
  const timestamp = new Date().toISOString();
  if (!content.includes('## History')) content += '\n## History\n';
  content += `- [${timestamp}] Ralph Loop: ${state.completedTasks.length} completed, ${state.blockedTasks.length} blocked\n`;
  
  await fs.writeFile(progressPath, content);
}
