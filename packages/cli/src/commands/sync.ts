import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  feature: string;
}

export const syncCommand = new Command('sync')
  .description('Sync with GitHub Issues/Projects')
  .option('--export-issues', 'Export tasks as GitHub Issues markdown')
  .option('--import', 'Import issues from GitHub (requires gh CLI)')
  .option('--status', 'Show sync status')
  .option('--dry-run', 'Show what would be synced')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n[BSR Sync] GitHub Integration\n'));

    if (!(await fs.pathExists('.bsr/config.yaml'))) {
      console.log(chalk.red('Error: BSR not initialized. Run bsr init first.\n'));
      process.exit(1);
    }

    // Check if we're in a git repo
    const isGitRepo = await fs.pathExists('.git');
    if (!isGitRepo) {
      console.log(chalk.yellow('Warning: Not a git repository.\n'));
    }

    // Get remote URL
    let repoInfo = { owner: '', repo: '' };
    try {
      const { stdout } = await execAsync('git remote get-url origin');
      repoInfo = parseGitHubUrl(stdout.trim());
      console.log(chalk.gray(`Repository: ${repoInfo.owner}/${repoInfo.repo}\n`));
    } catch {
      console.log(chalk.yellow('Warning: Could not determine GitHub repository.\n'));
    }

    if (options.status) {
      await showSyncStatus(repoInfo);
      return;
    }

    if (options.exportIssues) {
      await exportGitHubIssues(options.dryRun);
      return;
    }

    if (options.import) {
      await importFromGitHub(repoInfo, options.dryRun);
      return;
    }

    // Default: show menu
    console.log('Available sync options:\n');
    console.log('  --export-issues   Export tasks as GitHub Issues');
    console.log('  --import          Import issues from GitHub');
    console.log('  --status          Show sync status');
    console.log('  --dry-run         Preview without making changes\n');

    // Show quick export
    await exportGitHubIssues(false);
  });

