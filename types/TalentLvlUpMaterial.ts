type Item = {
	id: string;
	name: string;
	amount: number;
};

type Convert = {
	[key: string]: Item;
};

export type TalentLvlUpMaterial = {
	id: string;
	name: string;
	description: string;
	source: string[];
	location?: string;
	rarity: number;
	craft?: {
		cost: number;
		items: Item[];
	};
	convert?: Convert[];
	domain?: string;
	days?: string[];
	version?: string;
};
