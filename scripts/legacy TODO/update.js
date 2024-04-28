const fs = require('fs');
const path = require('path');

// Got to the ../genshin-data directory
process.chdir(__dirname + '/../../genshin-data');
const gitCommitHash = 'a65abf9fde838e06af96da72d86393b5f8efd85f';
const version = '4.5';
const folderMapping = {
	'chinese-simplified': 'ZH-S',
	'chinese-traditional': 'ZH-T',
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
	italian: 'IT',
};

// Get the filed that were changed
const {execSync} = require('child_process');
const result = execSync(`git diff-tree --no-commit-id --name-only -r ${gitCommitHash}`).toString();
// Remove all line that doesn't start with src/data
const resultArray = result.split('\n').filter(line => line.startsWith('src/data'));

// - camelCase
const toCamelCase = str => {
	if (typeof str !== 'string') {
		str = String(str);
	}

	return str
		.replace(/_/g, ' ') // Replace underscores with spaces
		.toLowerCase()
		.replace(/(?:^\w|[A-Z]|\b\w)/g, (match, index) => index === 0 ? match.toLowerCase() : match.toUpperCase())
		.replace(/\s+/g, '');
};

// PascalCase
const pascalCase = str => {
	if (typeof str !== 'string') {
		str = String(str);
	}

	return str.replace(/_/g, ' ') // Replace underscores with spaces
		.replace(/[_-]/g, ' ') // Replace underscores and dashes with spaces
		.replace(/'/g, '') // Remove apostrophes
		.split(' ') // Split into words
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter of each word
		.join(''); // Join without spaces
};

const checkForExistingFile = path => fs.existsSync(path);

const specialDish = {
	Chiori: 'FashionShow',
	Xianyun: 'EncompassingGladness',
	Gaming: 'YummyYumCha',
	Chevreuse: 'TheKindThatDoesntNeedToBeDealtWith',
	Navia: '“pickWhatYouLike!”',
	Charlotte: 'ExclusiveScoop:GourmetColumn',
	Furina: '“pourLaJustice”',
	Wriothesley: 'SecretSauceBbqRibs',
	Neuvillette: '"consommePurete"',
	Freminet: 'SeabirdsSojourn',
	Lyney: 'CubicTricks',
	Lynette: 'ALeisurelySip',
	Kirara: 'EnergizingBento',
	Kaveh: 'TheEndeavor',
	Baizhu: 'HeatQuellingSoup',
	Mika: 'SurveyorsBreakfastSandwich',
	Dehya: 'GoldflameTajine',
	Alhaitham: 'IdealCircumstance',
	Yaoyao: 'QingceHouseholdDish',
	Wanderer: 'ShimiChazuke',
	Faruzan: 'TraditionallyMadeCharcoalBakedAjilenakhCake',
	Layla: 'ExtravagantSlumber',
	Nahida: 'Halvamazd',
	Cyno: 'DuelSoul',
	Nilou: 'SwirlingSteps',
	Candace: 'UtmostCare',
	Tighnari: 'ForestWatchersChoice',
	Collei: 'Yearning',
	Dori: 'ShowMeTheMora',
	Heizou: 'TheOnlyTruth',
	Shinobu: 'OmuriceWaltz',
	Yelan: 'DewDippedShrimp',
	Ayato: 'QuietElegance',
	YaeMiko: 'FukuuchiUdon',
	YunJin: 'CloudShroudedJade',
	Shenhe: 'HeartstringNoodles',
	Itto: 'WayOfTheStrong',
	Gorou: 'VictoriousLegend',
	Thoma: '"warmth"',
	Aloy: 'SatietyGel',
	Kokomi: 'AStunningStratagem',
	Sara: 'FaithEternal',
	Sayu: 'DizzinessBeGoneNoJutsuVersion2.0',
	Yoimiya: 'SummerFestivalFish',
	Kazuha: 'AllWeatherBeauty',
	Ayaka: 'SnowOnTheHearth',
	Yanfei: '“myWay”',
	Rosaria: 'DinnerOfJudgement',
	Ganyu: 'ProsperousPeace',
	HuTao: 'GhostlyMarch',
	Xiao: '“sweetDream”',
	Albedo: 'WoodlandDream',
	Tartaglia: 'APrizeCatch',
	Zhongli: 'SlowCookedBambooShootSoup',
	Xinyan: 'RockinRiffinChicken!',
	Razor: 'PuppyPawHashBrown',
	Noelle: 'LighterThanAirPancake',
	Lisa: 'MysteriousBolognese',
	Barbara: 'SpicyStew',
	Jean: 'InvigoratingPizza',
	Venti: 'ABuoyantBreeze',
	Klee: 'FishFlavoredToast',
	Bennett: 'TeyvatCharredEgg',
	Chongyun: 'ColdNoodlesWithMountainDelicacies',
	Ningguang: 'QiankunMoraMeat',
	Qiqi: 'NoTomorrow',
	Diluc: 'OnceUponATimeInMondstadt',
	Amber: 'OutridersChampionSteak!',
	Mona: 'DerWeisheitLetzterSchluss(life)',
	Fischl: 'DieHeiligeSinfonie',
	Beidou: 'FlashFriedFilet',
	Sucrose: 'NutritiousMeal(v.593)',
	Kaeya: 'FruitySkewers',
	Keqing: 'SurvivalGrilledFish',
	Diona: 'DefinitelyNotBarFood!',
	Xiangling: 'WanminRestaurantsBoiledFish',
	Xingqiu: 'AllDelicacyParcels',
	Eula: 'StormcrestPie',
};

// Function to pascalCase each field of a json file, remove the "_id" field and CamelCasing the value of the "id" field
const updateFile = (obj, folder) => {
	const transformObject = obj => {
		const newObj = {};
		Object.keys(obj).forEach(key => {
			if (key === '_id') {
				return;
			}

			const newKey = toCamelCase(key);
			if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
				newObj[newKey] = transformObject(obj[key]);
			} else if (Array.isArray(obj[key]) && key === 'birthday' && obj[key].length === 2) {
				newObj[newKey] = `${obj[key][0]}/${obj[key][1]}`;
			} else if (Array.isArray(obj[key])) {
				newObj[newKey] = obj[key].map(item => typeof item === 'object' && item !== null ? transformObject(item) : item);
			} else {
				newObj[newKey] = key === 'id' ? pascalCase(obj[key]) : obj[key];
			}
		});
		return newObj;
	};

	const updatedObj = transformObject(obj);
	if (folder && !checkForExistingFile(`/data/EN/${folder}/${updatedObj.id}.json`)) {
		updatedObj.version = version;
	}

	if (folder && folder === 'Character') {
		const objectAddition = {
			pictures: {
				icon: `Character/${updatedObj.id}/Icon.webp`,
				sideIcon: `Character/${updatedObj.id}/SideIcon.webp`,
				gatchaCard: `Character/${updatedObj.id}/GachaCard.webp`,
				gachaSplash: `Character/${updatedObj.id}/GachaSplash.webp`,
				face: `Character/${updatedObj.id}/Face.webp`,
				halfFace: `Character/${updatedObj.id}/HalfFace.webp`,
				profile: `Character/${updatedObj.id}/Profile.webp`,
				weaponStance: `Character/${updatedObj.id}/WeaponStance.webp`,
			},
			signatureArtifactSet: '',
			signatureWeapon: '',
			specialDish: specialDish[updatedObj.id],
			tcgCharacterCard: existInTCG(updatedObj.id) ? updatedObj.id : '',
			outfits: [
			]};
		Object.assign(updatedObj, objectAddition);
	}

	return updatedObj;
};

