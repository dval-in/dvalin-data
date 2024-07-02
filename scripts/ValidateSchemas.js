const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const schemaDirectory = path.join(__dirname, '../schemas');
const dataDirectory = path.join(__dirname, '../data');

/*
const snakeToPascal = (string) =>
	string
		.split('/')
		.map((snake) =>
			snake
				.split('_')
				.map((substr) => substr.charAt(0).toUpperCase() + substr.slice(1))
				.join('')
		)
		.join('/');
 */

fs.readdir(dataDirectory, (err, langDirectory) => {
	if (err) {
		console.error(`Error reading directory: ${err}`);
		return;
	}

	langDirectory.forEach((lang) => {
		fs.readdir(path.join(dataDirectory, lang), (err, files) => {
			if (err) {
				console.error(`Error reading directory: ${err}`);
				return;
			}

			files.forEach((typeName) => {
				const typePath = path.join(dataDirectory, lang, typeName);
				if (fs.lstatSync(typePath).isDirectory()) {
					// Read all files of the same schema
					fs.readdir(typePath, (err, jsonFiles) => {
						if (err) {
							console.error(`Error reading directory: ${err}`);
							return;
						}

						const schemaPath = path.join(schemaDirectory, typeName + '.json');
						if (!fs.existsSync(schemaPath)) {
							console.log('Error missing schema ' + typeName);
						} else {
							// Valid json for each file
							jsonFiles.forEach((jsonFileName) => {
								const command = `ajv validate -s ${schemaPath} -d ${path.join(typePath, jsonFileName)}`;
								console.log(
									`Validating ${lang}/${typeName}/${jsonFileName} with schema ${typeName}`
								);
								execSync(command, (err, stdout, stderr) => {
									if (err) {
										console.error(`Error validating ${jsonFileName}: ${err}`);
										return;
									}

									if (stdout) {
										console.log(`stdout: ${stdout}`);
									}

									if (stderr) {
										console.error(`stderr: ${stderr}`);
									}
								});
							});
						}
					});
				} else {
				}
			});
		});
	});
});
