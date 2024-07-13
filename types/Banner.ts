/**
 * @TJS-required
 */
export type ContentBanner = {
	version: string;
	name: string;
	startDuration: string;
	duration: string;
	featured: string[];
	type: 'Permanent' | 'Character' | 'Weapon' | 'Chronicled';
	id: string;
};

export type Banner = {
	banner: ContentBanner[];
};
