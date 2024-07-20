type SkillPoint = {
	id: string;
	type: string;
	count: number;
};
type Entity = {
	id: string;
	name: string;
};
export type CharacterCardSkill = {
	id: string;
	name: string;
	desc: string;
	skillTag: string[];
	points: SkillPoint[];
};
export type TCGCharacterCard = {
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
	version: string;
};
