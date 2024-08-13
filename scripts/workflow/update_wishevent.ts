import { JSDOM } from 'jsdom';
import { toPascalCase } from '../utils/stringUtils';
import { write } from 'bun';
import { ContentBanner } from '../../types/Banners';

const fetchHtmlContent = async (url: string): Promise<string> => {
	try {
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const html = await response.text();
		return html;
	} catch (error) {
		console.error('Error fetching the HTML content:', error);
		throw error;
	}
};

const parseDuration = (
	duration: string,
	isEndDuration: boolean = false,
	isAfterPatch: boolean = false
): string => {
	try {
		// Attempt to parse the date and convert to ISO string
		const date = new Date(duration);
		// Check if the date is valid
		if (!isNaN(date.getTime())) {
			if (isEndDuration) {
				date.setHours(17, 59, 59, 999);
			} else if (isAfterPatch) {
				date.setHours(6, 0, 0, 0);
			} else {
				date.setHours(18, 0, 0, 0);
			}
			return date.toISOString();
		}
		// If parsing fails or results in an invalid date, return the original string
		return duration;
	} catch (error) {
		// If any error occurs during parsing, return the original string
		return duration;
	}
};

const parseContentBanners = (html: string): ContentBanner[] => {
	const dom = new JSDOM(html);
	const document = dom.window._document;

	const banners: ContentBanner[] = [];
	const versionHeaders = document.querySelectorAll('h3');

	for (const header of versionHeaders) {
		if (header.textContent?.trim().includes('Character Event')) {
			break;
		}
		const version = header.textContent?.trim().replace('Version ', '') || '';

		const table = header.nextElementSibling?.nextElementSibling as HTMLTableElement;
		let dateAfterPatch: string = '';
		if (table && table.tagName === 'TABLE') {
			const rows = table.querySelectorAll('tbody tr');

			rows.forEach((row) => {
				const cells = row.querySelectorAll('td');
				if (cells.length >= 3) {
					const titleAttr = cells[0].querySelectorAll('a')[1]
						? cells[0].querySelectorAll('a')[1].getAttribute('title') || ''
						: cells[0].querySelectorAll('a')[0].getAttribute('title') || '';
					const name = titleAttr.split('/')[0].trim();
					const featured = Array.from(cells[1].querySelectorAll('.card-caption a')).map(
						(a) => toPascalCase(a.getAttribute('title')?.trim() || '')
					);
					const duration = cells[2].textContent?.trim() || '';
					const [startDuration, endDuration] = duration.split('–').map((d) => d.trim());
					if (dateAfterPatch === '') {
						dateAfterPatch = startDuration;
					}
					let type: ContentBanner['type'];
					if (name.includes('Epitome Invocation')) {
						type = 'Weapon';
					} else if (name === "Beginners' Wish") {
						type = 'Beginner';
					} else if (name.includes('Dawn Breeze')) {
						type = 'Chronicled';
					} else if (
						duration === 'Indefinite' ||
						name.includes('Wanderlust Invocation')
					) {
						type = 'Permanent';
					} else {
						type = 'Character';
					}

					banners.push({
						version,
						name,
						startDuration: parseDuration(
							startDuration,
							false,
							dateAfterPatch === startDuration
						),
						duration: parseDuration(endDuration, true),
						featured,
						type,
						id: toPascalCase(name) + version
					});
				}
			});
		}
	}

	return banners;
};

const WIKI_URL = 'https://genshin-impact.fandom.com/wiki/Wish/History';

const main = async () => {
	// get all banner from the wiki
	const html = await fetchHtmlContent(WIKI_URL);
	const banners = parseContentBanners(html);
	// save the file in the data/en/banners.json using bun
	write('./data/EN/banners.json', JSON.stringify({ banner: banners }, null, 2));
};

main();
