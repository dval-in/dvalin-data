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
const toPascalCase = str => {
	if (isPascalCase(str)) {
		return str;
	}

	return str
		.split(/[^a-zA-Z0-9]/)
		.filter(Boolean)
		.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join('');
};

const isPascalCase = str => /^[A-Z][a-z]+(?:[A-Z][a-z]+)*$/.test(str);
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
	if (/^[a-z]+(?:[A-Z][a-z]*)*$/.test(str)) {
		return str;
	}

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

/**
 * Replaces the Roman numeral at the end of a PascalCased series name with its Arabic numeral equivalent.
 * Handles Roman numerals from I to X in mixed case due to PascalCasing.
 *
 * @param {string} seriesName - The PascalCased name of the series with a Roman numeral at the end.
 * @return {string} - The series name with the Roman numeral at the end replaced by its Arabic numeral equivalent.
 */
const replaceRomanNumeralsPascalCased = seriesName => {
	const romanToNumber = {
		I: 1, II: 2, III: 3, IV: 4,
		V: 5, VI: 6, VII: 7, VIII: 8,
		IX: 9, X: 10,
	};

	// Regular expression to match the Roman numeral at the end of the series name, case-insensitive
	const regex = /(I{1,3}|IV|V|VI{1,3}|IX|X)$/i;

	// Attempt to find the Roman numeral at the end, converting it to uppercase for matching
	const match = seriesName.match(regex);
	if (!match) {
		return seriesName;
	} // If no match, return the original series name

	const romanNumeral = match[0].toUpperCase();
	const number = romanToNumber[romanNumeral];
	if (!number) {
		return seriesName;
	} // If no numeral mapping, return the original series name

	// Replace the Roman numeral at the end with its Arabic numeral equivalent
	return seriesName.substring(0, match.index) + number;
};

export {
	toPascalCase, toCamelCase, replaceRomanNumeralsPascalCased, isPascalCase,
};
