import { AchievementCategoryKey } from "./AchievementCategoryKey";
import { AchievementKey } from "./AchievementKey";
import { ArtifactSetKey } from "./ArtifactSetKey";
import { BannerKey } from "./BannerKey";
import { CharacterKey } from "./CharacterKey";
import { MaterialKey } from "./MaterialKey";
import { ServerKey } from "./ServerKey";
import { SlotKey } from "./SlotKey";
import { StatKey } from "./StatKey";
import { WeaponKey } from "./WeaponKey";
import { WishBannerKey } from "./WishBannerKey";

export interface IGOOD {
	format: "GOOD"; // A way for people to recognize this format.
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
}
interface IArtifact {
	setKey: ArtifactSetKey; //e.g. "GladiatorsFinale"
	slotKey: SlotKey; //e.g. "plume"
	level: number; //0-20 inclusive
	rarity: number; //1-5 inclusive
	mainStatKey: StatKey;
	location: CharacterKey | ""; //where "" means not equipped.
	lock: boolean; //Whether the artifact is locked in game.
	substats: ISubstat[];
}

interface ISubstat {
	key: StatKey; //e.g. "critDMG_"
	value: number; //e.g. 19.4
}

interface IWeapon {
	key: WeaponKey; //"CrescentPike"
	level: number; //1-90 inclusive
	ascension: number; //0-6 inclusive. need to disambiguate 80/90 or 80/80
	refinement: number; //1-5 inclusive
	location: CharacterKey | ""; //where "" means not equipped.
	lock: boolean; //Whether the weapon is locked in game.
}

interface ICharacter {
	key: CharacterKey; //e.g. "Rosaria"
	level: number; //1-90 inclusive
	constellation: number; //0-6 inclusive
	ascension: number; //0-6 inclusive. need to disambiguate 80/90 or 80/80
	talent: {
		//does not include boost from constellations. 1-15 inclusive
		auto: number;
		skill: number;
		burst: number;
	};
}

interface IAchievement {
	key: AchievementKey;
	category: AchievementCategoryKey;
	achieved: boolean;
	preStage?: AchievementKey; // refer to the previous achievements of a series
}

interface IWishBanner {
	key: WishBannerKey;
	pulls: IWish[];
}

interface IWish {
	type: "Weapon" | "Character";
	key: WeaponKey | CharacterKey;
	date: Date;
	pity: 1;
	banner: BannerKey;
}

interface IFurnishing {}
