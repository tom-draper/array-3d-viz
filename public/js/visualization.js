/**
 * @fileoverview 3D visualization functions using Three.js
 * Optimized for large arrays using instanced rendering and minimal object creation
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
/** @type {THREE.InstancedMesh} */
export let instancedCubes;
/** @type {THREE.LineSegments} */
export let instancedWireframes;
/** @type {*} */
export let controls;
/** @type {Array<{value: number, index: number, position: THREE.Vector3}>} */
export let cubeData = [];
/** @type {THREE.Font} */
let cachedFont = null;

// Shared geometries and materials
const sharedGeometry = new THREE.BoxGeometry();
const sharedMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
});
const sharedWireframeMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });

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
    const points = [
        new THREE.Vector3(x1, y1, z1),
        new THREE.Vector3(x2, y2, z2)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
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
 * Pre-loads font for text rendering
 * @returns {Promise<THREE.Font>}
 */
function loadFont() {
    return new Promise((resolve, reject) => {
        if (cachedFont) {
            resolve(cachedFont);
            return;
        }
        
        const loader = new THREE.FontLoader();
        loader.load(
            "fonts/helvetiker_regular.typeface.json",
            (font) => {
                cachedFont = font;
                resolve(font);
            },
            undefined,
            reject
        );
    });
}

/**
 * Creates text labels for array elements with proper cube surface alignment
 * @param {Array<{value: number, position: THREE.Vector3}>} elements
 * @param {number} maxLabels - Maximum number of labels to create
 */
async function createOptimizedLabels(elements, maxLabels = 100) {
    try {
        const font = await loadFont();
        
        // Sample elements for labeling (take every nth element)
        const step = Math.max(1, Math.floor(elements.length / maxLabels));
        const sampledElements = elements.filter((_, index) => index % step === 0);
        
        for (const element of sampledElements) {
            const { value, position } = element;
            const nDigits = value.toString().includes(".") ? 7 : 5;
            const textShapes = font.generateShapes(
                value.toString().slice(0, nDigits + 1),
                0.15
            );
            
            const textGeometry = new THREE.ShapeBufferGeometry(textShapes);
            const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
            
            // Front-facing text - aligned to cube face
            const text = new THREE.Mesh(textGeometry, textMaterial);
            text.position.set(
                position.x - 0.45, // Adjust to align with cube surface
                position.y - 0.45,
                position.z + 0.51  // Just in front of cube face
            );
            scene.add(text);
            
            // Back-facing text - aligned to opposite cube face
            const textReverse = new THREE.Mesh(textGeometry, textMaterial.clone());
            textReverse.position.set(
                position.x + 0.45, // Align with back face
                position.y - 0.45,
                position.z - 0.51  // Just behind cube face
            );
            textReverse.rotateY(Math.PI);
            scene.add(textReverse);
        }
    } catch (error) {
        console.warn('Could not load font for labels:', error);
    }
}

/**
 * Creates individual cubes for proper transparency and text alignment
 * Uses a hybrid approach: individual cubes for smaller arrays, simplified rendering for larger ones
 * @param {Array<{position: THREE.Vector3, value: number, opacity: number}>} elements
 */
function createOptimizedCubes(elements) {
    const count = elements.length;
    
    // For smaller arrays, use individual cubes for proper transparency
    if (count <= 2000) {
        elements.forEach((element, i) => {
            const { position, opacity, value } = element;
            
            // Create cube with proper transparency
            const geometry = sharedGeometry.clone();
            const material = new THREE.MeshBasicMaterial({
                color: 0x00ff00,
                opacity: opacity,
                transparent: true,
            });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.copy(position);
            cube.value = value;
            scene.add(cube);
            
            // Store reference for later manipulation
            cubeData[i].mesh = cube;
            
            // Create wireframe
            const wireframe = new THREE.LineSegments(
                new THREE.EdgesGeometry(geometry),
                new THREE.LineBasicMaterial({ color: 0x00ff00 })
            );
            wireframe.position.copy(position);
            scene.add(wireframe);
        });
    } else {
        // For larger arrays, use instanced rendering but sacrifice some transparency precision
        instancedCubes = new THREE.InstancedMesh(sharedGeometry, sharedMaterial, count);
        
        const wireframeGeometry = new THREE.EdgesGeometry(sharedGeometry);
        instancedWireframes = new THREE.InstancedMesh(wireframeGeometry, sharedWireframeMaterial, count);
        
        const matrix = new THREE.Matrix4();
        const color = new THREE.Color();
        
        for (let i = 0; i < count; i++) {
            const { position, opacity } = elements[i];
            
            matrix.setPosition(position);
            instancedCubes.setMatrixAt(i, matrix);
            instancedWireframes.setMatrixAt(i, matrix);
            
            // Simulate transparency with brightness
            color.setRGB(0, opacity + 0.2, 0);
            instancedCubes.setColorAt(i, color);
            instancedWireframes.setColorAt(i, color);
            
            elements[i].instanceIndex = i;
        }
        
        instancedCubes.instanceMatrix.needsUpdate = true;
        instancedWireframes.instanceMatrix.needsUpdate = true;
        
        if (instancedCubes.instanceColor) {
            instancedCubes.instanceColor.needsUpdate = true;
        }
        if (instancedWireframes.instanceColor) {
            instancedWireframes.instanceColor.needsUpdate = true;
        }
        
        scene.add(instancedCubes);
        scene.add(instancedWireframes);
    }
}

/**
 * Visualizes a 1D array using instanced rendering
 * @param {import('./types.js').Coords} loc - Starting location
 * @param {import('./types.js').Array1D} arr - 1D array to visualize
 */
export function graph1DArray(loc, arr) {
    const [x, y, z] = loc;
    const [min, max] = minMax(arr);
    const elements = [];
    
    for (let i = 0; i < arr.length; i++) {
        const opacity = ((arr[i] - min) / (max - min)) * 0.8;
        const position = new THREE.Vector3(x + i + 0.5, y + 0.5, z - 0.5);
        
        elements.push({
            position,
            value: arr[i],
            opacity,
            coords: [x + i, y, z]
        });
        
        cubeData.push({
            value: arr[i],
            index: i,
            position
        });
    }
    
    createOptimizedCubes(elements);
    
    // Create labels for smaller arrays only
    if (arr.length <= 2000) {
        createOptimizedLabels(elements, arr.length);
    }
}

/**
 * Visualizes a 2D array using instanced rendering
 * @param {import('./types.js').Coords} loc - Starting location
 * @param {import('./types.js').Array2D} arr - 2D array to visualize
 */
export function graph2DArray(loc, arr) {
    const [x, y, z] = loc;
    const [min, max] = minMax([...arr.flat()]);
    const elements = [];
    
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr[0].length; j++) {
            const opacity = ((arr[i][j] - min) / (max - min)) * 0.8;
            const position = new THREE.Vector3(
                x + j + 0.5,
                y + arr.length - 1 - i + 0.5,
                z - 0.5
            );
            
            elements.push({
                position,
                value: arr[i][j],
                opacity,
                coords: [x + j, y + arr.length - 1 - i, z]
            });
            
            cubeData.push({
                value: arr[i][j],
                index: i * arr[0].length + j,
                position
            });
        }
    }
    
    createOptimizedCubes(elements);
    
    // Create labels for smaller arrays only
    const totalElements = arr.length * arr[0].length;
    if (totalElements <= 1000) {
        createOptimizedLabels(elements, totalElements);
    }
}

