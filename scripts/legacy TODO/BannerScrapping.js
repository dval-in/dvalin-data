
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const bannerWebsite = 'https://game8.co/games/Genshin-Impact/archives/297500';

const cheerio = require('cheerio');

const scrapeBanner = async () => {
	const response = await axios.get(bannerWebsite);
	const html = response.data;
	const $ = cheerio.load(html);

	const banners = [];

	$('table.a-table tbody tr').each(function () {
		// Skip the header row
		if ($(this).find('th').length) {
			return true;
		}

		const banner = {
			name: '',
			picture: '',
			featured: [],
			dates: '',
		};

		// Extract banner name and picture
		const bannerTd = $(this).find('td.center').first();
		banner.name = bannerTd.find('a.a-link').text().trim();
		banner.picture = bannerTd.find('img').attr('data-src');

		// Extract featured characters or items
		$(this).find('td').eq(1).find('div.align').each(function () {
			const featured = {
				name: $(this).find('a').text().trim(),
			};
			banner.featured.push(featured);
		});

		// Extract dates
		banner.dates = $(this).find('td').last().text().trim();

		banners.push(banner);
	});
	banners.shift(); // Removed beginer wish banner
	banners.shift(); // Removed unwanted table banner
	banners.shift(); // Removed unwanted table banner
	// reverse the array to get the oldest banner first
	banners.reverse();
	banners.shift();
	banners.shift();
	banners.shift();
	banners.shift();
	banners.shift();
	banners.shift();
	banners.shift();
	banners.shift();
	banners.shift();
	banners.shift();
	banners.shift();
	return banners;
};

const BannerKey = [];
const BannerFile = {};

function toPascalCase(str) {
	return str
		.replace(/[^a-zA-Z\s]/g, '')
		.split(' ')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join('');
}

function convertToDate(str) {
	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December',
		'Jan.',
		'Feb.',
		'Mar.',
		'Apr.',
		'May.',
		'Jun.',
		'Jul.',
		'Aug.',
		'Sep.',
		'Oct.',
		'Nov.',
		'Dec.',
	];
	const parts = str.split(' ');
	const monthPart = parts[0];
	const day = parseInt(parts[1], 10);
	const year = parseInt(parts[2], 10);

	// Adjust for abbreviated month names
	let month = monthNames.indexOf(monthPart);
	// If the month is found in the second half of the array (abbreviated names), adjust the index
	if (month > 11) {
		month -= 12;
	}

	// JavaScript counts months from 0 to 11
	return new Date(year, month, day);
}

scrapeBanner().then(banners => {
	banners.forEach(banner => {
		const finalBanner = {
			id: '',
			name: '',
			picture: '',
			featured: [],
			startTime: '',
			endTime: '',
		};

		finalBanner.name = banner.name;
		finalBanner.picture = banner.picture;
		finalBanner.featured = banner.featured.map(featured => toPascalCase(featured.name));
		let id = toPascalCase(banner.name);
		// Look the id in the BannerKey. If it doesn't exist, add a 1 to the id and add it to the BannerKey. If it has one or more increment the number and add it to the BannerKey
		let i = 1;
		while (BannerKey.includes(id + i)) {
			i++;
		}

		id += i;
		BannerKey.push(id);
		finalBanner.id = id;
		const dates = banner.dates.split(' - ');
		dates[0] = dates[0].replace(/\bPhase\s+\d+(?:\s*&\s*\d+)?(?:\s+(?=\S))?/, '').trim();
		dates[0] = dates[0].replace(/[<,]/g, '');
		dates[1] = dates[1].replace(/[<,]/g, '');
		dates[0] = convertToDate(dates[0]);
		dates[1] = convertToDate(dates[1]);
		finalBanner.startTime = dates[0];
		finalBanner.endTime = dates[1];
		BannerFile[id] = finalBanner;
	});
}).finally(() => {
	fs.readdirSync('./data').forEach(folder => {
		// Folder is a directory
		if (fs.lstatSync(path.join('./data', folder)).isDirectory()) {
			fs.writeFileSync(path.join('./data', folder, 'banners.json'), JSON.stringify(BannerFile, null, 2));
		}
	});
});

