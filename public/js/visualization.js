import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { arrayShape, minMax } from './types.js';
import { isIntegerArray } from "./array-utils.js";

let xGraph = [];

export class Vis {
    constructor() {
        this.camera = null;
        this.scene = null;
        this.renderer = null;
        this.instancedCubes = null;
        this.controls = null;
        this.cubeData = [];
        this.cachedFont = null;
        this.sharedGeometry = new THREE.BoxGeometry();
        this.activeSlices = { x: null, y: null, z: null };
        this.handleResizeBound = this.handleResize.bind(this);
    }

    init(arr) {
        if (this.scene) {
            this.clearScene();
        }

        try {
            if (!this.renderer) {
                this.renderer = new THREE.WebGLRenderer({
                    antialias: true,
                    powerPreference: "high-performance"
                });
                this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                this.renderer.setSize(window.innerWidth, window.innerHeight);
                this.renderer.setClearColor(0x000000, 1);
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
        let shape3D = shape.concat(Array(3 - nDim).fill(0));
        shape3D[2] = Math.max(Math.max(...shape3D), 3);
        this.camera.position.set(shape3D[0], shape3D[1], shape3D[2]);

        let center = shape
            .concat(Array(3 - shape.length).fill(0))
            .map((x) => Math.floor(x / 2));

        switch (nDim) {
            case 3:
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

        let directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(10, 10, 0);
        directionalLight.intensity = 1.5;
        this.scene.add(directionalLight);
        let ambientLight = new THREE.AmbientLight();
        ambientLight.intensity = 0.2;
        this.scene.add(ambientLight);

        window.removeEventListener("resize", this.handleResizeBound, false);
        window.addEventListener("resize", this.handleResizeBound, false);
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

        if (this.instancedCubes) {
            this.scene.remove(this.instancedCubes);
            this.instancedCubes.dispose();
            this.instancedCubes = null;
        }

        this.cubeData = [];

        const objectsToRemove = this.scene.children.filter(child =>
            child instanceof THREE.Mesh && child.geometry instanceof THREE.ShapeGeometry
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

            const loader = new FontLoader();
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

            const step = Math.max(1, Math.floor(elements.length / maxLabels));
            const sampledElements = elements.filter((_, index) => index % step === 0);

            for (const element of sampledElements) {
                const { value, position } = element;
                const nDigits = value.toString().includes(".") ? 7 : 5;
                const textShapes = font.generateShapes(
                    value.toString().slice(0, nDigits + 1),
                    0.15
                );

                const textGeometry = new THREE.ShapeGeometry(textShapes);
                const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

                const text = new THREE.Mesh(textGeometry, textMaterial);
                text.position.set(
                    position.x - 0.45,
                    position.y - 0.45,
                    position.z + 0.51
                );
                this.scene.add(text);

                const textReverse = new THREE.Mesh(textGeometry, textMaterial.clone());
                textReverse.position.set(
                    position.x + 0.45,
                    position.y - 0.45,
                    position.z - 0.51
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

        const material = new THREE.ShaderMaterial({
            vertexShader: `
                varying vec2 vUv;
                varying float vOpacity;

                void main() {
                    vUv = uv;

                    #ifdef USE_INSTANCING_COLOR
                        vOpacity = instanceColor.g;
                    #else
                        vOpacity = 0.5;
                    #endif

                    #ifdef USE_INSTANCING
                        vec4 worldPos = instanceMatrix * vec4(position, 1.0);
                        gl_Position = projectionMatrix * modelViewMatrix * worldPos;
                    #else
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    #endif
                }
            `,
            fragmentShader: `
                varying vec2 vUv;
                varying float vOpacity;

                void main() {
                    float edgeWidth = 0.05;
                    bool onEdge = vUv.x < edgeWidth || vUv.x > 1.0 - edgeWidth ||
                                  vUv.y < edgeWidth || vUv.y > 1.0 - edgeWidth;

                    if (onEdge) {
                        gl_FragColor = vec4(0.0, vOpacity * 0.4, 0.0, vOpacity * 0.8 + 0.1);
                    } else {
                        gl_FragColor = vec4(0.0, vOpacity, 0.0, vOpacity);
                    }
                }
            `,
            transparent: true,
        });

        this.instancedCubes = new THREE.InstancedMesh(this.sharedGeometry, material, count);

        const matrix = new THREE.Matrix4();
        const color = new THREE.Color();

        for (let i = 0; i < count; i++) {
            const { position, opacity } = elements[i];
            matrix.setPosition(position);
            this.instancedCubes.setMatrixAt(i, matrix);
            color.setRGB(0, opacity + 0.2, 0);
            this.instancedCubes.setColorAt(i, color);
            elements[i].instanceIndex = i;
        }

        this.instancedCubes.instanceMatrix.needsUpdate = true;
        this.instancedCubes.instanceColor.needsUpdate = true;

        this.scene.add(this.instancedCubes);
    }

    graph1DArray(loc, arr) {
        const [x, y, z] = loc;
        const [min, max] = minMax(arr);
        const elements = [];

        for (let i = 0; i < arr.length; i++) {
            const opacity = getOpacity(arr[i], min, max);
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
                position,
                coords: { x: x + i, y: y, z: z }
            });
        }

        this.createOptimizedCubes(elements);

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
                const opacity = getOpacity(arr[i][j], min, max);
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
                    position,
                    coords: { x: x + j, y: y + arr.length - 1 - i, z: z }
                });
            }
        }

        this.createOptimizedCubes(elements);

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
                    const opacity = getOpacity(arr[i][j][k], min, max);
                    const position = new THREE.Vector3(
                        x + k + 0.5,
                        y + arr[0].length - 1 - j + 0.5,
                        z - i - 0.5
                    );

                    elements.push({
                        position,
                        value: arr[i][j][k],
                        opacity,
                        coords: [x + k, y + arr[0].length - 1 - j, i]
                    });

                    this.cubeData.push({
                        value: arr[i][j][k],
                        index: i * arr[0].length * arr[0][0].length + j * arr[0][0].length + k,
                        position,
                        coords: { x: x + k, y: y + arr[0].length - 1 - j, z: i }
                    });
                }
            }
        }

        this.createOptimizedCubes(elements);

        const totalElements = arr.length * arr[0].length * arr[0][0].length;
        if (totalElements <= 1000) {
            this.createOptimizedLabels(elements, totalElements);
        }
    }

    applySlice(xSlice, ySlice, zSlice) {
        this.activeSlices = { x: xSlice, y: ySlice, z: zSlice };

        const slicedValues = this.cubeData
            .filter(data => data.coords && this.cubeMatchesSlice(data.coords, xSlice, ySlice, zSlice))
            .map(data => data.value);

        const [min, max] = slicedValues.length > 0 ? minMax(slicedValues) : [0, 1];

        const graphDiv = document.getElementById('graph');
        if (graphDiv && graphDiv.layout) {
            if (isIntegerArray(slicedValues)) {
                const data = {};
                slicedValues.forEach(value => {
                    data[value] ||= 0;
                    data[value] += 1;
                });

                const sorted = Object.keys(data).sort((a, b) => Number(a) - Number(b)).reduce(
                    (obj, key) => {
                        obj[key] = data[key];
                        return obj;
                    },
                    {}
                );

                Plotly.react("graph", [{
                    x: Object.keys(sorted).map(Number),
                    y: Object.values(sorted),
                    type: 'bar',
                    marker: { color: 'rgb(0,255,0)', opacity: 0.9 }
                }], graphDiv.layout);
            } else {
                Plotly.react("graph", [{
                    x: slicedValues,
                    type: 'histogram',
                    marker: { color: 'rgb(0,255,0)', opacity: 0.9 }
                }], graphDiv.layout);
            }
        }

        if (this.instancedCubes) {
            const color = new THREE.Color();
            for (let i = 0; i < this.cubeData.length; i++) {
                const data = this.cubeData[i];
                const matchesSlice = this.cubeMatchesSlice(data.coords, xSlice, ySlice, zSlice);
                if (matchesSlice) {
                    color.setRGB(0, getOpacity(data.value, min, max) + 0.2, 0);
                } else {
                    color.setRGB(0, 0.05, 0);
                }
                this.instancedCubes.setColorAt(i, color);
            }
            this.instancedCubes.instanceColor.needsUpdate = true;
        }
    }

    cubeMatchesSlice(coords, xSlice, ySlice, zSlice) {
        const xMatch = xSlice === null || coords.x === xSlice;
        const yMatch = ySlice === null || coords.y === ySlice;
        const zMatch = zSlice === null || coords.z === zSlice;
        return xMatch && yMatch && zMatch;
    }

    highlightValue(value) {
        const graphDiv = document.getElementById('graph');

        if (graphDiv && graphDiv.layout) {
            const values = this.cubeData.map(cube => cube.value);
            const isInteger = isIntegerArray(values);

            if (isInteger) {
                let min = Math.min(...xGraph);
                let max = Math.max(...xGraph);
                const data = {};

                values.forEach(val => {
                    data[val] ||= 0;
                    data[val] += 1;
                });

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

                xGraph = Object.keys(sorted).map(Number);

                const index = xGraph.indexOf(value);
                const colors = Array(xGraph.length).fill('rgb(0,255,0)');
                if (index !== -1) {
                    colors[index] = 'rgb(255,0,0)';
                }

                Plotly.react("graph", [{
                    x: xGraph,
                    y: Object.values(sorted),
                    type: 'bar',
                    marker: { color: colors, opacity: 0.9 }
                }], graphDiv.layout);
            }
        }

        if (this.instancedCubes) {
            const color = new THREE.Color();
            for (let i = 0; i < this.cubeData.length; i++) {
                const isMatch = this.cubeData[i].value === value;
                color.setRGB(0, isMatch ? 0.8 : 0.05, 0);
                this.instancedCubes.setColorAt(i, color);
            }
            this.instancedCubes.instanceColor.needsUpdate = true;
        }
    }

    highlightInequality(low, high) {
        const filteredX = [];
        const filteredY = [];

        const graphDiv = document.getElementById('graph');
        if (graphDiv && graphDiv.data && graphDiv.data[0]) {
            const originalY = graphDiv.data[0].y;

            xGraph.forEach((value, index) => {
                if (low < value && value < high) {
                    filteredX.push(value);
                    filteredY.push(originalY[index]);
                }
            });

            if (filteredX.length > 0) {
                Plotly.react("graph", [{
                    x: filteredX,
                    y: filteredY,
                    type: 'bar',
                    marker: { color: 'rgb(0,255,0)', opacity: 0.9 }
                }], graphDiv.layout);
            }
        }

        if (this.instancedCubes) {
            const color = new THREE.Color();
            for (let i = 0; i < this.cubeData.length; i++) {
                const inRange = low < this.cubeData[i].value && this.cubeData[i].value < high;
                color.setRGB(0, inRange ? 0.8 : 0.05, 0);
                this.instancedCubes.setColorAt(i, color);
            }
            this.instancedCubes.instanceColor.needsUpdate = true;
        }
    }

    resetScale() {
        const graphDiv = document.getElementById('graph');

        if (graphDiv && graphDiv.layout) {
            const values = this.cubeData.map(cube => cube.value);
            const isInteger = isIntegerArray(values);

            if (isInteger) {
                let min = Math.min(...xGraph);
                let max = Math.max(...xGraph);
                const data = {};

                values.forEach(value => {
                    data[value] ||= 0;
                    data[value] += 1;
                });

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

                Plotly.react("graph", [{
                    x: Object.keys(sorted).map(Number),
                    y: Object.values(sorted),
                    type: 'bar',
                    marker: { color: 'rgb(0,255,0)', opacity: 0.9 }
                }], graphDiv.layout);
            } else {
                Plotly.react("graph", [{
                    x: values,
                    type: 'histogram',
                    marker: { color: 'rgb(0,255,0)', opacity: 0.9 }
                }], graphDiv.layout);
            }
        }

        const [min, max] = minMax(this.cubeData.map(cube => cube.value));

        if (this.instancedCubes) {
            const color = new THREE.Color();
            for (let i = 0; i < this.cubeData.length; i++) {
                const opacity = getOpacity(this.cubeData[i].value, min, max);
                color.setRGB(0, opacity + 0.2, 0);
                this.instancedCubes.setColorAt(i, color);
            }
            this.instancedCubes.instanceColor.needsUpdate = true;
        }
    }

    clearAllSlices() {
        this.activeSlices = { x: null, y: null, z: null };
        this.resetScale();
    }
}

