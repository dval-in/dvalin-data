import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

const typesDirectory = path.join('./types');
const schemaDirectory = path.join('./schemas');

// Read all TypeScript files in the directory
fs.readdir(typesDirectory, (err, files) => {
	if (err) {
		console.error(`Error reading directory: ${err}`);
		return;
	}

	files.forEach((file) => {
		if (file.endsWith('.ts')) {
			// Extract the type name from the filename
			const typeName = path.basename(file, '.ts');

			// Construct the command
			const command = `typescript-json-schema --required "${typesDirectory}/${file}" ${typeName}  --out "${schemaDirectory}/${typeName}.json"`;

			// Execute the command
			exec(command, (err, stdout, stderr) => {
				if (err) {
					console.error(`Error processing ${typeName}: ${err}`);
					return;
				}

				console.log(`Generated schema for ${typeName}`);
				if (stdout) {
					console.log(`stdout: ${stdout}`);
				}

				if (stderr) {
					console.error(`stderr: ${stderr}`);
				}

				// Read the generated schema file
				const schemaPath = path.join(schemaDirectory, `${typeName}.json`);
				const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

				// Add the additionalProperties property
				schema.additionalProperties = false;

				// Write the updated schema back to the file
				fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
			});
		}
	});
});
