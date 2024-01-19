import {type AchievementCategoryKey} from './AchievementCategoryKey';
import {type AchievementKey} from './AchievementKey';
import {type ArtifactSetKey} from './ArtifactSetKey';
import {type BannerKey} from './BannerKey';
import {type CharacterKey} from './CharacterKey';
import {type MaterialKey} from './MaterialKey';
import {type ServerKey} from './ServerKey';
import {type SlotKey} from './SlotKey';
import {type StatKey} from './StatKey';
import {type WeaponKey} from './WeaponKey';
import {type WishBannerKey} from './WishBannerKey';

export type IGOOD = {
	format: 'GOOD'; // A way for people to recognize this format.
	version: number; // GOOD API version.
	source: string; // The app that generates this data.
	server: ServerKey;
	ar: number; // 1-60 inclusive
	characters?: ICharacter[];
	artifacts?: IArtifact[];
	weapons?: IWeapon[];
	materials?: {
		[key in MaterialKey]: number;
	};
	achievments?: IAchievement[];
	furnishing?: IFurnishing[];
	wishes?: IWishBanner[];
};
type IArtifact = {
	setKey: ArtifactSetKey; // E.g. "GladiatorsFinale"
	slotKey: SlotKey; // E.g. "plume"
	level: number; // 0-20 inclusive
	rarity: number; // 1-5 inclusive
	mainStatKey: StatKey;
	location: CharacterKey | ''; // Where "" means not equipped.
	lock: boolean; // Whether the artifact is locked in game.
	substats: ISubstat[];
};

type ISubstat = {
	key: StatKey; // E.g. "critDMG_"
	value: number; // E.g. 19.4
};

type IWeapon = {
	key: WeaponKey; // "CrescentPike"
	level: number; // 1-90 inclusive
	ascension: number; // 0-6 inclusive. need to disambiguate 80/90 or 80/80
	refinement: number; // 1-5 inclusive
	location: CharacterKey | ''; // Where "" means not equipped.
	lock: boolean; // Whether the weapon is locked in game.
};

type ICharacter = {
	key: CharacterKey; // E.g. "Rosaria"
	level: number; // 1-90 inclusive
	constellation: number; // 0-6 inclusive
	ascension: number; // 0-6 inclusive. need to disambiguate 80/90 or 80/80
	talent: {
		// Does not include boost from constellations. 1-15 inclusive
		auto: number;
		skill: number;
		burst: number;
	};
};

type IAchievement = {
	key: AchievementKey;
	category: AchievementCategoryKey;
	achieved: boolean;
	preStage?: AchievementKey; // Refer to the previous achievements of a series
};

type IWishBanner = {
	key: WishBannerKey;
	pulls: IWish[];
};

type IWish = {
	type: 'Weapon' | 'Character';
	key: WeaponKey | CharacterKey;
	date: Date;
	pity: 1;
	banner: BannerKey;
};

type IFurnishing = Record<string, unknown>;
