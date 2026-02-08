import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import yaml from 'yaml';

interface DiscoveryResult {
  metadata: {
    discoveryDate: string;
    projectPath: string;
    scanDuration: number;
  };
  projectInfo: {
    name: string;
    hasGit: boolean;
    hasPackageJson: boolean;
  };
  technologyStack: {
    runtime: { name: string; version: string } | null;
    framework: { name: string; version: string } | null;
    database: { type: string; detected: string[] } | null;
    languages: string[];
  };
  structure: {
    totalFiles: number;
    totalDirs: number;
    codeFiles: number;
    testFiles: number;
    configFiles: number;
    docFiles: number;
  };
  dependencies: {
    production: string[];
    development: string[];
    total: number;
  };
  patterns: {
    hasTests: boolean;
    hasCI: boolean;
    hasDocs: boolean;
    hasDocker: boolean;
    hasEnvExample: boolean;
  };
  recommendations: string[];
}

export const discoverCommand = new Command('discover')
  .description('Analyze existing codebase (brownfield)')
  .option('-p, --path <dir>', 'Path to analyze', '.')
  .option('-o, --output <dir>', 'Output directory', 'discovery')
  .option('--deep', 'Deep analysis (slower)')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n[BSR Discover] Brownfield Analysis\n'));

    const targetPath = path.resolve(options.path);
    
    if (!(await fs.pathExists(targetPath))) {
      console.log(chalk.red(`Error: Path not found: ${targetPath}\n`));
      process.exit(1);
    }

    console.log(chalk.gray(`Analyzing: ${targetPath}\n`));

    const startTime = Date.now();
    const spinner = ora('Scanning project structure...').start();

    try {
      // Run discovery
      const result = await analyzeProject(targetPath, options.deep);
      result.metadata.scanDuration = Date.now() - startTime;

      spinner.succeed('Scan complete');

      // Output results
      await fs.ensureDir(options.output);

      if (options.json) {
        await fs.writeFile(
          path.join(options.output, 'discovery.json'),
          JSON.stringify(result, null, 2)
        );
        console.log(chalk.green(`\nSaved: ${options.output}/discovery.json`));
      } else {
        // YAML output
        await fs.writeFile(
          path.join(options.output, 'project-context.yaml'),
          yaml.stringify(result)
        );
        console.log(chalk.green(`\nSaved: ${options.output}/project-context.yaml`));

        // Markdown summary
        const summary = generateDiscoverySummary(result);
        await fs.writeFile(
          path.join(options.output, 'DISCOVERY.md'),
          summary
        );
        console.log(chalk.green(`Saved: ${options.output}/DISCOVERY.md`));
      }

      // Display summary
      console.log(chalk.blue.bold('\n' + '='.repeat(50)));
      console.log(chalk.blue.bold('Discovery Complete!'));
      console.log(chalk.blue.bold('='.repeat(50)));

      console.log('\nProject Overview:');
      console.log(`  Name: ${result.projectInfo.name}`);
      console.log(`  Languages: ${result.technologyStack.languages.join(', ') || 'Unknown'}`);
      if (result.technologyStack.runtime) {
        console.log(`  Runtime: ${result.technologyStack.runtime.name} ${result.technologyStack.runtime.version}`);
      }
      if (result.technologyStack.framework) {
        console.log(`  Framework: ${result.technologyStack.framework.name}`);
      }
      if (result.technologyStack.database) {
        console.log(`  Database: ${result.technologyStack.database.type}`);
      }

      console.log('\nStructure:');
      console.log(`  Files: ${result.structure.totalFiles}`);
      console.log(`  Code: ${result.structure.codeFiles}`);
      console.log(`  Tests: ${result.structure.testFiles}`);
      console.log(`  Dependencies: ${result.dependencies.total}`);

      console.log('\nPatterns Detected:');
      console.log(`  Tests: ${result.patterns.hasTests ? 'Yes' : 'No'}`);
      console.log(`  CI/CD: ${result.patterns.hasCI ? 'Yes' : 'No'}`);
      console.log(`  Docker: ${result.patterns.hasDocker ? 'Yes' : 'No'}`);
      console.log(`  Docs: ${result.patterns.hasDocs ? 'Yes' : 'No'}`);

      if (result.recommendations.length > 0) {
        console.log('\nRecommendations:');
        result.recommendations.forEach((r, i) => {
          console.log(`  ${i + 1}. ${r}`);
        });
      }

      console.log(chalk.gray(`\nScan duration: ${result.metadata.scanDuration}ms`));
      console.log(chalk.blue('\nNext: Run bsr plan --from-dps to generate plans from discovery\n'));

    } catch (error) {
      spinner.fail('Discovery failed');
      console.error(chalk.red(String(error)));
      process.exit(1);
    }
  });

