/**
 * Parse a .npy file ArrayBuffer into a nested JS array.
 * Supports dtypes: float32, float64, int8/16/32/64, uint8/16/32/64.
 */
export function parseNpy(buffer) {
    const bytes = new Uint8Array(buffer);

    // Validate magic: \x93NUMPY
    if (bytes[0] !== 0x93 || String.fromCharCode(...bytes.slice(1, 6)) !== 'NUMPY') {
        throw new Error('Not a valid .npy file');
    }

    const major = bytes[6];
    const view = new DataView(buffer);
    const headerLen = major === 1 ? view.getUint16(8, true) : view.getUint32(8, true);
    const headerOffset = major === 1 ? 10 : 12;

    const header = new TextDecoder().decode(bytes.slice(headerOffset, headerOffset + headerLen));

    const shapeMatch = header.match(/'shape':\s*\(([^)]*)\)/);
    const shapeStr = shapeMatch ? shapeMatch[1].trim() : '';
    const shape = shapeStr
        ? shapeStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
        : [1];

    const dtypeMatch = header.match(/'descr':\s*'([^']+)'/);
    if (!dtypeMatch) throw new Error('Could not parse dtype from .npy header');
    const dtype = dtypeMatch[1];

    const dataBuffer = buffer.slice(headerOffset + headerLen);
    const flat = readTypedArray(dtype, dataBuffer);

    return reshapeArray(flat, shape);
}

function readTypedArray(dtype, buffer) {
    const typeChar = dtype.slice(-2);
    switch (typeChar) {
        case 'f4': return Array.from(new Float32Array(buffer));
        case 'f8': return Array.from(new Float64Array(buffer));
        case 'i1': return Array.from(new Int8Array(buffer));
        case 'i2': return Array.from(new Int16Array(buffer));
        case 'i4': return Array.from(new Int32Array(buffer));
        case 'u1': return Array.from(new Uint8Array(buffer));
        case 'u2': return Array.from(new Uint16Array(buffer));
        case 'u4': return Array.from(new Uint32Array(buffer));
        case 'i8': return Array.from(new BigInt64Array(buffer), v => Number(v));
        case 'u8': return Array.from(new BigUint64Array(buffer), v => Number(v));
        default: throw new Error(`Unsupported dtype: ${dtype}`);
    }
}

function reshapeArray(flat, shape) {
    if (shape.length === 0) return flat[0] ?? 0;
    if (shape.length === 1) return flat;
    const chunkSize = flat.length / shape[0];
    return Array.from({ length: shape[0] }, (_, i) =>
        reshapeArray(flat.slice(i * chunkSize, (i + 1) * chunkSize), shape.slice(1))
    );
}

/**
 * Read a dropped File and return its contents.
 * .npy files resolve to a nested array; all others resolve to a text string.
 */
export function readFile(file) {
    return new Promise((resolve, reject) => {
        const ext = file.name.split('.').pop().toLowerCase();
        const reader = new FileReader();
        reader.onerror = reject;

        if (ext === 'npy') {
            reader.onload = e => {
                try {
                    resolve({ type: 'array', data: parseNpy(e.target.result) });
                } catch (err) {
                    reject(err);
                }
            };
            reader.readAsArrayBuffer(file);
        } else if (ext === 'json' || ext === 'csv') {
            reader.onload = e => resolve({ type: 'text', data: e.target.result });
            reader.readAsText(file);
        } else {
            reject(new Error(`Unsupported file type: .${ext}. Use .json, .csv, or .npy`));
        }
    });
}
