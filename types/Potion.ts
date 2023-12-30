type Item = {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	name: string;
	amount: number;
};

export type Potion = {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	name: string;
	description: string;
	effect: string;
	rarity: number;
	craft: {
		cost: number;
		items: Item[];
	};
};