async function analyzeProject(projectPath: string, _deep: boolean): Promise<DiscoveryResult> {
  const projectName = path.basename(projectPath);

  // Initialize result
  const result: DiscoveryResult = {
    metadata: {
      discoveryDate: new Date().toISOString(),
      projectPath,
      scanDuration: 0,
    },
    projectInfo: {
      name: projectName,
      hasGit: await fs.pathExists(path.join(projectPath, '.git')),
      hasPackageJson: await fs.pathExists(path.join(projectPath, 'package.json')),
    },
    technologyStack: {
      runtime: null,
      framework: null,
      database: null,
      languages: [],
    },
    structure: {
      totalFiles: 0,
      totalDirs: 0,
      codeFiles: 0,
      testFiles: 0,
      configFiles: 0,
      docFiles: 0,
    },
    dependencies: {
      production: [],
      development: [],
      total: 0,
    },
    patterns: {
      hasTests: false,
      hasCI: false,
      hasDocs: false,
      hasDocker: false,
      hasEnvExample: false,
    },
    recommendations: [],
  };

  // Scan directory structure
  const structure = await scanDirectory(projectPath);
  result.structure = structure.stats;
  result.technologyStack.languages = structure.languages;

  // Analyze package.json
  if (result.projectInfo.hasPackageJson) {
    const pkgAnalysis = await analyzePackageJson(projectPath);
    result.technologyStack.runtime = pkgAnalysis.runtime;
    result.technologyStack.framework = pkgAnalysis.framework;
    result.technologyStack.database = pkgAnalysis.database;
    result.dependencies = pkgAnalysis.dependencies;
    if (pkgAnalysis.name) result.projectInfo.name = pkgAnalysis.name;
  }

  // Detect patterns
  result.patterns = await detectPatterns(projectPath);

  // Generate recommendations
  result.recommendations = generateRecommendations(result);

  return result;
}

async function scanDirectory(dir: string): Promise<{ stats: DiscoveryResult['structure']; languages: string[] }> {
  const stats = {
    totalFiles: 0,
    totalDirs: 0,
    codeFiles: 0,
    testFiles: 0,
    configFiles: 0,
    docFiles: 0,
  };
  const languagesSet = new Set<string>();
  const excludeDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.turbo'];

  async function scan(currentDir: string) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);

        if (entry.isDirectory()) {
          if (!excludeDirs.includes(entry.name)) {
            stats.totalDirs++;
            await scan(fullPath);
          }
        } else if (entry.isFile()) {
          stats.totalFiles++;
          const ext = path.extname(entry.name).toLowerCase();

          // Categorize files
          if (['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.cs'].includes(ext)) {
            stats.codeFiles++;
            const langMap: Record<string, string> = {
              '.ts': 'TypeScript', '.tsx': 'TypeScript',
              '.js': 'JavaScript', '.jsx': 'JavaScript',
              '.py': 'Python', '.go': 'Go', '.rs': 'Rust',
              '.java': 'Java', '.cs': 'C#',
            };
            if (langMap[ext]) languagesSet.add(langMap[ext]);
          }

          if (entry.name.includes('.test.') || entry.name.includes('.spec.') || entry.name.includes('_test.')) {
            stats.testFiles++;
          }

          if (['.json', '.yaml', '.yml', '.toml', '.ini', '.env'].includes(ext) ||
              entry.name.startsWith('.') && !entry.name.startsWith('.git')) {
            stats.configFiles++;
          }

          if (['.md', '.mdx', '.txt', '.rst'].includes(ext)) {
            stats.docFiles++;
          }
        }
      }
    } catch {
      // Skip inaccessible directories
    }
  }

  await scan(dir);
  return { stats, languages: Array.from(languagesSet) };
}

