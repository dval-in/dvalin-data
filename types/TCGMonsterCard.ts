type SkillPoint = {
	id: string;
	type: string;
	count: number;
};
type Entity = {
	id: string;
	name: string;
};
export type MonsterCardSkill = {
	id: string;
	name: string;
	desc: string;
	skillTag: string[];
	points: SkillPoint[];
};
export type TCGMonsterCard = {
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
	version: string;
};
