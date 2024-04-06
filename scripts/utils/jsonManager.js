
import fs from 'fs';

/**
 * Reads and parses a JSON file.
 *
 * @param {string} filePath - The path to the JSON file.
 * @returns {Promise<Object>} A promise that resolves to the parsed JSON object.
 */
const openJsonFile = filePath => new Promise((resolve, reject) => {
	fs.readFile(filePath, 'utf8', (err, data) => {
		if (err) {
			reject(new Error('Error reading the JSON file: ' + err));
			return;
		}

		try {
			const json = JSON.parse(data);
			resolve(json);
		} catch (parseError) {
			reject(new Error('Error parsing JSON from file: ' + parseError));
		}
	});
});

/**
 * Writes a JavaScript object to a JSON file.
 *
 * @param {string} filePath - The path to the JSON file.
 * @param {Object} obj - The JavaScript object to write.
 * @returns {Promise<void>} A promise that resolves when the file has been written.
 */
const writeJsonFile = (filePath, obj) => new Promise((resolve, reject) => {
	const data = JSON.stringify(obj, null, 2);
	fs.writeFile(filePath, data, 'utf8', err => {
		if (err) {
			reject(new Error('Error writing the JSON to file: ' + err));
			return;
		}

		resolve();
	});
});

/**
 * Merges a given object into a JSON file.
 *
 * @param {string} filePath - The path to the JSON file.
 * @param {Object} obj - The JavaScript object to merge.
 * @returns {Promise<void>} A promise that resolves when the merge and write are complete.
 */
const mergeObjectIntoJson = async (filePath, obj) => {
	try {
		const currentData = await openJsonFile(filePath);
		const mergedResult = {...currentData, ...obj};
		await writeJsonFile(filePath, mergedResult);
		console.log('Merge successful. JSON file has been updated.');
	} catch (error) {
		console.error('Error during merge operation:', error);
	}
};

export {openJsonFile, writeJsonFile, mergeObjectIntoJson};
