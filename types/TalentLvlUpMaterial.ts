type Item = {
	/**
	 * @TJS-required
	 */

	id: string;
	name: string;
	amount: number;
};

export type TalentLvlUpMaterial = {
	/**
	 * @TJS-required
	 */

	id: string;
	name: string;
	description: string;
	source: string[];
	location?: string;
	rarity: number;
	craft?: {
		cost: number;
		items: Item[];
	};
	domain?: string;
	days?: string[];
};
