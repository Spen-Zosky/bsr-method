import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import yaml from 'yaml';

export const statusCommand = new Command('status')
  .description('Show current BSR project status')
  .option('-j, --json', 'Output as JSON')
  .action(async (options) => {
    const configPath = '.bsr/config.yaml';

    if (!(await fs.pathExists(configPath))) {
      console.log(chalk.red('\nâŒ BSR not initialized. Run `bsr init` first.\n'));
      process.exit(1);
    }

    const config = yaml.parse(await fs.readFile(configPath, 'utf-8'));

    let phase = 'unknown';
    let status = 'unknown';

    if (await fs.pathExists('progress.txt')) {
      const progress = await fs.readFile('progress.txt', 'utf-8');
      const phaseMatch = progress.match(/## Current Phase\n(\w+)/);
      const statusMatch = progress.match(/## Status\n(\w+)/);
      if (phaseMatch) phase = phaseMatch[1];
      if (statusMatch) status = statusMatch[1];
    }

    const result = {
      project: config.project.name,
      type: config.project.type,
      llm: config.llm.target,
      phase,
      status,
      created: config.project.created,
    };

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log(chalk.blue.bold('\nðŸ“Š BSR Project Status\n'));
    console.log(`  Project:  ${chalk.white(result.project)}`);
    console.log(`  Type:     ${chalk.cyan(result.type)}`);
    console.log(`  LLM:      ${chalk.magenta(result.llm)}`);
    console.log(`  Phase:    ${chalk.yellow(result.phase)}`);
    console.log(`  Status:   ${result.status === 'complete' ? chalk.green(result.status) : chalk.gray(result.status)}`);
    console.log('');
  });
