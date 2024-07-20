import { createGenerator } from 'ts-json-schema-generator';
import { writeFile, mkdir } from 'fs/promises';
import { join, basename } from 'path';
import type { Config } from 'ts-json-schema-generator';

const SCHEMAS_DIR = './schemas';

async function generateSchema(typePath: string): Promise<void> {
	const typeName = basename(typePath, '.ts');
	const config: Config = {
		path: typePath,
		tsconfig: './tsconfig.json',
		type: '*'
	};

	try {
		const schema = createGenerator(config).createSchema(config.type);
		const schemaString = JSON.stringify(schema, null, 2);
		const outputPath = join(SCHEMAS_DIR, `${typeName}.schema.json`);
		await mkdir(SCHEMAS_DIR, { recursive: true });
		await writeFile(outputPath, schemaString);
		console.log(`Generated schema for ${typeName}`);
	} catch (error) {
		console.error(`Error generating schema for ${typeName}:`, error);
		process.exit(1);
	}
}

async function main(): Promise<void> {
	const files = process.argv.slice(2);
	for (const file of files) {
		await generateSchema(file);
	}
}

main().catch((error) => {
	console.error('An error occurred:', error);
	process.exit(1);
});
