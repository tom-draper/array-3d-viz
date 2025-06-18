/**
 * @fileoverview Type definitions and utility functions for array visualization
 */

/**
 * @typedef {number[]} Array1D
 */

/**
 * @typedef {number[][]} Array2D
 */

/**
 * @typedef {number[][][]} Array3D
 */

/**
 * @typedef {Array1D | Array2D | Array3D} ArrayType
 */

/**
 * @typedef {[number, number, number]} Coords
 */

/**
 * Checks if a value is an integer
 * @param {number} value - The value to check
 * @returns {boolean} True if the value is an integer
 */
export function isInt(value) {
    if (isNaN(value)) {
        return false;
    }
    const x = parseFloat(value.toString());
    return (x | 0) === x;
}

/**
 * Checks if an array contains only integers
 * @param {any[]} arr - The array to check
 * @returns {boolean} True if all values are integers
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
 * Checks if two arrays are equal
 * @param {any[]} a - First array
 * @param {any[]} b - Second array
 * @returns {boolean} True if arrays are equal
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
 * Gets the shape of an array (dimensions)
 * @param {any[] | number} arr - The array to analyze
 * @returns {number[]} Array representing the shape
 */
export function arrayShape(arr) {
    if (!(arr instanceof Array) || !arr.length) {
        return [];
    }
    const dim = arr.reduce(function (result, current) {
        return arrayEquals(result, arrayShape(current)) ? result : false;
    }, arrayShape(arr[0]));
    return dim && [arr.length].concat(dim);
}

/**
 * Finds minimum and maximum values in an array
 * @param {number[]} arr - Array of numbers
 * @returns {[number, number]} Tuple of [min, max]
 */
export function minMax(arr) {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < arr.length; i++) {
        const value = arr[i];
        if (isNumeric2(value)) {
            if (value < min) {
                min = value;
            }
            if (value > max) {
                max = value;
            }
        }
    }
    return [min, max];
}

/**
 * Checks if a string represents a numeric value
 * @param {string} str - String to check
 * @returns {boolean} True if string is numeric
 */
export function isNumeric(str) {
    if (typeof str != "string") return false;
    return (
        !isNaN(str) && 
        !isNaN(parseFloat(str))
    );
}

/**
 * Checks if a number is numeric and finite
 * @param {number} str - Number to check
 * @returns {boolean} True if number is valid
 */
export function isNumeric2(str) {
    return !isNaN(str) && isFinite(str);
}