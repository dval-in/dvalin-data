const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");

const typesDirectory = path.join(__dirname, "/types");
const schemaDirectory = path.join(__dirname, "/schemas");

// Read all TypeScript files in the directory
fs.readdir(typesDirectory, (err, files) => {
	if (err) {
		console.error(`Error reading directory: ${err}`);
		return;
	}

	files.forEach((file) => {
		if (file.endsWith(".ts")) {
			// Extract the type name from the filename
			const typeName = path.basename(file, ".ts");

			// Construct the command
			const command = `typescript-json-schema --required ${typesDirectory}/${file} ${typeName}  --out ${schemaDirectory}/${typeName}.json`;

			// Execute the command
			exec(command, (err, stdout, stderr) => {
				if (err) {
					console.error(`Error processing ${typeName}: ${err}`);
					return;
				}
				console.log(`Generated schema for ${typeName}`);
				if (stdout) console.log(`stdout: ${stdout}`);
				if (stderr) console.error(`stderr: ${stderr}`);
			});
		}
	});
});
