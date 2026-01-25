#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';

import { initCommand } from '../commands/init.js';
import { configCommand } from '../commands/config.js';
import { statusCommand } from '../commands/status.js';
import { planCommand } from '../commands/plan.js';
import { specCommand } from '../commands/spec.js';
import { tasksCommand } from '../commands/tasks.js';
import { discoverCommand } from '../commands/discover.js';

const VERSION = '0.1.0';

const program = new Command();

program
  .name('bsr')
  .description(
    chalk.bold('BSR Method') +
      ' - AI-driven development framework\n\n' +
      'Integrates BMAD (planning), SpecKit (specs), and Ralph (execution)'
  )
  .version(VERSION, '-v', '--version')
  .option('--verbose', 'Enable verbose output');

program.addCommand(initCommand);
program.addCommand(configCommand);
program.addCommand(statusCommand);
program.addCommand(discoverCommand);
program.addCommand(planCommand);
program.addCommand(specCommand);
program.addCommand(tasksCommand);

const placeholders = [
  ['run', 'Start Ralph loop execution'],
  ['dashboard', 'Open web dashboard'],
  ['export', 'Export reports (PDF/HTML/MD)'],
  ['sync', 'Sync with GitHub Issues/Projects'],
];

for (const [name, desc] of placeholders) {
  program
    .command(name)
    .description(desc + chalk.gray(' [coming soon]'))
    .action(() => {
      console.log(chalk.yellow('\nCommand not yet implemented.\n'));
    });
}

export function run() {
  program.parse();
}

run();