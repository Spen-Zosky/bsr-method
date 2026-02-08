/**
 * SpecKit Adapter - Validator
 * Validate specifications against BSR schema
 */

import * as fs from 'fs';
import YAML from 'yaml';
import type { BSRIdea, BSRFeature, BSRPersona, BSRArchitecture } from './generator.js';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100 completeness score
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error';
}

export interface ValidationWarning {
  field: string;
  message: string;
  severity: 'warning';
  suggestion?: string;
}

export interface ValidationOptions {
  strict?: boolean;          // Fail on warnings too
  requirePersonas?: boolean;
  requireMilestones?: boolean;
  requireArchitecture?: boolean;
  minFeatures?: number;
  minGoals?: number;
}

const DEFAULT_OPTIONS: ValidationOptions = {
  strict: false,
  requirePersonas: false,
  requireMilestones: false,
  requireArchitecture: false,
  minFeatures: 1,
  minGoals: 1,
};

/**
 * Validate BSR idea object
 */
export function validateIdea(
  idea: BSRIdea,
  options: ValidationOptions = {}
): ValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let scorePoints = 0;
  const maxPoints = 100;

  // Required fields
  if (!idea.name || idea.name.trim() === '') {
    errors.push({ field: 'name', message: 'Project name is required', severity: 'error' });
  } else {
    scorePoints += 10;
  }

  if (!idea.version || idea.version.trim() === '') {
    errors.push({ field: 'version', message: 'Version is required', severity: 'error' });
  } else if (!isValidSemver(idea.version)) {
    warnings.push({ 
      field: 'version', 
      message: 'Version should follow semver format (e.g., 1.0.0)', 
      severity: 'warning',
      suggestion: 'Use format: MAJOR.MINOR.PATCH'
    });
    scorePoints += 3;
  } else {
    scorePoints += 5;
  }

  if (!idea.description || idea.description.trim() === '') {
    errors.push({ field: 'description', message: 'Description is required', severity: 'error' });
  } else if (idea.description.length < 20) {
    warnings.push({ 
      field: 'description', 
      message: 'Description is too short', 
      severity: 'warning',
      suggestion: 'Provide at least 20 characters describing the project'
    });
    scorePoints += 5;
  } else {
    scorePoints += 10;
  }

  // Goals
  if (!idea.goals || idea.goals.length === 0) {
    if (opts.minGoals && opts.minGoals > 0) {
      errors.push({ field: 'goals', message: `At least ${opts.minGoals} goal(s) required`, severity: 'error' });
    } else {
      warnings.push({ field: 'goals', message: 'No goals defined', severity: 'warning' });
    }
  } else if (idea.goals.length < (opts.minGoals || 1)) {
    warnings.push({ 
      field: 'goals', 
      message: `Only ${idea.goals.length} goal(s) defined, recommend at least ${opts.minGoals}`, 
      severity: 'warning' 
    });
    scorePoints += 5;
  } else {
    scorePoints += 10;
  }

  // Features
  if (!idea.features || idea.features.length === 0) {
    if (opts.minFeatures && opts.minFeatures > 0) {
      errors.push({ field: 'features', message: `At least ${opts.minFeatures} feature(s) required`, severity: 'error' });
    } else {
      warnings.push({ field: 'features', message: 'No features defined', severity: 'warning' });
    }
  } else {
    if (idea.features.length < (opts.minFeatures || 1)) {
      warnings.push({ 
        field: 'features', 
        message: `Only ${idea.features.length} feature(s) defined`, 
        severity: 'warning' 
      });
    }
    
    // Validate each feature
    const featureErrors = validateFeatures(idea.features);
    errors.push(...featureErrors.errors);
    warnings.push(...featureErrors.warnings);
    
    scorePoints += Math.min(20, idea.features.length * 4);
  }

  // Vision (optional but recommended)
  if (!idea.vision || idea.vision.trim() === '') {
    warnings.push({ 
      field: 'vision', 
      message: 'Vision statement not provided', 
      severity: 'warning',
      suggestion: 'Add a vision to guide development decisions'
    });
  } else {
    scorePoints += 10;
  }

  // Architecture
  if (opts.requireArchitecture && (!idea.architecture || Object.keys(idea.architecture).length === 0)) {
    errors.push({ field: 'architecture', message: 'Architecture definition required', severity: 'error' });
  } else if (idea.architecture) {
    const archResult = validateArchitecture(idea.architecture);
    errors.push(...archResult.errors);
    warnings.push(...archResult.warnings);
    scorePoints += archResult.score;
  } else {
    warnings.push({ 
      field: 'architecture', 
      message: 'No architecture defined', 
      severity: 'warning',
      suggestion: 'Define at least architecture type and main components'
    });
  }

  // Personas
  if (opts.requirePersonas && (!idea.personas || idea.personas.length === 0)) {
    errors.push({ field: 'personas', message: 'At least one persona required', severity: 'error' });
  } else if (idea.personas && idea.personas.length > 0) {
    const personaResult = validatePersonas(idea.personas);
    errors.push(...personaResult.errors);
    warnings.push(...personaResult.warnings);
    scorePoints += Math.min(10, idea.personas.length * 3);
  }

  // Milestones
  if (opts.requireMilestones && (!idea.milestones || idea.milestones.length === 0)) {
    errors.push({ field: 'milestones', message: 'At least one milestone required', severity: 'error' });
  } else if (idea.milestones && idea.milestones.length > 0) {
    scorePoints += Math.min(10, idea.milestones.length * 3);
  }

  // Tech decisions bonus
  if (idea.tech_decisions && Object.keys(idea.tech_decisions).length > 0) {
    scorePoints += Math.min(10, Object.keys(idea.tech_decisions).length * 2);
  }

  // Calculate final score
  const score = Math.min(100, Math.round((scorePoints / maxPoints) * 100));

  // In strict mode, warnings become errors
  if (opts.strict) {
    for (const warning of warnings) {
      errors.push({ ...warning, severity: 'error' });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: opts.strict ? [] : warnings,
    score,
  };
}

