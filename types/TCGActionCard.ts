export type ActionCardSkill = {
	name: string;
	desc: string;
};
type Entity = {
	id: string;
	name: string;
	rarity: number;
};
type Energy = {
	id: string;
	type: string;
	count: number;
};
export type TCGActionCard = {
	id: string;
	name: string;
	title: string;
	desc: string;
	in_play_description: string;
	attributes: {
		cost: number;
		costType: string;
		cardType: string;
		energy: Energy[];
		source: string;
		artifact?: Entity;
		character?: Entity;
		food?: Entity;
		weapon?: Entity;
		tags: string[];
	};
	skills: ActionCardSkill[];
	version?: string;
};