async function analyzePackageJson(projectPath: string): Promise<{
  runtime: { name: string; version: string } | null;
  framework: { name: string; version: string } | null;
  database: { type: string; detected: string[] } | null;
  dependencies: { production: string[]; development: string[]; total: number };
  name: string | null;
}> {
  const pkgPath = path.join(projectPath, 'package.json');
  const pkg = JSON.parse(await fs.readFile(pkgPath, 'utf-8'));

  const deps = { ...pkg.dependencies };
  const devDeps = { ...pkg.devDependencies };
  const allDeps = { ...deps, ...devDeps };

  // Detect runtime
  let runtime = null;
  const engines = pkg.engines || {};
  if (engines.node) {
    runtime = { name: 'Node.js', version: engines.node };
  } else {
    runtime = { name: 'Node.js', version: 'unknown' };
  }

  // Detect framework
  let framework = null;
  const frameworks: Record<string, string> = {
    'next': 'Next.js',
    'react': 'React',
    'vue': 'Vue.js',
    'express': 'Express',
    'fastify': 'Fastify',
    'nestjs': 'NestJS',
    '@nestjs/core': 'NestJS',
    'koa': 'Koa',
    'hapi': 'Hapi',
    'angular': 'Angular',
    '@angular/core': 'Angular',
    'svelte': 'Svelte',
  };
  for (const [dep, name] of Object.entries(frameworks)) {
    if (allDeps[dep]) {
      framework = { name, version: allDeps[dep] };
      break;
    }
  }

  // Detect database
  let database = null;
  const dbIndicators: Record<string, string> = {
    'pg': 'PostgreSQL',
    'mysql': 'MySQL',
    'mysql2': 'MySQL',
    'mongodb': 'MongoDB',
    'mongoose': 'MongoDB',
    'sqlite3': 'SQLite',
    'better-sqlite3': 'SQLite',
    'prisma': 'Prisma ORM',
    '@prisma/client': 'Prisma ORM',
    'typeorm': 'TypeORM',
    'sequelize': 'Sequelize',
    'knex': 'Knex',
    'drizzle-orm': 'Drizzle ORM',
  };
  const detectedDbs: string[] = [];
  for (const [dep, name] of Object.entries(dbIndicators)) {
    if (allDeps[dep]) {
      detectedDbs.push(name);
    }
  }
  if (detectedDbs.length > 0) {
    database = { type: detectedDbs[0], detected: detectedDbs };
  }

  return {
    runtime,
    framework,
    database,
    dependencies: {
      production: Object.keys(deps),
      development: Object.keys(devDeps),
      total: Object.keys(deps).length + Object.keys(devDeps).length,
    },
    name: pkg.name || null,
  };
}

