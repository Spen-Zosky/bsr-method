import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import yaml from 'yaml';
import inquirer from 'inquirer';
import { LLMClient, createLLMClient } from '../lib/llm-client.js';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done' | 'blocked';
  feature: string;
  type: string;
  priority: string;
  dependencies?: string[];
}

interface LoopState {
  currentTask: Task | null;
  completedTasks: string[];
  blockedTasks: string[];
  iteration: number;
  startedAt: string;
  llm: string;
  responses: Array<{
    taskId: string;
    timestamp: string;
    prompt: string;
    response: string;
    tokens: { input: number; output: number };
  }>;
}

export const runCommand = new Command('run')
  .description('Start Ralph loop execution')
  .option('-t, --task <id>', 'Start with specific task')
  .option('--auto', 'Auto-execute with LLM (no manual approval)')
  .option('--dry-run', 'Show what would be done without executing')
  .option('--max-iterations <n>', 'Maximum iterations', '10')
  .option('--stream', 'Stream LLM responses in real-time')
  .option('--model <model>', 'Override LLM model')
  .option('--provider <provider>', 'LLM provider: claude or openai', 'claude')
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
    const llmName = options.provider || config.llm?.default || 'claude';

    // Initialize LLM client
    let llmClient: LLMClient | null = null;
    if (options.auto && !options.dryRun) {
      try {
        llmClient = await createLLMClient();
        if (options.model) {
          llmClient = new LLMClient({
            provider: options.provider as 'claude' | 'openai',
            model: options.model,
          });
        }
        console.log(chalk.green(`✓ LLM client initialized (${llmName})`));
      } catch (error) {
        console.log(chalk.yellow(`⚠ LLM not configured: ${error}`));
        console.log(chalk.gray('  Set ANTHROPIC_API_KEY or OPENAI_API_KEY environment variable'));
        console.log(chalk.gray('  Or add to .env file in project root\n'));
        
        if (options.auto) {
          console.log(chalk.red('Cannot run in --auto mode without LLM API key.\n'));
          process.exit(1);
        }
      }
    }

    console.log(chalk.gray(`LLM: ${llmName}`));
    console.log(chalk.gray(`Mode: ${options.dryRun ? 'Dry Run' : options.auto ? 'Auto Execute' : 'Interactive'}`));
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
      llm: llmName,
      responses: [],
    };

    // Load existing state if resuming
    if (await fs.pathExists('.bsr/loop-state.json')) {
      const existingState = await fs.readJson('.bsr/loop-state.json');
      state.completedTasks = existingState.completedTasks || [];
      state.blockedTasks = existingState.blockedTasks || [];
      state.responses = existingState.responses || [];
      console.log(chalk.gray(`Resuming: ${state.completedTasks.length} already completed\n`));
    }

    // Filter out already completed/blocked tasks
    const availableTasks = todoTasks.filter(
      t => !state.completedTasks.includes(t.id) && !state.blockedTasks.includes(t.id)
    );

    if (availableTasks.length === 0) {
      console.log(chalk.green('All available tasks completed!\n'));
      process.exit(0);
    }

    // Select starting task
    let startTask: Task | undefined;
    if (options.task) {
      startTask = availableTasks.find(t => t.id === options.task);
      if (!startTask) {
        console.log(chalk.red(`Task ${options.task} not found or not available.\n`));
        process.exit(1);
      }
    } else if (options.auto) {
      // Auto mode: pick highest priority
      const highPriority = availableTasks.filter(t => t.priority === 'high');
      startTask = highPriority.length > 0 ? highPriority[0] : availableTasks[0];
      console.log(chalk.cyan(`Auto-selected: ${startTask.id} - ${startTask.title}`));
    } else {
      // Interactive selection
      const { selectedTask } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedTask',
          message: 'Select task to start:',
          choices: availableTasks.slice(0, 10).map(t => ({
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
      console.log(chalk.gray(`Type: ${state.currentTask.type} | Priority: ${state.currentTask.priority}`));
      if (state.currentTask.description) {
        console.log(chalk.gray(`Description: ${state.currentTask.description}\n`));
      }

      // Generate implementation prompt
      const prompt = generateImplementationPrompt(state.currentTask, config, tasks);

      if (options.dryRun) {
        console.log(chalk.yellow('[DRY RUN] Would send to LLM:\n'));
        console.log(chalk.gray('─'.repeat(40)));
        console.log(prompt.slice(0, 800) + (prompt.length > 800 ? '\n...(truncated)' : ''));
        console.log(chalk.gray('─'.repeat(40) + '\n'));

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

      } else if (options.auto && llmClient) {
        // AUTO MODE: Execute with LLM
        console.log(chalk.cyan('Sending to LLM...\n'));

        const spinner = options.stream ? null : ora('Waiting for LLM response...').start();

        try {
          let response: string;
          const startTime = Date.now();

          if (options.stream) {
            // Streaming mode
            response = '';
            process.stdout.write(chalk.gray('─'.repeat(40) + '\n'));
            
            for await (const chunk of llmClient.stream(
              [{ role: 'user', content: prompt }],
              getSystemPrompt(config)
            )) {
              process.stdout.write(chunk);
              response += chunk;
            }
            
            process.stdout.write('\n' + chalk.gray('─'.repeat(40) + '\n'));
          } else {
            // Non-streaming mode
            const result = await llmClient.complete(
              [{ role: 'user', content: prompt }],
              getSystemPrompt(config)
            );
            response = result.content;
            spinner?.succeed(`Response received (${result.usage?.outputTokens || 0} tokens)`);

            // Display response
            console.log(chalk.gray('─'.repeat(40)));
            console.log(response.slice(0, 2000) + (response.length > 2000 ? '\n...(truncated)' : ''));
            console.log(chalk.gray('─'.repeat(40)));
          }

          const duration = Date.now() - startTime;
          console.log(chalk.gray(`\nDuration: ${(duration / 1000).toFixed(1)}s`));

          // Save response
          await fs.ensureDir('.bsr/responses');
          const responseFile = `.bsr/responses/${state.currentTask.id}-${Date.now()}.md`;
          await fs.writeFile(responseFile, `# ${state.currentTask.id}: ${state.currentTask.title}\n\n## Prompt\n\n${prompt}\n\n## Response\n\n${response}`);
          console.log(chalk.green(`Saved: ${responseFile}`));

          // Record in state
          state.responses.push({
            taskId: state.currentTask.id,
            timestamp: new Date().toISOString(),
            prompt: prompt.slice(0, 500),
            response: response.slice(0, 1000),
            tokens: { input: 0, output: 0 },
          });

          // Auto-mark as done
          state.completedTasks.push(state.currentTask.id);
          await updateTaskStatus(state.currentTask.id, 'done');
          console.log(chalk.green(`\n✓ Task ${state.currentTask.id} completed`));

        } catch (error) {
          spinner?.fail('LLM request failed');
          console.error(chalk.red(String(error)));

          state.blockedTasks.push(state.currentTask.id);
          await updateTaskStatus(state.currentTask.id, 'blocked');
          console.log(chalk.yellow(`⚠ Task ${state.currentTask.id} blocked due to error`));
        }

      } else {
        // INTERACTIVE MODE
        // Save prompt to file
        await fs.ensureDir('.bsr/prompts');
        const promptFile = `.bsr/prompts/${state.currentTask.id}-${Date.now()}.md`;
        await fs.writeFile(promptFile, prompt);
        console.log(chalk.green(`Prompt saved: ${promptFile}\n`));

        console.log(chalk.gray('─'.repeat(40)));
        console.log(prompt.slice(0, 600) + (prompt.length > 600 ? '\n...(see file for full prompt)' : ''));
        console.log(chalk.gray('─'.repeat(40) + '\n'));

        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              { name: 'Execute with LLM', value: 'execute' },
              { name: 'Mark task as done (manual)', value: 'done' },
              { name: 'Mark task as blocked', value: 'blocked' },
              { name: 'Skip to next task', value: 'skip' },
              { name: 'Exit loop', value: 'exit' },
            ],
          },
        ]);

        if (action === 'exit') break;

        if (action === 'execute') {
          // Try to execute with LLM
          if (!llmClient) {
            try {
              llmClient = await createLLMClient();
            } catch (error) {
              console.log(chalk.red(`Cannot initialize LLM: ${error}`));
              continue;
            }
          }

          const spinner = ora('Sending to LLM...').start();
          try {
            const result = await llmClient.complete(
              [{ role: 'user', content: prompt }],
              getSystemPrompt(config)
            );
            spinner.succeed(`Response received (${result.usage?.outputTokens || 0} tokens)`);

            console.log(chalk.gray('\n─'.repeat(40)));
            console.log(result.content);
            console.log(chalk.gray('─'.repeat(40) + '\n'));

            // Save response
            await fs.ensureDir('.bsr/responses');
            const responseFile = `.bsr/responses/${state.currentTask.id}-${Date.now()}.md`;
            await fs.writeFile(responseFile, `# ${state.currentTask.id}\n\n## Response\n\n${result.content}`);
            console.log(chalk.green(`Saved: ${responseFile}`));

            // Ask what to do with result
            const { resultAction } = await inquirer.prompt([
              {
                type: 'list',
                name: 'resultAction',
                message: 'Result action:',
                choices: [
                  { name: 'Accept and mark done', value: 'done' },
                  { name: 'Mark as blocked (needs work)', value: 'blocked' },
                  { name: 'Skip (keep in todo)', value: 'skip' },
                ],
              },
            ]);

            if (resultAction === 'done') {
              state.completedTasks.push(state.currentTask.id);
              await updateTaskStatus(state.currentTask.id, 'done');
              console.log(chalk.green(`✓ Task ${state.currentTask.id} completed`));
            } else if (resultAction === 'blocked') {
              state.blockedTasks.push(state.currentTask.id);
              await updateTaskStatus(state.currentTask.id, 'blocked');
            }

          } catch (error) {
            spinner.fail('LLM request failed');
            console.error(chalk.red(String(error)));
          }

        } else if (action === 'done') {
          state.completedTasks.push(state.currentTask.id);
          await updateTaskStatus(state.currentTask.id, 'done');
          console.log(chalk.green(`\n✓ Task ${state.currentTask.id} completed`));

        } else if (action === 'blocked') {
          state.blockedTasks.push(state.currentTask.id);
          await updateTaskStatus(state.currentTask.id, 'blocked');
          console.log(chalk.yellow(`\n⚠ Task ${state.currentTask.id} blocked`));
        }
      }

      // Save state after each iteration
      await fs.writeJson('.bsr/loop-state.json', state, { spaces: 2 });

      // Find next task
      const remainingTasks = availableTasks.filter(
        t => !state.completedTasks.includes(t.id) &&
             !state.blockedTasks.includes(t.id) &&
             t.id !== state.currentTask?.id
      );

      if (remainingTasks.length === 0) {
        console.log(chalk.green('\n✓ No more tasks to process!'));
        break;
      }

      // Continue to next?
      if (options.auto) {
        // Auto mode: continue with next high-priority
        const highPriority = remainingTasks.filter(t => t.priority === 'high');
        state.currentTask = highPriority.length > 0 ? highPriority[0] : remainingTasks[0];
        console.log(chalk.cyan(`\nNext: ${state.currentTask.id} - ${state.currentTask.title}`));
      } else {
        const { continueLoop } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'continueLoop',
            message: `Continue to next task? (${remainingTasks.length} remaining)`,
            default: true,
          },
        ]);

        if (!continueLoop) break;

        // Select next task
        const { nextTask } = await inquirer.prompt([
          {
            type: 'list',
            name: 'nextTask',
            message: 'Select next task:',
            choices: remainingTasks.slice(0, 10).map(t => ({
              name: `${t.id}: ${t.title} [${t.priority}]`,
              value: t,
            })),
          },
        ]);
        state.currentTask = nextTask;
      }
    }

    // Final save
    await fs.writeJson('.bsr/loop-state.json', state, { spaces: 2 });

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

    console.log(chalk.blue('\nState saved to .bsr/loop-state.json'));
    console.log(chalk.blue('Run bsr status to see current progress\n'));
  });

