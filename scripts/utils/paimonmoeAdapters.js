// Most of those function will only be used once or twice. They are here just to update some missing info from paimon.moe
import { toPascalCase } from './stringUtils.js';
import { openJsonFile } from './fileManager.js';
import { replaceRomanNumeralsPascalCased } from './stringUtils.js';
import { writeJsonFile } from './fileManager.js';
import { mergeDeep } from './fileManager.js';
import path from 'path';
import fs from 'fs/promises';

// Main function to merge Paimon data
const mergePaimonData = async () => {
	const paimonPath = './../paimon-moe/src/data/achievement/';
	const paimonAchievementFile = await openJsonFile(path.join(paimonPath, 'en.json'));
	const onlyVersion = getVersion(paimonAchievementFile); // Assuming getVersion is correctly implemented

	// Dynamically reading language directories
	const directories = await fs.readdir('./data/', { withFileTypes: true });
	const languageDirs = directories
		.filter((dirent) => dirent.isDirectory())
		.map((dirent) => dirent.name);
	console.log(directories);
	for (const lang of languageDirs) {
		const langPath = path.join('./data/', lang, '/AchievementCategory/');
		const categories = Object.keys(onlyVersion);

		for (const category of categories) {
			const versionAchievements = onlyVersion[category];
			const versionFile = category + '.json'; // Filename format based on category
			const filePath = path.join(langPath, versionFile);

			try {
				const langAchievements = await openJsonFile(filePath);
				for (const verAchievement of versionAchievements) {
					const index = langAchievements.achievements.findIndex(
						(a) => a.id === verAchievement.id
					);
					if (index !== -1) {
						langAchievements.achievements[index] = mergeDeep(
							langAchievements.achievements[index],
							verAchievement
						);
					} else {
						console.warn(
							`Achievement ID ${verAchievement.id} not found in ${lang} - ${versionFile}.`
						);
					}
				}

				await writeJsonFile(filePath, langAchievements);
			} catch (error) {
				console.error(`Failed to merge achievements for ${category} in ${lang}:`, error);
			}
		}
	}
};

/**
 * Transforms the given data structure into a new format, converting category names to PascalCase
 * and simplifying achievements to include only id and ver properties.
 *
 * @param {Object} data - The original data structure to transform.
 * @returns {Object} The transformed data structure.
 */
const getVersion = (data) => {
	const transformed = {};

	Object.keys(data).forEach((key) => {
		const category = data[key];
		const categoryNamePascalCase = toPascalCase(category.name);
		const fixedNumber = replaceRomanNumeralsPascalCased(categoryNamePascalCase);
		const achievementsFlat = category.achievements
			.flat(Infinity)
			.map(({ id, ver }) => ({ id, version: ver }));

		transformed[fixedNumber] = achievementsFlat;
	});

	return transformed;
};

mergePaimonData();
