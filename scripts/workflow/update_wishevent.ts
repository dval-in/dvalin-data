import { ApiResponse, Event, ContentBanner, Section } from '../../types/scripts/hoyo_event';
import { join } from 'path';
import { JSDOM } from 'jsdom';
import { toPascalCase } from '../utils/stringUtils';
import { Banner } from '../../types/Banner';

const baseUrl =
	'https://sg-public-api-static.hoyoverse.com/content_v2_user/app/a1b1f9d3315447cc/getContentList';

const langMapping = {
	ZHT: 'zh-tw',
	EN: 'en-us',
	FR: 'fr-fr',
	DE: 'de-de',
	ID: 'id-id',
	JP: 'ja-jp',
	KO: 'ko-kr',
	PT: 'pt-pt',
	RU: 'ru-ru',
	ES: 'es-es',
	TH: 'th-th',
	VI: 'vi-vn',
	TR: 'tr-tr',
	IT: 'it-it'
};

// Set the maximum number of pages to fetch
// -1 means no limit, it will fetch all available pages
const MAX_PAGES: -1 | number = 54;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const randomSleep = async () => {
	const sleepTime = Math.floor(Math.random() * (1000 - 200 + 1) + 200);
	console.log(`Sleeping for ${sleepTime}ms to avoid rate limiting...`);
	await sleep(sleepTime);
};

const fetchEvents = async (page: number, lang: string): Promise<Event[]> => {
	const params = {
		iAppId: '32',
		iChanId: '396',
		iPageSize: '20',
		sLangKey: lang,
		iPage: page.toString()
	};
	const url = `${baseUrl}?${new URLSearchParams(params)}`;
	const response = await fetch(url);
	const data: ApiResponse = await response.json();
	return data.data.list;
};

const getAllMatchGroups = (text: string, regex: RegExp): string[] => {
	const results: string[] = [];
	const matches = text.matchAll(regex);

	for (const match of matches) {
		const groups = match.slice(1).filter((group): group is string => group !== undefined);
		results.push(...groups);
	}

	return results;
};

