type Ingredient = {
	id: string;
	name: string;
	amount: number;
};

type FoodResult = {
	normal: {
		name: string;
		description: string;
		effect: string;
	};
	delicious: {
		name: string;
		description: string;
		effect: string;
	};
	suspicious: {
		name: string;
		description: string;
		effect: string;
	};
	special?: {
		id: string;
		name: string;
		description: string;
		effect: string;
		character: {
			id: string;
			name: string;
		};
	};
};

export type Food = {
	id: string;
	name: string;
	description: string;
	ingredients: Ingredient[];
	dishType: string;
	results: FoodResult;
	rarity: number;
	version?: string;
};
