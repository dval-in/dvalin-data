import { createGenerator } from 'ts-json-schema-generator';
import { writeFile, readdir, mkdir } from 'fs/promises';
import { join, basename } from 'path';
import type { Config } from 'ts-json-schema-generator';

const TYPES_DIR = './types';
const SCHEMAS_DIR = './schemas';

async function generateSchema(typePath: string, typeName: string): Promise<void> {
	const config: Config = {
		path: typePath,
		tsconfig: './tsconfig.json',
		type: typeName
	};

	try {
		const schema = createGenerator(config).createSchema(config.type);
		const schemaString = JSON.stringify(schema, null, 2);
		const outputPath = join(SCHEMAS_DIR, `${typeName}.schema.json`);
		await writeFile(outputPath, schemaString);
		console.log(`Generated schema for ${typeName}`);
	} catch (error) {
		console.error(`Error generating schema for ${typeName}:`, error);
		throw error;
	}
}

async function getAllTypeFiles(): Promise<string[]> {
	const files = await readdir(TYPES_DIR);
	return files.filter((file) => file.endsWith('.ts'));
}

async function getExistingSchemas(): Promise<string[]> {
	try {
		const files = await readdir(SCHEMAS_DIR);
		return files.filter((file) => file.endsWith('.schema.json'));
	} catch (error) {
		if (error.code === 'ENOENT') {
			return [];
		}
		throw error;
	}
}

async function main(): Promise<void> {
	await mkdir(SCHEMAS_DIR, { recursive: true });

	const allTypeFiles = await getAllTypeFiles();
	const existingSchemas = await getExistingSchemas();

	for (const typeFile of allTypeFiles) {
		const typeName = basename(typeFile, '.ts');
		const schemaFile = `${typeName}.schema.json`;

		if (!existingSchemas.includes(schemaFile)) {
			await generateSchema(join(TYPES_DIR, typeFile), typeName);
		}
	}
}

main().catch(console.error);
