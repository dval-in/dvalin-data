import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import Ajv from 'ajv';
import { toPascalCase } from '../utils/stringUtils';

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

const SPECIAL_FILES = ['Domains.json', 'Banners.json'];

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

		// Validate special files
		for (const specialFile of SPECIAL_FILES) {
			if (specialFile === 'Banners.json' && lang !== 'EN') {
				continue;
			}
			const jsonPath = join(langDir, specialFile);
			const schemaPath = join(
				SCHEMAS_DIR,
				`${toPascalCase(specialFile.replace('.json', ''))}.schema.json`
			);
			await validateJson(jsonPath, schemaPath);
		}

		// Validate files in category subdirectories
		const items = await readdir(langDir, { withFileTypes: true });

		for (const item of items) {
			if (item.isDirectory()) {
				const categoryDir = join(langDir, item.name);
				const jsonFiles = await readdir(categoryDir);

				for (const jsonFile of jsonFiles) {
					if (jsonFile.endsWith('.json')) {
						const jsonPath = join(categoryDir, jsonFile);
						const schemaPath = join(SCHEMAS_DIR, `${item.name}.schema.json`);
						await validateJson(jsonPath, schemaPath);
					}
				}
			}
		}
	}
}

validateAllJson().catch((error) => {
	console.error('Validation failed:', error);
	process.exit(1);
});
