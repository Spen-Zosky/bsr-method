import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';

export const initCommand = new Command('init')
  .description('Initialize BSR Method in a project')
  .option('-g, --greenfield', 'Start a new greenfield project')
  .option('-b, --brownfield', 'Initialize on existing project')
  .option('-l, --llm <target>', 'Target LLM (claude, cursor, copilot, vscode, generic)', 'claude')
  .option('-n, --name <name>', 'Project name')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .action(async (options) => {
    console.log(chalk.blue.bold('\nðŸš€ BSR Method Initialization\n'));

    let projectType = options.greenfield ? 'greenfield' : options.brownfield ? 'brownfield' : null;
    let llmTarget = options.llm;
    const projectName = options.name || path.basename(process.cwd());

    if (!projectType && !options.yes) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'projectType',
          message: 'What type of project is this?',
          choices: [
            { name: 'Greenfield - New project from scratch', value: 'greenfield' },
            { name: 'Brownfield - Existing project to analyze', value: 'brownfield' },
          ],
        },
      ]);
      projectType = answers.projectType;
    }

    if (!options.llm && !options.yes) {
      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'llm',
          message: 'Which LLM/IDE will you use?',
          choices: [
            { name: 'Claude (Claude Code CLI)', value: 'claude' },
            { name: 'Cursor', value: 'cursor' },
            { name: 'GitHub Copilot', value: 'copilot' },
            { name: 'VS Code', value: 'vscode' },
            { name: 'Generic', value: 'generic' },
          ],
        },
      ]);
      llmTarget = answers.llm;
    }

    projectType = projectType || 'greenfield';
    llmTarget = llmTarget || 'claude';

    const spinner = ora('Setting up BSR Method...').start();

    try {
      await fs.ensureDir('.bsr');

      const config = {
        version: '1.0',
        project: {
          name: projectName,
          type: projectType,
          created: new Date().toISOString(),
        },
        llm: { target: llmTarget },
        workflow: {
          auto_commit: true,
          commit_prefix: '[BSR]',
          progress_file: 'progress.txt',
        },
        discovery: {
          enabled: projectType === 'brownfield',
          scanners: { code: true, database: true, config: true, api: true, test: true, docs: true, deps: true },
          exclude: ['node_modules', 'dist', '.git'],
        },
        dashboard: { port: 3456, auto_open: true },
        export: { formats: ['md', 'html', 'pdf'], output_dir: '.bsr/reports' },
        memory: { enabled: true, database: '.bsr/memory.db' },
      };

      await fs.writeFile('.bsr/config.yaml', yaml.stringify(config));

      const instructionsFile =
        llmTarget === 'claude' ? 'CLAUDE.md' :
        llmTarget === 'cursor' ? '.cursorrules' :
        llmTarget === 'copilot' ? '.github/copilot-instructions.md' :
        'BSR-INSTRUCTIONS.md';

      if (instructionsFile.includes('/')) {
        await fs.ensureDir(path.dirname(instructionsFile));
      }

      const instructions = `# ${projectName} - Development Instructions

## Overview
This is a **${projectType}** project using BSR Method.

## BSR Commands
- \`bsr discover\` - Analyze codebase (brownfield)
- \`bsr plan\` - Run BMAD planning
- \`bsr spec\` - Generate specifications
- \`bsr tasks\` - Generate task breakdown
- \`bsr run\` - Start Ralph loop
- \`bsr status\` - Check progress
- \`bsr dashboard\` - Open web UI

## Key Files
- \`.bsr/config.yaml\` - Configuration
- \`progress.txt\` - Progress tracking
- \`docs/\` - Generated documentation
- \`specs/\` - Specifications

## Current Status
Check \`progress.txt\` for current phase.
`;

      await fs.writeFile(instructionsFile, instructions);

      const progressContent = `# BSR Method Progress Tracker
# Project: ${projectName}
# Type: ${projectType}
# Started: ${new Date().toISOString()}

## Current Phase
initialization

## Status
pending

## Next Steps
${projectType === 'greenfield'
  ? '1. Define your IDEA\n2. Run: bsr plan'
  : '1. Run: bsr discover\n2. Review discovery results\n3. Run: bsr plan --from-dps'}
`;

      await fs.writeFile('progress.txt', progressContent);
      await fs.ensureDir('docs');

      spinner.succeed('BSR Method initialized!');

      console.log(chalk.green('\nâœ… Created:'));
      console.log(`   â€¢ .bsr/config.yaml`);
      console.log(`   â€¢ ${instructionsFile}`);
      console.log(`   â€¢ progress.txt`);

      console.log(chalk.blue('\nðŸ“‹ Next steps:'));
      if (projectType === 'greenfield') {
        console.log(`   1. Define your IDEA in ${instructionsFile}`);
        console.log(`   2. Run: ${chalk.yellow('bsr plan')}`);
      } else {
        console.log(`   1. Run: ${chalk.yellow('bsr discover')}`);
        console.log(`   2. Review: discovery/project-context.yaml`);
      }
      console.log('');
    } catch (error) {
      spinner.fail('Failed to initialize');
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });
