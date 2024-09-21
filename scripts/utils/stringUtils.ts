/**
 * Checks if a given string is in PascalCase.
 * @param str - The string to check.
 * @returns True if the string is in PascalCase, false otherwise.
 */
export function isPascalCase(str: string): boolean {
	return /^[A-Z][a-z0-9]+(?:[A-Z][a-z0-9]+)*$/.test(str);
}

/**
 * Converts a given string to PascalCase.
 * @param str - The string to convert to PascalCase.
 * @returns The converted string in PascalCase.
 */
export function toPascalCase(str: string): string {
	return (str.charAt(0).toUpperCase() + str.slice(1))
		.replace("'", '')
		.replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
}

/**
 * Converts a given string to camelCase.
 * @param str - The string to convert to camelCase.
 * @returns The converted string in camelCase.
 */
export function toCamelCase(str: string): string {
	if (/^[a-z]+(?:[A-Z][a-z]*)*$/.test(str)) {
		return str;
	}

	const words = str
		.replace('-', '')
		.split(/[^a-zA-Z0-9]/)
		.filter(Boolean)
		.map((word, index) => {
			if (index === 0) {
				return word.toLowerCase();
			}
			return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
		});

	return words.join('');
}

/**
 * Replaces the Roman numeral at the end of a PascalCased series name with its Arabic numeral equivalent.
 * Handles Roman numerals from I to XX in mixed case due to PascalCasing.
 * @param seriesName - The PascalCased name of the series with a Roman numeral at the end.
 * @returns The series name with the Roman numeral at the end replaced by its Arabic numeral equivalent.
 */
export function replaceRomanNumeralsPascalCased(seriesName: string): string {
	const romanToNumber: { [key: string]: number } = {
		I: 1,
		II: 2,
		III: 3,
		IV: 4,
		V: 5,
		VI: 6,
		VII: 7,
		VIII: 8,
		IX: 9,
		X: 10,
		XI: 11,
		XII: 12,
		XIII: 13,
		XIV: 14,
		XV: 15,
		XVI: 16,
		XVII: 17,
		XVIII: 18,
		XIX: 19,
		XX: 20
	};

	const regex = /(I{1,3}|IV|V|VI{1,3}|IX|X)$/i;
	const match = seriesName.match(regex);

	if (!match) {
		return seriesName;
	}

	const romanNumeral = match[0].toUpperCase();
	const number = romanToNumber[romanNumeral];

	if (!number) {
		return seriesName;
	}

	return seriesName.substring(0, match.index) + number;
}
