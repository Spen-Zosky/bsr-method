import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import YAML from 'yaml';

import {
  parseBMADDirectory,
  parseBMADFile,
  type BMADProject,
} from '../src/parser.js';

import {
  transformToBSR,
  transformAndSave,
  type TransformOptions,
} from '../src/transformer.js';

import {
  bmadToBSR,
  bmadFileToBSR,
  convertBMADtoBSR,
} from '../src/index.js';

let testDir: string;

beforeEach(() => {
  testDir = path.join(
    os.tmpdir(),
    'bmad-test-' + Date.now() + '-' + Math.random().toString(36).slice(2),
  );
  fs.mkdirSync(testDir, { recursive: true });
});

afterEach(() => {
  fs.rmSync(testDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface BMADFixture {
  project?: Record<string, unknown>;
  projectExt?: string; // default 'yaml'
  features?: Record<string, unknown>[] | string; // array for yaml, string for md
  featuresExt?: string;
  personas?: Record<string, unknown>[];
  epics?: Record<string, unknown>[];
  stories?: Record<string, unknown>[];
}

function createBMADFixture(dir: string, fixture: BMADFixture) {
  const ext = fixture.projectExt || 'yaml';
  if (fixture.project) {
    fs.writeFileSync(
      path.join(dir, `project.${ext}`),
      ext === 'md' ? (fixture.project as unknown as string) : YAML.stringify(fixture.project),
    );
  }

  if (fixture.features) {
    const fExt = fixture.featuresExt || 'yaml';
    const content =
      typeof fixture.features === 'string'
        ? fixture.features
        : YAML.stringify(fixture.features);
    fs.writeFileSync(path.join(dir, `features.${fExt}`), content);
  }

  if (fixture.personas) {
    const pDir = path.join(dir, 'personas');
    fs.mkdirSync(pDir, { recursive: true });
    fixture.personas.forEach((p, i) => {
      fs.writeFileSync(path.join(pDir, `persona-${i + 1}.yaml`), YAML.stringify(p));
    });
  }

  if (fixture.epics) {
    const eDir = path.join(dir, 'epics');
    fs.mkdirSync(eDir, { recursive: true });
    fixture.epics.forEach((e, i) => {
      fs.writeFileSync(path.join(eDir, `epic-${i + 1}.yaml`), YAML.stringify(e));
    });
  }

  if (fixture.stories) {
    const sDir = path.join(dir, 'stories');
    fs.mkdirSync(sDir, { recursive: true });
    fixture.stories.forEach((s, i) => {
      fs.writeFileSync(path.join(sDir, `story-${i + 1}.yaml`), YAML.stringify(s));
    });
  }
}

// ---------------------------------------------------------------------------
// BMAD Parser
// ---------------------------------------------------------------------------

describe('BMAD Parser', () => {
  describe('parseBMADDirectory', () => {
    it('should parse a valid directory with all sections', async () => {
      createBMADFixture(testDir, {
        project: { name: 'My Project', description: 'A test project', vision: 'Best tool' },
        personas: [{ name: 'Dev', role: 'Developer', goals: ['ship fast'], painPoints: ['slow CI'] }],
        epics: [{ id: 'E1', title: 'MVP', description: 'First release', features: ['F1'] }],
        stories: [
          { id: 'S1', epic: 'E1', title: 'Login', asA: 'user', iWant: 'to login', soThat: 'I can access' },
        ],
        features: [{ id: 'F1', name: 'Auth', description: 'Authentication' }],
      });

      const result = await parseBMADDirectory(testDir);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.project).toBeDefined();
      expect(result.project!.name).toBe('My Project');
      expect(result.project!.description).toBe('A test project');
      expect(result.project!.vision).toBe('Best tool');
      expect(result.project!.personas).toHaveLength(1);
      expect(result.project!.personas![0].name).toBe('Dev');
      expect(result.project!.epics).toHaveLength(1);
      expect(result.project!.epics![0].id).toBe('E1');
      expect(result.project!.userStories).toHaveLength(1);
      expect(result.project!.userStories![0].asA).toBe('user');
      expect(result.project!.features).toHaveLength(1);
      expect(result.project!.features![0].name).toBe('Auth');
    });

    it('should return error for non-existent directory', async () => {
      const result = await parseBMADDirectory('/nonexistent/path');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('not found');
    });

    it('should warn when no project file exists', async () => {
      // empty dir – no project.yaml
      const result = await parseBMADDirectory(testDir);

      expect(result.success).toBe(true);
      expect(result.warnings).toContain('No project file found');
    });

    it('should find project.yml variant', async () => {
      fs.writeFileSync(
        path.join(testDir, 'project.yml'),
        YAML.stringify({ name: 'YML Project' }),
      );

      const result = await parseBMADDirectory(testDir);

      expect(result.success).toBe(true);
      expect(result.project!.name).toBe('YML Project');
    });

    it('should parse project.md', async () => {
      const md = `# Markdown Project\n\n## Description\nSome desc\n\n## Vision\nBig vision\n`;
      fs.writeFileSync(path.join(testDir, 'project.md'), md);

      const result = await parseBMADDirectory(testDir);

      expect(result.success).toBe(true);
      expect(result.project!.name).toBe('Markdown Project');
      expect(result.project!.description).toBe('Some desc');
      expect(result.project!.vision).toBe('Big vision');
    });

    it('should report error for invalid YAML', async () => {
      fs.writeFileSync(path.join(testDir, 'project.yaml'), ':\n  bad: [yaml\n  ');

      const result = await parseBMADDirectory(testDir);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('YAML'))).toBe(true);
    });
  });

  describe('parseBMADFile', () => {
    it('should parse a valid .yaml file', async () => {
      const filePath = path.join(testDir, 'project.yaml');
      fs.writeFileSync(filePath, YAML.stringify({ name: 'YAML File' }));

      const result = await parseBMADFile(filePath);

      expect(result.success).toBe(true);
      expect(result.project!.name).toBe('YAML File');
    });

    it('should parse a valid .yml file', async () => {
      const filePath = path.join(testDir, 'project.yml');
      fs.writeFileSync(filePath, YAML.stringify({ name: 'YML File' }));

      const result = await parseBMADFile(filePath);

      expect(result.success).toBe(true);
      expect(result.project!.name).toBe('YML File');
    });

    it('should parse a valid .md file', async () => {
      const filePath = path.join(testDir, 'project.md');
      fs.writeFileSync(filePath, '# MD Project\n\n## Description\nHello\n');

      const result = await parseBMADFile(filePath);

      expect(result.success).toBe(true);
      expect(result.project!.name).toBe('MD Project');
    });

    it('should return error for non-existent file', async () => {
      const result = await parseBMADFile('/nonexistent/file.yaml');

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('not found');
    });

    it('should return error for invalid YAML', async () => {
      const filePath = path.join(testDir, 'bad.yaml');
      fs.writeFileSync(filePath, ':\nbad: [yaml');

      const result = await parseBMADFile(filePath);

      expect(result.success).toBe(false);
      expect(result.errors.some(e => e.includes('YAML'))).toBe(true);
    });

    it('should return error for unsupported extension', async () => {
      const filePath = path.join(testDir, 'file.txt');
      fs.writeFileSync(filePath, 'some text');

      const result = await parseBMADFile(filePath);

      expect(result.success).toBe(false);
      expect(result.errors[0]).toContain('Unsupported');
    });
  });

  describe('Field name variations', () => {
    it('should handle as_a, i_want, so_that in user stories', async () => {
      const sDir = path.join(testDir, 'stories');
      fs.mkdirSync(sDir, { recursive: true });
      fs.writeFileSync(
        path.join(sDir, 'story-1.yaml'),
        YAML.stringify({ title: 'S', as_a: 'dev', i_want: 'deploy', so_that: 'users happy' }),
      );
      createBMADFixture(testDir, { project: { name: 'P' } });

      const result = await parseBMADDirectory(testDir);

      expect(result.project!.userStories![0].asA).toBe('dev');
      expect(result.project!.userStories![0].iWant).toBe('deploy');
      expect(result.project!.userStories![0].soThat).toBe('users happy');
    });

    it('should handle acceptance_criteria variation', async () => {
      const sDir = path.join(testDir, 'stories');
      fs.mkdirSync(sDir, { recursive: true });
      fs.writeFileSync(
        path.join(sDir, 'story-1.yaml'),
        YAML.stringify({
          title: 'S',
          asA: 'user',
          iWant: 'x',
          soThat: 'y',
          acceptance_criteria: ['AC1', 'AC2'],
        }),
      );
      createBMADFixture(testDir, { project: { name: 'P' } });

      const result = await parseBMADDirectory(testDir);

      expect(result.project!.userStories![0].acceptanceCriteria).toEqual(['AC1', 'AC2']);
    });

    it('should handle projectName and title field names', async () => {
      const f1 = path.join(testDir, 'a.yaml');
      fs.writeFileSync(f1, YAML.stringify({ projectName: 'PN' }));
      const r1 = await parseBMADFile(f1);
      expect(r1.project!.name).toBe('PN');

      const f2 = path.join(testDir, 'b.yaml');
      fs.writeFileSync(f2, YAML.stringify({ title: 'TT' }));
      const r2 = await parseBMADFile(f2);
      expect(r2.project!.name).toBe('TT');
    });

    it('should handle summary and projectVision field names', async () => {
      const fp = path.join(testDir, 'c.yaml');
      fs.writeFileSync(
        fp,
        YAML.stringify({ name: 'X', summary: 'Summ', projectVision: 'PV' }),
      );
      const result = await parseBMADFile(fp);
      expect(result.project!.description).toBe('Summ');
      expect(result.project!.vision).toBe('PV');
    });
  });

  describe('Markdown parsing', () => {
    it('should extract name from # Title', async () => {
      const fp = path.join(testDir, 'p.md');
      fs.writeFileSync(fp, '# My Title\n');
      const r = await parseBMADFile(fp);
      expect(r.project!.name).toBe('My Title');
    });

    it('should extract description from ## Description', async () => {
      const fp = path.join(testDir, 'p.md');
      fs.writeFileSync(fp, '# T\n\n## Description\nThe description here\n');
      const r = await parseBMADFile(fp);
      expect(r.project!.description).toBe('The description here');
    });

    it('should extract description from ## Overview alias', async () => {
      const fp = path.join(testDir, 'p.md');
      fs.writeFileSync(fp, '# T\n\n## Overview\nOverview text\n');
      const r = await parseBMADFile(fp);
      expect(r.project!.description).toBe('Overview text');
    });

    it('should extract vision from ## Vision', async () => {
      const fp = path.join(testDir, 'p.md');
      fs.writeFileSync(fp, '# T\n\n## Vision\nBig vision\n');
      const r = await parseBMADFile(fp);
      expect(r.project!.vision).toBe('Big vision');
    });

    it('should extract goals from ## Goals list items', async () => {
      const fp = path.join(testDir, 'p.md');
      fs.writeFileSync(fp, '# T\n\n## Goals\n- Goal A\n- Goal B\n');
      const r = await parseBMADFile(fp);
      expect(r.project!.goals).toEqual(['Goal A', 'Goal B']);
    });

    it('should parse features from markdown list items', async () => {
      const fp = path.join(testDir, 'features.md');
      fs.writeFileSync(fp, '- Auth: Authentication system\n- Dashboard: Main panel\n');

      createBMADFixture(testDir, { project: { name: 'P' } });
      // Place features file
      fs.copyFileSync(fp, path.join(testDir, 'features.md'));

      const result = await parseBMADDirectory(testDir);

      expect(result.project!.features).toBeDefined();
      expect(result.project!.features!.length).toBe(2);
      expect(result.project!.features![0].name).toBe('Auth');
      expect(result.project!.features![0].description).toBe('Authentication system');
      expect(result.project!.features![1].id).toBe('F2');
    });
  });

  describe('Auto-ID generation', () => {
    it('should generate F1, F2 for features without id', async () => {
      const fp = path.join(testDir, 'file.yaml');
      fs.writeFileSync(
        fp,
        YAML.stringify({
          name: 'P',
          features: [
            { name: 'A', description: 'a' },
            { name: 'B', description: 'b' },
          ],
        }),
      );
      const r = await parseBMADFile(fp);
      expect(r.project!.features![0].id).toBe('F1');
      expect(r.project!.features![1].id).toBe('F2');
    });

    it('should use filename as id for epics without id', async () => {
      const eDir = path.join(testDir, 'epics');
      fs.mkdirSync(eDir, { recursive: true });
      fs.writeFileSync(
        path.join(eDir, 'onboarding.yaml'),
        YAML.stringify({ title: 'Onboarding', description: 'Onb' }),
      );
      createBMADFixture(testDir, { project: { name: 'P' } });

      const result = await parseBMADDirectory(testDir);

      expect(result.project!.epics![0].id).toBe('onboarding');
    });

    it('should use filename as id for stories without id', async () => {
      const sDir = path.join(testDir, 'stories');
      fs.mkdirSync(sDir, { recursive: true });
      fs.writeFileSync(
        path.join(sDir, 'user-login.yaml'),
        YAML.stringify({ title: 'Login', asA: 'user', iWant: 'login', soThat: 'access' }),
      );
      createBMADFixture(testDir, { project: { name: 'P' } });

      const result = await parseBMADDirectory(testDir);

      expect(result.project!.userStories![0].id).toBe('user-login');
    });
  });
});

