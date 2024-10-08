import { createGenerator } from 'ts-json-schema-generator';
import { writeFile, mkdir } from 'fs/promises';
import { join, basename, resolve } from 'path';
import type { Config } from 'ts-json-schema-generator';
import { glob } from 'glob';

const SCHEMAS_DIR = './schemas';
const TYPES_DIR = './types';

async function generateSchema(typePath: string): Promise<void> {
	const typeName = basename(typePath, '.ts');
	const fullPath = resolve(typePath);

	const config: Config = {
		path: fullPath,
		tsconfig: './tsconfig.json',
		type: '*'
	};

	try {
		const generator = createGenerator(config);
		const schema = generator.createSchema(config.type);
		const schemaString = JSON.stringify(schema, null, 2);
		const outputPath = join(SCHEMAS_DIR, `${typeName}.schema.json`);
		await mkdir(SCHEMAS_DIR, { recursive: true });
		await writeFile(outputPath, schemaString);
		console.log(`Generated schema for ${typeName}`);
	} catch (error) {
		console.error(`Error generating schema for ${typeName}:`, error);
	}
}

async function main(): Promise<void> {
	try {
		const files = await glob('**/*.ts', {
			cwd: TYPES_DIR,
			ignore: ['**/index.ts'] // Ignore index.ts files
		});

		if (files.length === 0) {
			console.log(`No TypeScript files found in ${TYPES_DIR}`);
			return;
		}

		for (const file of files) {
			const fullPath = join(TYPES_DIR, file);
			await generateSchema(fullPath);
		}
	} catch (error) {
		console.error('Error processing files:', error);
	}
}

main().catch((error) => {
	console.error('An unhandled error occurred:', error);
});
