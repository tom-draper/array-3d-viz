/**
 * @fileoverview Input validation and parsing utilities
 */

import { arrayShape } from './types.js';

/**
 * Validates if input string is a valid JSON array
 * @param {string} input - The input string to validate
 * @returns {boolean} True if valid JSON array with max 3 dimensions
 */
export function validJSONArray(input) {
    try {
        // Test if valid array syntax.
        const arr = JSON.parse(input);
        // Check max of 3 dimensions.
        if (arrayShape(arr).length > 3) {
            return false;
        }
    } catch (error) {
        return false;
    }
    return true;
}

/**
 * Validates if input string is a valid CSV array
 * @param {string} csvText - The CSV text to validate
 * @returns {boolean} True if valid CSV format
 */
export function validCSVArray(csvText) {
    // Split text by line to get rows
    const rows = csvText.trim().split("\n");

    // Check if there is at least one row
    if (rows.length < 1) return false;

    // Get the number of columns from the first row
    const columnCount = rows[0].split(",").length;

    // Validate each row has the same number of columns
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i].split(",");

        // Check if the current row has the expected number of columns
        if (row.length !== columnCount) {
            return false;
        }
    }

    return true;
}

/**
 * Parses CSV text into array format
 * @param {string} input - The CSV input string
 * @returns {Array1D | Array2D} Parsed array
 */
export function parseCSVArray(input) {
    // Split text by line to get rows
    const rows = input.trim().split("\n");

    // Map each row to an array of values by splitting on commas
    const data = rows.map(row => row.split(",").map(value => tryParseNumber(value.trim())));

    if (data.length == 1) {
        return data[0];
    } else {
        return data;
    }
}

/**
 * Attempts to parse a string as a number, returns original string if not numeric
 * @param {string} value - The value to parse
 * @returns {number | string} Parsed number or original string
 */
export function tryParseNumber(value) {
    const result = parseFloat(value);
    if (isNaN(result)) {
        return value;
    } else {
        return result;
    }
}

/**
 * Checks if a string represents an integer
 * @param {string} value - The string to check
 * @returns {boolean} True if string represents an integer
 */
export function isInteger(value) {
    const x = parseFloat(value);
    return (x | 0) === x;
}