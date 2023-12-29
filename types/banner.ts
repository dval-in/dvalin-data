export type Banner = {
	_id: number;
	id: string;
	name: string;
	startTime: string;
	endTime: string;
	featured: ECharacter[] | EWeapon[];
	picture: string;
};

export type ECharacter = {
	_id: number;
	id: string;
};

export type EWeapon = {
	_id: number;
	id: string;
};
