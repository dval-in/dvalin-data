const fs = require('fs');
const path = require('path');

const dataDirPath = './data';
const charName = 'Alhaitham';

// Define the JSON object with all missing fields
const missingFields = {
	artifacts: [
		'GildedDreams',
		'DeepwoodMemories',
	], // Populate these fields as needed
	featuredBanner: [
		'CautionInConfidence1',
		'CautionInConfidence2',
	],
	outfits: [{
		id: 'TheRational',
		name: 'The Rational',
		description: 'Alhaitham\'s outfit. "Don\'t bother the Scribe with trivialities... What do you think those soundproofers of his are for, anyway?" \n So observed an experienced staff member at the Temple of Silence.',
		picture: 'Character/Alhaitham/Outfit/NewmoonStarlight.webp',
	}],
	pictures: {
		icon: 'Character/Alhaitham/Icon.webp',
		sideIcon: 'Character/Alhaitham/SideIcon.webp',
		gatchaCard: 'Character/Alhaitham/GachaCard.webp',
		gachaSplash: 'Character/Alhaitham/GachaSplash.webp',
		face: 'Character/Alhaitham/Face.webp',
		halfFace: 'Character/Alhaitham/HalfFace.webp',
		profile: 'Character/Alhaitham/Profile.webp',
		weaponStance: 'Character/Alhaitham/WeaponStance.webp',
	},
	signatureArtifactSet: 'GildedDreams',
	signatureWeapon: 'LightOfFoliarIncision',
	specialDish: 'IdealCircumstance',
	tcgCharacterCard: 'Alhaitham',
	weapons: ['LightOfFoliarIncision', 'PrimordialJadeCutter', 'MistsplitterReforged', 'HaranGeppakuFutsu', 'FreedomSworn', 'TheBlackSword', 'IronSting'],
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
