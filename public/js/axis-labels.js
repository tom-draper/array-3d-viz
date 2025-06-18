/**
 * @fileoverview Axis labeling functions for 3D visualization
 */

import { arrayShape } from './types.js';
import { scene } from './visualization.js';

/**
 * Creates axis coordinate labels
 * @param {import('./types.js').Coords} loc - Starting location
 * @param {import('./types.js').ArrayType} arr - Array to create labels for
 */
export function axisCoordinates(loc, arr) {
    let doubleAxisSize = 10;
    var loader = new THREE.FontLoader();
    loader.load("fonts/helvetiker_bold.typeface.json", function (font) {
        xAxisLabels(loc, arr, font, doubleAxisSize);
        yAxisLabels(loc, arr, font, doubleAxisSize);
        zAxisLabels(loc, arr, font, doubleAxisSize);
    });
}

/**
 * Creates X-axis labels based on array dimensions
 * @param {import('./types.js').Coords} loc - Starting location
 * @param {import('./types.js').ArrayType} arr - Array to label
 * @param {THREE.Font} font - Font to use for labels
 * @param {number} doubleAxisSize - Threshold for double axis labeling
 */
export function xAxisLabels(loc, arr, font, doubleAxisSize) {
    const shape = arrayShape(arr);
    switch (shape.length) {
        case 1:
            xAxisLabels1D(loc, arr, font);
            break;
        case 2:
            xAxisLabels2D(loc, arr, font, doubleAxisSize);
            break;
        case 3:
            xAxisLabels3D(loc, arr, font, doubleAxisSize);
            break;
    }
}

/**
 * Creates X-axis labels for 1D arrays
 * @param {import('./types.js').Coords} loc - Starting location
 * @param {import('./types.js').Array1D} arr - 1D array
 * @param {THREE.Font} font - Font to use
 */
export function xAxisLabels1D(loc, arr, font) {
    const [x, y, z] = loc;
    for (let i = 0; i < arr.length; i++) {
        const textsShapes = font.generateShapes(i.toString(), 0.3);
        const textsGeometry = new THREE.ShapeBufferGeometry(textsShapes);
        const textsMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        const text = new THREE.Mesh(textsGeometry, textsMaterial);
        text.position.set(x + i + 0.1, y - 0.4, z);
        scene.add(text);

        const textBehind = new THREE.Mesh(textsGeometry, textsMaterial);
        const depth = 1;
        textBehind.position.set(x + i + 0.9, y - 0.4, z - depth);
        textBehind.rotateY(Math.PI);
        scene.add(textBehind);
    }
}

/**
 * Creates X-axis labels for 2D arrays
 * @param {import('./types.js').Coords} loc - Starting location
 * @param {import('./types.js').Array2D} arr - 2D array
 * @param {THREE.Font} font - Font to use
 * @param {number} doubleAxisSize - Threshold for double axis labeling
 */
export function xAxisLabels2D(loc, arr, font, doubleAxisSize) {
    const [x, y, z] = loc;
    for (let i = 0; i < arr[0].length; i++) {
        const textsShapes = font.generateShapes(i.toString(), 0.3);
        const textsGeometry = new THREE.ShapeBufferGeometry(textsShapes);
        const textsMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        const text = new THREE.Mesh(textsGeometry, textsMaterial);
        text.position.set(x + i + 0.1, y - 0.4, z);
        scene.add(text);

        if (arr[0].length > doubleAxisSize) {
            const textAbove = new THREE.Mesh(textsGeometry, textsMaterial);
            textAbove.position.set(x + i + 0.1, y + arr.length + 0.1, z);
            scene.add(textAbove);
        }

        const textBehind = new THREE.Mesh(textsGeometry, textsMaterial);
        textBehind.position.set(x + i + 0.9, y - 0.4, z - 1);
        textBehind.rotateY(Math.PI);
        scene.add(textBehind);

        if (arr.length > doubleAxisSize) {
            const textBehindAbove = new THREE.Mesh(textsGeometry, textsMaterial);
            textBehindAbove.position.set(x + i + 0.9, y + arr.length + 0.1, z - 1);
            textBehindAbove.rotateY(Math.PI);
            scene.add(textBehindAbove);
        }
    }
}

