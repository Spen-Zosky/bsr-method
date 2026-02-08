/**
 * SpecKit Adapter - Generator
 * Generate spec.md from BSR idea.yaml
 */

import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';

export interface BSRIdea {
  name: string;
  version: string;
  description: string;
  vision?: string;
  goals: string[];
  features: BSRFeature[];
  personas?: BSRPersona[];
  architecture?: BSRArchitecture;
  tech_decisions?: Record<string, string>;
  constraints?: string[];
  milestones?: BSRMilestone[];
}

export interface BSRFeature {
  id: string;
  name: string;
  description: string;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  stories?: string[];
}

export interface BSRPersona {
  name: string;
  role: string;
  needs: string[];
}

export interface BSRArchitecture {
  type?: string;
  components?: string[];
  integrations?: string[];
}

export interface BSRMilestone {
  id: string;
  name: string;
  features: string[];
  target_date?: string;
}

export interface GeneratorOptions {
  format?: 'markdown' | 'yaml';
  includeTaskBreakdown?: boolean;
  includeAcceptanceCriteria?: boolean;
  outputPath?: string;
}

export interface GeneratorResult {
  success: boolean;
  content?: string;
  errors: string[];
  warnings: string[];
}

/**
 * Load BSR idea from YAML file
 */
export function loadIdea(ideaPath: string): BSRIdea | null {
  if (!fs.existsSync(ideaPath)) {
    return null;
  }
  
  const content = fs.readFileSync(ideaPath, 'utf-8');
  try {
    return YAML.parse(content) as BSRIdea;
  } catch {
    return null;
  }
}

/**
 * Generate specification document from BSR idea
 */
export function generateSpec(
  idea: BSRIdea,
  options: GeneratorOptions = {}
): GeneratorResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!idea.name) {
    errors.push('Project name is required');
    return { success: false, errors, warnings };
  }

  const format = options.format || 'markdown';
  
  let content: string;
  if (format === 'yaml') {
    content = generateYAMLSpec(idea, options);
  } else {
    content = generateMarkdownSpec(idea, options);
  }

  return { success: true, content, errors, warnings };
}

/**
 * Generate and save specification
 */
export async function generateAndSave(
  idea: BSRIdea,
  outputPath: string,
  options: GeneratorOptions = {}
): Promise<GeneratorResult> {
  const result = generateSpec(idea, options);
  
  if (!result.success || !result.content) {
    return result;
  }

  try {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, result.content, 'utf-8');
    return result;
  } catch (e) {
    result.errors.push('Failed to write file: ' + (e as Error).message);
    result.success = false;
    return result;
  }
}

// Helper functions

