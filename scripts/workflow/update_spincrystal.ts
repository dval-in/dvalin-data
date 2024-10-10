import { fetchHtmlContent } from '../utils/htmlFetch';

interface SpincrystalData {
	id: string;
	track: string;
	source: string;
	region: string;
}

const url = 'https://genshin-impact.fandom.com/wiki/Radiant_Spincrystal';

const parseData = async (url: string): Promise<SpincrystalData[]> => {
	const document = await fetchHtmlContent(url);

	const table = document.querySelector(`table.sortable`);
	if (table === null) {
		console.warn(`Warning: No table found for URL: ${url}`);
		return [];
	}

	const tableRows = table.querySelectorAll('tbody > tr');
	const data: SpincrystalData[] = [];
	for (let i = 1; i < tableRows.length; i++) {
		const row = tableRows[i];
		const cells = row.querySelectorAll('td');
		let spincrystal: SpincrystalData;
		spincrystal = {
			id: cells[0].textContent?.trim().match(/\d+/)?.[0] || '',
			track: cells[1].textContent?.trim() || '',
			source: cells[2].textContent?.trim() || '',
			region: cells[3].textContent?.trim() || ''
		};
		data.push(spincrystal);
	}
	return data;
};

const main = async () => {
	const data = await parseData(url);
	await Bun.write('./data/EN/RadiantSpincrystal.json', JSON.stringify(data, null, 2));
};

main();
