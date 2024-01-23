/* eslint-disable no-prototype-builtins */
/* eslint-disable no-await-in-loop */
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const dataDirPath = './data';
const charName = 'Dori';
const charCode = '068';
const charNameurl = 'dori';
const honeyhunterworld = 'https://genshin.honeyhunterworld.com';
const cheerio = require('cheerio');
let outfitId = '';

// Define the JSON object with all missing fields
const missingFields = {
	featuredBanner: [],
	pictures: {
		icon: `Character/${charName}/Icon.webp`,
		sideIcon: `Character/${charName}/SideIcon.webp`,
		gatchaCard: `Character/${charName}/GachaCard.webp`,
		gachaSplash: `Character/${charName}/GachaSplash.webp`,
		face: `Character/${charName}/Face.webp`,
		halfFace: `Character/${charName}/HalfFace.webp`,
		profile: `Character/${charName}/Profile.webp`,
		weaponStance: `Character/${charName}/WeaponStance.webp`,
	},
	signatureArtifactSet: '',
	signatureWeapon: '',
	specialDish: 'ShowMeTheMora',
	tcgCharacterCard: 'Dori',
};

async function getOutfit() {
	const pageUrl = `${honeyhunterworld}/i_n2${charCode}00/`;
	const langCorrespondence = {
		DE: '?lang=DE',
		EN: '?lang=EN',
		ES: '?lang=ES',
		FR: '?lang=FR',
		ID: '?lang=ID',
		IT: '?lang=IT',
		JP: '?lang=JA',
		KO: '?lang=KO',
		PT: '?lang=PT',
		RU: '?lang=RU',
		TH: '?lang=TH',
		TR: '?lang=TR',
		VI: '?lang=VI',
		'ZH-S': '?lang=CHS',
		'ZH-T': '?lang=CHT',
	};

	const outfitsByLang = {};

	// First, fetch and parse the English page to get the id
	const englishUrl = pageUrl + '?lang=EN';
	let id = '';
	try {
		const response = await axios.get(englishUrl);
		const $ = cheerio.load(response.data);

		const name = $('h2.wp-block-post-title').text().trim();
		id = name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join('');
	} catch (error) {
		console.error(`Error fetching or parsing English data: ${error}`);
		return; // Exit if unable to fetch English version
	}

	outfitId = id;

	// Then, iterate over each language
	for (const [lang, query] of Object.entries(langCorrespondence)) {
		const url = pageUrl + query;
		try {
			const response = await axios.get(url);
			const $ = cheerio.load(response.data);

			const name = $('h2.wp-block-post-title').text().trim();
			const description = $('table.genshin_table.main_table tbody tr').eq(3).find('td').eq(1).text().trim();

			outfitsByLang[lang] = {
				outfits: [{
					id,
					name,
					description,
					picture: `Character/${charName}/Outfit/${id}.webp`,
				}],
			};
		} catch (error) {
			console.error(`Error fetching or parsing data for language ${lang}: ${error}`);
		}
	}

	return outfitsByLang;
}

async function updateCharacterFile(filePath, outfitDataForLang) {
	const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

	// Add missing fields if they don't exist
	for (const key in missingFields) {
		if (!data.hasOwnProperty(key)) {
			data[key] = missingFields[key];
		}
	}

	// Add outfit data
	if (outfitDataForLang) {
		data.outfits = outfitDataForLang.outfits;
	}

	fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function updateJson(outfitsByLang) {
	fs.readdirSync(dataDirPath).forEach(langFolder => {
		const charFilePath = path.join(dataDirPath, langFolder, 'Character', `${charName}.json`);
		if (fs.existsSync(charFilePath)) {
			const outfitDataForLang = outfitsByLang[langFolder];
			updateCharacterFile(charFilePath, outfitDataForLang);
		}
	});
	console.log('Character files have been updated.');
}

async function downloadPictures() {
	const imageTypes = {
		gatchaCard: 'gacha_card.webp',
		gachaSplash: 'gacha_splash.webp',
		icon: 'icon.webp',
		sideIcon: 'side_icon.webp',
	};
	const otherTypes = {
		face: 'face.webp',
		halfFace: 'half_face.webp',
		profile: 'profile.webp',
		weaponStance: 'weapon.webp',
	};
	const directory = `./images/Character/${charName}`;

	// Ensure the directory exists
	if (!fs.existsSync(directory)) {
		fs.mkdirSync(directory, {recursive: true});
		fs.mkdirSync(directory + '/Outfit', {recursive: true});
	}

	// Download image types
	for (const [type, suffix] of Object.entries(imageTypes)) {
		await downloadImage(type, `${honeyhunterworld}/img/${charNameurl}_${charCode}_${suffix}?x84769`, directory);
	}

	// Download other types
	for (const [type, suffix] of Object.entries(otherTypes)) {
		const otherUrl = `${honeyhunterworld}/img/scr/char/10000${charCode}/${suffix}?x84769`;
		await downloadImage(type, otherUrl, directory);
	}

	// Special case for 'outfit'
	const outfitUrl = `${honeyhunterworld}/img/i_n2${charCode}00.webp?x84769`;
	await downloadImage(outfitId, outfitUrl, directory + '/Outfit');
}

async function downloadImage(type, url, directory) {
	const filePath = path.join(directory, `${type}.webp`);

	try {
		const response = await axios({
			method: 'GET',
			url,
			responseType: 'stream',
		});

		response.data.pipe(fs.createWriteStream(filePath));
		console.log(`Downloaded ${type} with ${url}`);
	} catch (error) {
		console.error(`Error downloading ${type}: ${error}`);
	}
}

async function main() {
	try {
		const outfitsByLang = await getOutfit();
		await updateJson(outfitsByLang);
		await downloadPictures();
	} catch (error) {
		console.error('An error occurred:', error);
	}
}

main();

