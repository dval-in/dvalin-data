import { JsonObject } from './types';

export async function readJsonFile(filePath: string): Promise<JsonObject> {
	try {
		const file = Bun.file(filePath);
		return await file.json();
	} catch (error) {
		throw new Error(`Error reading or parsing JSON file ${filePath}: ${error}`);
	}
}

export async function writeJsonFile(filePath: string, obj: JsonObject): Promise<void> {
	try {
		const data = JSON.stringify(obj, null, 2);
		await Bun.write(filePath, data);
	} catch (error) {
		throw new Error(`Error writing JSON to file ${filePath}: ${error}`);
	}
}
