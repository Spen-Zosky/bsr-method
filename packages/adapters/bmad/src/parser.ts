/**
 * BMAD Adapter - Parser
 * Parses BMAD output files and extracts structured data
 */

import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';

export interface BMADProject {
  name: string;
  description?: string;
  vision?: string;
  goals?: string[];
  features?: BMADFeature[];
  personas?: BMADPersona[];
  epics?: BMADEpic[];
  userStories?: BMADUserStory[];
}

export interface BMADFeature {
  id: string;
  name: string;
  description: string;
  priority?: 'P0' | 'P1' | 'P2' | 'P3';
}

export interface BMADPersona {
  name: string;
  role: string;
  goals: string[];
  painPoints?: string[];
}

export interface BMADEpic {
  id: string;
  title: string;
  description: string;
  features?: string[];
}

export interface BMADUserStory {
  id: string;
  epic?: string;
  title: string;
  asA: string;
  iWant: string;
  soThat: string;
  acceptanceCriteria?: string[];
}

export interface ParseResult {
  success: boolean;
  project?: BMADProject;
  errors: string[];
  warnings: string[];
}

/**
 * Parse BMAD output directory structure
 */
export async function parseBMADDirectory(bmadPath: string): Promise<ParseResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!fs.existsSync(bmadPath)) {
    return { success: false, errors: ['BMAD directory not found: ' + bmadPath], warnings };
  }

  const project: BMADProject = { name: '' };

  // Parse project.yaml or project.md
  const projectFile = findFile(bmadPath, ['project.yaml', 'project.yml', 'project.md']);
  if (projectFile) {
    const parsed = await parseProjectFile(projectFile);
    Object.assign(project, parsed.data);
    errors.push(...parsed.errors);
  } else {
    warnings.push('No project file found');
  }

  // Parse personas
  const personasDir = path.join(bmadPath, 'personas');
  if (fs.existsSync(personasDir)) {
    project.personas = await parsePersonas(personasDir);
  }

  // Parse epics
  const epicsDir = path.join(bmadPath, 'epics');
  if (fs.existsSync(epicsDir)) {
    project.epics = await parseEpics(epicsDir);
  }

  // Parse user stories
  const storiesDir = path.join(bmadPath, 'stories');
  if (fs.existsSync(storiesDir)) {
    project.userStories = await parseUserStories(storiesDir);
  }

  // Parse features from various sources
  const featuresFile = findFile(bmadPath, ['features.yaml', 'features.yml', 'features.md']);
  if (featuresFile) {
    project.features = await parseFeatures(featuresFile);
  }

  return {
    success: errors.length === 0,
    project,
    errors,
    warnings,
  };
}

/**
 * Parse a single BMAD output file (YAML or Markdown)
 */
export async function parseBMADFile(filePath: string): Promise<ParseResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!fs.existsSync(filePath)) {
    return { success: false, errors: ['File not found: ' + filePath], warnings };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const ext = path.extname(filePath).toLowerCase();

  let project: BMADProject = { name: '' };

  if (ext === '.yaml' || ext === '.yml') {
    try {
      const parsed = YAML.parse(content);
      project = normalizeProject(parsed);
    } catch (e) {
      errors.push('Failed to parse YAML: ' + (e as Error).message);
    }
  } else if (ext === '.md') {
    project = parseMarkdownProject(content);
  } else {
    errors.push('Unsupported file type: ' + ext);
  }

  return { success: errors.length === 0, project, errors, warnings };
}

// Helper functions

