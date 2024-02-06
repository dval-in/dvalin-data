
export enum Game {
	/**
	 * @TJS-required
	 */
	HonkaiImpact3Rd,
	GenshinImpact,
	TearsOfThemis,
	Hoyolab,
	HonkaiStarRail,
	ZenlessZoneZero
}

export enum MessageType {
	/**
	 * @TJS-required
	 */
	Notices = 1,
	Event = 2,
	Info = 3
}

export enum Tags {
	/**
	 * @TJS-required
	 */
	NewCharacterIntro,
	VoiceArtistAnnouncement,
	VersionEventWishesNotice,
	VersionEventNoticesCompilation,
	CharacterDemo,
	CharacterTeaser,
	StoryQuest,
	VersionNewWeapon,
	NewOutfit,
	OutfitTeaser,
	NewContentsDisplay,
	WebEventWallpapers,
	VersionPreview,
	Event,
	VersionTrailer,
	OstAlbum,
	SpecialProgramPreview,
	DevelopersDiscussion,
	CollectedMiscellany,
	VersionEventsPreview,
	EventTeaser,
	VersionNewArtifact,
	UpdatePreview,
	UpdateDetails,
	LeyLineOverflow,
	Wallpapers,
	GeniusInvokationTcg,
	CutsceneAnimation,
	GenshinConcert2023,
	VersionPreviewPage,
	Music
}

export enum LanguageCode {
	/**
	 * @TJS-required
	 */
	Thai = 'th-th',
	ChineseSimplified = 'zh-cn',
	ChineseTraditional = 'zh-tw',
	Russian = 'ru-ru',
	Indonesian = 'id-id',
	Korean = 'ko-kr',
	Vietnamese = 'vi-vn',
	Italian = 'it-it',
	Japanese = 'ja-jp',
	Portuguese = 'pt-pt',
	Turkish = 'tr-tr',
	English = 'en-us',
	German = 'de-de',
	French = 'fr-fr',
	Spanish = 'es-es'
}

type RedirectLinkChain = Array<string>;

export enum LinkType {
	/**
	 * @TJS-required
	 */
	Image,
	HoyoLink,
	Hoyolab,
	MihoyoHoyoverse,
	Twitter,
	Facebook,
	Youtube,
	Twitch,
	Vk,
	Telegram,
	Relative,
	Unknown,
	Malformed
}

export type Link = {
	/**
	 * @TJS-required
	 */
	index: number | undefined;
	url: string;
	urlOriginal: string;
	urlOriginalResolved: RedirectLinkChain;
	urlLocal: string | undefined;
	linkType: LinkType;
};

export type Event = {
	/**
	 * @TJS-required
	 */
	postId: string;
	gameId: Game;
	messageType: MessageType;
	createdAt: Date;
	tags: Array<Tags>;
	language: LanguageCode;
	subject: string;
	content: string;
	links: Array<Link>;
	articleUrl: string;
};