/**
 * Creates X-axis labels for 3D arrays
 * @param {import('./types.js').Coords} loc - Starting location
 * @param {import('./types.js').Array3D} arr - 3D array
 * @param {THREE.Font} font - Font to use
 * @param {number} doubleAxisSize - Threshold for double axis labeling
 */
export function xAxisLabels3D(loc, arr, font, doubleAxisSize) {
    const [x, y, z] = loc;
    for (let i = 0; i < arr[0][0].length; i++) {
        const textsShapes = font.generateShapes(i.toString(), 0.3);
        const textsGeometry = new THREE.ShapeBufferGeometry(textsShapes);
        const textsMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        const text = new THREE.Mesh(textsGeometry, textsMaterial);
        text.position.set(x + i + 0.1, y - 0.4, z);
        scene.add(text);

        if (arr[0].length > doubleAxisSize) {
            const textAbove = new THREE.Mesh(textsGeometry, textsMaterial);
            textAbove.position.set(x + i + 0.1, y + arr[0].length + 0.1, z);
            scene.add(textAbove);
        }

        const textBehind = new THREE.Mesh(textsGeometry, textsMaterial);
        textBehind.position.set(x + i + 0.9, y - 0.4, z - arr.length);
        textBehind.rotateY(Math.PI);
        scene.add(textBehind);

        if (arr.length > doubleAxisSize) {
            const textBehindAbove = new THREE.Mesh(textsGeometry, textsMaterial);
            textBehindAbove.position.set(
                x + i + 0.9,
                y + arr[0].length + 0.1,
                z - arr.length
            );
            textBehindAbove.rotateY(Math.PI);
            scene.add(textBehindAbove);
        }
    }
}

/**
 * Creates Y-axis labels based on array dimensions
 * @param {import('./types.js').Coords} loc - Starting location
 * @param {import('./types.js').ArrayType} arr - Array to label
 * @param {THREE.Font} font - Font to use
 * @param {number} doubleAxisSize - Threshold for double axis labeling
 */
export function yAxisLabels(loc, arr, font, doubleAxisSize) {
    const shape = arrayShape(arr);
    switch (shape.length) {
        case 2:
            yAxisLabels2D(loc, arr, font, doubleAxisSize);
            break;
        case 3:
            yAxisLabels3D(loc, arr, font, doubleAxisSize);
            break;
    }
}

/**
 * Creates Y-axis labels for 2D arrays
 * @param {import('./types.js').Coords} loc - Starting location
 * @param {import('./types.js').Array2D} arr - 2D array
 * @param {THREE.Font} font - Font to use
 * @param {number} doubleAxisSize - Threshold for double axis labeling
 */
export function yAxisLabels2D(loc, arr, font, doubleAxisSize) {
    const [x, y, z] = loc;
    for (let i = 0; i < arr.length; i++) {
        const tickVal = (arr.length - 1 - i).toString();
        const nChars = Array.from(tickVal).length;
        const textsShapes = font.generateShapes(tickVal, 0.3);
        const textsGeometry = new THREE.ShapeBufferGeometry(textsShapes);
        const textsMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

        const text = new THREE.Mesh(textsGeometry, textsMaterial);
        text.position.set(x - 0.20 - 0.25 * nChars, y + i + 0.1, z);
        scene.add(text);

        if (arr.length > doubleAxisSize) {
            const textRight = new THREE.Mesh(textsGeometry, textsMaterial);
            textRight.position.set(x + arr[0].length + 0.15, y + i + 0.1, z);
            scene.add(textRight);
        }

        const textBehindRight = new THREE.Mesh(textsGeometry, textsMaterial);
        textBehindRight.position.set(x + arr[0].length + 0.25 + 0.25 * nChars, y + i + 0.1, z - 1);
        textBehindRight.rotateY(Math.PI);
        scene.add(textBehindRight);

        if (arr.length > doubleAxisSize) {
            const textBehind = new THREE.Mesh(textsGeometry, textsMaterial);
            textBehind.position.set(x - 0.15, y + i + 0.1, z - 1);
            textBehind.rotateY(Math.PI);
            scene.add(textBehind);
        }
    }
}

