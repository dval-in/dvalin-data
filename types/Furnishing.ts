export interface FurnitureRecipe {
	/**
	 * @TJS-required
	 */
	id: string;
	name: string;
	amount: string;
}

export interface FurnitureCategory {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: number;
	category: string;
	type?: string;
}

export interface Furnishing {
	/**
	 * @TJS-required
	 */
	_id: number;
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
}