const existInTCG = charName => {
	const path = `/data/EN/TCGCharacterCard/${charName}.json`;
	return checkForExistingFile(path);
};

const removeTrailingS = str => str.replace(/s$/, '');
const appendDataToFile = (filename, newData) => {
	try {
		const filePath = path.resolve(__dirname, filename);
		const data = fs.readFileSync(filePath, 'utf8');
		const json = JSON.parse(data);
		Object.assign(json, newData);
		console.log(json);
		fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
		console.log('The file has been updated successfully.');
	} catch (err) {
		console.error('An error occurred:', err);
	}
};

// For each line of result : we read the file, parse it, pascalCase it, stringify it and write it in the correct folder
resultArray.forEach(filePath => {
	const fullPath = path.join(__dirname, `../../genshin-data/${filePath}`);
	// Console.log('On : ', fullPath);
	const langFolder = filePath.split('/')[2];
	let dataFolder = filePath.split('/')[3];
	if (!checkForExistingFile(fullPath) || dataFolder === 'domains.json') {
		return; // Skip this iteration if the file does not exist
	}

	const fileName = filePath.split('/')[4]?.replace('.json', '');

	const data = fs.readFileSync(fullPath);
	const parsedData = JSON.parse(data);

	const language = folderMapping[langFolder];

	// Ensure the destination directory exists
	dataFolder = pascalCase(dataFolder);
	if (dataFolder.startsWith('Tcg')) {
		dataFolder = dataFolder.slice(3);
		dataFolder = removeTrailingS(dataFolder);
		dataFolder = 'TCG' + dataFolder + 'Card';
	}

	if (dataFolder === 'Achievements') {
		dataFolder = 'AchievementCategory';
	}

	dataFolder = removeTrailingS(dataFolder);

	const pascalCasedData = updateFile(parsedData, dataFolder);
	const destDir = path.join(__dirname, `../data/${language}/${dataFolder}`);

	if (language === 'EN' && (dataFolder === 'Character' || dataFolder === 'Weapon')) {
		const dataForIndex = {
			[pascalCasedData.id]: {
				name: pascalCasedData.name,
				rarity: pascalCasedData.rarity,
			},
		};
		appendDataToFile(`../data/EN/${dataFolder}/index.json`, dataForIndex);
	}

	if (!checkForExistingFile(destDir)) {
		fs.mkdirSync(destDir, {recursive: true});
	}

	fs.writeFileSync(path.join(destDir, `${pascalCase(fileName)}.json`), JSON.stringify(pascalCasedData, null, '\t'));
});