// ---------------------------------------------------------------------------
// BMAD Transformer
// ---------------------------------------------------------------------------

describe('BMAD Transformer', () => {
  describe('transformToBSR', () => {
    it('should transform a valid project to BSRIdea', () => {
      const project: BMADProject = {
        name: 'My Tool',
        description: 'A CLI tool',
        vision: 'Best CLI',
        goals: ['fast', 'reliable'],
        features: [
          { id: 'F1', name: 'Init', description: 'Initialize project', priority: 'P0' },
        ],
      };

      const result = transformToBSR(project);

      expect(result.success).toBe(true);
      expect(result.idea).toBeDefined();
      expect(result.idea!.name).toBe('My Tool');
      expect(result.idea!.version).toBe('0.1.0');
      expect(result.idea!.description).toBe('A CLI tool');
      expect(result.idea!.vision).toBe('Best CLI');
      expect(result.idea!.goals).toEqual(['fast', 'reliable']);
      expect(result.idea!.features).toHaveLength(1);
      expect(result.idea!.features[0].id).toBe('F1');
    });

    it('should fail when project has no name', () => {
      const project: BMADProject = { name: '' };

      const result = transformToBSR(project);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Project name is required');
    });

    it('should use custom version from options', () => {
      const project: BMADProject = { name: 'P' };
      const result = transformToBSR(project, { version: '2.0.0' });

      expect(result.idea!.version).toBe('2.0.0');
    });

    it('should include personas when includePersonas is true', () => {
      const project: BMADProject = {
        name: 'P',
        personas: [{ name: 'Dev', role: 'Developer', goals: ['speed'], painPoints: [] }],
      };

      const result = transformToBSR(project, { includePersonas: true });

      expect(result.idea!.personas).toHaveLength(1);
      expect(result.idea!.personas![0].needs).toEqual(['speed']);
    });

    it('should exclude personas when includePersonas is false', () => {
      const project: BMADProject = {
        name: 'P',
        personas: [{ name: 'Dev', role: 'Developer', goals: ['speed'], painPoints: [] }],
      };

      const result = transformToBSR(project, { includePersonas: false });

      expect(result.idea!.personas).toBeUndefined();
    });

    it('should convert epics to milestones', () => {
      const project: BMADProject = {
        name: 'P',
        epics: [
          { id: 'E1', title: 'MVP', description: 'First', features: ['F1'] },
          { id: 'E2', title: 'V2', description: 'Second', features: ['F2'] },
        ],
      };

      const result = transformToBSR(project);

      expect(result.idea!.milestones).toHaveLength(2);
      expect(result.idea!.milestones![0].id).toBe('M1');
      expect(result.idea!.milestones![0].name).toBe('MVP');
      expect(result.idea!.milestones![0].features).toEqual(['F1']);
      expect(result.idea!.milestones![1].id).toBe('M2');
    });

    it('should return empty features array for project without features', () => {
      const project: BMADProject = { name: 'P' };
      const result = transformToBSR(project);

      expect(result.idea!.features).toEqual([]);
    });
  });

  describe('normalizePriority', () => {
    // We test normalizePriority indirectly via transformToBSR since it's private
    function featureWithPriority(priority?: string) {
      const project: BMADProject = {
        name: 'P',
        features: [{ id: 'F1', name: 'X', description: 'x', priority: priority as any }],
      };
      return transformToBSR(project).idea!.features[0].priority;
    }

    it.each([
      ['P0', 'P0'],
      ['P1', 'P1'],
      ['P2', 'P2'],
      ['P3', 'P3'],
    ])('should keep %s unchanged', (input, expected) => {
      expect(featureWithPriority(input)).toBe(expected);
    });

    it.each([
      ['p0', 'P0'],
      ['p1', 'P1'],
      ['p2', 'P2'],
      ['p3', 'P3'],
    ])('should normalize lowercase %s to %s', (input, expected) => {
      expect(featureWithPriority(input)).toBe(expected);
    });

    it.each([
      ['HIGH', 'P0'],
      ['CRITICAL', 'P0'],
      ['MEDIUM', 'P1'],
      ['NORMAL', 'P1'],
      ['LOW', 'P2'],
    ])('should map %s to %s', (input, expected) => {
      expect(featureWithPriority(input)).toBe(expected);
    });

    it('should default to P1 for undefined', () => {
      expect(featureWithPriority(undefined)).toBe('P1');
    });

    it('should default to P1 for unknown value', () => {
      expect(featureWithPriority('WHATEVER')).toBe('P1');
    });
  });

  describe('inferArchitecture', () => {
    function archFor(description: string) {
      const project: BMADProject = { name: 'P', description };
      return transformToBSR(project).idea!.architecture;
    }

    it('should detect microservices type', () => {
      expect(archFor('A microservice-based system').type).toBe('microservices');
    });

    it('should detect monolith type', () => {
      expect(archFor('A monolith application').type).toBe('monolith');
    });

    it('should detect serverless type', () => {
      expect(archFor('Uses serverless functions').type).toBe('serverless');
    });

    it('should detect serverless from lambda keyword', () => {
      expect(archFor('AWS Lambda functions').type).toBe('serverless');
    });

    it('should detect api-first type', () => {
      expect(archFor('REST api layer').type).toBe('api-first');
    });

    it('should detect frontend component', () => {
      expect(archFor('A dashboard for users').components).toContain('frontend');
    });

    it('should detect backend component', () => {
      expect(archFor('Backend server').components).toContain('backend');
    });

    it('should detect database component', () => {
      expect(archFor('Uses database storage').components).toContain('database');
    });

    it('should detect auth component', () => {
      expect(archFor('User login auth system').components).toContain('auth');
    });

    it('should detect cli component', () => {
      expect(archFor('A command line tool (cli)').components).toContain('cli');
    });

    it('should detect github integration', () => {
      expect(archFor('Integrates with github').integrations).toContain('github');
    });

    it('should detect payments integration', () => {
      expect(archFor('Stripe payment processing').integrations).toContain('payments');
    });

    it('should return empty arch for unrecognized text', () => {
      const arch = archFor('');
      expect(arch!.type).toBeUndefined();
      expect(arch!.components).toBeUndefined();
      expect(arch!.integrations).toBeUndefined();
    });
  });

  describe('Feature-story linking', () => {
    it('should link stories whose title contains feature name', () => {
      const project: BMADProject = {
        name: 'P',
        features: [{ id: 'F1', name: 'Auth', description: 'Authentication' }],
        userStories: [
          { id: 'S1', title: 'Auth login flow', asA: 'user', iWant: 'login', soThat: 'access' },
          { id: 'S2', title: 'Dashboard view', asA: 'user', iWant: 'see', soThat: 'monitor' },
        ],
      };

      const result = transformToBSR(project);

      expect(result.idea!.features[0].stories).toEqual(['S1']);
    });

    it('should match case insensitively', () => {
      const project: BMADProject = {
        name: 'P',
        features: [{ id: 'F1', name: 'auth', description: 'Auth' }],
        userStories: [
          { id: 'S1', title: 'AUTH flow', asA: 'u', iWant: 'w', soThat: 's' },
        ],
      };

      const result = transformToBSR(project);

      expect(result.idea!.features[0].stories).toEqual(['S1']);
    });

    it('should not add stories field when no match', () => {
      const project: BMADProject = {
        name: 'P',
        features: [{ id: 'F1', name: 'Auth', description: 'x' }],
        userStories: [
          { id: 'S1', title: 'Dashboard view', asA: 'u', iWant: 'w', soThat: 's' },
        ],
      };

      const result = transformToBSR(project);

      expect(result.idea!.features[0].stories).toBeUndefined();
    });
  });

  describe('transformAndSave', () => {
    it('should write YAML file to output path', async () => {
      const project: BMADProject = { name: 'SaveTest', description: 'Test save' };
      const outputPath = path.join(testDir, 'output', 'idea.yaml');

      const result = await transformAndSave(project, outputPath);

      expect(result.success).toBe(true);
      expect(fs.existsSync(outputPath)).toBe(true);

      const written = YAML.parse(fs.readFileSync(outputPath, 'utf-8'));
      expect(written.name).toBe('SaveTest');
    });

    it('should create directory if it does not exist', async () => {
      const project: BMADProject = { name: 'P' };
      const outputPath = path.join(testDir, 'deep', 'nested', 'idea.yaml');

      await transformAndSave(project, outputPath);

      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('should not write file for invalid project', async () => {
      const project: BMADProject = { name: '' };
      const outputPath = path.join(testDir, 'idea.yaml');

      const result = await transformAndSave(project, outputPath);

      expect(result.success).toBe(false);
      expect(fs.existsSync(outputPath)).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// BMAD Integration
// ---------------------------------------------------------------------------

describe('BMAD Integration', () => {
  describe('bmadToBSR', () => {
    it('should run full parse + transform pipeline', async () => {
      createBMADFixture(testDir, {
        project: { name: 'Integration', description: 'Test integration' },
        features: [{ id: 'F1', name: 'Core', description: 'Core feature' }],
      });

      const { parseResult, transformResult } = await bmadToBSR(testDir);

      expect(parseResult.success).toBe(true);
      expect(transformResult).toBeDefined();
      expect(transformResult!.success).toBe(true);
      expect(transformResult!.idea!.name).toBe('Integration');
    });

    it('should not transform when parse fails', async () => {
      const { parseResult, transformResult } = await bmadToBSR('/nonexistent');

      expect(parseResult.success).toBe(false);
      expect(transformResult).toBeUndefined();
    });
  });

  describe('bmadFileToBSR', () => {
    it('should parse single file and transform', async () => {
      const fp = path.join(testDir, 'project.yaml');
      fs.writeFileSync(fp, YAML.stringify({ name: 'Single', description: 'File test' }));

      const { parseResult, transformResult } = await bmadFileToBSR(fp);

      expect(parseResult.success).toBe(true);
      expect(transformResult!.idea!.name).toBe('Single');
    });
  });

  describe('convertBMADtoBSR', () => {
    it('should run full pipeline: parse -> transform -> save', async () => {
      createBMADFixture(testDir, {
        project: { name: 'FullPipeline', description: 'E2E test' },
      });
      const outputPath = path.join(testDir, 'out', 'idea.yaml');

      const result = await convertBMADtoBSR(testDir, outputPath);

      expect(result.success).toBe(true);
      expect(result.idea).toBeDefined();
      expect(result.idea!.name).toBe('FullPipeline');
      expect(fs.existsSync(outputPath)).toBe(true);
    });

    it('should aggregate errors from both parse and transform steps', async () => {
      const result = await convertBMADtoBSR('/nonexistent', path.join(testDir, 'out.yaml'));

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
