/**
 * Checks if the input string is a valid JSON array with up to 3 dimensions.
 * @param {string} input - The input JSON string to validate.
 * @returns {boolean} - True if valid, false otherwise.
 */
export function validJSONArray(input) {
	try {
		const arr = JSON.parse(input);
		if (!Array.isArray(arr)) return false;
		if (getArrayShape(arr).length > 3) return false;
		return true;
	} catch {
		return false;
	}
}

/**
 * Determines the shape of a nested array.
 * @param {any} arr - The input array.
 * @returns {number[]} - The shape as an array of dimensions.
 */
function getArrayShape(arr) {
	const shape = [];
	let current = arr;

	while (Array.isArray(current)) {
		shape.push(current.length);
		current = current[0];
	}

	return shape;
}

/**
 * Validates whether the provided CSV string has consistent columns.
 * @param {string} csvText - The CSV string to validate.
 * @returns {boolean} - True if all rows have the same number of columns.
 */
export function validCSVArray(csvText) {
	const rows = csvText.trim().split("\n");
	if (rows.length === 0) return false;

	const columnCount = rows[0].split(",").length;

	for (let i = 1; i < rows.length; i++) {
		if (rows[i].split(",").length !== columnCount) {
			return false;
		}
	}

	return true;
}

/**
 * Parses a CSV string into a 1D or 2D array of numbers/strings.
 * @param {string} input - The CSV string to parse.
 * @returns {Array<string|number>[]|Array<string|number>} - Parsed array.
 */
export function parseCSVArray(input) {
	const rows = input.trim().split("\n");
	const data = rows.map(row =>
		row.split(",").map(value => tryParseNumber(value.trim()))
	);

	return data.length === 1 ? data[0] : data;
}

/**
 * Attempts to parse a string into a number. Returns original string if NaN.
 * @param {string} value - The string to parse.
 * @returns {number|string} - Parsed number or original string.
 */
export function tryParseNumber(value) {
	const result = parseFloat(value);
	return isNaN(result) ? value : result;
}

/**
 * Checks if a given string represents an integer.
 * @param {string} value - The string to check.
 * @returns {boolean} - True if the value is an integer, false otherwise.
 */
export function isInteger(value) {
	const x = parseFloat(value);
	return Number.isInteger(x);
}

/**
 * Compares two arrays for equality by checking length and element-wise equality.
 * @param {any[]} a - First array to compare
 * @param {any[]} b - Second array to compare
 * @returns {boolean} - True if arrays are equal, false otherwise
 */
export function arrayEquals(a, b) {
	return (
		a.length === b.length &&
		a.every(function (value, index) {
			return value === b[index];
		})
	);
}

/**
 * Determines the shape (dimensions) of a nested array structure.
 * Returns an array representing the size of each dimension, or false if dimensions are inconsistent.
 * @param {any[]} arr - The array to analyze
 * @returns {number[]|false} - Array of dimension sizes, or false if inconsistent structure
 */
export function arrayShape(arr) {
	if (!(arr) || !arr.length) {
		return [];
	}
	const dim = arr.reduce(function (result, current) {
		return arrayEquals(result, arrayShape(current)) ? result : false;
	}, arrayShape(arr[0]));
	return dim && [arr.length].concat(dim);
}

/**
 * Checks if all elements in an array are integers.
 * @param {any[]} arr - The array to check
 * @returns {boolean} - True if all elements are integers, false otherwise
 */
export function isIntegerArray(arr) {
	for (const value of arr) {
		if (!isInt(value)) {
			return false;
		}
	}
	return true;
}

/**
 * Helper function to check if a value is an integer.
 * Handles both numeric and string representations of numbers.
 * @param {any} value - The value to check
 * @returns {boolean} - True if the value is an integer, false otherwise
 */
function isInt(value) {
	if (isNaN(value)) {
		return false;
	}
	const x = parseFloat(value.toString());
	return (x | 0) === x;
}