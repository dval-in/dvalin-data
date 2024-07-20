export type FurnitureRecipe = {
	id: string;
	name: string;
	amount: string;
};

export type FurnitureCategory = {
	id: number;
	category: string;
	type?: string;
};

export type Furnishing = {
	id: string;
	originalId: number;
	name: string;
	description: string;
	rarity: number;
	load?: number;
	energy?: number;
	exp?: number;
	category: FurnitureCategory[];
	recipe?: FurnitureRecipe[];
	version?: string;
};
