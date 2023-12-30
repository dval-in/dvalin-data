interface SkillPoint {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	type: string;
	count: number;
}
interface Entity {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	name: string;
}
export interface CharacterCardSkill {
	/**
	 * @TJS-required
	 */
	id: string;
	name: string;
	desc: string;
	skillTag: string[];
	points: SkillPoint[];
}
export interface TCGCharacterCard {
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
}
