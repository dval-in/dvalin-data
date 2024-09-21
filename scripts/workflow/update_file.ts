import { join, resolve } from 'path';
import { readJsonFile, writeJsonFile } from '../utils/fileUtils';
import { toPascalCase, replaceRomanNumeralsPascalCased } from '../utils/stringUtils';
import { langMapping, folderMapping } from '../utils/mappings';
import { stripHtml } from 'string-strip-html';
import { appendFile } from 'node:fs/promises';

const baseDir = resolve('./');
const version = Bun.argv[2] || '0.0';

if (version === '0.0') {
	console.warn('No version provided. Using fallback version: 0.0');
}

console.log(`Processing version: ${version}`);

const filePath = join(baseDir, 'changed_files.txt');
const file = await Bun.file(filePath).text();

const lines = file.split('\n').filter((line) => line.startsWith('src/data'));

const fileListCreated: string[] = [];
const updatedFileList: string[] = [];
const errorFileList: Array<{ error: any; key: string }> = [];

async function processLines() {
	for (const line of lines) {
		try {
			const [, , lang, folder, file] = line.split('/');
			const newLang = langMapping[lang];
			const newFolder = folderMapping[folder];

			if (folder === 'Domains.json' || folder === 'Domains') {
				const link = join(baseDir, 'genshin-data/', line);
				const newPath = join(baseDir, `data/${newLang}/${folder.split('.')[0]}.json`);
				const newData = await readJsonFile(link);
				if (!newData) {
					throw new Error(`Error reading file ${link}`);
				}
				await writeJsonFile(newPath, newData);
				continue;
			}

			const fileName = file.split('.')[0];
			let newFile = toPascalCase(fileName);
			if (newFolder === 'AchievementCategory') {
				newFile = replaceRomanNumeralsPascalCased(newFile);
			}

			const dvalinPath = join(baseDir, `data/${newLang}/${newFolder}/${newFile}.json`);
			const genshinDataPath = join(baseDir, 'genshin-data/', line);
			const fileContent = await handleFile(genshinDataPath, dvalinPath);
			await writeJsonFile(dvalinPath, fileContent);
			updatedFileList.push(dvalinPath);
		} catch (error) {
			errorFileList.push({ key: line, error: error });
		}
	}
}

const handleFile = async (genshinDataPath: string, currentDataPath: string) => {
	const genshinData = await readJsonFile(genshinDataPath);
	if (!genshinData) {
		throw new Error(`Error reading file ${genshinDataPath}`);
	}
	const currentData = await readJsonFile(currentDataPath);
	const savedVersion = currentData?.version;
	const processObject = (obj: any): any => {
		if (Array.isArray(obj)) {
			return obj.map((item) => processObject(item));
		} else if (typeof obj === 'object' && obj !== null) {
			const newObj: any = {};
			for (const [key, value] of Object.entries(obj)) {
				if (key !== '_id') {
					if (key.toLowerCase().includes('id') && typeof value === 'string') {
						if (genshinDataPath.includes('achievements')) {
							newObj[key] = replaceRomanNumeralsPascalCased(toPascalCase(value));
						} else {
							newObj[key] = toPascalCase(value);
						}
					} else {
						newObj[key] = processObject(value);
					}
					if (
						[
							'description',
							'name',
							'title',
							'desc',
							'inPlayDescription',
							'bonus'
						].includes(key)
					) {
						newObj[key] = stripHtml(value as string).result;
					}
				}
			}
			return newObj;
		}
		return obj;
	};

	const processedData = processObject(genshinData);

	processedData.version = savedVersion ?? version;
	return processedData;
};

await processLines();

console.log('Processing complete');
console.log('Files created:', fileListCreated.length);
console.log('Files updated:', updatedFileList.length);
console.log('Errors:', errorFileList.length);

const newContent =
	`==================================== UPDATE ${version}===============================================\n` +
	'CREATED : \n' +
	fileListCreated +
	'\n' +
	'UPDATED : \n' +
	updatedFileList +
	'\n' +
	'ERRORS : \n' +
	errorFileList +
	'\n\n';

await appendFile('./changed_files.txt', newContent, 'utf8');