function findFile(dir: string, names: string[]): string | null {
  for (const name of names) {
    const filePath = path.join(dir, name);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

async function parseProjectFile(filePath: string): Promise<{ data: Partial<BMADProject>; errors: string[] }> {
  const errors: string[] = [];
  const content = fs.readFileSync(filePath, 'utf-8');
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.yaml' || ext === '.yml') {
    try {
      const parsed = YAML.parse(content);
      return { data: normalizeProject(parsed), errors };
    } catch (e) {
      errors.push('Failed to parse project YAML: ' + (e as Error).message);
      return { data: {}, errors };
    }
  }

  // Markdown parsing
  return { data: parseMarkdownProject(content), errors };
}

function normalizeProject(raw: any): BMADProject {
  return {
    name: raw.name || raw.projectName || raw.title || '',
    description: raw.description || raw.summary || '',
    vision: raw.vision || raw.projectVision || '',
    goals: Array.isArray(raw.goals) ? raw.goals : [],
    features: normalizeFeatures(raw.features || []),
  };
}

function normalizeFeatures(raw: any[]): BMADFeature[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((f, i) => ({
    id: f.id || `F${i + 1}`,
    name: f.name || f.title || '',
    description: f.description || '',
    priority: f.priority || 'P1',
  }));
}

function parseMarkdownProject(content: string): BMADProject {
  const project: BMADProject = { name: '' };
  const lines = content.split('\n');

  let currentSection = '';
  
  for (const line of lines) {
    if (line.startsWith('# ')) {
      project.name = line.substring(2).trim();
    } else if (line.startsWith('## ')) {
      currentSection = line.substring(3).trim().toLowerCase();
    } else if (currentSection === 'description' || currentSection === 'overview') {
      project.description = (project.description || '') + line + '\n';
    } else if (currentSection === 'vision') {
      project.vision = (project.vision || '') + line + '\n';
    } else if (currentSection === 'goals' && line.startsWith('- ')) {
      project.goals = project.goals || [];
      project.goals.push(line.substring(2).trim());
    }
  }

  // Trim descriptions
  if (project.description) project.description = project.description.trim();
  if (project.vision) project.vision = project.vision.trim();

  return project;
}

async function parsePersonas(dir: string): Promise<BMADPersona[]> {
  const personas: BMADPersona[] = [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml') || f.endsWith('.md'));
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    if (file.endsWith('.yaml') || file.endsWith('.yml')) {
      try {
        const parsed = YAML.parse(content);
        personas.push({
          name: parsed.name || '',
          role: parsed.role || '',
          goals: parsed.goals || [],
          painPoints: parsed.painPoints || [],
        });
      } catch { /* skip invalid files */ }
    }
  }
  
  return personas;
}

async function parseEpics(dir: string): Promise<BMADEpic[]> {
  const epics: BMADEpic[] = [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    try {
      const parsed = YAML.parse(content);
      epics.push({
        id: parsed.id || path.basename(file, path.extname(file)),
        title: parsed.title || parsed.name || '',
        description: parsed.description || '',
        features: parsed.features || [],
      });
    } catch { /* skip invalid files */ }
  }
  
  return epics;
}

async function parseUserStories(dir: string): Promise<BMADUserStory[]> {
  const stories: BMADUserStory[] = [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  
  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    try {
      const parsed = YAML.parse(content);
      stories.push({
        id: parsed.id || path.basename(file, path.extname(file)),
        epic: parsed.epic,
        title: parsed.title || '',
        asA: parsed.asA || parsed.as_a || '',
        iWant: parsed.iWant || parsed.i_want || '',
        soThat: parsed.soThat || parsed.so_that || '',
        acceptanceCriteria: parsed.acceptanceCriteria || parsed.acceptance_criteria || [],
      });
    } catch { /* skip invalid files */ }
  }
  
  return stories;
}

async function parseFeatures(filePath: string): Promise<BMADFeature[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.yaml' || ext === '.yml') {
    try {
      const parsed = YAML.parse(content);
      const features = Array.isArray(parsed) ? parsed : parsed.features || [];
      return normalizeFeatures(features);
    } catch {
      return [];
    }
  }
  
  // Markdown: extract features from list items
  const features: BMADFeature[] = [];
  const lines = content.split('\n');
  let id = 1;
  
  for (const line of lines) {
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const text = line.substring(2).trim();
      const [name, ...descParts] = text.split(':');
      features.push({
        id: `F${id++}`,
        name: name.trim(),
        description: descParts.join(':').trim(),
      });
    }
  }
  
  return features;
}
