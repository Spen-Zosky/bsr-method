/**
 * BMAD Adapter - Transformer
 * Transforms parsed BMAD data to BSR idea.yaml format
 */

import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';
import type { BMADProject, BMADFeature, BMADPersona, BMADEpic, BMADUserStory } from './parser.js';

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

export interface TransformResult {
  success: boolean;
  idea?: BSRIdea;
  errors: string[];
  warnings: string[];
}

export interface TransformOptions {
  version?: string;
  includePersonas?: boolean;
  includeStories?: boolean;
  outputPath?: string;
}

/**
 * Transform BMAD project to BSR idea format
 */
export function transformToBSR(
  project: BMADProject,
  options: TransformOptions = {}
): TransformResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!project.name) {
    errors.push('Project name is required');
  }

  const idea: BSRIdea = {
    name: project.name,
    version: options.version || '0.1.0',
    description: project.description || '',
    vision: project.vision,
    goals: project.goals || [],
    features: transformFeatures(project.features || [], project.userStories),
  };

  // Add personas if requested
  if (options.includePersonas && project.personas) {
    idea.personas = project.personas.map(p => ({
      name: p.name,
      role: p.role,
      needs: p.goals,
    }));
  }

  // Generate milestones from epics
  if (project.epics && project.epics.length > 0) {
    idea.milestones = project.epics.map((epic, i) => ({
      id: `M${i + 1}`,
      name: epic.title,
      features: epic.features || [],
    }));
  }

  // Infer architecture from features
  idea.architecture = inferArchitecture(project);

  return {
    success: errors.length === 0,
    idea,
    errors,
    warnings,
  };
}

/**
 * Transform and save BSR idea to file
 */
export async function transformAndSave(
  project: BMADProject,
  outputPath: string,
  options: TransformOptions = {}
): Promise<TransformResult> {
  const result = transformToBSR(project, options);
  
  if (!result.success || !result.idea) {
    return result;
  }

  try {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const yamlContent = YAML.stringify(result.idea, {
      indent: 2,
      lineWidth: 100,
    });

    fs.writeFileSync(outputPath, yamlContent, 'utf-8');
    return result;
  } catch (e) {
    result.errors.push('Failed to write file: ' + (e as Error).message);
    result.success = false;
    return result;
  }
}

// Helper functions

function transformFeatures(
  features: BMADFeature[],
  stories?: BMADUserStory[]
): BSRFeature[] {
  return features.map(f => {
    const bsrFeature: BSRFeature = {
      id: f.id,
      name: f.name,
      description: f.description,
      priority: normalizePriority(f.priority),
    };

    // Link stories to features if available
    if (stories) {
      const relatedStories = stories
        .filter(s => s.title.toLowerCase().includes(f.name.toLowerCase()))
        .map(s => s.id);
      
      if (relatedStories.length > 0) {
        bsrFeature.stories = relatedStories;
      }
    }

    return bsrFeature;
  });
}

function normalizePriority(priority?: string): 'P0' | 'P1' | 'P2' | 'P3' {
  if (!priority) return 'P1';
  const p = priority.toUpperCase();
  if (['P0', 'P1', 'P2', 'P3'].includes(p)) {
    return p as 'P0' | 'P1' | 'P2' | 'P3';
  }
  // Map common alternatives
  if (p === 'HIGH' || p === 'CRITICAL') return 'P0';
  if (p === 'MEDIUM' || p === 'NORMAL') return 'P1';
  if (p === 'LOW') return 'P2';
  return 'P1';
}

function inferArchitecture(project: BMADProject): BSRArchitecture {
  const arch: BSRArchitecture = {};
  const components: Set<string> = new Set();
  const integrations: Set<string> = new Set();

  // Analyze features for architecture hints
  const allText = [
    project.description || '',
    project.vision || '',
    ...(project.features?.map(f => f.description) || []),
    ...(project.userStories?.map(s => s.title + ' ' + s.iWant) || []),
  ].join(' ').toLowerCase();

  // Detect architecture type
  if (allText.includes('microservice')) {
    arch.type = 'microservices';
  } else if (allText.includes('monolith')) {
    arch.type = 'monolith';
  } else if (allText.includes('serverless') || allText.includes('lambda')) {
    arch.type = 'serverless';
  } else if (allText.includes('api') || allText.includes('rest')) {
    arch.type = 'api-first';
  }

  // Detect components
  if (allText.includes('frontend') || allText.includes('ui') || allText.includes('dashboard')) {
    components.add('frontend');
  }
  if (allText.includes('backend') || allText.includes('api') || allText.includes('server')) {
    components.add('backend');
  }
  if (allText.includes('database') || allText.includes('db') || allText.includes('storage')) {
    components.add('database');
  }
  if (allText.includes('auth') || allText.includes('login') || allText.includes('user')) {
    components.add('auth');
  }
  if (allText.includes('cli') || allText.includes('command')) {
    components.add('cli');
  }

  // Detect integrations
  if (allText.includes('github')) integrations.add('github');
  if (allText.includes('slack')) integrations.add('slack');
  if (allText.includes('stripe') || allText.includes('payment')) integrations.add('payments');
  if (allText.includes('email') || allText.includes('sendgrid')) integrations.add('email');
  if (allText.includes('oauth') || allText.includes('sso')) integrations.add('oauth');

  if (components.size > 0) arch.components = Array.from(components);
  if (integrations.size > 0) arch.integrations = Array.from(integrations);

  return arch;
}
