/**
 * @TJS-required
 */
export type ContentBanner = {
	version: string;
	name: string;
	startDuration: string;
	endDuration: string;
	fiveStar: string[];
	fourStar: string[];
	type: 'Character' | 'Weapon' | 'Chronicled';
	imageUrl: string;
	id: number;
};

export type Banner = {
	banner: ContentBanner[];
};
