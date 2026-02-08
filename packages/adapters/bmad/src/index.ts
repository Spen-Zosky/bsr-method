/**
 * @bsr-method/bmad-adapter
 * BMAD adapter for BSR Method - Parse and transform BMAD outputs
 */

export * from './parser.js';
export * from './transformer.js';

import { parseBMADDirectory, parseBMADFile, type ParseResult } from './parser.js';
import { transformToBSR, transformAndSave, type TransformResult, type TransformOptions, type BSRIdea } from './transformer.js';

/**
 * High-level API: Parse BMAD and transform to BSR in one step
 */
export async function bmadToBSR(
  bmadPath: string,
  options: TransformOptions = {}
): Promise<{ parseResult: ParseResult; transformResult?: TransformResult }> {
  const parseResult = await parseBMADDirectory(bmadPath);
  
  if (!parseResult.success || !parseResult.project) {
    return { parseResult };
  }

  const transformResult = transformToBSR(parseResult.project, options);
  
  return { parseResult, transformResult };
}

/**
 * High-level API: Parse BMAD file and transform to BSR
 */
export async function bmadFileToBSR(
  filePath: string,
  options: TransformOptions = {}
): Promise<{ parseResult: ParseResult; transformResult?: TransformResult }> {
  const parseResult = await parseBMADFile(filePath);
  
  if (!parseResult.success || !parseResult.project) {
    return { parseResult };
  }

  const transformResult = transformToBSR(parseResult.project, options);
  
  return { parseResult, transformResult };
}

/**
 * High-level API: Full pipeline - parse, transform, and save
 */
export async function convertBMADtoBSR(
  bmadPath: string,
  outputPath: string,
  options: TransformOptions = {}
): Promise<{ success: boolean; errors: string[]; warnings: string[]; idea?: BSRIdea }> {
  const { parseResult, transformResult } = await bmadToBSR(bmadPath, options);
  
  const errors = [...parseResult.errors];
  const warnings = [...parseResult.warnings];

  if (!transformResult) {
    return { success: false, errors, warnings };
  }

  errors.push(...transformResult.errors);
  warnings.push(...transformResult.warnings);

  if (!transformResult.success || !transformResult.idea) {
    return { success: false, errors, warnings };
  }

  // Save to file
  const saveResult = await transformAndSave(parseResult.project!, outputPath, options);
  errors.push(...saveResult.errors);

  return {
    success: saveResult.success,
    errors,
    warnings,
    idea: transformResult.idea,
  };
}
