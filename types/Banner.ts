/**
	 * @TJS-required
	 */
export type Banner = {
	id: string;
	name: string;
	startTime: Date;
	endTime: Date;
	featured: ECharacter[] | EWeapon[];
	picture: string;
	version: string;
};

/**
	 * @TJS-required
	 */
export type ECharacter = {
	id: string;
};

/**
	 * @TJS-required
	 */
export type EWeapon = {
	id: string;
};
