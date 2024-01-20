const fs = require('fs');
const path = require('path');

const dataDirPath = './data';
const charName = 'Albedo'; // Replace with your character's name

// Define the JSON object with all missing fields
const missingFields = {
	artifacts: [
		'HuskOfOpulentDreams',
		'GoldenTroupe',
	], // Populate these fields as needed
	featuredBanner: [
		'SecretumSecretorum1',
		'SecretumSecretorum2',
		'SecretumSecretorum3',
		'SecretumSecretorum4',
	],
	outfits: [{
		id: 'NewmoonStarlight',
		name: 'Newmoon Starlight',
		description: 'Albedo\'s outfit. The Knights of Favonius alchemist\'s uniform that Albedo often wears when conducting his experiments',
		picture: 'Character/Albedo/Outfit/NewmoonStarlight.png',
	}],
	pictures: {
		icon: 'Character/Albedo/Icon.png',
		sideIcon: 'Character/Albedo/SideIcon.png',
		gatchaCard: 'Character/Albedo/GachaCard.png',
		gachaSplash: 'Character/Albedo/GachaSplash.png',
		face: 'Character/Albedo/Face.png',
		halfFace: 'Character/Albedo/HalfFace.png',
		profile: 'Character/Albedo/Profile.png',
		weaponStance: 'Character/Albedo/WeaponStance.png',
	},
	signatureArtifactSet: '',
	signatureWeapon: 'CinnabarSpindle',
	specialDish: 'WoodlandDream',
	tcgCharacterCard: 'Albedo',
	weapons: ['CinnabarSpindle', 'HarbingerOfDawn', 'WolfFang'],
};

function updateCharacterFile(filePath) {
	const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

	// Add missing fields if they don't exist
	for (const key in missingFields) {
		// eslint-disable-next-line no-prototype-builtins
		if (!data.hasOwnProperty(key)) {
			data[key] = missingFields[key];
		}
	}

	fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

fs.readdirSync(dataDirPath).forEach(langFolder => {
	const charFilePath = path.join(dataDirPath, langFolder, 'Character', `${charName}.json`);
	if (fs.existsSync(charFilePath)) {
		updateCharacterFile(charFilePath);
	}
});

console.log('Character files have been updated.');
