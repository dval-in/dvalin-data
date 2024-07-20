import { JsonObject } from '.';
import { toPascalCase, replaceRomanNumeralsPascalCased, toCamelCase } from './stringUtils';
import { stripHtml } from 'string-strip-html';

export function transformObject(obj: JsonObject, version: string): JsonObject {
	const result = { ...obj };

	function traverseObject(obj: JsonObject) {
		const keysToDelete: string[] = [];

		for (const [key, value] of Object.entries(obj)) {
			if (key === '_id') {
				delete obj._id;
				continue;
			}

			if (key === 'id' && typeof value === 'string') {
				obj[key] = obj.hasOwnProperty('achievements')
					? replaceRomanNumeralsPascalCased(toPascalCase(value))
					: toPascalCase(value);
			} else if (key === 'ids' && Array.isArray(value)) {
				obj[key] = [...new Set(value.map(toPascalCase))];
			} else if (
				typeof key === 'string' &&
				['description', 'name', 'title', 'desc', 'inPlayDescription', 'bonus'].includes(key)
			) {
				try {
					obj[key] = stripHtml(value as string).result;
				} catch (error) {
					console.error(`Error stripping HTML from ${key}:`, error);
				}
			} else if (typeof value === 'object' && value !== null) {
				traverseObject(value as JsonObject);
			}

			const camelCasedKey = toCamelCase(key);
			obj[camelCasedKey] = obj[key];
			if (key !== camelCasedKey) {
				keysToDelete.push(key);
			}
		}

		keysToDelete.forEach((key) => delete obj[key]);
	}

	traverseObject(result);

	if (result.achievements) {
		result.achievements = result.achievements.map((achievement: JsonObject) => ({
			...achievement,
			version: achievement.version || version
		}));
	} else {
		result.version = result.version || version;
	}

	if (result.birthday && Array.isArray(result.birthday)) {
		result.birthday = `${result.birthday[0]}/${result.birthday[1]}`;
	}

	return result;
}
