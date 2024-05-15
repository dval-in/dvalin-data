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
	} catch (error) {
		console.error(`Error during merge operation of ${filePath}:`, error);
	}
};

const merge = (target, source) => {
	for (const key of Object.keys(source)) {
		if (source[key] instanceof Object && !Array.isArray(source[key])) {
			target[key] ||= {};

			merge(target[key], source[key]);
		} else if (Array.isArray(source[key])) {
			target[key] ||= [];

			source[key].forEach(sourceElement => {
				if (sourceElement instanceof Object && 'id' in sourceElement) {
					const targetElementIndex = target[key].findIndex(targetElement => targetElement.id === sourceElement.id);
					// eslint-disable-next-line no-negated-condition
					if (targetElementIndex !== -1) {
						merge(target[key][targetElementIndex], sourceElement);
					} else {
						target[key].push(sourceElement);
					}
				} else if (sourceElement instanceof Object && 'domainName' in sourceElement) {
					const targetElementIndex = target[key].findIndex(targetElement => targetElement.domainName === sourceElement.domainName);
					// eslint-disable-next-line no-negated-condition
					if (targetElementIndex !== -1) {
						merge(target[key][targetElementIndex], sourceElement);
					} else {
						target[key].push(sourceElement);
					}
				} else if (sourceElement instanceof Object && 'day' in sourceElement) {
					const targetElementIndex = target[key].findIndex(targetElement => targetElement.day === sourceElement.day);
					// eslint-disable-next-line no-negated-condition
					if (targetElementIndex !== -1) {
						merge(target[key][targetElementIndex], sourceElement);
					} else {
						target[key].push(sourceElement);
					}
				} else if (Array.isArray(target[key])) {
					target[key].push(sourceElement);
				} else {
					target[key] = source[key];
				}
			});
		} else {
			target[key] = source[key];
		}
	}

	return target;
};

/**
   * Merges a given object into a JSON file, performing a deep merge. This means
   * that nested properties are also merged, rather than being overwritten.
   * If the same key exists at any level, the value from the given object will
   * be deeply merged into the value from the JSON file.
   *
   * @param {string} filePath - The path to the JSON file.
   * @param {Object} obj - The JavaScript object to merge. This operation performs
   *                       a deep merge, preserving nested structures.
   * @returns {Promise<void>} A promise that resolves when the merge and write operations
   *                          are complete. If an error occurs, it is logged to the console.
   */
const deepMergeObjectIntoJson = async (filePath, obj) => {
	try {
		const currentData = await openJsonFile(filePath);
		const mergedResult = merge(currentData, obj);
		await writeJsonFile(filePath, mergedResult);
	} catch (error) {
		console.error('Error during merge operation:', error);
	}
};

export {
	openJsonFile, writeJsonFile, mergeObjectIntoJson, deepMergeObjectIntoJson, merge,
};
