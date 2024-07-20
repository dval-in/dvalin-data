export type ContentBanner = {
	version: string;
	name: string;
	startDuration: string;
	duration: string;
	featured: string[];
	type: 'Beginner' | 'Permanent' | 'Character' | 'Weapon' | 'Chronicled';
	id: string;
};

export type Banner = {
	banner: ContentBanner[];
};
