interface ApiResponse {
	retcode: number;
	message: string;
	data: ApiData;
}

interface ApiData {
	iTotal: number;
	list: Event[];
}

interface Event {
	sChanId: string[];
	sTitle: string;
	sIntro: string;
	sUrl: string;
	sAuthor: string;
	sContent: string;
	sExt: string;
	dtStartTime: string;
	dtEndTime: string;
	dtCreateTime: string;
	iInfoId: number;
	sTagName: string[];
	sCategoryName: string;
	sSign: string;
}

// Helper type for parsing sExt JSON string
interface ExtData {
	title: string;
	banner: Banner[];
}

interface Banner {
	name: string;
	url: string;
}

interface ContentBanner {
	version: string;
	name: string;
	startDuration: string;
	endDuration: string;
	fiveStar: string[];
	fourStar: string[];
	type: 'Character' | 'Weapon' | 'Chronicled';
	imageUrl: string;
	id: number;
}
interface Section {
	image: string;
	title: string;
	wishDetails: string[];
	duration: string;
	type: 'Character' | 'Weapon' | 'Chronicled';
}
export { ApiResponse, ApiData, Event, ExtData, Section, ContentBanner };
