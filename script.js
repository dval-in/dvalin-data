const fs = require('fs');
const path = require('path');

function removeFieldsFromJson(filePath, fieldsToRemove) {
	fs.readFile(filePath, 'utf8', (err, data) => {
		if (err) {
			console.error(`Error reading file ${filePath}:`, err);
			return;
		}

		let jsonData;
		try {
			jsonData = JSON.parse(data);
		} catch (parseErr) {
			console.error(`Error parsing JSON from file ${filePath}:`, parseErr);
			return;
		}

		fieldsToRemove.forEach(field => {
			delete jsonData[field];
		});

		fs.writeFile(filePath, JSON.stringify(jsonData, null, 4), 'utf8', writeErr => {
			if (writeErr) {
				console.error(`Error writing file ${filePath}:`, writeErr);
				return;
			}

			console.log(`Updated file: ${filePath}`);
		});
	});
}

function findAndUpdateJsonFiles(rootDir, fileName, fieldsToRemove) {
	fs.readdir(rootDir, {withFileTypes: true}, (err, files) => {
		if (err) {
			console.error(`Error reading directory ${rootDir}:`, err);
			return;
		}

		files.forEach(file => {
			const resolvedPath = path.resolve(rootDir, file.name);
			if (file.isDirectory()) {
				findAndUpdateJsonFiles(resolvedPath, fileName, fieldsToRemove);
			} else if (file.isFile() && file.name === fileName) {
				removeFieldsFromJson(resolvedPath, fieldsToRemove);
			}
		});
	});
}

// Example usage
const rootDirectory = './data'; // Replace with your directory path
const jsonFileName = 'Aloy.json'; // The name of the JSON file to search for
const fieldsToRemove = ['artifacts', 'weapons']; // Fields to remove from the JSON file

findAndUpdateJsonFiles(rootDirectory, jsonFileName, fieldsToRemove);
