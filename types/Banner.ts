export type Banner = {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
	name: string;
	startTime: string;
	endTime: string;
	featured: ECharacter[] | EWeapon[];
	picture: string;
};

export type ECharacter = {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
};

export type EWeapon = {
	/**
	 * @TJS-required
	 */
	_id: number;
	id: string;
};
