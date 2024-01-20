const fs = require('fs');
const path = require('path');

const dataDirPath = './data';

function snakeToCamel(str) {
	return str.replace(/([-_][a-z])/g, group => group.toUpperCase().replace('-', '').replace('_', ''));
}

function processJsonFile(filePath) {
	const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

	const newData = {};
	for (const key in data) {
		if (data.hasOwnProperty(key)) {
			const newKey = snakeToCamel(key);
			newData[newKey] = data[key];
			if (newKey === 'birthday') {
				newData[newKey] = `${data[key][0]}/${data[key][1]}`;
			}
		}
	}

	fs.writeFileSync(filePath, JSON.stringify(newData, null, 2));
}

fs.readdirSync(dataDirPath).forEach(langFolder => {
	const characterDirPath = path.join(dataDirPath, langFolder, 'Character');
	if (fs.existsSync(characterDirPath)) {
		fs.readdirSync(characterDirPath).forEach(file => {
			if (file.endsWith('.json')) {
				processJsonFile(path.join(characterDirPath, file));
			}
		});
	}
});

console.log('JSON files have been updated.');
