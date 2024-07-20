import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import Ajv from 'ajv';

const ajv = new Ajv();
const DATA_DIR = './data';
const SCHEMAS_DIR = './schemas';
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

async function validateJson(jsonPath: string, schemaPath: string): Promise<void> {
	const jsonContent = await readFile(jsonPath, 'utf-8');
	const schemaContent = await readFile(schemaPath, 'utf-8');

	const json = JSON.parse(jsonContent);
	const schema = JSON.parse(schemaContent);

	const validate = ajv.compile(schema);
	const valid = validate(json);

	if (!valid) {
		console.error(`Validation failed for ${jsonPath}`);
		console.error(validate.errors);
		throw new Error(`JSON validation failed for ${jsonPath}`);
	}

	console.log(`${jsonPath} is valid`);
}

async function validateAllJson(): Promise<void> {
	for (const lang of LANGUAGE_CODES) {
		const langDir = join(DATA_DIR, lang);
		const categories = await readdir(langDir);

		for (const category of categories) {
			const categoryDir = join(langDir, category);
			const jsonFiles = await readdir(categoryDir);

			for (const jsonFile of jsonFiles) {
				if (jsonFile.endsWith('.json')) {
					const jsonPath = join(categoryDir, jsonFile);
					const schemaPath = join(SCHEMAS_DIR, `${category}.schema.json`);

					await validateJson(jsonPath, schemaPath);
				}
			}
		}
	}
}

validateAllJson().catch((error) => {
	console.error('Validation failed:', error);
	process.exit(1);
});
