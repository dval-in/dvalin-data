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
export interface MonsterCardSkill {
	/**
	 * @TJS-required
	 */
	id: string;
	name: string;
	desc: string;
	skillTag: string[];
	points: SkillPoint[];
}
export interface TCGMonsterCard {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	name: string;
	title?: string;
	desc?: string;
	attributes: {
		hp: number;
		cardType: string;
		energy: number;
		element: string;
		weapon: string;
		faction: string[];
		source?: string;
		monster?: Entity;
	};
	skills: MonsterCardSkill[];
}
