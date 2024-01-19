type SkillPoint = {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	type: string;
	count: number;
};
type Entity = {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	name: string;
};
export type CharacterCardSkill = {
	/**
	 * @TJS-required
	 */
	id: string;
	name: string;
	desc: string;
	skillTag: string[];
	points: SkillPoint[];
};
export type TCGCharacterCard = {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	name: string;
	attributes: {
		hp: number;
		cardType: string;
		energy: number;
		element: string;
		weapon: string;
		faction: string[];
		talentCard?: Entity;
		source: string;
		character?: Entity;
	};
	skills: CharacterCardSkill[];
};
