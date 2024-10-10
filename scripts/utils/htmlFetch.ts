import { JSDOM } from 'jsdom';
export const fetchHtmlContent = async (url: string): Promise<Document> => {
	try {
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const html = await response.text();
		const dom = new JSDOM(html);
		const document = dom.window.document;
		return document;
	} catch (error) {
		console.error('Error fetching the HTML content:', error);
		throw error;
	}
};
