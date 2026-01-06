/**
 * @fileoverview 3D visualization functions using Three.js
 * Optimized for large arrays using instanced rendering and minimal object creation
 */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js";
import { arrayShape, minMax } from './types.js';
import { isIntegerArray } from "./array-utils.js";

export class Vis {
    constructor() {
        this.camera = null;
        this.scene = null;
        this.renderer = null;
        this.instancedCubes = null;
        this.instancedWireframes = null;
        this.controls = null;
        this.cubeData = [];
        this.cachedFont = null;
        this.sharedGeometry = new THREE.BoxGeometry();
        this.sharedMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
        });
        this.sharedWireframeMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    }

    init(arr) {
        // Clear existing scene
        if (this.scene) {
            this.clearScene();
        }

        try {
            if (!this.renderer) {
                this.renderer = new THREE.WebGLRenderer({
                    antialias: true,
                    powerPreference: "high-performance"
                });
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.setClearColor(0x000000, 1); // Set black background
                this.renderer.autoClear = false;
                document.getElementById("dataViz").appendChild(this.renderer.domElement);
            }
        } catch (error) {
            console.warn(error);
            throw new Error("Could not find dataViz element");
        }

        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        let shape = arrayShape(arr);
        let nDim = shape.length;
        // Shape padded to 3D with 0s for non-existent dimensions.
        let shape3D = shape.concat(Array(3 - nDim).fill(0));
        shape3D[2] = Math.max(Math.max(...shape3D), 3);
        this.camera.position.set(shape3D[0], shape3D[1], shape3D[2]);

        let center = shape
            .concat(Array(3 - shape.length).fill(0))
            .map((x) => Math.floor(x / 2));

        switch (nDim) {
            case 3:
                // Negative z-index as array is build behind the x-axis line (negative z coords)
                this.camera.lookAt(new THREE.Vector3(center[2], center[1], -center[0]));
                this.controls.target.set(center[2], center[1], -center[0]);
                break;
            case 2:
                this.camera.lookAt(new THREE.Vector3(center[1], center[0], 0));
                this.controls.target.set(center[1], center[0], 0);
                break;
            default:
                this.camera.lookAt(new THREE.Vector3(center[0], 0, 0));
                this.controls.target.set(center[0], 0, 0);
                break;
        }

        this.graphAxisLines();

        switch (shape.length) {
            case 1:
                this.graph1DArray([0, 0, 0], arr);
                break;
            case 2:
                this.graph2DArray([0, 0, 0], arr);
                break;
            case 3:
                this.graph3DArray([0, 0, 0], arr);
                break;
        }

        // Add directional lighting to scene.
        let directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(10, 10, 0);
        directionalLight.intensity = 1.5;
        this.scene.add(directionalLight);
        let ambientLight = new THREE.AmbientLight();
        ambientLight.intensity = 0.2;
        this.scene.add(ambientLight);

        // Handle resizing of the browser window.
        window.addEventListener("resize", () => this.handleResize(), false);
    }

    animate() {
        this.renderer.setAnimationLoop(() => {
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        });
    }

    clearScene() {
        if (!this.scene) {
            return;
        }
        // Clear individual cubes
        this.cubeData.forEach(data => {
            if (data.mesh) {
                this.scene.remove(data.mesh);
                data.mesh.geometry.dispose();
                data.mesh.material.dispose();
            }
        });

        // Clear instanced cubes
        if (this.instancedCubes) {
            this.scene.remove(this.instancedCubes);
            this.instancedCubes.dispose();
            this.instancedCubes = null;
        }

        if (this.instancedWireframes) {
            this.scene.remove(this.instancedWireframes);
            this.instancedWireframes.dispose();
            this.instancedWireframes = null;
        }

        this.cubeData = [];

        // Remove text labels and wireframes
        const objectsToRemove = this.scene.children.filter(child =>
            (child instanceof THREE.Mesh && child.geometry instanceof THREE.ShapeBufferGeometry) ||
            (child instanceof THREE.LineSegments && child.geometry instanceof THREE.EdgesGeometry)
        );
        objectsToRemove.forEach(mesh => {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.scene = null;
    }

    handleResize() {
        if (this.camera && this.renderer) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    graphLine(x1, y1, z1, x2, y2, z2, color = 0xff0000) {
        const lineMaterial = new THREE.LineBasicMaterial({ color: color });
        const points = [
            new THREE.Vector3(x1, y1, z1),
            new THREE.Vector3(x2, y2, z2)
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, lineMaterial);
        this.scene.add(line);
    }

    graphAxisLines() {
        this.graphLine(-100, 0, 0, 100, 0, 0, 0xff0000);
        this.graphLine(0, -100, 0, 0, 100, 0, 0x00ff00);
        this.graphLine(0, 0, -100, 0, 0, 100, 0x0000ff);
    }

    loadFont() {
        return new Promise((resolve, reject) => {
            if (this.cachedFont) {
                resolve(this.cachedFont);
                return;
            }

            const loader = new THREE.FontLoader();
            loader.load(
                "fonts/helvetiker_regular.typeface.json",
                (font) => {
                    this.cachedFont = font;
                    resolve(font);
                },
                undefined,
                reject
            );
        });
    }

    async createOptimizedLabels(elements, maxLabels = 100) {
        try {
            const font = await this.loadFont();

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
                this.scene.add(text);

                // Back-facing text - aligned to opposite cube face
                const textReverse = new THREE.Mesh(textGeometry, textMaterial.clone());
                textReverse.position.set(
                    position.x + 0.45, // Align with back face
                    position.y - 0.45,
                    position.z - 0.51  // Just behind cube face
                );
                textReverse.rotateY(Math.PI);
                this.scene.add(textReverse);
            }
        } catch (error) {
            console.warn('Could not load font for labels:', error);
        }
    }

    createOptimizedCubes(elements) {
        const count = elements.length;

        // For smaller arrays, use individual cubes for proper transparency
        if (count <= 27_000) {
            elements.forEach((element, i) => {
                const { position, opacity, value } = element;

                // Create cube with proper transparency
                const geometry = this.sharedGeometry.clone();
                const material = new THREE.MeshBasicMaterial({
                    color: 0x00ff00,
                    opacity: opacity,
                    transparent: true,
                });
                const cube = new THREE.Mesh(geometry, material);
                cube.position.copy(position);
                cube.value = value;
                this.scene.add(cube);

                // Store reference for later manipulation
                this.cubeData[i].mesh = cube;

                // Create wireframe
                const wireframe = new THREE.LineSegments(
                    new THREE.EdgesGeometry(geometry),
                    new THREE.LineBasicMaterial({ color: 0x00ff00 })
                );
                wireframe.position.copy(position);
                this.scene.add(wireframe);
            });
        } else {
            // For larger arrays, use instanced rendering but sacrifice some transparency precision
            this.instancedCubes = new THREE.InstancedMesh(this.sharedGeometry, this.sharedMaterial, count);

            const wireframeGeometry = new THREE.EdgesGeometry(this.sharedGeometry);
            this.instancedWireframes = new THREE.InstancedMesh(wireframeGeometry, this.sharedWireframeMaterial, count);

            const matrix = new THREE.Matrix4();
            const color = new THREE.Color();

            for (let i = 0; i < count; i++) {
                const { position, opacity } = elements[i];

                matrix.setPosition(position);
                this.instancedCubes.setMatrixAt(i, matrix);
                this.instancedWireframes.setMatrixAt(i, matrix);

                // Simulate transparency with brightness
                color.setRGB(0, opacity, 0);
                this.instancedCubes.setColorAt(i, color);
                this.instancedWireframes.setColorAt(i, color);

                elements[i].instanceIndex = i;
            }

            this.instancedCubes.instanceMatrix.needsUpdate = true;
            this.instancedWireframes.instanceMatrix.needsUpdate = true;

            if (this.instancedCubes.instanceColor) {
                this.instancedCubes.instanceColor.needsUpdate = true;
            }
            if (this.instancedWireframes.instanceColor) {
                this.instancedWireframes.instanceColor.needsUpdate = true;
            }

            this.scene.add(this.instancedCubes);
            this.scene.add(this.instancedWireframes);
        }
    }

    graph1DArray(loc, arr) {
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

            this.cubeData.push({
                value: arr[i],
                index: i,
                position
            });
        }

        this.createOptimizedCubes(elements);

        // Create labels for smaller arrays only
        if (arr.length <= 2000) {
            this.createOptimizedLabels(elements, arr.length);
        }
    }

    graph2DArray(loc, arr) {
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

                this.cubeData.push({
                    value: arr[i][j],
                    index: i * arr[0].length + j,
                    position
                });
            }
        }

        this.createOptimizedCubes(elements);

        // Create labels for smaller arrays only
        const totalElements = arr.length * arr[0].length;
        if (totalElements <= 1000) {
            this.createOptimizedLabels(elements, totalElements);
        }
    }

    graph3DArray(loc, arr) {
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

                    this.cubeData.push({
                        value: arr[i][j][k],
                        index: i * arr[0].length * arr[0][0].length + j * arr[0][0].length + k,
                        position
                    });
                }
            }
        }

        this.createOptimizedCubes(elements);

        // Only create labels for very small 3D arrays
        const totalElements = arr.length * arr[0].length * arr[0][0].length;
        if (totalElements <= 1000) {
            this.createOptimizedLabels(elements, totalElements);
        }
    }

    highlightValue(value) {
        // Handle individual cubes
        this.cubeData.forEach(data => {
            if (data.mesh) {
                data.mesh.material.opacity = data.value === value ? 0.8 : 0.1;
            }
        });

        // Handle instanced cubes (for larger arrays)
        if (this.instancedCubes) {
            const color = new THREE.Color();
            for (let i = 0; i < this.cubeData.length; i++) {
                const isMatch = this.cubeData[i].value === value;
                color.setRGB(0, isMatch ? 0.8 : 0.1, 0);
                this.instancedCubes.setColorAt(i, color);
            }
            this.instancedCubes.instanceColor.needsUpdate = true;
        }
    }

    highlightInequality(low, high) {
        // Handle individual cubes
        this.cubeData.forEach(data => {
            if (data.mesh) {
                const inRange = low < data.value && data.value < high;
                data.mesh.material.opacity = inRange ? 0.8 : 0.1;
            }
        });

        // Handle instanced cubes (for larger arrays)
        if (this.instancedCubes) {
            const color = new THREE.Color();
            for (let i = 0; i < this.cubeData.length; i++) {
                const inRange = low < this.cubeData[i].value && this.cubeData[i].value < high;
                color.setRGB(0, inRange ? 0.8 : 0.1, 0);
                this.instancedCubes.setColorAt(i, color);
            }
            this.instancedCubes.instanceColor.needsUpdate = true;
        }
    }

    resetScale() {
        const [min, max] = minMax(this.cubeData.map(cube => cube.value));

        // Handle individual cubes
        this.cubeData.forEach(data => {
            if (data.mesh) {
                const opacity = ((data.value - min) / (max - min)) * 0.8;
                data.mesh.material.opacity = opacity;
            }
        });

        // Handle instanced cubes (for larger arrays)
        if (this.instancedCubes) {
            const color = new THREE.Color();
            for (let i = 0; i < this.cubeData.length; i++) {
                const opacity = ((this.cubeData[i].value - min) / (max - min)) * 0.8;
                color.setRGB(0, opacity + 0.2, 0);
                this.instancedCubes.setColorAt(i, color);
            }
            this.instancedCubes.instanceColor.needsUpdate = true;
        }
    }
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