/**
 * Visualizes a 3D array using instanced rendering
 * @param {import('./types.js').Coords} loc - Starting location
 * @param {import('./types.js').Array3D} arr - 3D array to visualize
 */
export function graph3DArray(loc, arr) {
    let [x, y, z] = loc;
    const [min, max] = minMax([...arr.flat().flat()]);
    const elements = [];
    
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr[0].length; j++) {
            for (let k = 0; k < arr[0][0].length; k++) {
                let opacity = ((arr[i][j][k] - min) / (max - min)) * 0.8;
                const position = new THREE.Vector3(
                    x + k + 0.5,
                    y + arr[0].length - 1 - j + 0.5,
                    z - i - 0.5
                );
                
                elements.push({
                    position,
                    value: arr[i][j][k],
                    opacity,
                    coords: [x + k, y + arr[0].length - 1 - j, z - i]
                });
                
                cubeData.push({
                    value: arr[i][j][k],
                    index: i * arr[0].length * arr[0][0].length + j * arr[0][0].length + k,
                    position
                });
            }
        }
    }
    
    createOptimizedCubes(elements);
    
    // Only create labels for very small 3D arrays
    const totalElements = arr.length * arr[0].length * arr[0][0].length;
    if (totalElements <= 1000) {
        createOptimizedLabels(elements, totalElements);
    }
}

/**
 * Highlights cubes with a specific value
 * @param {number} value - Value to highlight
 */
export function highlightValue(value) {
    // Handle individual cubes
    cubeData.forEach(data => {
        if (data.mesh) {
            data.mesh.material.opacity = data.value === value ? 0.8 : 0.1;
        }
    });
    
    // Handle instanced cubes (for larger arrays)
    if (instancedCubes) {
        const color = new THREE.Color();
        for (let i = 0; i < cubeData.length; i++) {
            const isMatch = cubeData[i].value === value;
            color.setRGB(0, isMatch ? 0.8 : 0.1, 0);
            instancedCubes.setColorAt(i, color);
        }
        instancedCubes.instanceColor.needsUpdate = true;
    }
}

