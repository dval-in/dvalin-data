import fs from 'fs';
import path from 'path';
import {
	toPascalCase,
	replaceRomanNumeralsPascalCased,
	toCamelCase
} from '../utils/stringUtils.js';
import { openJsonFile, writeJsonFile, merge } from '../utils/fileManager.js';
import { stripHtml } from 'string-strip-html';
const baseDir = path.resolve('./');
let version = process.argv[2];

if (!version) {
	console.error('No version provided');
	console.error('Using fallback version: 0.0');
	version = '0.0';
}

// Your existing script logic here
console.log(`Processing version: ${version}`);

// Construct the full path
const filePath = path.join(baseDir, 'genshin-data/changed_files.txt');
const file = fs.readFileSync(filePath, 'utf8');

// Filter all the lines not starting with src/data
const lines = file.split('\n').filter((line) => line.startsWith('src/data'));

const fileListCreated = [];
const updatedFileList = [];
const errorFileList = [];

const handleMergeOperation = async (newPath, link) => {
	let mergedResult;
	let object;
	try {
		const currentData = await openJsonFile(newPath);
		object = await openJsonFile(link);
		try {
			mergedResult = merge(currentData, object);
		} catch (error) {
			console.error(`Error during merge operation of ${newPath}:`, error);
		}

		updatedFileList.push(newPath);
	} catch (error) {
		object = await openJsonFile(link);
		mergedResult = object;
		fileListCreated.push(newPath);
	} finally {
		mergedResult = transformObject(mergedResult, version);
		await writeJsonFile(newPath, mergedResult);
	}
};

const transformObject = (obj, version) => {
	const result = { ...obj };

	// Remove _id field

	const traverseObject = (obj) => {
		const keysToDelete = [];

		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
				if (key === '_id') {
					// Assuming result is defined somewhere outside this function
					delete obj._id;
					continue;
				}

				if (key === 'id' && typeof obj[key] === 'string') {
					if (obj.hasOwnProperty('achievements')) {
						obj[key] = replaceRomanNumeralsPascalCased(toPascalCase(obj[key]));
					} else {
						obj[key] = toPascalCase(obj[key]);
					}
				} else if (key === 'ids' && Array.isArray(obj[key])) {
					for (let i = 0; i < obj[key].length; i++) {
						obj[key][i] = toPascalCase(obj[key][i]);
					}

					// Remove duplicates
					obj[key] = [...new Set(obj[key])];
				} else if (
					typeof key === 'string' &&
					['description', 'name', 'title', 'desc', 'inPlayDescription', 'bonus'].includes(
						key
					)
				) {
					try {
						obj[key] = stripHtml(obj[key]).result;
					} catch (error) {
						errorFileList.push({ error, key, obj });
					}
				} else if (typeof obj[key] === 'object' && obj[key] !== null) {
					traverseObject(obj[key]);
				}

				const camelCasedKey = toCamelCase(key);
				obj[camelCasedKey] = obj[key];
				if (key !== camelCasedKey) {
					keysToDelete.push(key);
				}
			}
		}

		for (const key of keysToDelete) {
			delete obj[key];
		}
	};

	traverseObject(result);

	// Load the array result.achievements. For each achievement if version doesn't exist add it
	if (result.achievements) {
		result.achievements = result.achievements.map((achievement) => {
			achievement.version ||= version;
			return achievement;
		});
	} else {
		result.version ||= version;
	}

	// Transform birthday field
	result.birthday &&= result.birthday[0] + '/' + result.birthday[1];

	return result;
};

const langMapping = {
	'chinese-simplified': 'ZHS',
	'chinese-traditional': 'ZHT',
	english: 'EN',
	french: 'FR',
	german: 'DE',
	indonesian: 'ID',
	japanese: 'JP',
	korean: 'KO',
	portuguese: 'PT',
	russian: 'RU',
	spanish: 'ES',
	thai: 'TH',
	vietnamese: 'VI',
	turkish: 'TR',
	italian: 'IT'
};

const folderMapping = {
	achievements: 'AchievementCategory',
	artifacts: 'Artifact',
	bait: 'Bait',
	characters: 'Character',
	character_exp_material: 'CharacterExpMaterial',
	common_materials: 'CommonMaterial',
	elemental_stone_materials: 'ElementalStoneMaterial',
	fish: 'Fish',
	fishing_rod: 'FishingRod',
	food: 'Food',
	furnishing: 'Furnishing',
	ingredients: 'Ingredient',
	jewels_materials: 'JewelMaterial',
	local_materials: 'LocalMaterial',
	potions: 'Potion',
	talent_lvl_up_materials: 'TalentLvlUpMaterial',
	tcg_action: 'TCGActionCard',
	tcg_characters: 'TCGCharacterCard',
	tcg_monsters: 'TCGMonsterCard',
	weapons: 'Weapon',
	weapon_enhancement_material: 'WeaponEnhancementMaterial',
	weapon_primary_materials: 'WeaponPrimaryMaterial',
	weapon_secondary_materials: 'WeaponSecondaryMaterial'
};

for (const line of lines) {
	const lang = line.split('/')[2];
	const newLang = langMapping[lang];
	const folder = line.split('/')[3];
	const newFolder = folderMapping[folder];

	if (folder === 'domains.json' || folder === 'domains') {
		const link = path.join(baseDir, 'genshin-data/', line);
		const newPath = path.join(baseDir, `data/${newLang}/${folder.split('.')[0]}.json`);
		await handleMergeOperation(newPath, link);
		continue;
	}

	const file = line.split('/')[4].split('.')[0];

	let newFile = toPascalCase(file);
	if (newFolder === 'AchievementCategory') {
		newFile = replaceRomanNumeralsPascalCased(newFile);
	}

	const newPath = path.join(baseDir, `data/${newLang}/${newFolder}/${newFile}.json`);
	// We try to open the json file and if it doesn't exist we create it
	const link = path.join(baseDir, 'genshin-data/', line);
	await handleMergeOperation(newPath, link);
}
