type Item = {
	id: string;
	name: string;
	amount: number;
};

type Convert = {
	[key: string]: Item;
};

export type JewelsMaterial = {
	id: string;
	name: string;
	description: string;
	source: string[];
	rarity: number;
	craft?: {
		cost: number;
		items: Item[];
	};
	convert?: Convert[];
	version?: string;
};
