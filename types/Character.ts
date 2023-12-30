export interface SkillAttribute {
	/**
	 * @TJS-required
	 */
	label: string;
	values: string[];
}

export interface Skill {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	name: string;
	description: string;
	info: string;
	attributes: SkillAttribute[];
}

export interface Passive {
	/**
	 * @TJS-required
	 */
	id: string;
	name: string;
	description: string;
	level: number;
}

export interface Constellation {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	name: string;
	description: string;
	level: number;
}

export interface AscensionMaterial {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	name: string;
	amount: number;
	rarity: number;
}

export type AscendStat = {
	/**
	 * @TJS-required
	 */
	label: string;
	values: (string | number)[] | null;
};

export interface Ascension {
	/**
	 * @TJS-required
	 */
	level: [number];
	cost?: number;
	stats: AscendStat[];
	mat1?: AscensionMaterial;
	mat2?: AscensionMaterial;
	mat3?: AscensionMaterial;
	mat4?: AscensionMaterial;
}

export type CharacterVoice = {
	/**
	 * @TJS-required
	 */
	english: string;
	chinese: string;
	japanese: string;
	korean: string;
};

export type TalentMaterial = {
	/**
	 * @TJS-required
	 */
	level: number;
	cost: number;
	items: AscensionMaterial[];
};

export type CharacterPicture = {
	/**
	 * @TJS-required
	 */
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
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	name: string;
	picture: string;
};

interface EWeapon {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
}

interface EArtifact {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
}

interface EFood {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
}

interface EBanner {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
}

interface ETCGCharacterCard {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
}

export interface Character {
	/**
	 * @TJS-required
	 */
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
	signatureArtifactSet: null | EArtifact;
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
