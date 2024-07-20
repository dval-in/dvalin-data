export type Fish = {
	id: string;
	name: string;
	description: string;
	rarity: number;
	source: string[];
	bait?: {
		id: string;
		name: string;
		rarity: number;
	};
	version?: string;
};
