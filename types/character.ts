export interface SkillAttribute {
	label: string;
	values: string[];
}

export interface Skill {
	_id: number;
	id: string;
	name: string;
	description: string;
	info: string;
	attributes: SkillAttribute[];
}

export interface Passive {
	id: string;
	name: string;
	description: string;
	level: number;
}

export interface Constellation {
	_id: number;
	id: string;
	name: string;
	description: string;
	level: number;
}

export interface AscensionMaterial {
	_id: number;
	id: string;
	name: string;
	amount: number;
	rarity: number;
}

export type AscendStat = {
	label: string;
	values: (string | number)[] | null;
};
export interface Ascension {
	level: [number, number];
	cost?: number;
	stats: AscendStat[];
	mat1?: AscensionMaterial;
	mat2?: AscensionMaterial;
	mat3?: AscensionMaterial;
	mat4?: AscensionMaterial;
}

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
	_id: number;
	id: string;
	name: string;
	picture: string;
};

interface EWeapon {
	_id: number;
	id: string;
}

interface EArtifact {
	_id: number;
	id: string;
}

interface EFood {
	_id: number;
	id: string;
}

interface EBanner {
	_id: number;
	id: string;
}

interface ETCGCharacterCard {
	_id: number;
	id: string;
}

export interface Character {
	_id: number;
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
	birthday: string;
	pictures: CharacterPicture;
	outfits: null | Outfits[];
	signatureWeapon: EWeapon;
	weapons: EWeapon[];
	signatureArtifactSet: EArtifact;
	artifacts: EArtifact[];
	specialDish: EFood;
	featuredBanner: EBanner[];
	tcgCharacterCard: null | ETCGCharacterCard;
	constellation: string;
	domain: string;
	cv: CharacterVoice;
	skills: Skill[];
	passives: Passive[];
	constellations: Constellation[];
	ascension: Ascension[];
	talentMaterials: TalentMaterial[];
}
