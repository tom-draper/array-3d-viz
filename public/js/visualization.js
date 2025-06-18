/**
 * @fileoverview 3D visualization functions using Three.js
 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js";
import { arrayShape, minMax } from './types.js';
import { isIntegerArray } from "./array-utils.js";

/** @type {THREE.Camera} */
export let camera;
/** @type {THREE.Scene} */
export let scene;
/** @type {THREE.WebGLRenderer} */
export let renderer;
/** @type {THREE.Mesh[]} */
export let cubes = [];
/** @type {*} */
export let controls;

/**
 * Creates a line between two 3D points
 * @param {number} x1 - Start X coordinate
 * @param {number} y1 - Start Y coordinate
 * @param {number} z1 - Start Z coordinate
 * @param {number} x2 - End X coordinate
 * @param {number} y2 - End Y coordinate
 * @param {number} z2 - End Z coordinate
 * @param {number} [color=0xff0000] - Line color
 */
export function graphLine(x1, y1, z1, x2, y2, z2, color = 0xff0000) {
    const lineMaterial = new THREE.LineBasicMaterial({ color: color });
    const geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(x1, y1, z1));
    geometry.vertices.push(new THREE.Vector3(x2, y2, z2));
    const line = new THREE.Line(geometry, lineMaterial);
    scene.add(line);
}

/**
 * Creates axis lines for the 3D scene
 */
export function graphAxisLines() {
    graphLine(-100, 0, 0, 100, 0, 0, 0xff0000);
    graphLine(0, -100, 0, 0, 100, 0, 0x00ff00);
    graphLine(0, 0, -100, 0, 0, 100, 0x0000ff);
}

/**
 * Creates a 3D cube element at specified location
 * @param {import('./types.js').Coords} loc - Location coordinates [x, y, z]
 * @param {number} value - The value to display
 * @param {number} opacity - Cube opacity (0-1)
 */
export function graphArrayElement(loc, value, opacity) {
    const [x, y, z] = loc;

    // Cube.
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        opacity: opacity,
        transparent: true,
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.set(x + 0.5, y + 0.5, z - 0.5);
    scene.add(cube);
    cube.value = value;
    cubes.push(cube);

    // Cube edges.
    const wireframe = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({ color: 0x00ff00 })
    );
    wireframe.position.set(x + 0.5, y + 0.5, z - 0.5);
    scene.add(wireframe);

    // Display element value.
    const loader = new THREE.FontLoader();
    loader.load("fonts/helvetiker_regular.typeface.json", function (font) {
        const nDigits = value.toString().includes(".") ? 7 : 5;
        const textsShapes = font.generateShapes(
            value.toString().slice(0, nDigits + 1),
            0.15
        );
        const textsGeometry = new THREE.ShapeBufferGeometry(textsShapes);
        const textsMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

        const text = new THREE.Mesh(textsGeometry, textsMaterial);
        text.position.set(x + 0.05, y + 0.05, z + 0.01);
        scene.add(text);

        const textReverse = new THREE.Mesh(textsGeometry, textsMaterial);
        textReverse.position.set(x + 0.95, y + 0.05, z - 1.01);
        textReverse.rotateY(Math.PI);
        scene.add(textReverse);
    });
}

/**
 * Visualizes a 1D array
 * @param {import('./types.js').Coords} loc - Starting location
 * @param {import('./types.js').Array1D} arr - 1D array to visualize
 */
export function graph1DArray(loc, arr) {
    const [x, y, z] = loc;
    const [min, max] = minMax(arr);
    for (let i = 0; i < arr.length; i++) {
        const opacity = ((arr[i] - min) / (max - min)) * 0.8;
        graphArrayElement([x + i, y, z], arr[i], opacity);
    }
}

/**
 * Visualizes a 2D array
 * @param {import('./types.js').Coords} loc - Starting location
 * @param {import('./types.js').Array2D} arr - 2D array to visualize
 */
export function graph2DArray(loc, arr) {
    const [x, y, z] = loc;
    const [min, max] = minMax([...arr.flat()]);
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr[0].length; j++) {
            const opacity = ((arr[i][j] - min) / (max - min)) * 0.8;
            graphArrayElement([x + j, y + arr.length - 1 - i, z], arr[i][j], opacity);
        }
    }
}

/**
 * Visualizes a 3D array
 * @param {import('./types.js').Coords} loc - Starting location
 * @param {import('./types.js').Array3D} arr - 3D array to visualize
 */
export function graph3DArray(loc, arr) {
    let [x, y, z] = loc;
    const [min, max] = minMax([...arr.flat().flat()]);
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr[0].length; j++) {
            for (let k = 0; k < arr[0][0].length; k++) {
                let opacity = ((arr[i][j][k] - min) / (max - min)) * 0.8;
                graphArrayElement(
                    [x + k, y + arr[0].length - 1 - j, z - i],
                    arr[i][j][k],
                    opacity
                );
            }
        }
    }
}

/**
 * Highlights cubes with a specific value
 * @param {number} value - Value to highlight
 */
export function highlightValue(value) {
    for (let i = 0; i < cubes.length; i++) {
        if (cubes[i].value === value) {
            cubes[i].material.opacity = 0.8;
        } else {
            cubes[i].material.opacity = 0;
        }
    }
}

