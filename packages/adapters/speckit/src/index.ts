/**
 * @bsr-method/speckit-adapter
 * SpecKit adapter for BSR Method - Generate and validate specifications
 */

export * from './generator.js';
export * from './validator.js';

import { loadIdea, generateSpec, generateAndSave, type GeneratorOptions, type GeneratorResult } from './generator.js';
import { validateIdea, validateIdeaFile, validateSpec, type ValidationOptions, type ValidationResult } from './validator.js';

/**
 * High-level API: Load idea, validate, and generate spec
 */
export async function ideaToSpec(
  ideaPath: string,
  outputPath: string,
  options: GeneratorOptions & ValidationOptions = {}
): Promise<{ validation: ValidationResult; generation?: GeneratorResult }> {
  // Load idea
  const idea = loadIdea(ideaPath);
  if (!idea) {
    return {
      validation: {
        valid: false,
        errors: [{ field: 'file', message: `Failed to load idea from: ${ideaPath}`, severity: 'error' }],
        warnings: [],
        score: 0,
      },
    };
  }

  // Validate
  const validation = validateIdea(idea, options);
  if (!validation.valid) {
    return { validation };
  }

  // Generate
  const generation = await generateAndSave(idea, outputPath, options);

  return { validation, generation };
}

/**
 * High-level API: Validate idea file only
 */
export function checkIdea(
  ideaPath: string,
  options: ValidationOptions = {}
): ValidationResult {
  return validateIdeaFile(ideaPath, options);
}

/**
 * High-level API: Generate spec from idea object
 */
export function createSpec(
  idea: any,
  options: GeneratorOptions = {}
): GeneratorResult {
  return generateSpec(idea, options);
}
