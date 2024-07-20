import * as TJS from 'ts-json-schema-generator';
import Ajv from 'ajv';
import { readdir, readFile, writeFile } from 'fs/promises';
import { join, basename } from 'path';

const LANGUAGE_CODES = [
	'ZHS',
	'ZHT',
	'EN',
	'FR',
	'DE',
	'ID',
	'JP',
	'KO',
	'PT',
	'RU',
	'ES',
	'TH',
	'VI',
	'TR',
	'IT'
];

const generateSchema = (typePath: string, typeName: string) => {
	const config: TJS.Config = {
		path: typePath,
		tsconfig: './tsconfig.json',
		type: typeName
	};

	const schema = TJS.createGenerator(config).createSchema(typeName);
	return schema;
};

const validateJson = (schema: any, json: any): string[] => {
	const ajv = new Ajv();
	const validate = ajv.compile(schema);
	const valid = validate(json);

	if (!valid) {
		return validate.errors?.map((error) => `${error.instancePath} ${error.message}`) || [];
	}

	return [];
};

const validateAllJsonFiles = async (dataDir: string, typeDir: string) => {
	const typeFiles = await readdir(typeDir);

	for (const typeFile of typeFiles) {
		if (typeFile.endsWith('.ts')) {
			const typeName = basename(typeFile, '.ts');
			const schema = generateSchema(join(typeDir, typeFile), typeName);

			// Optionally, save the generated schema
			await writeFile(`${typeName}.schema.json`, JSON.stringify(schema, null, 2));

			for (const langCode of LANGUAGE_CODES) {
				const categoryDir = join(dataDir, langCode, typeName);
				try {
					const jsonFiles = await readdir(categoryDir);

					for (const jsonFile of jsonFiles) {
						if (jsonFile.endsWith('.json')) {
							const jsonPath = join(categoryDir, jsonFile);
							const jsonContent = await readFile(jsonPath, 'utf-8');
							const jsonData = JSON.parse(jsonContent);

							const errors = validateJson(schema, jsonData);

							if (errors.length > 0) {
								throw new Error(
									`Validation errors for ${jsonPath}:\n${errors.join('\n')}`
								);
							} else {
								console.log(`${jsonPath} is valid`);
							}
						}
					}
				} catch (error) {
					if (error.code === 'ENOENT') {
						console.warn(`No directory found for ${typeName} in ${langCode}`);
					} else {
						throw error;
					}
				}
			}
		}
	}
};

// Usage
validateAllJsonFiles('./data', './types')
	.then(() => console.log('All JSON files validated successfully'))
	.catch((error) => {
		console.error('Validation failed:', error.message);
		process.exit(1);
	});