/**
 * Validate idea from YAML file
 */
export function validateIdeaFile(
  filePath: string,
  options: ValidationOptions = {}
): ValidationResult {
  if (!fs.existsSync(filePath)) {
    return {
      valid: false,
      errors: [{ field: 'file', message: `File not found: ${filePath}`, severity: 'error' }],
      warnings: [],
      score: 0,
    };
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const idea = YAML.parse(content) as BSRIdea;
    return validateIdea(idea, options);
  } catch (e) {
    return {
      valid: false,
      errors: [{ field: 'file', message: `Failed to parse YAML: ${(e as Error).message}`, severity: 'error' }],
      warnings: [],
      score: 0,
    };
  }
}

/**
 * Validate specification markdown content
 */
export function validateSpec(content: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let score = 0;

  // Check for required sections
  const requiredSections = ['Overview', 'Architecture', 'Features'];
  const optionalSections = ['Technical Decisions', 'Personas', 'Milestones', 'Constraints'];

  for (const section of requiredSections) {
    if (!content.includes(`## `) || !content.toLowerCase().includes(section.toLowerCase())) {
      warnings.push({ 
        field: 'sections', 
        message: `Missing recommended section: ${section}`, 
        severity: 'warning' 
      });
    } else {
      score += 15;
    }
  }

  for (const section of optionalSections) {
    if (content.toLowerCase().includes(section.toLowerCase())) {
      score += 5;
    }
  }

  // Check for title
  if (!content.startsWith('# ')) {
    warnings.push({ field: 'title', message: 'Spec should start with a title (# Title)', severity: 'warning' });
  } else {
    score += 10;
  }

  // Check minimum length
  if (content.length < 500) {
    warnings.push({ 
      field: 'content', 
      message: 'Specification seems incomplete (less than 500 characters)', 
      severity: 'warning' 
    });
  } else {
    score += 10;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    score: Math.min(100, score),
  };
}

// Helper functions

function isValidSemver(version: string): boolean {
  const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/;
  return semverRegex.test(version);
}

function validateFeatures(features: BSRFeature[]): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const ids = new Set<string>();

  for (let i = 0; i < features.length; i++) {
    const feature = features[i];
    const prefix = `features[${i}]`;

    if (!feature.id) {
      errors.push({ field: `${prefix}.id`, message: 'Feature ID is required', severity: 'error' });
    } else if (ids.has(feature.id)) {
      errors.push({ field: `${prefix}.id`, message: `Duplicate feature ID: ${feature.id}`, severity: 'error' });
    } else {
      ids.add(feature.id);
    }

    if (!feature.name || feature.name.trim() === '') {
      errors.push({ field: `${prefix}.name`, message: 'Feature name is required', severity: 'error' });
    }

    if (!feature.description || feature.description.trim() === '') {
      warnings.push({ field: `${prefix}.description`, message: 'Feature description is empty', severity: 'warning' });
    }

    if (!['P0', 'P1', 'P2', 'P3'].includes(feature.priority)) {
      warnings.push({ 
        field: `${prefix}.priority`, 
        message: `Invalid priority: ${feature.priority}`, 
        severity: 'warning',
        suggestion: 'Use P0, P1, P2, or P3'
      });
    }
  }

  return { errors, warnings };
}

function validateArchitecture(arch: BSRArchitecture): { errors: ValidationError[]; warnings: ValidationWarning[]; score: number } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let score = 0;

  if (arch.type) {
    score += 5;
  } else {
    warnings.push({ field: 'architecture.type', message: 'Architecture type not specified', severity: 'warning' });
  }

  if (arch.components && arch.components.length > 0) {
    score += Math.min(5, arch.components.length);
  }

  if (arch.integrations && arch.integrations.length > 0) {
    score += Math.min(5, arch.integrations.length);
  }

  return { errors, warnings, score };
}

function validatePersonas(personas: BSRPersona[]): { errors: ValidationError[]; warnings: ValidationWarning[] } {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  for (let i = 0; i < personas.length; i++) {
    const persona = personas[i];
    const prefix = `personas[${i}]`;

    if (!persona.name) {
      errors.push({ field: `${prefix}.name`, message: 'Persona name is required', severity: 'error' });
    }

    if (!persona.role) {
      warnings.push({ field: `${prefix}.role`, message: 'Persona role not specified', severity: 'warning' });
    }

    if (!persona.needs || persona.needs.length === 0) {
      warnings.push({ field: `${prefix}.needs`, message: 'Persona has no needs defined', severity: 'warning' });
    }
  }

  return { errors, warnings };
}
