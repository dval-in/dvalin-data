import { join, resolve } from 'path';
import { readJsonFile, writeJsonFile } from '../utils/fileUtils';
import { transformObject } from '../utils/transformUtils';
import { merge } from '../utils/mergeUtils';
import { toPascalCase, replaceRomanNumeralsPascalCased } from '../utils/stringUtils';
import { langMapping, folderMapping } from '../utils/mappings';

const baseDir = resolve('./');
const version = Bun.argv[2] || '0.0';

if (version === '0.0') {
	console.warn('No version provided. Using fallback version: 0.0');
}

console.log(`Processing version: ${version}`);

const filePath = join(baseDir, 'genshin-data/changed_files.txt');
const file = await Bun.file(filePath).text();

const lines = file.split('\n').filter((line) => line.startsWith('src/data'));

const fileListCreated: string[] = [];
const updatedFileList: string[] = [];
const errorFileList: Array<{ error: any; key: string; obj: any }> = [];

async function handleMergeOperation(newPath: string, link: string) {
	try {
		const currentData = await readJsonFile(newPath);
		const object = await readJsonFile(link);
		const mergedResult = merge(currentData, object);
		updatedFileList.push(newPath);
		return transformObject(mergedResult, version);
	} catch (error) {
		if (error.message.includes('Error reading')) {
			const object = await readJsonFile(link);
			fileListCreated.push(newPath);
			return transformObject(object, version);
		}
		throw error;
	}
}

async function processLines() {
	for (const line of lines) {
		const [, , lang, folder, file] = line.split('/');
		const newLang = langMapping[lang];
		const newFolder = folderMapping[folder];

		if (folder === 'domains.json' || folder === 'domains') {
			const link = join(baseDir, 'genshin-data/', line);
			const newPath = join(baseDir, `data/${newLang}/${folder.split('.')[0]}.json`);
			const mergedResult = await handleMergeOperation(newPath, link);
			await writeJsonFile(newPath, mergedResult);
			continue;
		}

		const fileName = file.split('.')[0];
		let newFile = toPascalCase(fileName);
		if (newFolder === 'AchievementCategory') {
			newFile = replaceRomanNumeralsPascalCased(newFile);
		}

		const newPath = join(baseDir, `data/${newLang}/${newFolder}/${newFile}.json`);
		const link = join(baseDir, 'genshin-data/', line);
		const mergedResult = await handleMergeOperation(newPath, link);
		await writeJsonFile(newPath, mergedResult);
	}
}

await processLines();

console.log('Processing complete');
console.log('Files created:', fileListCreated.length);
console.log('Files updated:', updatedFileList.length);
console.log('Errors:', errorFileList.length);

if (errorFileList.length > 0) {
	console.error('Errors occurred during processing:');
	console.error(JSON.stringify(errorFileList, null, 2));
}
