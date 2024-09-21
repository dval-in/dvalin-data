export type FishingRod = {
	id: string;
	name: string;
	description: string;
	rarity: number;
	source: string[];
	version: string;
	processing?: Item[];
};

type Item = {
	id: string;
	name: string;
	amount: number;
};
