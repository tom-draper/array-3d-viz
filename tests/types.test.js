import { describe, it, expect } from 'vitest';
import { isInt, isIntegerArray, arrayEquals, arrayShape, minMax, isNumeric, isNumeric2 } from '../public/js/types.js';

describe('isInt', () => {
    it('returns true for a positive integer', () => expect(isInt(5)).toBe(true));
    it('returns true for zero', () => expect(isInt(0)).toBe(true));
    it('returns true for a negative integer', () => expect(isInt(-3)).toBe(true));
    it('returns false for a float', () => expect(isInt(5.5)).toBe(false));
    it('returns false for NaN', () => expect(isInt(NaN)).toBe(false));
});

describe('isIntegerArray', () => {
    it('returns true when all elements are integers', () => expect(isIntegerArray([1, 2, 3])).toBe(true));
    it('returns false when any element is a float', () => expect(isIntegerArray([1, 2.5, 3])).toBe(false));
    it('returns true for an empty array', () => expect(isIntegerArray([])).toBe(true));
});

describe('arrayEquals', () => {
    it('returns true for equal arrays', () => expect(arrayEquals([1, 2, 3], [1, 2, 3])).toBe(true));
    it('returns true for empty arrays', () => expect(arrayEquals([], [])).toBe(true));
    it('returns false for different lengths', () => expect(arrayEquals([1, 2], [1, 2, 3])).toBe(false));
    it('returns false for different values', () => expect(arrayEquals([1, 2, 3], [1, 2, 4])).toBe(false));
});

describe('arrayShape', () => {
    it('returns [n] for a 1D array', () => expect(arrayShape([1, 2, 3])).toEqual([3]));
    it('returns [m, n] for a 2D array', () => expect(arrayShape([[1, 2], [3, 4], [5, 6]])).toEqual([3, 2]));
    it('returns [x, y, z] for a 3D array', () => expect(arrayShape([[[1], [2]], [[3], [4]]])).toEqual([2, 2, 1]));
    it('returns [] for an empty array', () => expect(arrayShape([])).toEqual([]));
    it('returns false for a ragged array', () => expect(arrayShape([[1, 2], [3]])).toBe(false));
});

describe('minMax', () => {
    it('returns the min and max of a basic array', () => expect(minMax([3, 1, 4, 1, 5, 9])).toEqual([1, 9]));
    it('handles a single element', () => expect(minMax([7])).toEqual([7, 7]));
    it('handles negative numbers', () => expect(minMax([-3, -1, -2])).toEqual([-3, -1]));
    it('skips Infinity', () => expect(minMax([1, Infinity, 2])).toEqual([1, 2]));
    it('skips NaN', () => expect(minMax([1, NaN, 2])).toEqual([1, 2]));
});

describe('isNumeric', () => {
    it('returns true for integer strings', () => expect(isNumeric('42')).toBe(true));
    it('returns true for float strings', () => expect(isNumeric('3.14')).toBe(true));
    it('returns true for negative number strings', () => expect(isNumeric('-5')).toBe(true));
    it('returns false for non-numeric strings', () => expect(isNumeric('hello')).toBe(false));
    it('returns false for non-string values', () => expect(isNumeric(42)).toBe(false));
    it('returns false for empty string', () => expect(isNumeric('')).toBe(false));
});

describe('isNumeric2', () => {
    it('returns true for finite numbers', () => expect(isNumeric2(42)).toBe(true));
    it('returns true for floats', () => expect(isNumeric2(3.14)).toBe(true));
    it('returns false for NaN', () => expect(isNumeric2(NaN)).toBe(false));
    it('returns false for Infinity', () => expect(isNumeric2(Infinity)).toBe(false));
    it('returns false for negative Infinity', () => expect(isNumeric2(-Infinity)).toBe(false));
});
