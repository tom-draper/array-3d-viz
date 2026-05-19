import { describe, it, expect } from 'vitest';
import { encodeArray, decodeArray } from '../public/js/url-state.js';

describe('encodeArray', () => {
    it('returns a non-empty string for a valid array', () => {
        expect(typeof encodeArray([1, 2, 3])).toBe('string');
        expect(encodeArray([1, 2, 3]).length).toBeGreaterThan(0);
    });

    it('returns null when the array JSON exceeds the size limit', () => {
        const big = Array.from({ length: 5000 }, (_, i) => i);
        expect(encodeArray(big)).toBe(null);
    });

    it('produces valid base64', () => {
        const encoded = encodeArray([1, 2, 3]);
        expect(() => atob(encoded)).not.toThrow();
    });
});

describe('decodeArray', () => {
    it('returns null for invalid base64', () => {
        expect(decodeArray('!!!not-base64!!!')).toBe(null);
    });

    it('returns null for valid base64 that is not JSON', () => {
        expect(decodeArray(btoa('not json {{}'))).toBe(null);
    });
});

describe('encodeArray / decodeArray round-trip', () => {
    it('round-trips a 1D integer array', () => {
        const arr = [1, 2, 3, 4, 5];
        expect(decodeArray(encodeArray(arr))).toEqual(arr);
    });

    it('round-trips a 2D array', () => {
        const arr = [[1, 2, 3], [4, 5, 6]];
        expect(decodeArray(encodeArray(arr))).toEqual(arr);
    });

    it('round-trips a 3D array', () => {
        const arr = [[[1, 2], [3, 4]], [[5, 6], [7, 8]]];
        expect(decodeArray(encodeArray(arr))).toEqual(arr);
    });

    it('round-trips float values', () => {
        const arr = [1.5, 2.718, 3.14159];
        const result = decodeArray(encodeArray(arr));
        result.forEach((v, i) => expect(v).toBeCloseTo(arr[i], 5));
    });

    it('round-trips negative values', () => {
        const arr = [-3, -2, -1, 0, 1];
        expect(decodeArray(encodeArray(arr))).toEqual(arr);
    });

    it('round-trips an array containing zeros', () => {
        const arr = [[0, 0], [0, 0]];
        expect(decodeArray(encodeArray(arr))).toEqual(arr);
    });

    it('produces a different encoding for different arrays', () => {
        expect(encodeArray([1, 2, 3])).not.toBe(encodeArray([4, 5, 6]));
    });
});
