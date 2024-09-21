import { join, resolve } from 'path';
import { readJsonFile, writeJsonFile } from '../utils/fileUtils';
import { toPascalCase, replaceRomanNumeralsPascalCased } from '../utils/stringUtils';
import { langMapping, folderMapping } from '../utils/mappings';

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
const errorFileList: Array<{ error: any; key: string; obj: any }> = [];

async function processLines() {
	for (const line of lines) {
		const [, , lang, folder, file] = line.split('/');
		const newLang = langMapping[lang];
		const newFolder = folderMapping[folder];

		if (folder === 'domains.json' || folder === 'domains') {
			const link = join(baseDir, 'genshin-data/', line);
			const newPath = join(baseDir, `data/${newLang}/${folder.split('.')[0]}.json`);
			const newData = await readJsonFile(link);
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
		const fileContent = await handleFile(genshinDataPath);
		await writeJsonFile(dvalinPath, fileContent);
		updatedFileList.push(dvalinPath);
	}
}

const handleFile = async (genshinDataPath: string) => {
	const genshinData = await readJsonFile(genshinDataPath);

	const processObject = (obj: any): any => {
		if (Array.isArray(obj)) {
			return obj.map((item) => processObject(item));
		} else if (typeof obj === 'object' && obj !== null) {
			const newObj: any = {};
			for (const [key, value] of Object.entries(obj)) {
				if (key !== '_id') {
					if (key.toLowerCase().includes('id') && typeof value === 'string') {
						newObj[key] = toPascalCase(value);
					} else {
						newObj[key] = processObject(value);
					}
				}
			}
			return newObj;
		}
		return obj;
	};

	const processedData = processObject(genshinData);

	// Add version to root
	processedData.version = version;

	// Handle achievements
	if (processedData.achievements && Array.isArray(processedData.achievements)) {
		processedData.achievements = processedData.achievements.map((achievement: any) => ({
			...achievement,
			version: version
		}));
	}

	return processedData;
};

await processLines();

console.log('Processing complete');
console.log('Files created:', fileListCreated.length);
console.log('Files updated:', updatedFileList.length);
console.log('Errors:', errorFileList.length);

if (errorFileList.length > 0) {
	console.error('Errors occurred during processing:');
	console.error(JSON.stringify(errorFileList, null, 2));
}
