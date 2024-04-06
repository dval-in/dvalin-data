import {toPascalCase} from './stringUtils.js';

/**
 * Transforms the achievements structure in the provided JSON.
 *
 * Achievements are grouped by their 'name' into arrays under each unique 'name' as the key.
 * This function navigates through the nested structure, collecting achievements under their
 * respective names.
 *
 * @param {Object} data - The original JSON data.
 * @returns {Object} The transformed JSON structure.
 */
const transformAchievements = data => {
	const finalData = {};

	Object.values(data).forEach(category => {
		const categoryName = toPascalCase(category.name);
		const transformed = {};
		category.achievements.forEach(achievement => {
			if (Array.isArray(achievement)) {
				// If the achievement itself is an array, iterate through each item
				achievement.forEach(item => {
					const name = toPascalCase(item.name);
					if (!transformed[name]) {
						transformed[name] = [];
					}

					transformed[name].push(item);
				});
			} else {
				// For single achievement objects
				const name = toPascalCase(achievement.name);
				if (!transformed[name]) {
					transformed[name] = [];
				}

				transformed[name].push(achievement);
			}
		});
		finalData[categoryName] = transformed;
	});

	return finalData;
};

// Example usage
const jsonData = {
	0: {
		name: 'Wonders of the World',
		achievements: [
			{
				id: 80091,
				name: 'Tales of Monstrous Madness',
				desc: 'Collect the entire "Toki Alley Tales" series.',
				reward: 5,
				ver: '2.0',
			},
			[
				{
					id: 80127,
					name: 'Zoo Tycoon',
					desc: 'Use the Omni-Ubiquity Net item to capture 1 wild animal.',
					reward: 5,
					ver: '2.3',
				},
				{
					id: 80128,
					name: 'Zoo Tycoon',
					desc: 'Use the Omni-Ubiquity Net item to capture 30 wild animals.',
					reward: 10,
					ver: '2.3',
				},
			],
			// Add the rest of your achievements here...
		],
	},
	// Add other categories if necessary...
};

const transformedData = transformAchievements(jsonData);
console.log(JSON.stringify(transformedData, null, 2));