/**
 * Creates Y-axis labels for 3D arrays
 * @param {import('./types.js').Coords} loc - Starting location
 * @param {import('./types.js').Array3D} arr - 3D array
 * @param {THREE.Font} font - Font to use
 * @param {number} doubleAxisSize - Threshold for double axis labeling
 */
export function yAxisLabels3D(loc, arr, font, doubleAxisSize) {
    const [x, y, z] = loc;
    for (let i = 0; i < arr[0].length; i++) {
        const tickVal = (arr[0].length - 1 - i).toString();
        const nChars = Array.from(tickVal).length;
        const textsShapes = font.generateShapes(tickVal, 0.3);
        const textsGeometry = new THREE.ShapeBufferGeometry(textsShapes);
        const textsMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

        const text = new THREE.Mesh(textsGeometry, textsMaterial);
        text.position.set(x - 0.20 - 0.25 * nChars, y + i + 0.1, z);
        scene.add(text);

        if (arr.length > doubleAxisSize) {
            const textRight = new THREE.Mesh(textsGeometry, textsMaterial);
            textRight.position.set(x + arr[0][0].length + 0.15, y + i + 0.1, z);
            scene.add(textRight);
        }

        const textBehindRight = new THREE.Mesh(textsGeometry, textsMaterial);
        textBehindRight.position.set(
            x + arr[0][0].length + 0.25 + 0.25 * nChars,
            y + i + 0.1,
            z - arr.length
        );
        textBehindRight.rotateY(Math.PI);
        scene.add(textBehindRight);

        if (arr.length > doubleAxisSize) {
            const textBehind = new THREE.Mesh(textsGeometry, textsMaterial);
            textBehind.position.set(x - 0.15, y + i + 0.1, z - arr.length);
            textBehind.rotateY(Math.PI);
            scene.add(textBehind);
        }
    }
}

/**
 * Creates Z-axis labels based on array dimensions
 * @param {import('./types.js').Coords} loc - Starting location
 * @param {import('./types.js').ArrayType} arr - Array to label
 * @param {THREE.Font} font - Font to use
 * @param {number} doubleAxisSize - Threshold for double axis labeling
 */
export function zAxisLabels(loc, arr, font, doubleAxisSize) {
    const shape = arrayShape(arr);
    switch (shape.length) {
        case 3:
            zAxisLabels3D(loc, arr, font, doubleAxisSize);
            break;
    }
}

/**
 * Creates Z-axis labels for 3D arrays
 * @param {import('./types.js').Coords} loc - Starting location
 * @param {import('./types.js').Array3D} arr - 3D array
 * @param {THREE.Font} font - Font to use
 * @param {number} doubleAxisSize - Threshold for double axis labeling
 */
export function zAxisLabels3D(loc, arr, font, doubleAxisSize) {
    const [x, y, z] = loc;
    for (let i = 0; i < arr.length; i++) {
        const tickVal = i.toString();
        const textsShapes = font.generateShapes(tickVal, 0.3);
        const textsGeometry = new THREE.ShapeBufferGeometry(textsShapes);
        const textsMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });

        // Front-facing label
        const text = new THREE.Mesh(textsGeometry, textsMaterial);
        text.position.set(x, y - 0.4, z - i - 0.95);
        text.rotateY(-Math.PI / 2);
        scene.add(text);

        // Top-facing duplicate (if height is large)
        if (arr[0].length > doubleAxisSize) {
            const textAbove = new THREE.Mesh(textsGeometry, textsMaterial);
            textAbove.position.set(x, y + arr[0].length + 0.1, z - i - 0.95);
            textAbove.rotateY(-Math.PI / 2);
            scene.add(textAbove);
        }

        // Back-facing mirrored label
        const textBehind = new THREE.Mesh(textsGeometry, textsMaterial);
        textBehind.position.set(x + arr[0][0].length, y - 0.4, z - i - 0.05);
        textBehind.rotateY(Math.PI / 2);
        scene.add(textBehind);

        // Back-top-facing duplicate
        if (arr[0].length > doubleAxisSize) {
            const textBehindAbove = new THREE.Mesh(textsGeometry, textsMaterial);
            textBehindAbove.position.set(
                x + arr[0][0].length,
                y + arr[0].length + 0.1,
                z - i - 0.05
            );
            textBehindAbove.rotateY(Math.PI / 2);
            scene.add(textBehindAbove);
        }
    }
}