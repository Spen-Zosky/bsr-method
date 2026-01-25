#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';

import { initCommand } from '../commands/init.js';
import { configCommand } from '../commands/config.js';
import { statusCommand } from '../commands/status.js';

const VERSION = '0.1.0';

const program = new Command();

program
  .name('bsr')
  .description(
    chalk.bold('BSR Method') +
      ' - AI-driven development framework\n\n' +
      'Integrates BMAD (planning), SpecKit (specs), and Ralph (execution)'
  )
  .version(VERSION, '-v, --version')
  .option('--verbose', 'Enable verbose output');

program.addCommand(initCommand);
program.addCommand(configCommand);
program.addCommand(statusCommand);

// Placeholder commands
const placeholders = [
  ['discover', 'Analyze existing codebase (brownfield)'],
  ['plan', 'Run BMAD planning phase'],
  ['spec', 'Generate SpecKit specifications'],
  ['tasks', 'Generate task breakdown'],
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
      console.log(chalk.yellow(`\nCommand '${name}' is not yet implemented.\n`));
    });
}

export function run() {
  program.parse();
}

run();
