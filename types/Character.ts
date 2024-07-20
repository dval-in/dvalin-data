export type SkillAttribute = {
	label: string;
	values: string[];
};

export type Skill = {
	id: string;
	name: string;
	description: string;
	info: string;
	attributes: SkillAttribute[];
};

export type Passive = {
	id: string;
	name: string;
	description: string;
	level: number;
};

export type Constellation = {
	id: string;
	name: string;
	description: string;
	level: number;
};

export type AscensionMaterial = {
	id: string;
	name: string;
	amount: number;
	rarity: number;
};

export type AscendStat = {
	label: string;
	values: Array<string | number> | undefined;
};

export type Ascension = {
	level: [number];
	cost?: number;
	stats: AscendStat[];
	mat1?: AscensionMaterial;
	mat2?: AscensionMaterial;
	mat3?: AscensionMaterial;
	mat4?: AscensionMaterial;
};

export type CharacterVoice = {
	english: string;
	chinese: string;
	japanese: string;
	korean: string;
};

export type TalentMaterial = {
	level: number;
	cost: number;
	items: AscensionMaterial[];
};

export type CharacterPicture = {
	icon: string;
	sideIcon: string;
	gatchaCard: string;
	gachaSplash: string;
	face: string;
	halfFace: string;
	profile: string;
	weaponStance: string;
};

export type Outfits = {
	id: string;
	name: string;
	picture: string;
	description: string;
};

export type Character = {
	id: string;
	name: string;
	title?: string;
	description: string;
	weaponType: string;
	element: string;
	gender: string;
	substat: string;
	affiliation: string;
	region?: string;
	rarity: number;
	birthday: string; // MM-DD
	pictures: CharacterPicture;
	outfits: undefined | Outfits[];
	signatureWeapon: string; // Id
	signatureArtifactSet: undefined | string; // Id
	specialDish: string; // Id
	featuredBanner: string[];
	tcgCharacterCard: undefined | string; // Id
	constellation: string;
	domain: string;
	cv: CharacterVoice;
	skills: Skill[];
	passives: Passive[];
	constellations: Constellation[];
	ascension: Ascension[];
	talentMaterials: TalentMaterial[];
	version: string;
	release: number;
};