function generateMarkdownSpec(idea: BSRIdea, options: GeneratorOptions): string {
  const lines: string[] = [];

  // Header
  lines.push(`# ${idea.name} - Technical Specification`);
  lines.push('');
  lines.push(`**Version:** ${idea.version}`);
  lines.push(`**Generated:** ${new Date().toISOString().split('T')[0]}`);
  lines.push('');

  // Overview
  lines.push('## 1. Overview');
  lines.push('');
  lines.push(idea.description);
  lines.push('');

  // Vision
  if (idea.vision) {
    lines.push('### Vision');
    lines.push('');
    lines.push(idea.vision);
    lines.push('');
  }

  // Goals
  if (idea.goals && idea.goals.length > 0) {
    lines.push('### Goals');
    lines.push('');
    for (const goal of idea.goals) {
      lines.push(`- ${goal}`);
    }
    lines.push('');
  }

  // Architecture
  lines.push('## 2. Architecture');
  lines.push('');
  if (idea.architecture) {
    if (idea.architecture.type) {
      lines.push(`**Architecture Type:** ${idea.architecture.type}`);
      lines.push('');
    }
    if (idea.architecture.components && idea.architecture.components.length > 0) {
      lines.push('### Components');
      lines.push('');
      for (const comp of idea.architecture.components) {
        lines.push(`- **${comp}**`);
      }
      lines.push('');
    }
    if (idea.architecture.integrations && idea.architecture.integrations.length > 0) {
      lines.push('### External Integrations');
      lines.push('');
      for (const int of idea.architecture.integrations) {
        lines.push(`- ${int}`);
      }
      lines.push('');
    }
  } else {
    lines.push('*Architecture to be defined*');
    lines.push('');
  }

  // Tech Decisions
  if (idea.tech_decisions && Object.keys(idea.tech_decisions).length > 0) {
    lines.push('## 3. Technical Decisions');
    lines.push('');
    lines.push('| Decision | Choice |');
    lines.push('|----------|--------|');
    for (const [key, value] of Object.entries(idea.tech_decisions)) {
      lines.push(`| ${key} | ${value} |`);
    }
    lines.push('');
  }

  // Features
  lines.push('## 4. Features');
  lines.push('');
  
  // Group by priority
  const priorityGroups = groupByPriority(idea.features);
  
  for (const [priority, features] of Object.entries(priorityGroups)) {
    if (features.length === 0) continue;
    
    lines.push(`### ${priority} Features`);
    lines.push('');
    
    for (const feature of features) {
      lines.push(`#### ${feature.id}: ${feature.name}`);
      lines.push('');
      lines.push(feature.description);
      lines.push('');
      
      if (options.includeAcceptanceCriteria) {
        lines.push('**Acceptance Criteria:**');
        lines.push('');
        lines.push('- [ ] TBD');
        lines.push('');
      }
    }
  }

  // Personas
  if (idea.personas && idea.personas.length > 0) {
    lines.push('## 5. User Personas');
    lines.push('');
    
    for (const persona of idea.personas) {
      lines.push(`### ${persona.name}`);
      lines.push('');
      lines.push(`**Role:** ${persona.role}`);
      lines.push('');
      lines.push('**Needs:**');
      for (const need of persona.needs) {
        lines.push(`- ${need}`);
      }
      lines.push('');
    }
  }

  // Milestones
  if (idea.milestones && idea.milestones.length > 0) {
    lines.push('## 6. Milestones');
    lines.push('');
    
    for (const milestone of idea.milestones) {
      lines.push(`### ${milestone.id}: ${milestone.name}`);
      if (milestone.target_date) {
        lines.push(`**Target:** ${milestone.target_date}`);
      }
      lines.push('');
      lines.push('**Features:**');
      for (const f of milestone.features) {
        lines.push(`- ${f}`);
      }
      lines.push('');
    }
  }

  // Constraints
  if (idea.constraints && idea.constraints.length > 0) {
    lines.push('## 7. Constraints');
    lines.push('');
    for (const constraint of idea.constraints) {
      lines.push(`- ${constraint}`);
    }
    lines.push('');
  }

  // Task Breakdown placeholder
  if (options.includeTaskBreakdown) {
    lines.push('## 8. Task Breakdown');
    lines.push('');
    lines.push('*See `tasks/breakdown.json` for detailed task breakdown.*');
    lines.push('');
  }

  return lines.join('\n');
}

function generateYAMLSpec(idea: BSRIdea, options: GeneratorOptions): string {
  const spec = {
    metadata: {
      name: idea.name,
      version: idea.version,
      generated: new Date().toISOString(),
    },
    overview: {
      description: idea.description,
      vision: idea.vision,
      goals: idea.goals,
    },
    architecture: idea.architecture,
    tech_decisions: idea.tech_decisions,
    features: idea.features.map(f => ({
      id: f.id,
      name: f.name,
      description: f.description,
      priority: f.priority,
      acceptance_criteria: options.includeAcceptanceCriteria ? ['TBD'] : undefined,
    })),
    personas: idea.personas,
    milestones: idea.milestones,
    constraints: idea.constraints,
  };

  return YAML.stringify(spec, { indent: 2 });
}

function groupByPriority(features: BSRFeature[]): Record<string, BSRFeature[]> {
  const groups: Record<string, BSRFeature[]> = {
    P0: [],
    P1: [],
    P2: [],
    P3: [],
  };

  for (const feature of features) {
    const priority = feature.priority || 'P1';
    if (!groups[priority]) groups[priority] = [];
    groups[priority].push(feature);
  }

  return groups;
}
