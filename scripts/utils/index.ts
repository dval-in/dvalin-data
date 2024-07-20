// This module uses Bun's built-in file system operations for improved performance.
// Make sure to run this code with Bun: https://bun.sh/

// File operations
export { readJsonFile, writeJsonFile } from './fileUtils';
export { merge, mergeObjectIntoJson } from './mergeUtils';
// String manipulations
export {
	isPascalCase,
	toPascalCase,
	toCamelCase,
	replaceRomanNumeralsPascalCased
} from './stringUtils';

// Types
export type { JsonObject, MergeableObject } from './types';

// Object transformations
export { transformObject } from './transformUtils';

// Mappings
export { langMapping, folderMapping } from './mappings';