const parseHTML = (html: string, version: string, id: number): ContentBanner[] => {
	const dom = new JSDOM(html);
	const document = dom.window._document;

	const sections: Section[] = [];
	let currentSection: Section | null = null;
	const elements = document.body.children;

	for (let i = 0; i < elements.length; i++) {
		const element = elements[i];

		if (element.tagName === 'P' && element.querySelector('img')) {
			// Start a new section
			if (currentSection) {
				sections.push(currentSection);
			}
			let title = '';
			let type: 'Character' | 'Weapon' | 'Chronicled' = 'Character';
			if (element.textContent?.includes('Event')) {
				title = element.textContent?.trim().match(/"([^"]+)"/)?.[1] ?? '';
				if (!title) {
					throw new Error(
						`Failed to extract title from element at index ${i}. Text content: ${element.textContent}`
					);
				}
			}
			type = title.includes('Epitome')
				? 'Weapon'
				: title.includes('Chronicled')
					? 'Chronicled'
					: 'Character';
			currentSection = {
				image: element.querySelector('img')?.getAttribute('src') || undefined,
				type,
				title,
				wishDetails: [],
				duration: ''
			};
		} else if (currentSection) {
			if (!currentSection.title && element.textContent?.includes('Event')) {
				const titleText = element.textContent?.trim() || '';
				currentSection.type = titleText.includes('Epitome')
					? 'Weapon'
					: titleText.includes('Chronicled')
						? 'Chronicled'
						: 'Character';
				currentSection.title = titleText.match(/"([^"]+)"/)?.[1] || '';
				if (!currentSection.title) {
					throw new Error(
						`Failed to extract title from element at index ${i}. Text content: ${titleText}`
					);
				}
			} else if (
				element.textContent?.includes('●') &&
				currentSection.wishDetails.length < 2 &&
				currentSection.type !== 'Chronicled'
			) {
				currentSection.wishDetails.push(element.textContent?.trim() || '');
			} else if (
				element.textContent?.includes(
					'All 5-star and 4-star items in this Chronicled Wish:'
				) &&
				currentSection.type === 'Chronicled'
			) {
				currentSection.wishDetails.push(element.textContent?.trim());
				for (let j = 1; j <= 4; j++) {
					const detailElement = elements[i + j];
					if (!detailElement) {
						throw new Error(`Missing expected wish detail element at index ${i + j}`);
					}
					currentSection.wishDetails.push(detailElement.textContent?.trim() || '');
				}
			} else if (element.textContent?.includes('Event Wish Duration')) {
				const dashRegex = /([^–—―‒-―−‐‑‒–—―−~˗]+)[–—―‒-―−‐‑‒–—―−~˗]+(.+)/;
				currentSection.duration = elements[i + 1]?.textContent?.trim().replace(/\s+/g, ' ');
				if (!currentSection.duration.match(/[—\-–~]/)) {
					currentSection.duration += elements[i + 2]?.textContent
						?.trim()
						.replace(/\s+/g, ' ');
					currentSection.duration += elements[i + 3]?.textContent
						?.trim()
						.replace(/\s+/g, ' ');
				}
				if (
					!currentSection.duration ||
					!currentSection.duration.match(/[:\s\/\w.]+[—\-–~—][\d:\s\/]+/)
				) {
					console.log(element.textContent, '\n', elements[i + 1]?.textContent);
					console.log(elements[i + 1]?.textContent?.trim().match(/[—\-–~—]/g));
					throw new Error(`Failed to extract duration at index ${i}`);
				}
			}
		}
	}

	// Add the last section
	if (currentSection) {
		sections.push(currentSection);
	}

	// Convert sections to ContentBanner[]
	return sections.map((section, index) => {
		let fourStar: string[];
		let fiveStar: string[];
		if (section.wishDetails.length < 2) {
			const splitChar = section.wishDetails[0].split('●');
			section.wishDetails = [splitChar[1], splitChar[2].split('※')[0]];
		}
		if (section.type === 'Character') {
			if (section.wishDetails.length < 2) {
				console.log(section.wishDetails);
				throw new Error(
					`Insufficient wish details for Character section at index ${index} :`
				);
			}
			fiveStar = parseFiveStarCharacters(section.wishDetails[0]);
			fourStar = parseFourStarCharacters(section.wishDetails[1]);
		} else if (section.type === 'Weapon') {
			if (section.wishDetails.length < 2) {
				console.log(section.wishDetails);
				throw new Error(`Insufficient wish details for Weapon section at index ${index}`);
			}
			fiveStar = parseFiveStarWeapons(section.wishDetails[0]);
			fourStar = parseFourStarWeapons(section.wishDetails[1]);
		} else {
			if (section.wishDetails.length < 5) {
				console.log(section.wishDetails);
				throw new Error(
					`Insufficient wish details for Chronicled section at index ${index}`
				);
			}
			fiveStar = parseChronicled(section.wishDetails[1] + section.wishDetails[2]);
			fourStar = parseChronicled(section.wishDetails[3] + section.wishDetails[4]);
		}
		fourStar = fourStar.map((c) => toPascalCase(c));
		fiveStar = fiveStar.map((c) => toPascalCase(c));
		const durationRegex = /([^—\-–~]+)[—\-–~](.+)/;
		const durationMatch = section.duration.match(durationRegex);
		if (!durationMatch) {
			throw new Error(
				`Failed to parse duration for section ${section.title}: ${section.duration}`
			);
		}
		let endDuration = durationMatch[2].trim();
		let startDuration = durationMatch[1].trim();
		try {
			let endDate = new Date(endDuration);
			if (startDuration.startsWith('After')) {
				let startDate = subtractDays(endDate, 20);
				startDuration = startDate.toISOString();
			} else {
				startDuration = new Date(startDuration).toISOString();
			}
			endDuration = endDate.toISOString();
		} catch (e) {
			console.log(section.duration);
			throw new Error(`Error parsing date for ${section.title}: ${e}`);
		}

		return {
			version,
			name: section.title,
			startDuration,
			endDuration,
			type: section.type,
			imageUrl: section.image,
			fourStar,
			fiveStar,
			id
		};
	});
};

const subtractDays = (date: Date, days: number): Date => {
	const result = new Date(date);
	result.setDate(result.getDate() - days);
	return result;
};

