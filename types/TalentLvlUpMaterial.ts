type Item = {
	id: string;
	name: string;
	amount: number;
};

export type TalentLvlUpMaterial = {
	id: string;
	name: string;
	description: string;
	source: string[];
	location?: string;
	rarity: number;
	convert?: Item[];
	craft?: {
		cost: number;
		items: Item[];
	};
	domain?: string;
	days?: string[];
	version: string;
};
