import { Command } from 'commander';
import chalk from 'chalk';
import fs from 'fs-extra';
import yaml from 'yaml';

export const configCommand = new Command('config')
  .description('View or modify BSR configuration')
  .option('-l, --list', 'List all configuration')
  .option('-g, --get <key>', 'Get a value (dot notation)')
  .option('-s, --set <keyvalue>', 'Set a value (key=value)')
  .action(async (options) => {
    const configPath = '.bsr/config.yaml';

    if (!(await fs.pathExists(configPath))) {
      console.log(chalk.red('\nâŒ BSR not initialized. Run `bsr init` first.\n'));
      process.exit(1);
    }

    const content = await fs.readFile(configPath, 'utf-8');

    if (options.get) {
      const config = yaml.parse(content);
      const keys = options.get.split('.');
      let value: unknown = config;
      for (const k of keys) {
        if (value && typeof value === 'object') {
          value = (value as Record<string, unknown>)[k];
        } else {
          value = undefined;
          break;
        }
      }
      console.log(value !== undefined ? (typeof value === 'object' ? yaml.stringify(value) : value) : 'Not found');
      return;
    }

    console.log(chalk.blue.bold('\nBSR Configuration:\n'));
    console.log(content);
  });
