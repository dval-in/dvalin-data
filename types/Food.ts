type Ingredient = {
	/**
	 * @TJS-required
	 */
	id: string;
	name: string;
	amount: number;
};

type FoodResult = {
	/**
	 * @TJS-required
	 */
	normal: {
		_id: number;
		name: string;
		description: string;
		effect: string;
	};
	delicious: {
		_id: number;
		name: string;
		description: string;
		effect: string;
	};
	suspicious: {
		_id: number;
		name: string;
		description: string;
		effect: string;
	};
	special?: {
		_id: number;
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
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	name: string;
	description: string;
	ingredients: Ingredient[];
	dishType: string;
	results: FoodResult;
	rarity: number;
};
