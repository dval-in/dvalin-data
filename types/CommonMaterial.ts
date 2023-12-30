type Item = {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	name: string;
	amount: number;
};

type Craft = {
	/**
	 * @TJS-required
	 */
	cost: number;
	items: Item[];
};

export type CommonMaterial = {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	name: string;
	description: string;
	source: string[];
	rarity: number;
	craft?: Craft;
};