function parseGitHubUrl(url: string): { owner: string; repo: string } {
  // Handle SSH: git@github.com:owner/repo.git
  // Handle HTTPS: https://github.com/owner/repo.git
  const sshMatch = url.match(/git@github\.com:([^/]+)\/(.+?)(\.git)?$/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  const httpsMatch = url.match(/github\.com\/([^/]+)\/(.+?)(\.git)?$/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  return { owner: '', repo: '' };
}

async function showSyncStatus(_repoInfo: { owner: string; repo: string }): Promise<void> {
  console.log(chalk.cyan('Sync Status\n'));

  // Check for gh CLI
  let hasGhCli = false;
  try {
    await execAsync('gh --version');
    hasGhCli = true;
    console.log(chalk.green('✓ GitHub CLI (gh) installed'));
  } catch {
    console.log(chalk.yellow('✗ GitHub CLI (gh) not installed'));
    console.log(chalk.gray('  Install: https://cli.github.com/\n'));
  }

  // Check authentication
  if (hasGhCli) {
    try {
      await execAsync('gh auth status');
      console.log(chalk.green('✓ Authenticated with GitHub'));
    } catch {
      console.log(chalk.yellow('✗ Not authenticated'));
      console.log(chalk.gray('  Run: gh auth login\n'));
    }
  }

  // Check local tasks
  if (await fs.pathExists('tasks/breakdown.json')) {
    const tasks = await fs.readJson('tasks/breakdown.json');
    console.log(chalk.green(`✓ Local tasks: ${tasks.length}`));
  } else {
    console.log(chalk.yellow('✗ No local tasks found'));
    console.log(chalk.gray('  Run: bsr tasks\n'));
  }

  // Check sync state
  if (await fs.pathExists('.bsr/sync-state.json')) {
    const syncState = await fs.readJson('.bsr/sync-state.json');
    console.log(chalk.green(`✓ Last sync: ${syncState.lastSync || 'never'}`));
  } else {
    console.log(chalk.gray('○ Never synced'));
  }

  console.log('');
}

async function exportGitHubIssues(dryRun: boolean): Promise<void> {
  const spinner = ora('Loading tasks...').start();

  if (!(await fs.pathExists('tasks/breakdown.json'))) {
    spinner.fail('No tasks found. Run bsr tasks first.');
    return;
  }

  const tasks: Task[] = await fs.readJson('tasks/breakdown.json');
  spinner.succeed(`Found ${tasks.length} tasks`);

  // Generate GitHub Issues markdown
  const issuesContent = generateGitHubIssuesMarkdown(tasks);

  // Generate GitHub CLI commands
  const cliCommands = generateGhCliCommands(tasks);

  if (dryRun) {
    console.log(chalk.yellow('\n[DRY RUN] Would create the following:\n'));
    console.log(chalk.gray('─'.repeat(40)));
    console.log(issuesContent.slice(0, 1000));
    if (issuesContent.length > 1000) console.log('...');
    console.log(chalk.gray('─'.repeat(40)));
    return;
  }

  // Save files
  await fs.ensureDir('sync');

  await fs.writeFile('sync/github-issues.md', issuesContent);
  console.log(chalk.green('\nSaved: sync/github-issues.md'));

  await fs.writeFile('sync/create-issues.sh', cliCommands);
  console.log(chalk.green('Saved: sync/create-issues.sh'));

  // Save sync state
  await fs.writeJson('.bsr/sync-state.json', {
    lastExport: new Date().toISOString(),
    tasksExported: tasks.length,
  }, { spaces: 2 });

  console.log(chalk.cyan('\nTo create issues on GitHub:'));
  console.log(chalk.gray('  Option 1: Copy from sync/github-issues.md'));
  console.log(chalk.gray('  Option 2: Run: bash sync/create-issues.sh'));
  console.log(chalk.gray('  (Requires: gh auth login)\n'));
}

function generateGitHubIssuesMarkdown(tasks: Task[]): string {
  const priorityLabels: Record<string, string> = {
    high: 'priority: high',
    medium: 'priority: medium',
    low: 'priority: low',
  };

  const typeLabels: Record<string, string> = {
    setup: 'type: setup',
    feature: 'type: feature',
    test: 'type: test',
    docs: 'type: documentation',
    refactor: 'type: refactor',
  };

  let content = `# GitHub Issues Export

Generated: ${new Date().toISOString()}
Total Issues: ${tasks.length}

---

`;

  for (const task of tasks) {
    const labels = [
      priorityLabels[task.priority] || 'priority: medium',
      typeLabels[task.type] || 'type: feature',
    ];

    if (task.feature && task.feature !== 'setup' && task.feature !== 'testing' && task.feature !== 'docs') {
      labels.push(`feature: ${task.feature}`);
    }

    content += `## ${task.id}: ${task.title || 'Untitled'}

**Labels**: \`${labels.join('`, `')}\`

### Description

${task.description || 'No description provided.'}

### Acceptance Criteria

- [ ] Implementation complete
- [ ] Tests passing (if applicable)
- [ ] Documentation updated
- [ ] Code reviewed

### BSR Metadata

- **Task ID**: ${task.id}
- **Type**: ${task.type || 'feature'}
- **Priority**: ${task.priority || 'medium'}
- **Status**: ${task.status || 'todo'}

---

`;
  }

  return content;
}

function generateGhCliCommands(tasks: Task[]): string {
  const priorityLabels: Record<string, string> = {
    high: 'priority-high',
    medium: 'priority-medium',
    low: 'priority-low',
  };

  let script = `#!/bin/bash
# GitHub Issues Creation Script
# Generated by BSR Method
# Run: bash sync/create-issues.sh

set -e

echo "Creating ${tasks.length} GitHub issues..."
echo ""

`;

  for (const task of tasks) {
    const title = (task.title || task.id).replace(/"/g, '\\"');
    const body = `## Description

${task.description || 'Implement as specified.'}

## BSR Task Info
- ID: ${task.id}
- Type: ${task.type || 'feature'}
- Priority: ${task.priority || 'medium'}

---
*Created by BSR Method*`;

    const labels = [
      priorityLabels[task.priority] || 'priority-medium',
      task.type || 'feature',
    ].join(',');

    script += `# ${task.id}
gh issue create \\
  --title "${task.id}: ${title}" \\
  --body "${body.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" \\
  --label "${labels}" || echo "Failed: ${task.id}"

echo "Created: ${task.id}"

`;
  }

  script += `
echo ""
echo "Done! Created ${tasks.length} issues."
`;

  return script;
}

async function importFromGitHub(repoInfo: { owner: string; repo: string }, dryRun: boolean): Promise<void> {
  // Check for gh CLI
  try {
    await execAsync('gh --version');
  } catch {
    console.log(chalk.red('Error: GitHub CLI (gh) not installed.'));
    console.log(chalk.gray('Install: https://cli.github.com/\n'));
    return;
  }

  if (!repoInfo.owner || !repoInfo.repo) {
    console.log(chalk.red('Error: Could not determine repository.'));
    return;
  }

  const spinner = ora('Fetching issues from GitHub...').start();

  try {
    const { stdout } = await execAsync(
      `gh issue list --repo ${repoInfo.owner}/${repoInfo.repo} --json number,title,state,labels --limit 100`
    );

    const issues = JSON.parse(stdout);
    spinner.succeed(`Found ${issues.length} issues`);

    if (dryRun) {
      console.log(chalk.yellow('\n[DRY RUN] Would import:\n'));
      issues.slice(0, 5).forEach((issue: any) => {
        console.log(`  #${issue.number}: ${issue.title}`);
      });
      if (issues.length > 5) {
        console.log(`  ... and ${issues.length - 5} more`);
      }
      return;
    }

    // Convert to BSR tasks
    const tasks: Task[] = issues.map((issue: any, _index: number) => ({
      id: `GH-${issue.number}`,
      title: issue.title,
      description: `Imported from GitHub Issue #${issue.number}`,
      status: issue.state === 'OPEN' ? 'todo' : 'done',
      priority: extractPriority(issue.labels),
      type: extractType(issue.labels),
      feature: 'imported',
    }));

    // Save
    await fs.ensureDir('tasks');
    await fs.writeJson('tasks/github-import.json', tasks, { spaces: 2 });
    console.log(chalk.green(`\nImported ${tasks.length} issues to tasks/github-import.json`));

    // Update sync state
    await fs.writeJson('.bsr/sync-state.json', {
      lastImport: new Date().toISOString(),
      issuesImported: issues.length,
      repo: `${repoInfo.owner}/${repoInfo.repo}`,
    }, { spaces: 2 });

  } catch (error) {
    spinner.fail('Failed to fetch issues');
    console.error(chalk.red(String(error)));
  }
}

function extractPriority(labels: any[]): string {
  const labelNames = labels.map((l: any) => l.name.toLowerCase());
  if (labelNames.some(l => l.includes('high') || l.includes('urgent'))) return 'high';
  if (labelNames.some(l => l.includes('low'))) return 'low';
  return 'medium';
}

function extractType(labels: any[]): string {
  const labelNames = labels.map((l: any) => l.name.toLowerCase());
  if (labelNames.some(l => l.includes('bug'))) return 'fix';
  if (labelNames.some(l => l.includes('doc'))) return 'docs';
  if (labelNames.some(l => l.includes('test'))) return 'test';
  return 'feature';
}