/**
 * Highlights cubes within a range
 * @param {number} low - Lower bound
 * @param {number} high - Upper bound
 */
export function highlightInequality(low, high) {
    // Handle individual cubes
    cubeData.forEach(data => {
        if (data.mesh) {
            const inRange = low < data.value && data.value < high;
            data.mesh.material.opacity = inRange ? 0.8 : 0.1;
        }
    });
    
    // Handle instanced cubes (for larger arrays)
    if (instancedCubes) {
        const color = new THREE.Color();
        for (let i = 0; i < cubeData.length; i++) {
            const inRange = low < cubeData[i].value && cubeData[i].value < high;
            color.setRGB(0, inRange ? 0.8 : 0.1, 0);
            instancedCubes.setColorAt(i, color);
        }
        instancedCubes.instanceColor.needsUpdate = true;
    }
}

/**
 * Resets cube opacity to original scale
 */
export function resetScale() {
    const [min, max] = minMax(cubeData.map(cube => cube.value));
    
    // Handle individual cubes
    cubeData.forEach(data => {
        if (data.mesh) {
            const opacity = ((data.value - min) / (max - min)) * 0.8;
            data.mesh.material.opacity = opacity;
        }
    });
    
    // Handle instanced cubes (for larger arrays)
    if (instancedCubes) {
        const color = new THREE.Color();
        for (let i = 0; i < cubeData.length; i++) {
            const opacity = ((cubeData[i].value - min) / (max - min)) * 0.8;
            color.setRGB(0, opacity + 0.2, 0);
            instancedCubes.setColorAt(i, color);
        }
        instancedCubes.instanceColor.needsUpdate = true;
    }
}

/**
 * Animation loop for rendering the 3D scene
 * Continuously updates and renders the scene using requestAnimationFrame
 */
export function animate() {
    requestAnimationFrame(animate);
    controls.update(); // Add this for smoother camera controls
    renderer.render(scene, camera);
}

/**
 * Handles window resize events by updating camera aspect ratio and renderer size
 * Should be called when the browser window is resized to maintain proper aspect ratio
 */
export function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Clears the scene of all cubes and resets data
 */
function clearScene() {
    // Clear individual cubes
    cubeData.forEach(data => {
        if (data.mesh) {
            scene.remove(data.mesh);
            data.mesh.geometry.dispose();
            data.mesh.material.dispose();
        }
    });
    
    // Clear instanced cubes
    if (instancedCubes) {
        scene.remove(instancedCubes);
        instancedCubes.dispose();
        instancedCubes = null;
    }
    
    if (instancedWireframes) {
        scene.remove(instancedWireframes);
        instancedWireframes.dispose();
        instancedWireframes = null;
    }
    
    cubeData = [];
    
    // Remove text labels and wireframes
    const objectsToRemove = scene.children.filter(child => 
        (child instanceof THREE.Mesh && child.geometry instanceof THREE.ShapeBufferGeometry) ||
        (child instanceof THREE.LineSegments && child.geometry instanceof THREE.EdgesGeometry)
    );
    objectsToRemove.forEach(mesh => {
        scene.remove(mesh);
        mesh.geometry.dispose();
        mesh.material.dispose();
    });
}

/**
 * Initializes the 3D visualization scene with the given array
 * Sets up renderer, scene, camera, controls, lighting, and visualizes the array based on its dimensions
 * @param {import('./types.js').Array1D|import('./types.js').Array2D|import('./types.js').Array3D} arr - Array to visualize (1D, 2D, or 3D)
 */
export function init(arr) {
    // Clear existing scene
    if (scene) {
        clearScene();
    }
    
    // Set up the Web GL renderer.
    if (!renderer) {
        renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x000000, 1); // Set black background
        renderer.autoClear = false;
        document.body.appendChild(renderer.domElement);
    }

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smoother camera movement
    controls.dampingFactor = 0.05;
    
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

/**
 * Creates and displays a distribution graph for array values using Plotly
 * For integer arrays, generates a bar chart showing frequency distribution of values
 * @param {import('./types.js').Array1D|import('./types.js').Array2D|import('./types.js').Array3D} arr - Array to analyze and graph
 */
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

        const sorted = Object.keys(data).sort((a, b) => Number(a) - Number(b)).reduce(
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
                tickmode: "array",
                tickvals: [min, max],
                ticktext: [min, max],
                tickfont: {
                    size: 10
                }
            }
        }

        Plotly.newPlot("graph", graphData, layout, { staticPlot: true });
    }
}

/**
 * Updates the DOM element displaying array dimensions with color-coded shape information
 * Shows array shape with color coding: red for 1D, green×red for 2D, blue×green×red for 3D
 * @param {import('./types.js').Array1D|import('./types.js').Array2D|import('./types.js').Array3D} arr - Array whose dimensions to display
 */
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