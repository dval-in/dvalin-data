export type Fish = {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	name: string;
	description: string;
	rarity: number;
	source: string[];
	bait: {
		id: string;
		name: string;
		rarity: number;
	};
};