const parseFourStarCharacters = (text: string): string[] => {
	const charMatch = [...text.matchAll(/"[^"]+"\s+([^(]+)/g)];
	return charMatch.map((c) => c[1].trim());
};

const parseFourStarWeapons = (text: string): string[] => {
	const match = getAllMatchGroups(
		text,
		/4-star weapons?\s+([\w'\s]+)(?=\()|,\s+[and]*([\w'\s]+)(?=\()/g
	);
	return match.map((w) => w.trim());
};

const parseFiveStarCharacters = (text: string): string[] => {
	const charMatch = [...text.matchAll(/"[^"]+"\s+([^(]+)/g)];
	return charMatch.map((c) => c[1].trim());
};

const parseFiveStarWeapons = (text: string): string[] => {
	const match = getAllMatchGroups(
		text,
		/5-star weapons?\s+([\w'\-\s]+)\s*\(\w+\)\s*|and\s*([\D'\-\s]+)\s*\(\w+\)/g
	);
	return match.map((w) => w.trim());
};

const parseChronicled = (text: string): string[] => {
	const fiveStarRegex = /(?:[:,])\s+(?:and)?([\s\w'-]+)(?=[\d,])/g;
	const matches = getAllMatchGroups(text, fiveStarRegex);
	return matches.map((match) => match.replace(/and /, ''));
};

async function loadExistingBanners(folderName: string): Promise<Banner> {
	const filePath = join(import.meta.dir, '..', '..', 'data', folderName, 'banners.json');
	const file = Bun.file(filePath);
	const exists = await file.exists();

	if (exists) {
		const fileContent = await file.text();
		return JSON.parse(fileContent);
	}
	return { banner: [] };
}

async function getLastRegisteredId(folderName: string): Promise<number> {
	const existingBanners = await loadExistingBanners(folderName);
	if (existingBanners.banner.length > 0) {
		return Math.max(...existingBanners.banner.map((banner) => banner.id));
	}
	return 0;
}

async function loadAndUpdateBanners(
	newBanners: ContentBanner[],
	folderName: string
): Promise<void> {
	const filePath = join(import.meta.dir, '..', '..', 'data', folderName, 'banners.json');
	const existingData = await loadExistingBanners(folderName);

	existingData.banner = [...existingData.banner, ...newBanners];

	await Bun.write(filePath, JSON.stringify(existingData, null, 2));
}
interface ParsedEventData {
	id: number;
	version: string;
	part: string | undefined;
	parsedBanners: ContentBanner[];
}

const parseEventData = (event: Event): ParsedEventData => {
	const version = event.sTitle.match(/\d+\.\d+/);
	const part = event.sTitle.match(/(?:-\s+Phase\s+)(\w+)(?=$)/)?.[1];
	let parsedBanners;
	try {
		parsedBanners = parseHTML(
			event.sContent,
			`${version?.[0] || '1.0'}-${part}`,
			event.iInfoId
		);
	} catch (error) {
		console.error(`Error parsing HTML for ${event.sTitle} - ${event.iInfoId}: ${error}`);
		throw error;
	}

	return {
		id: event.iInfoId,
		version: version?.[0] || '1.0',
		part,
		parsedBanners
	};
};

const processLanguage = async (
	folderName: string,
	queryLang: string,
	eventIds?: number[],
	parsedData?: Map<number, ParsedEventData>
) => {
	const lastRegisteredId = await getLastRegisteredId(folderName);
	console.log(`Last registered ID for ${folderName}: ${lastRegisteredId}`);
	let eventWishesNotices: Event[] = [];
	let page = 1;
	let hasMorePages = true;

	while (hasMorePages && (MAX_PAGES === -1 || page <= MAX_PAGES)) {
		const events = await fetchEvents(page, queryLang);
		const filteredEvents = eventIds
			? events.filter((event) => eventIds.includes(event.iInfoId))
			: events.filter(
					(event) =>
						event.sTitle.includes('Event Wishes Notice') ||
						event.sTitle.includes('Event Wish')
				);
		eventWishesNotices.push(...filteredEvents);
		if (filteredEvents.some((event) => event.iInfoId === lastRegisteredId)) {
			hasMorePages = false;
			console.log(`Reached last registered ID. Stopping fetch for ${folderName}.`);
		} else if (events.length < 20) {
			hasMorePages = false;
		} else {
			page++;
		}

		if (page % 10 === 0) await randomSleep();
	}

	let newBanners: ContentBanner[] = [];
	const newParsedData = new Map<number, ParsedEventData>();

	eventWishesNotices.forEach((event) => {
		if (parsedData && parsedData.has(event.iInfoId)) {
			// Reuse parsed data, update only title and image
			const existingData = parsedData.get(event.iInfoId)!;
			const updatedBanners = existingData.parsedBanners.map((banner, index) => ({
				...banner,
				name: banner.name,
				imageUrl:
					new JSDOM(event.sContent).window._document
						.querySelectorAll('img')
						[index]?.getAttribute('src') || banner.imageUrl
			}));
			newParsedData.set(event.iInfoId, { ...existingData, parsedBanners: updatedBanners });
			newBanners.push(...updatedBanners.filter((banner) => banner.id > lastRegisteredId));
		} else {
			// Parse new data for English or if data doesn't exist
			const parsedEvent = parseEventData(event);
			newParsedData.set(event.iInfoId, parsedEvent);
			newBanners.push(
				...parsedEvent.parsedBanners.filter((banner) => banner.id > lastRegisteredId)
			);
		}
	});

	if (newBanners.length > 0) {
		await loadAndUpdateBanners(newBanners, folderName);
	}

	return {
		eventIds: eventWishesNotices.map((event) => event.iInfoId),
		parsedData: newParsedData
	};
};

const main = async () => {
	console.log('Processing English first...');
	const englishResult = await processLanguage('EN', langMapping['EN']);
	let eventIds = englishResult.eventIds;
	let parsedData = englishResult.parsedData;
	console.log(`Processed EN: ${eventIds.length} events, ${parsedData.size} parsed`);

	console.log('Processing other languages...');
	for (const [folderName, queryLang] of Object.entries(langMapping)) {
		if (folderName !== 'EN') {
			const result = await processLanguage(folderName, queryLang, eventIds, parsedData);
			// We don't update eventIds here, as we want to keep the English ones
			parsedData = new Map([...parsedData, ...result.parsedData]);
			console.log(
				`Processed ${folderName}: ${result.eventIds.length} events, ${result.parsedData.size} parsed`
			);
			await randomSleep();
		}
	}

	console.log('All languages processed.');
};

main().catch(console.error);