async function detectPatterns(projectPath: string): Promise<DiscoveryResult['patterns']> {
  return {
    hasTests: await fs.pathExists(path.join(projectPath, 'tests')) ||
              await fs.pathExists(path.join(projectPath, '__tests__')) ||
              await fs.pathExists(path.join(projectPath, 'test')) ||
              await fs.pathExists(path.join(projectPath, 'spec')),
    hasCI: await fs.pathExists(path.join(projectPath, '.github/workflows')) ||
           await fs.pathExists(path.join(projectPath, '.gitlab-ci.yml')) ||
           await fs.pathExists(path.join(projectPath, '.circleci')),
    hasDocs: await fs.pathExists(path.join(projectPath, 'docs')) ||
             await fs.pathExists(path.join(projectPath, 'documentation')),
    hasDocker: await fs.pathExists(path.join(projectPath, 'Dockerfile')) ||
               await fs.pathExists(path.join(projectPath, 'docker-compose.yml')) ||
               await fs.pathExists(path.join(projectPath, 'docker-compose.yaml')),
    hasEnvExample: await fs.pathExists(path.join(projectPath, '.env.example')) ||
                   await fs.pathExists(path.join(projectPath, '.env.sample')),
  };
}

function generateRecommendations(result: DiscoveryResult): string[] {
  const recs: string[] = [];

  if (!result.patterns.hasTests) {
    recs.push('Add tests - no test directory found');
  }
  if (!result.patterns.hasCI) {
    recs.push('Set up CI/CD pipeline');
  }
  if (!result.patterns.hasDocs) {
    recs.push('Create documentation in docs/ directory');
  }
  if (!result.patterns.hasEnvExample && result.projectInfo.hasPackageJson) {
    recs.push('Add .env.example for environment configuration');
  }
  if (result.structure.testFiles === 0 && result.structure.codeFiles > 0) {
    recs.push('No test files detected - consider adding unit tests');
  }
  if (result.dependencies.total > 50) {
    recs.push('High dependency count - review for unused packages');
  }

  return recs;
}

function generateDiscoverySummary(result: DiscoveryResult): string {
  return `# Discovery Report: ${result.projectInfo.name}

Generated: ${result.metadata.discoveryDate}

## Overview

| Metric | Value |
|--------|-------|
| Name | ${result.projectInfo.name} |
| Git Repository | ${result.projectInfo.hasGit ? 'Yes' : 'No'} |
| Package Manager | ${result.projectInfo.hasPackageJson ? 'npm/pnpm/yarn' : 'Unknown'} |

## Technology Stack

${result.technologyStack.runtime ? `- **Runtime**: ${result.technologyStack.runtime.name} ${result.technologyStack.runtime.version}` : ''}
${result.technologyStack.framework ? `- **Framework**: ${result.technologyStack.framework.name}` : ''}
${result.technologyStack.database ? `- **Database**: ${result.technologyStack.database.type}` : ''}
- **Languages**: ${result.technologyStack.languages.join(', ') || 'Unknown'}

## Project Structure

| Type | Count |
|------|-------|
| Total Files | ${result.structure.totalFiles} |
| Code Files | ${result.structure.codeFiles} |
| Test Files | ${result.structure.testFiles} |
| Config Files | ${result.structure.configFiles} |
| Doc Files | ${result.structure.docFiles} |

## Dependencies

- Production: ${result.dependencies.production.length}
- Development: ${result.dependencies.development.length}
- Total: ${result.dependencies.total}

${result.dependencies.production.length > 0 ? `### Key Dependencies\n${result.dependencies.production.slice(0, 10).map(d => `- ${d}`).join('\n')}` : ''}

## Detected Patterns

| Pattern | Status |
|---------|--------|
| Tests | ${result.patterns.hasTests ? 'Yes' : 'No'} |
| CI/CD | ${result.patterns.hasCI ? 'Yes' : 'No'} |
| Docker | ${result.patterns.hasDocker ? 'Yes' : 'No'} |
| Documentation | ${result.patterns.hasDocs ? 'Yes' : 'No'} |
| Env Example | ${result.patterns.hasEnvExample ? 'Yes' : 'No'} |

## Recommendations

${result.recommendations.length > 0 ? result.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n') : 'No recommendations - project looks well structured!'}

---
*Generated by BSR Method - Discovery Engine*
`;
}