/**
 * Highlights cubes within a range
 * @param {number} low - Lower bound
 * @param {number} high - Upper bound
 */
export function highlightInequality(low, high) {
    for (let i = 0; i < cubes.length; i++) {
        if (low < cubes[i].value && cubes[i].value < high) {
            cubes[i].material.opacity = 0.8;
        } else {
            cubes[i].material.opacity = 0;
        }
    }
}

/**
 * Resets cube opacity to original scale
 */
export function resetScale() {
    const [min, max] = minMax(cubes.map(cube => cube.value));

    for (let i = 0; i < cubes.length; i++) {
        let opacity = ((cubes[i].value - min) / (max - min)) * 0.8;
        cubes[i].material.opacity = opacity;
    }
}

/**
 * Animation loop
 */
export function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

/**
 * Handles window resize events
 */
export function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

export function init(arr) {
	// Set up the Web GL renderer.
	renderer = new THREE.WebGLRenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.autoClear = false;
	document.body.appendChild(renderer.domElement);

	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(
		60,
		window.innerWidth / window.innerHeight,
		0.1,
		1000
	);
	controls = new OrbitControls(camera, renderer.domElement);
	let shape = arrayShape(arr);
	let nDim = shape.length;
	// Shape padded to 3D with 0s for non-existent dimensions.
	let shape3D = shape.concat(Array(3 - nDim).fill(0));
	shape3D[2] = Math.max(Math.max(...shape3D), 3);
	camera.position.set(shape3D[0], shape3D[1], shape3D[2]);

	let center = shape
		.concat(Array(3 - shape.length).fill(0))
		.map((x) => Math.floor(x / 2));

	switch (nDim) {
		case 3:
			// Negative z-index as array is build behind the x-axis line (negative z coords)
			camera.lookAt(new THREE.Vector3(center[2], center[1], -center[0]));
			controls.target.set(center[2], center[1], -center[0]);
			break;
		case 2:
			camera.lookAt(new THREE.Vector3(center[1], center[0], 0));
			controls.target.set(center[1], center[0], 0);
			break;
		default:
			camera.lookAt(new THREE.Vector3(center[0], 0, 0));
			controls.target.set(center[0], 0, 0);
			break;
	}

	graphAxisLines();

	switch (shape.length) {
		case 1:
			graph1DArray([0, 0, 0], arr);
			break;
		case 2:
			graph2DArray([0, 0, 0], arr);
			break;
		case 3:
			graph3DArray([0, 0, 0], arr);
			break;
	}

	// Add directional lighting to scene.
	let directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
	directionalLight.position.set(10, 10, 0);
	directionalLight.intensity = 1.5;
	scene.add(directionalLight);
	let ambientLight = new THREE.AmbientLight();
	ambientLight.intensity = 0.2;
	scene.add(ambientLight);

	// Handle resizing of the browser window.
	window.addEventListener("resize", handleResize, false);
}

export function graphDistribution(arr) {
    const values = arr.flat().flat();
    if (isIntegerArray(values)) {
        // Count frequency of each value.
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        const data = {};
        for (const value of values) {
            data[value] ||= 0;
            data[value] += 1;
            if (value < min) {
                min = value;
            }
            if (value > max) {
                max = value;
            }
        }

        // Fill in any zeros
        for (let i = min; i <= max; i++) {
            data[i] ||= 0;
        }

        const sorted = Object.keys(data).sort().reduce(
            (obj, key) => {
                obj[key] = data[key];
                return obj;
            },
            {}
        );

        const graphData = [
            {
                x: Object.keys(sorted).map(Number),
                y: Object.values(sorted),
                type: 'bar',
                marker: {
                    color: 'rgb(0,255,0)',
                    opacity: 0.9,
                }
            }
        ]

        const layout = {
            height: 180,
            width: 270,
            margin: { t: 0, b: 20, r: 20, l: 20 },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            yaxis: {
                color: 'white',
                showgrid: false,
                zeroline: false,
                autotick: false,
                showticklabels: false
            },
            xaxis: {
                color: 'white',
                showgrid: false,
                zeroline: false,
                // autotick: false,
                // showticklabels: false,
                tickmode: "array",
                tickvals: [min, max],
                //@ts-ignore
                ticklabels: [min, max],
                tickfont: {
                    size: 10
                }
            }
        }

        Plotly.newPlot("graph", graphData, layout, { staticPlot: true });
    }
}

export function setArrayDimensions(arr) {
	const shape = arrayShape(arr);
	switch (shape.length) {
		case 1:
			document.getElementById("arrayShape").innerHTML = `<span class="red">${shape[0]}</span>`
			break;
		case 2:
			document.getElementById("arrayShape").innerHTML = `<span class="green">${shape[0]}</span><span class="multiply">×</span><span class="red">${shape[1]}</span>`
			break;
		case 3:
			document.getElementById("arrayShape").innerHTML = `<span class="blue">${shape[0]}</span><span class="multiply">×</span><span class="green">${shape[1]}</span><span class="multiply">×</span><span class="red">${shape[2]}</span>`
			break;
	}
}