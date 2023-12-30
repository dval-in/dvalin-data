type Item = {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	name: string;
	amount: number;
};

type Recipe = {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	name: string;
};

export type Ingredients = {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	name: string;
	description: string;
	processing?: Item[];
	recipes?: Recipe[];
	source?: string[];
};