function getOpacity(value, min, max) {
    if (!Number.isFinite(value)) {
        return 0.2;
    }

    if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
        return 0.8;
    }

    return ((value - min) / (max - min)) * 0.8;
}

export function graphDistribution(arr) {
    const values = arr.flat().flat();
    if (isIntegerArray(values)) {
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        const data = {};
        for (const value of values) {
            data[value] ||= 0;
            data[value] += 1;
            if (value < min) min = value;
            if (value > max) max = value;
        }

        for (let i = min; i <= max; i++) {
            data[i] ||= 0;
        }

        const sorted = Object.keys(data).sort((a, b) => Number(a) - Number(b)).reduce(
            (obj, key) => { obj[key] = data[key]; return obj; },
            {}
        );

        xGraph = Object.keys(sorted).map(Number);

        const layout = {
            height: 180,
            width: 270,
            margin: { t: 0, b: 20, r: 20, l: 20 },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            yaxis: { color: 'white', showgrid: false, zeroline: false, autotick: false, showticklabels: false },
            xaxis: {
                color: 'white', showgrid: false, zeroline: false,
                tickmode: "array", tickvals: [min, max], ticktext: [min, max], tickfont: { size: 10 }
            }
        };

        Plotly.newPlot("graph", [{
            x: xGraph,
            y: Object.values(sorted),
            type: 'bar',
            marker: { color: 'rgb(0,255,0)', opacity: 0.9 }
        }], layout, { staticPlot: true });
    } else {
        const [min, max] = minMax(values);
        const layout = {
            height: 180,
            width: 270,
            margin: { t: 0, b: 20, r: 20, l: 20 },
            paper_bgcolor: "rgba(0,0,0,0)",
            plot_bgcolor: "rgba(0,0,0,0)",
            yaxis: { color: 'white', showgrid: false, zeroline: false, showticklabels: false },
            xaxis: {
                color: 'white', showgrid: false, zeroline: false,
                tickmode: "array",
                tickvals: [min, max],
                ticktext: [parseFloat(min.toPrecision(4)).toString(), parseFloat(max.toPrecision(4)).toString()],
                tickfont: { size: 10 }
            }
        };
        Plotly.newPlot("graph", [{
            x: values,
            type: 'histogram',
            marker: { color: 'rgb(0,255,0)', opacity: 0.9 }
        }], layout, { staticPlot: true });
    }
}

export function setArrayDimensions(arr) {
    const shape = arrayShape(arr);
    switch (shape.length) {
        case 1:
            document.getElementById("arrayShape").innerHTML = `<span class="red">${shape[0]}</span>`;
            break;
        case 2:
            document.getElementById("arrayShape").innerHTML = `<span class="red">${shape[1]}</span><span class="multiply">×</span><span class="green">${shape[0]}</span>`;
            break;
        case 3:
            document.getElementById("arrayShape").innerHTML = `<span class="red">${shape[2]}</span><span class="multiply">×</span><span class="green">${shape[1]}</span><span class="multiply">×</span><span class="blue">${shape[0]}</span>`;
            break;
    }
}
