import { toPascalCase } from '../utils/stringUtils';
import { write } from 'bun';
import { ContentBanner } from '../../types/Banners';
import { fetchHtmlContent } from '../utils/htmlFetch';

const serverTimeToUTC = (dateString, isNAServer = true) => {
	if (dateString === 'Indefinite') {
		return dateString;
	}

	const date = new Date(dateString);

	// Determine if it's during Daylight Saving Time
	const isDST = (date) => {
		const jan = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
		const jul = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();
		return Math.max(jan, jul) !== date.getTimezoneOffset();
	};

	let offset = isNAServer ? (isDST(date) ? 5 : 6) : -8;
	date.setHours(date.getHours() + offset);

	return date.toISOString();
};

const parseContentBanners = async (document: Document): Promise<ContentBanner[]> => {
	const banners: ContentBanner[] = [];
	const versionHeaders = document.querySelectorAll('h3');

	for (const header of versionHeaders) {
		if (header.textContent?.trim().includes('Character Event')) {
			break;
		}
		const version = header.textContent?.trim().replace('Version ', '') || '';

		const table = header.nextElementSibling?.nextElementSibling as HTMLTableElement;
		if (table && table.tagName === 'TABLE') {
			const rows = table.querySelectorAll('tbody tr');

			const rowPromises = Array.from(rows).map(async (row) => {
				const cells = row.querySelectorAll('td');
				if (cells.length >= 3) {
					const titleAttr = cells[0].querySelectorAll('a')[1]
						? cells[0].querySelectorAll('a')[1].getAttribute('title') || ''
						: cells[0].querySelectorAll('a')[0].getAttribute('title') || '';
					const titleHref = cells[0].querySelectorAll('a')[1]
						? cells[0].querySelectorAll('a')[1].getAttribute('href') || ''
						: cells[0].querySelectorAll('a')[0].getAttribute('href') || '';

					const bannerDocument = await fetchHtmlContent(
						`https://genshin-impact.fandom.com${titleHref}`
					);
					const startDurationElement = bannerDocument.querySelector(
						'td[data-source="time_start"]'
					);
					const startDuration = serverTimeToUTC(
						startDurationElement ? startDurationElement.textContent?.trim() : null,
						false
					);
					const endDurationElement = bannerDocument.querySelector(
						'td[data-source="time_end"]'
					);
					const endDuration = serverTimeToUTC(
						endDurationElement ? endDurationElement.textContent?.trim() : null
					);
					const linkHref = bannerDocument
						.querySelector('div[data-source="link"] a.external')
						?.getAttribute('href');
					const name = titleAttr.split('/')[0].trim();
					const featured = Array.from(cells[1].querySelectorAll('.card-caption a')).map(
						(a) => toPascalCase(a.getAttribute('title')?.trim() || '')
					);
					const duration = cells[2].textContent?.trim() || '';

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

					return {
						version,
						name,
						startDuration: startDuration ?? 'Indefinite',
						duration: endDuration ?? 'Indefinite',
						featured,
						type,
						link: linkHref ?? '',
						id: toPascalCase(name) + version
					};
				}
			});

			const rowResults = await Promise.all(rowPromises);
			banners.push(...(rowResults.filter(Boolean) as ContentBanner[]));
		}
	}

	return banners;
};

const WIKI_URL = 'https://genshin-impact.fandom.com/wiki/Wish/History';

const main = async () => {
	// get all banner from the wiki
	const document = await fetchHtmlContent(WIKI_URL);
	const banners = await parseContentBanners(document);
	// save the file in the data/en/banners.json using bun
	console.log(banners);
	write('./data/EN/Banners.json', JSON.stringify({ banner: banners }, null, 2));
};

main();
