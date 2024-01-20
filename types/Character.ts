export type SkillAttribute = {
	/**
	 * @TJS-required
	 */
	label: string;
	values: string[];
};

export type Skill = {
	/**
	 * @TJS-required
	 */

	id: string;
	name: string;
	description: string;
	info: string;
	attributes: SkillAttribute[];
};

export type Passive = {
	/**
	 * @TJS-required
	 */
	id: string;
	name: string;
	description: string;
	level: number;
};

export type Constellation = {
	/**
	 * @TJS-required
	 */

	id: string;
	name: string;
	description: string;
	level: number;
};

export type AscensionMaterial = {
	/**
	 * @TJS-required
	 */

	id: string;
	name: string;
	amount: number;
	rarity: number;
};

export type AscendStat = {
	/**
	 * @TJS-required
	 */
	label: string;
	values: Array<string | number> | undefined;
};

export type Ascension = {
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
};

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

	id: string;
	name: string;
	picture: string;
};

type EWeapon = {
	/**
	 * @TJS-required
	 */

	id: string;
};

type EArtifact = {
	/**
	 * @TJS-required
	 */

	id: string;
};

type EFood = {
	/**
	 * @TJS-required
	 */

	id: string;
};

type EBanner = {
	/**
	 * @TJS-required
	 */

	id: string;
};

type ETCGCharacterCard = {
	/**
	 * @TJS-required
	 */

	id: string;
};

export type Character = {
	/**
	 * @TJS-required
	 */

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
	signatureWeapon: EWeapon;
	weapons: EWeapon[];
	signatureArtifactSet: undefined | EArtifact;
	artifacts: EArtifact[];
	specialDish: EFood;
	featuredBanner: EBanner[];
	tcgCharacterCard: undefined | ETCGCharacterCard;
	constellation: string;
	domain: string;
	cv: CharacterVoice;
	skills: Skill[];
	passives: Passive[];
	constellations: Constellation[];
	ascension: Ascension[];
	talentMaterials: TalentMaterial[];
};