async function loadTasks(): Promise<Task[]> {
  if (await fs.pathExists('tasks/breakdown.json')) {
    return await fs.readJson('tasks/breakdown.json');
  }

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

async function updateTaskStatus(taskId: string, status: 'done' | 'blocked' | 'in-progress'): Promise<void> {
  if (await fs.pathExists('tasks/breakdown.json')) {
    const tasks = await fs.readJson('tasks/breakdown.json');
    const task = tasks.find((t: Task) => t.id === taskId);
    if (task) {
      task.status = status;
      await fs.writeJson('tasks/breakdown.json', tasks, { spaces: 2 });
    }
  }

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

function getSystemPrompt(config: any): string {
  const projectName = config.project?.name || 'Project';
  const projectType = config.project?.type || 'application';

  return `You are an expert software developer working on "${projectName}" (${projectType}).

Your role is to implement tasks as part of the BSR Method development workflow.

Guidelines:
1. Write clean, well-documented TypeScript/JavaScript code
2. Follow best practices and the project's coding style
3. Include error handling and edge cases
4. Provide complete, working implementations
5. Explain your approach briefly before the code
6. If you need clarification, state your assumptions

Output format:
1. Brief analysis of the task
2. Implementation plan (2-3 bullet points)
3. Code implementation with comments
4. Any notes or follow-up suggestions`;
}

function generateImplementationPrompt(task: Task, config: any, allTasks: Task[]): string {
  const projectName = config.project?.name || 'Project';
  const projectType = config.project?.type || 'application';

  // Find related tasks
  const relatedTasks = task.dependencies
    ? allTasks.filter(t => task.dependencies?.includes(t.id))
    : [];

  let prompt = `# Implementation Task: ${task.id}

## Project Context
- **Project**: ${projectName}
- **Type**: ${projectType}
- **Task ID**: ${task.id}
- **Task Type**: ${task.type}
- **Priority**: ${task.priority}

## Task
**${task.title}**

${task.description || 'Implement as specified in the task title.'}

## Requirements
1. Follow the project's coding standards and TypeScript conventions
2. Write clean, maintainable code with appropriate error handling
3. Include JSDoc comments for public APIs
4. Consider edge cases and validation
`;

  if (relatedTasks.length > 0) {
    prompt += `
## Related Tasks (Dependencies)
${relatedTasks.map(t => `- ${t.id}: ${t.title} (${t.status})`).join('\n')}
`;
  }

  prompt += `
## Expected Output
Please provide:
1. **Analysis**: Brief review of what's needed (2-3 sentences)
2. **Implementation**: Complete code with comments
3. **Testing**: How to verify it works
4. **Notes**: Any assumptions or follow-up items

## Project Structure
\`\`\`
src/
├── commands/      # CLI command implementations
├── lib/           # Core libraries and utilities
├── types/         # TypeScript type definitions
└── index.ts       # Main entry point
\`\`\`

---
*BSR Method - Ralph Loop | Task ${task.id} | ${new Date().toISOString()}*
`;

  return prompt;
}

async function updateProgress(state: LoopState): Promise<void> {
  const progressPath = 'progress.txt';
  let content = await fs.pathExists(progressPath) ? await fs.readFile(progressPath, 'utf-8') : '';

  content = content.replace(/## Current Phase\n\w+/, '## Current Phase\nexecution');

  const timestamp = new Date().toISOString();
  if (!content.includes('## History')) content += '\n## History\n';
  content += `- [${timestamp}] Ralph Loop: ${state.completedTasks.length} completed, ${state.blockedTasks.length} blocked (${state.iteration} iterations)\n`;

  await fs.writeFile(progressPath, content);
}
