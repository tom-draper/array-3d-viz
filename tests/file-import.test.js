import { describe, it, expect } from 'vitest';
import { parseNpy } from '../public/js/file-import.js';

// Builds a minimal valid .npy v1 ArrayBuffer.
function buildNpyBuffer(flatData, dtype, shape) {
    const shapeStr = shape.length === 1
        ? `${shape[0]},`
        : shape.join(', ');
    const headerContent = `{'descr': '${dtype}', 'fortran_order': False, 'shape': (${shapeStr}), }`;

    // Header must be padded so that (10 + HEADER_LEN) is a multiple of 64.
    const rawLen = headerContent.length + 1; // +1 for the terminating newline
    const k = Math.ceil((rawLen + 10) / 64);
    const paddedLen = k * 64 - 10;
    const header = headerContent.padEnd(paddedLen - 1, ' ') + '\n';
    const headerBytes = new TextEncoder().encode(header);

    const TypedArrayMap = {
        '<f4': Float32Array,
        '<f8': Float64Array,
        '<i4': Int32Array,
        '<i2': Int16Array,
        '<i1': Int8Array,
        '<u1': Uint8Array,
        '<u4': Uint32Array,
    };
    const TypedArrayClass = TypedArrayMap[dtype];
    if (!TypedArrayClass) throw new Error(`Unknown dtype: ${dtype}`);
    const dataArr = new TypedArrayClass(flatData);

    const buffer = new ArrayBuffer(10 + headerBytes.length + dataArr.byteLength);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    bytes[0] = 0x93;
    bytes.set(new TextEncoder().encode('NUMPY'), 1);
    bytes[6] = 1; // major version
    bytes[7] = 0; // minor version
    view.setUint16(8, headerBytes.length, true);
    bytes.set(headerBytes, 10);
    bytes.set(new Uint8Array(dataArr.buffer), 10 + headerBytes.length);

    return buffer;
}

describe('parseNpy - validation', () => {
    it('throws when the magic bytes are missing', () => {
        const buf = new ArrayBuffer(64);
        expect(() => parseNpy(buf)).toThrow('Not a valid .npy file');
    });

    it('throws when the magic is almost correct but wrong first byte', () => {
        const buf = new ArrayBuffer(64);
        new Uint8Array(buf).set(new TextEncoder().encode('\x00NUMPY'));
        expect(() => parseNpy(buf)).toThrow('Not a valid .npy file');
    });
});

describe('parseNpy - 1D arrays', () => {
    it('parses a float32 (f4) 1D array', () => {
        const buf = buildNpyBuffer([1, 2, 3], '<f4', [3]);
        expect(parseNpy(buf)).toEqual([1, 2, 3]);
    });

    it('parses a float64 (f8) 1D array', () => {
        const buf = buildNpyBuffer([10, 20, 30], '<f8', [3]);
        expect(parseNpy(buf)).toEqual([10, 20, 30]);
    });

    it('parses an int32 (i4) 1D array', () => {
        const buf = buildNpyBuffer([5, 6, 7, 8], '<i4', [4]);
        expect(parseNpy(buf)).toEqual([5, 6, 7, 8]);
    });

    it('parses an int16 (i2) 1D array', () => {
        const buf = buildNpyBuffer([100, 200, 300], '<i2', [3]);
        expect(parseNpy(buf)).toEqual([100, 200, 300]);
    });

    it('parses a uint8 (u1) 1D array', () => {
        const buf = buildNpyBuffer([0, 128, 255], '<u1', [3]);
        expect(parseNpy(buf)).toEqual([0, 128, 255]);
    });

    it('parses negative integers', () => {
        const buf = buildNpyBuffer([-3, -2, -1, 0, 1], '<i4', [5]);
        expect(parseNpy(buf)).toEqual([-3, -2, -1, 0, 1]);
    });

    it('parses a single-element array', () => {
        const buf = buildNpyBuffer([42], '<i4', [1]);
        expect(parseNpy(buf)).toEqual([42]);
    });
});

describe('parseNpy - 2D arrays', () => {
    it('reshapes a flat buffer into a 2D array', () => {
        const buf = buildNpyBuffer([1, 2, 3, 4], '<i4', [2, 2]);
        expect(parseNpy(buf)).toEqual([[1, 2], [3, 4]]);
    });

    it('handles a non-square 2D array', () => {
        const buf = buildNpyBuffer([1, 2, 3, 4, 5, 6], '<f4', [2, 3]);
        expect(parseNpy(buf)).toEqual([[1, 2, 3], [4, 5, 6]]);
    });

    it('handles a tall (4x1) 2D array', () => {
        const buf = buildNpyBuffer([9, 8, 7, 6], '<i4', [4, 1]);
        expect(parseNpy(buf)).toEqual([[9], [8], [7], [6]]);
    });
});

describe('parseNpy - 3D arrays', () => {
    it('reshapes a flat buffer into a 3D array', () => {
        const buf = buildNpyBuffer([1, 2, 3, 4, 5, 6, 7, 8], '<f8', [2, 2, 2]);
        expect(parseNpy(buf)).toEqual([[[1, 2], [3, 4]], [[5, 6], [7, 8]]]);
    });

    it('handles a 2x3x4 shape', () => {
        const flat = Array.from({ length: 24 }, (_, i) => i);
        const buf = buildNpyBuffer(flat, '<i4', [2, 3, 4]);
        const result = parseNpy(buf);
        expect(result).toHaveLength(2);
        expect(result[0]).toHaveLength(3);
        expect(result[0][0]).toHaveLength(4);
        expect(result[0][0][0]).toBe(0);
        expect(result[1][2][3]).toBe(23);
    });
});

describe('parseNpy - float precision', () => {
    it('preserves float32 values to single precision', () => {
        const buf = buildNpyBuffer([1.5, 2.25, 3.125], '<f4', [3]);
        const result = parseNpy(buf);
        result.forEach((v, i) => expect(v).toBeCloseTo([1.5, 2.25, 3.125][i], 5));
    });

    it('preserves float64 values to double precision', () => {
        const buf = buildNpyBuffer([Math.PI, Math.E, Math.SQRT2], '<f8', [3]);
        const result = parseNpy(buf);
        expect(result[0]).toBeCloseTo(Math.PI, 10);
        expect(result[1]).toBeCloseTo(Math.E, 10);
        expect(result[2]).toBeCloseTo(Math.SQRT2, 10);
    });
});
