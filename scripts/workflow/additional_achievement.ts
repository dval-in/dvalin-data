import { JSDOM } from 'jsdom';
import { toPascalCase, replaceRomanNumeralsPascalCased } from '../utils/stringUtils';
import { readJsonFile } from '../utils/fileUtils';

interface AchievementData {
	achievement: string;
	description: string;
	requirements: string;
	hidden?: string;
	type?: string;
	version?: string;
	primo: string;
	steps?: string[];
	id?: number;
	requirementQuestLink?: string;
}

const base_url = 'https://genshin-impact.fandom.com';

const fetchHtmlContent = async (url: string): Promise<string> => {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		return await response.text();
	} catch (error) {
		console.error('Error fetching the HTML content:', error);
		throw error;
	}
};

interface CategoryLink {
	href: string;
	text: string;
}

const fetchSteps = async (url: string): Promise<string[]> => {
	const fullUrl = new URL(url, base_url).toString();
	const html = await fetchHtmlContent(fullUrl);
	const dom = new JSDOM(html);
	const document = dom.window.document;

	const stepsHeading = document.querySelector('h2 > span.mw-headline[id="Steps"]');
	if (stepsHeading) {
		const olElement = stepsHeading.parentElement?.nextElementSibling;
		if (olElement && olElement.tagName.toLowerCase() === 'ol') {
			return Array.from(olElement.querySelectorAll('li')).map(
				(li: any) => li.textContent?.trim() || ''
			);
		}
	}
	return [];
};

const getAchievementCategories = async (): Promise<CategoryLink[]> => {
	const html = await fetchHtmlContent(base_url + '/wiki/Achievement');
	const dom = new JSDOM(html);
	const document = dom.window.document;

	const categories: CategoryLink[] = [];
	const categoryElements = document.querySelectorAll('tr > td > a');

	for (const categoryElement of categoryElements) {
		const href = categoryElement.getAttribute('href');
		const text = categoryElement.textContent?.trim() || '';
		if (href && href.startsWith('/wiki/')) {
			categories.push({ href, text: replaceRomanNumeralsPascalCased(toPascalCase(text)) });
		}
	}

	return categories;
};

const parseCategoryPage = async (url: string, category: string): Promise<AchievementData[]> => {
	const html = await fetchHtmlContent(url);
	const dom = new JSDOM(html);
	const document = dom.window.document;

	const tableRows = document.querySelectorAll('table.sortable > tbody > tr');
	if (tableRows.length === 0) {
		console.warn(`Warning: No table rows found for URL: ${url}`);
		return [];
	}
	const data: AchievementData[] = [];

	for (let i = 1; i < tableRows.length; i++) {
		const row = tableRows[i];
		const cells = row.querySelectorAll('td');
		let achievementData: AchievementData;
		if (category === 'WondersOfTheWorld') {
			achievementData = {
				achievement: cells[0].textContent?.trim() || '',
				description: cells[1].textContent?.trim() || '',
				requirements: cells[2].textContent?.trim() || '',
				hidden: cells[3].textContent?.trim() || '',
				type: cells[4].textContent?.trim() || '',
				version: cells[5].textContent?.trim() || '',
				primo: cells[6].textContent?.trim() || ''
			};
		} else if (category === 'MemoriesOfTheHeart') {
			achievementData = {
				achievement: cells[0].textContent?.trim() || '',
				description: cells[1].textContent?.trim() || '',
				requirements: cells[2].textContent?.trim() || '',
				hidden: cells[3].textContent?.trim() || '',
				version: cells[4].textContent?.trim() || '',
				primo: cells[5].textContent?.trim() || ''
			};
		} else {
			achievementData = {
				achievement: cells[0].textContent?.trim() || '',
				description: cells[1].textContent?.trim() || '',
				requirements: cells[2].textContent?.trim() || '',
				primo: cells[3].textContent?.trim() || ''
			};
		}

		// Check if the Requirements cell contains an <i> > <a> element
		const requirementLink = cells[2].querySelector('i > a');
		if (requirementLink) {
			const href = requirementLink.getAttribute('href');
			if (href) {
				achievementData.requirementQuestLink = href;
				achievementData.steps = await fetchSteps(href);
			}
		}

		data.push(achievementData);
	}

	return data;
};

const main = async () => {
	const categories = await getAchievementCategories();
	for (const category of categories) {
		const fullUrl = new URL(category.href, base_url).toString();
		console.log(`Parsing category: ${category.text}`);
		const currentData = await readJsonFile(
			`./data/EN/AchievementCategory/${category.text}.json`
		);
		if (currentData === undefined) {
			console.warn(`Warning: No data found for category: ${category.text}`);
			continue;
		}
		const achievementData: { id: number; name: string }[] = currentData.achievements.map(
			(achievement: {
				id: number;
				name: string;
				desc: string;
				reward: number;
				hidden: boolean;
				order: number;
			}) => {
				return {
					id: achievement.id,
					name: achievement.name
				};
			}
		);

		const categoryData = await parseCategoryPage(fullUrl, category.text);
		categoryData.forEach((data) => {
			const found = achievementData.find(
				(a) =>
					a.name.toLowerCase().replace(/[^a-z0-9]/g, '') ===
					data.achievement.toLowerCase().replace(/[^a-z0-9]/g, '')
			);
			if (found) {
				data.id = found.id;
			} else {
				console.warn(`Warning: Achievement not found: ${data.achievement}`);
			}
		});
		await Bun.write(
			`./data/EN/AchievementCategory/${category.text}Extra.json`,
			JSON.stringify(categoryData, null, 2)
		);
	}
};

main();
