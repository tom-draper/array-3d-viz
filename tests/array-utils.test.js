import { describe, it, expect } from 'vitest';
import {
    validJSONArray,
    validCSVArray,
    parseCSVArray,
    tryParseNumber,
    isInteger,
    arrayEquals,
    arrayShape,
    isIntegerArray,
} from '../public/js/array-utils.js';

describe('validJSONArray', () => {
    it('accepts a 1D array', () => expect(validJSONArray('[1,2,3]')).toBe(true));
    it('accepts a 2D array', () => expect(validJSONArray('[[1,2],[3,4]]')).toBe(true));
    it('accepts a 3D array', () => expect(validJSONArray('[[[1,2],[3,4]],[[5,6],[7,8]]]')).toBe(true));
    it('rejects a 4D array', () => expect(validJSONArray('[[[[1]]]]')).toBe(false));
    it('rejects invalid JSON', () => expect(validJSONArray('[1,2,')).toBe(false));
    it('rejects a non-array JSON value', () => expect(validJSONArray('{"a":1}')).toBe(false));
    it('rejects a plain number', () => expect(validJSONArray('42')).toBe(false));
});

describe('validCSVArray', () => {
    it('accepts a single row', () => expect(validCSVArray('1,2,3')).toBe(true));
    it('accepts multiple rows with consistent columns', () => expect(validCSVArray('1,2,3\n4,5,6')).toBe(true));
    it('rejects rows with inconsistent column counts', () => expect(validCSVArray('1,2,3\n4,5')).toBe(false));
});

describe('parseCSVArray', () => {
    it('parses a single row into a 1D array', () => {
        expect(parseCSVArray('1,2,3')).toEqual([1, 2, 3]);
    });
    it('parses multiple rows into a 2D array', () => {
        expect(parseCSVArray('1,2,3\n4,5,6')).toEqual([[1, 2, 3], [4, 5, 6]]);
    });
    it('parses float strings', () => {
        expect(parseCSVArray('1.5,2.7')).toEqual([1.5, 2.7]);
    });
    it('preserves non-numeric strings', () => {
        expect(parseCSVArray('a,b,c')).toEqual(['a', 'b', 'c']);
    });
    it('trims whitespace around values', () => {
        expect(parseCSVArray(' 1 , 2 , 3 ')).toEqual([1, 2, 3]);
    });
});

describe('tryParseNumber', () => {
    it('parses integer strings', () => expect(tryParseNumber('42')).toBe(42));
    it('parses float strings', () => expect(tryParseNumber('3.14')).toBe(3.14));
    it('parses negative numbers', () => expect(tryParseNumber('-7')).toBe(-7));
    it('returns the original string when non-numeric', () => expect(tryParseNumber('hello')).toBe('hello'));
});

describe('isInteger', () => {
    it('returns true for whole number strings', () => expect(isInteger('5')).toBe(true));
    it('returns true for negative integer strings', () => expect(isInteger('-3')).toBe(true));
    it('returns false for float strings', () => expect(isInteger('5.5')).toBe(false));
});

describe('arrayEquals', () => {
    it('returns true for equal arrays', () => expect(arrayEquals([1, 2, 3], [1, 2, 3])).toBe(true));
    it('returns true for empty arrays', () => expect(arrayEquals([], [])).toBe(true));
    it('returns false for different lengths', () => expect(arrayEquals([1, 2], [1, 2, 3])).toBe(false));
    it('returns false for different values', () => expect(arrayEquals([1, 2, 3], [1, 2, 4])).toBe(false));
});

describe('arrayShape', () => {
    it('returns [n] for a 1D array', () => expect(arrayShape([1, 2, 3])).toEqual([3]));
    it('returns [m, n] for a 2D array', () => expect(arrayShape([[1, 2], [3, 4]])).toEqual([2, 2]));
    it('returns [x, y, z] for a 3D array', () => expect(arrayShape([[[1, 2], [3, 4]], [[5, 6], [7, 8]]])).toEqual([2, 2, 2]));
    it('returns [] for an empty array', () => expect(arrayShape([])).toEqual([]));
    it('returns false for a ragged (inconsistent) array', () => expect(arrayShape([[1, 2], [3]])).toBe(false));
});

describe('isIntegerArray', () => {
    it('returns true when all values are integers', () => expect(isIntegerArray([1, 2, 3])).toBe(true));
    it('returns false when any value is a float', () => expect(isIntegerArray([1, 2.5, 3])).toBe(false));
    it('returns true for an empty array', () => expect(isIntegerArray([])).toBe(true));
});
