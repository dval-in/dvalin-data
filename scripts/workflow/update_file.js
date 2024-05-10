import fs from 'fs';
import path from 'path';
import { toPascalCase, replaceRomanNumeralsPascalCased } from '../utils/stringUtils.js';
import {deepMergeObjectIntoJson, mergeDeep, openJsonFile, writeJsonFile} from '../utils/fileManager.js';
const baseDir = path.resolve('./');

// Construct the full path
const filePath = path.join(baseDir, 'genshin-data/changed_files.txt');
const file = fs.readFileSync(filePath, 'utf8');

// filter all the lines not starting with src/data
const lines = file.split('\n').filter(line => line.startsWith('src/data'));

const folderMapping = {
	'chinese-simplified': 'ZH-S',
	'chinese-traditional': 'ZH-T',
	english: 'EN',
	french: 'FR',
	german: 'DE',
	indonesian: 'ID',
	japanese: 'JP',
	korean: 'KO',
	portuguese: 'PT',
	russian: 'RU',
	spanish: 'ES',
	thai: 'TH',
	vietnamese: 'VI',
	turkish: 'TR',
	italian: 'IT',
};

for(let line of lines) {
    const lang = line.split('/')[2];
    const folder = line.split('/')[3];
    if (folder === 'domains.json' || folder === 'domains') {
        continue;
    }
    const file = line.split('/')[4].split('.')[0];
    const newLang = folderMapping[lang];
    const newFolder = toPascalCase(folder);
    let newFile = toPascalCase(file);
    if (newFolder === 'Achievements') {
        newFile = replaceRomanNumeralsPascalCased(newFile);
    }
    const newPath = `data/${newLang}/${newFolder}/${newFile}.json`
    // we try to open the json file and if it doesn't exist we create it
    try {
        const currentData = await openJsonFile(newPath);
        const object = await openJsonFile(line);
        const mergedResult = mergeDeep(newPath, object);
        await writeJsonFile(newPath, mergedResult);
        console.log(currentData)
    } catch (error) {
        console.warn('Creating a file for ', newPath);
        const object = await openJsonFile(line);
        await writeJsonFile(newPath, object);
    }
    console.log(newPath)
}
    