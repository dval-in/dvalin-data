import { JsonObject, MergeableObject } from './types';
import { readJsonFile, writeJsonFile } from './fileUtils';

export function merge(target: JsonObject, source: JsonObject): JsonObject {
	for (const key of Object.keys(source)) {
		if (source[key] instanceof Object && !Array.isArray(source[key])) {
			target[key] = target[key] || {};
			merge(target[key], source[key]);
		} else if (Array.isArray(source[key])) {
			target[key] = target[key] || [];
			mergeArrays(target[key], source[key]);
		} else {
			target[key] = source[key];
		}
	}
	return target;
}

function mergeArrays(targetArray: any[], sourceArray: any[]): void {
	sourceArray.forEach((sourceElement) => {
		if (sourceElement instanceof Object) {
			const mergeableElement = sourceElement as MergeableObject;
			const identifierKey = getIdentifierKey(mergeableElement);
			if (identifierKey) {
				const targetElementIndex = targetArray.findIndex(
					(targetElement: MergeableObject) =>
						targetElement[identifierKey] === mergeableElement[identifierKey]
				);
				if (targetElementIndex !== -1) {
					merge(targetArray[targetElementIndex], mergeableElement);
				} else {
					targetArray.push(mergeableElement);
				}
			} else {
				targetArray.push(sourceElement);
			}
		} else {
			targetArray.push(sourceElement);
		}
	});
}

function getIdentifierKey(obj: MergeableObject): string | null {
	if ('id' in obj) return 'id';
	if ('domainName' in obj) return 'domainName';
	if ('day' in obj) return 'day';
	return null;
}

export async function mergeObjectIntoJson(filePath: string, obj: JsonObject): Promise<void> {
	try {
		const currentData = await readJsonFile(filePath);
		const mergedResult = merge(currentData, obj);
		await writeJsonFile(filePath, mergedResult);
	} catch (error) {
		console.error(`Error during merge operation of ${filePath}:`, error);
	}
}
