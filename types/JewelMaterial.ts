type Item = {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	name: string;
	amount: number;
};

export type JewelMaterial = {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	name: string;
	description: string;
	source: string[];
	rarity: number;
	craft?: {
		cost: number;
		items: Item[];
	};
	convert?: Item[][];
};
