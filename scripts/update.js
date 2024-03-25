import fs from 'fs';
import path from 'path';

// Got to the ../genshin-data directory
process.chdir(__dirname + '/../genshin-data');
const gitCommitHash = 'a65abf9';
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

// Get the filed that were changed
const {execSync} = require('child_process');
const result = execSync(`git diff-tree --no-commit-id --name-only -r ${gitCommitHash}`).toString();

process.chdir(__dirname + '/../dvalin-data');

// Function to CamrelCase snake_case string (removing spaces, dashes and underscores as well a apostrophes)
const toCamelCase = str => str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
	if (Number(match) === 0) {
		return '';
	}

	return index === 0 ? match.toLowerCase() : match.toUpperCase();
});
const pascalCase = str => str.replace(/(?:^\w|[A-Z]|\b\w|\s+)/g, (match, index) => {
	if (Number(match) === 0) {
		return '';
	}

	return index === 0 ? match.toUpperCase() : match.toLowerCase();
});
// Function to pascalCase each field of a json file, remove the "_id" field and CamelCasing the value of the "id" field
const updateFile = obj => {
	const newObj = {};
	for (const key in obj) {
		if (key === '_id') {
			continue;
		}

		if (key === 'id') {
			newObj[pascalCase(key)] = toCamelCase(obj[key]);
		} else {
			newObj[toCamelCase(key)] = obj[key];
		}
	}

	return newObj;
};

// For each line of result : we read the file, parse it, pascalCase it, stringify it and write it in the correct folder
result.forEach(({folder, camelCaseFolder}) => {
	const data = fs.readFileSync(path.join(__dirname, `../genshin-data/src/data/${folder}/index.json`));
	const parsedData = JSON.parse(data);
	const pascalCasedData = parsedData.map(updateFile);
	const language = folderMapping[folder];
	fs.writeFileSync(path.join(__dirname, `../src/data/${language}/${camelCaseFolder}.json`), JSON.stringify(pascalCasedData, null, '\t'));
});
