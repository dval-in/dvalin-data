const fs = require('fs');
const path = require('path');

const dataDirPath = './data';
const regex = /"_id":\s*\d+,/g;

function processFile(filePath) {
	const data = fs.readFileSync(filePath, 'utf8');
	const modifiedData = data.replace(regex, '');

	fs.writeFileSync(filePath, modifiedData);
}

function traverseDirectory(directory) {
	fs.readdirSync(directory, {withFileTypes: true}).forEach(entry => {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			traverseDirectory(entryPath);
		} else if (entry.isFile() && entry.name.endsWith('.json')) {
			processFile(entryPath);
		}
	});
}

traverseDirectory(dataDirPath);

console.log('Files have been processed.');
