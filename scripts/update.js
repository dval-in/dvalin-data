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

const pascalCase = str => {
	if (typeof str !== 'string') {
		str = String(str);
	}

	return str.replace(/_/g, ' ') // Replace underscores with spaces
		.split(' ') // Split into words
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter of each word
		.join(''); // Join without spaces
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
	updatedObj.version = version;
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
			specialDish: '',
			tcgCharacterCard: existInTCG(updatedObj.id) ? updatedObj.id : '',
			outfits: [
			]};
		Object.assign(updatedObj, objectAddition);
	}

	return updatedObj;
};

const existInTCG = charName => {
	const path = `/data/EN/TCGCharacterCard/${charName}.json`;
	return fs.existsSync(path);
};

const removeTrailingS = str => str.replace(/s$/, '');

// For each line of result : we read the file, parse it, pascalCase it, stringify it and write it in the correct folder
resultArray.forEach(filePath => {
	const fullPath = path.join(__dirname, `../../genshin-data/${filePath}`);
	console.log('On : ', fullPath);
	const langFolder = filePath.split('/')[2];
	let dataFolder = filePath.split('/')[3];
	if (!fs.existsSync(fullPath) || dataFolder === 'domains.json') {
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
		console.log(dataFolder);
	}

	if (dataFolder === 'Characters' || dataFolder === 'Weapons' || dataFolder === 'Ingredients') {
		dataFolder = removeTrailingS(dataFolder);
	}

	const pascalCasedData = updateFile(parsedData, dataFolder);
	const destDir = path.join(__dirname, `../data/${language}/${dataFolder}`);

	if (!fs.existsSync(destDir)) {
		fs.mkdirSync(destDir, {recursive: true});
	}

	fs.writeFileSync(path.join(destDir, `${pascalCase(fileName)}.json`), JSON.stringify(pascalCasedData, null, '\t'));
});
