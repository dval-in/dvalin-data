/**
 * Converts a given string to PascalCase.
 *
 * This function splits the input string into words separated by non-alphanumeric characters,
 * capitalizes the first letter of each word, and then concatenates them together.
 * It effectively handles phrases, consecutive non-alphanumeric characters, and ensures
 * the output starts with an uppercase letter.
 *
 * @param {string} str - The string to convert to PascalCase.
 * @returns {string} The converted string in PascalCase.
 */
const toPascalCase = str => str
	.split(/[^a-zA-Z0-9]/)
	.filter(Boolean)
	.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
	.join('');

/**
 * Converts a given string to camelCase.
 *
 * This function splits the input string into words separated by non-alphanumeric characters.
 * The first word is made lowercase, and for the subsequent words, the first letter is capitalized.
 * It effectively handles phrases, consecutive non-alphanumeric characters, and ensures
 * the output starts with a lowercase letter, following camelCase conventions.
 *
 * @param {string} str - The string to convert to camelCase.
 * @returns {string} The converted string in camelCase.
 */
const toCamelCase = str => {
	const words = str
		.split(/[^a-zA-Z0-9]/)
		.filter(Boolean)
		.map((word, index) => {
			if (index === 0) {
				return word.toLowerCase();
			}

			return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
		});

	return words.join('');
};

export {toPascalCase, toCamelCase};
