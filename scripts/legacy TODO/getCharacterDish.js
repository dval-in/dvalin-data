const axios = require('axios');
const cheerio = require('cheerio');

const pascalCase = str => {
	if (typeof str !== 'string') {
		str = String(str);
	}

	return str.replace(/_/g, ' ') // Replace underscores with spaces
		.replace(/[_-]/g, ' ') // Replace underscores and dashes with spaces
		.replace(/'/g, '') // Remove apostrophes
		.split(' ') // Split into words
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter of each word
		.join(''); // Join without spaces
};

const getCharacterDish = async () => {
	const source = 'https://game8.co/games/Genshin-Impact/archives/315338';
	const response = await axios.get(source);
	const $ = cheerio.load(response.data);
	const h2 = $('h2').filter(function () {
		return $(this).text().trim() === 'List of Character Specialty Foods';
	});
	const table = h2.next('table');
	const tableData = [];

	table.find('tr').each(function () {
		const row = [];
		$(this).find('th, td').each(function (index) {
			if (index !== 1) {
				const text = $(this).text().trim();
				row.push(pascalCase(text));
			}
		});
		tableData.push(row);
	});
	const specialDishObj = Object.fromEntries(tableData);
	console.log(specialDishObj);
	return specialDishObj;
};

getCharacterDish();
