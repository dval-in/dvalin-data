type AscensionMaterial = {
	id: string;
	name: string;
	amount: number;
	rarity: number;
};

export type WeaponAscension = {
	ascension: number;
	level: number;
	cost: number;
	materials: AscensionMaterial[];
};

type WeaponRefinement = {
	refinement: number;
	desc: string;
};

type StatLevel = {
	ascension: number;
	level: number;
	primary: number;
	secondary?: number;
};

type WeaponStat = {
	primary: string;
	secondary?: string;
	levels: StatLevel[];
};

export type Weapon = {
	id: string;
	name: string;
	description: string;
	rarity: number;
	type: string;
	domain: string;
	passive: string;
	bonus: string;
	stats: WeaponStat;
	ascensions: WeaponAscension[];
	refinementRaw: {
		name: string;
		template: string;
		params: [string[]];
	};
	refinements: WeaponRefinement[];
	version?: string;
	pictures: {
		icon: string;
	};
};
