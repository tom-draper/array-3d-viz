import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js";
let camera;
let controls;
let scene;
let renderer;
let cubes = [];
let array;
// Check whether using GUI.
$.get("/gui", gui => {
    if (gui) {
        setupGUI(); // Setup gui and wait for button click to fetch array input.
    }
    else {
        enableViz();
        // Fetch array from saved file from server.
        $.get("/data", data => {
            $(".result").html(data);
            array = JSON.parse(data);
            startViz();
        });
    }
});
function setupGUI() {
    enableGUI();
    $("#runViz").bind("click", runInput);
}
function disableGUI() {
    $("#gui").css("display", "none"); // Disable GUI.
}
function enableGUI() {
    $("#gui").css("display", "flex"); // Disable GUI.
}
function disableViz() {
    $("#dataViz").css("display", "none");
    $(".equality-container").css("display", "none");
    $(".inequality-container").css("display", "none");
}
function enableViz() {
    $("#dataViz").css("display", "block");
    $(".equality-container").css("display", "flex");
    $(".inequality-container").css("display", "flex");
}
function validJSONArray(input) {
    try {
        // Test if valid array syntax.
        const arr = JSON.parse(input);
        // Check max of 3 dimensions.
        if (arrayShape(arr).length > 3) {
            return false;
        }
    }
    catch (error) {
        return false;
    }
    return true;
}
function validCSVArray(csvText) {
    // Split text by line to get rows
    const rows = csvText.trim().split("\n");
    // Check if there is at least one row
    if (rows.length < 1)
        return false;
    // Get the number of columns from the first row
    const columnCount = rows[0].split(",").length;
    // Validate each row has the same number of columns
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i].split(",");
        // Check if the current row has the expected number of columns
        if (row.length !== columnCount) {
            return false;
        }
    }
    return true;
}
function parseCSVArray(input) {
    // Split text by line to get rows
    const rows = input.trim().split("\n");
    // Map each row to an array of values by splitting on commas
    const data = rows.map(row => row.split(",").map(value => tryParseInt(value.trim())));
    if (data.length == 1) {
        return data[0];
    }
    else {
        return data;
    }
}
function tryParseInt(value) {
    const result = parseInt(value, 10);
    if (isNaN(result)) {
        return value;
    }
    else {
        return result;
    }
}
function isInteger(value) {
    const x = parseFloat(value);
    return (x | 0) === x;
}
function startViz() {
    graphDistribution();
    init();
    animate();
}
function runInput() {
    var _a;
    const input = (_a = $("#arrayInput").val()) === null || _a === void 0 ? void 0 : _a.toString().replace(/[ \t]+/g, "");
    if (input) {
        array = undefined;
        if (validJSONArray(input)) {
            array = JSON.parse(input);
        }
        else if (validCSVArray(input)) {
            array = parseCSVArray(input);
        }
        else {
            alert("JSON or CSV format required.");
        }
        if (array) {
            console.log(array);
            disableGUI();
            enableViz();
            startViz();
        }
    }
    else {
        alert("JSON or CSV format required.");
    }
}
function isInt(value) {
    if (isNaN(value)) {
        return false;
    }
    const x = parseFloat(value.toString());
    return (x | 0) === x;
}
function isIntegerArray(arr) {
    for (const value of arr) {
        if (!isInt(value)) {
            return false;
        }
    }
    return true;
}
function randn_bm(min, max, skew) {
    let u = 0, v = 0;
    while (u === 0)
        u = Math.random(); // Converting [0,1) to (0,1).
    while (v === 0)
        v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    num = num / 10.0 + 0.5; // Translate to 0 -> 1.
    if (num > 1 || num < 0) {
        num = randn_bm(min, max, skew); // Resample between 0 and 1 if out of range.
    }
    else {
        num = Math.pow(num, skew); // Skew.
        num *= max - min; // Stretch to fill range.
        num += min; // offset to min.
    }
    return parseInt(num.toString());
}
function graphDistribution() {
    const values = array.flat().flat();
    if (isIntegerArray(values)) {
        // Count frequency of each value.
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        const data = {};
        for (const value of values) {
            data[value] || (data[value] = 0);
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
            data[i] || (data[i] = 0);
        }
        const sorted = Object.keys(data).sort().reduce((obj, key) => {
            //@ts-ignore
            obj[key] = data[key];
            return obj;
        }, {});
        const graphData = [
            {
                x: Object.keys(sorted).map(Number),
                //@ts-ignore
                y: Object.values(sorted),
                type: 'bar',
                marker: {
                    color: 'rgb(0,255,0)',
                    opacity: 0.9,
                }
            }
        ];
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
        };
        //@ts-ignore
        Plotly.newPlot("graph", graphData, layout, { staticPlot: true });
    }
}
function graphLine(x1, y1, z1, x2, y2, z2, color) {
    if (color === undefined) {
        color = 0xff0000;
    }
    const lineMaterial = new THREE.LineBasicMaterial({ color: color });
    const geometry = new THREE.Geometry();
    geometry.vertices.push(new THREE.Vector3(x1, y1, z1));
    geometry.vertices.push(new THREE.Vector3(x2, y2, z2));
    const line = new THREE.Line(geometry, lineMaterial);
    scene.add(line);
}
function arrayEquals(a, b) {
    return (a.length === b.length &&
        a.every(function (value, index) {
            return value === b[index];
        }));
}
function arrayShape(arr) {
    if (!(arr instanceof Array) || !arr.length) {
        return [];
    }
    const dim = arr.reduce(function (result, current) {
        return arrayEquals(result, arrayShape(current)) ? result : false;
    }, arrayShape(arr[0]));
    return dim && [arr.length].concat(dim);
}
function setArrayShape(arr) {
    const shape = arrayShape(arr);
    switch (shape.length) {
        case 1:
            document.getElementById("arrayShape").innerHTML = `<span class="red">${shape[0]}</span>`;
            break;
        case 2:
            document.getElementById("arrayShape").innerHTML = `<span class="green">${shape[0]}</span> × <span class="red">${shape[1]}</span>`;
            break;
        case 3:
            document.getElementById("arrayShape").innerHTML = `<span class="blue">${shape[0]}</span> × <span class="green">${shape[1]}</span> × <span class="red">${shape[2]}</span>`;
            break;
    }
}
function graphArrayElement(loc, value, opacity) {
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
    const wireframe = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), new THREE.LineBasicMaterial({ color: 0x00ff00 }));
    wireframe.position.set(x + 0.5, y + 0.5, z - 0.5);
    scene.add(wireframe);
    // Display element value.
    const loader = new THREE.FontLoader();
    loader.load("fonts/helvetiker_regular.typeface.json", function (font) {
        const nDigits = value.toString().includes(".") ? 7 : 5;
        const textsShapes = font.generateShapes(value.toString().slice(0, nDigits + 1), 0.15);
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
function minMax(arr) {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 1; i < arr.length; i++) {
        const value = arr[i];
        if (isNumeric2(value)) {
            if (value < min) {
                min = value;
            }
            if (value > max) {
                max = value;
            }
        }
    }
    return [min, max];
}
function graph1DArray(loc, arr) {
    const [x, y, z] = loc;
    const [min, max] = minMax(arr);
    for (let i = 0; i < arr.length; i++) {
        const opacity = ((arr[i] - min) / (max - min)) * 0.8;
        graphArrayElement([x + i, y, z], arr[i], opacity);
    }
    axisCoordinates(loc, arr);
    setArrayShape(arr);
}
function graph2DArray(loc, arr) {
    const [x, y, z] = loc;
    const [min, max] = minMax([...arr.flat()]);
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr[0].length; j++) {
            const opacity = ((arr[i][j] - min) / (max - min)) * 0.8;
            graphArrayElement([x + j, y + arr.length - 1 - i, z], arr[i][j], opacity);
        }
    }
    axisCoordinates(loc, arr);
    setArrayShape(arr);
}
function xAxisLabels(loc, arr, font, doubleAxisSize) {
    const shape = arrayShape(arr);
    switch (shape.length) {
        case 1:
            // x axis coords on floor.
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
function xAxisLabels1D(loc, arr, font) {
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
function xAxisLabels2D(loc, arr, font, doubleAxisSize) {
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
function xAxisLabels3D(loc, arr, font, doubleAxisSize) {
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
            textBehindAbove.position.set(x + i + 0.9, y + arr[0].length + 0.1, z - arr.length);
            textBehindAbove.rotateY(Math.PI);
            scene.add(textBehindAbove);
        }
    }
}
function yAxisLabels(loc, arr, font, doubleAxisSize) {
    const shape = arrayShape(arr);
    switch (shape.length) {
        case 2:
            // y axis coords top to bottom.
            yAxisLabels2D(loc, arr, font, doubleAxisSize);
            break;
        case 3:
            yAxisLabels3D(loc, arr, font, doubleAxisSize);
            break;
    }
}
function yAxisLabels2D(loc, arr, font, doubleAxisSize) {
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
function yAxisLabels3D(loc, arr, font, doubleAxisSize) {
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
        textBehindRight.position.set(x + arr[0][0].length + 0.25 + 0.25 * nChars, y + i + 0.1, z - arr.length);
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
function zAxisLabels(loc, arr, font, doubleAxisSize) {
    const shape = arrayShape(arr);
    // z axis coords on floor
    switch (shape.length) {
        case 3:
            zAxisLabels3D(loc, arr, font, doubleAxisSize);
            break;
    }
}
function zAxisLabels3D(loc, arr, font, doubleAxisSize) {
    const [x, y, z] = loc;
    for (let i = 0; i < arr.length; i++) {
        const textsShapes = font.generateShapes(i.toString(), 0.3);
        const textsGeometry = new THREE.ShapeBufferGeometry(textsShapes);
        const textsMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        const text = new THREE.Mesh(textsGeometry, textsMaterial);
        text.position.set(x, y - 0.4, z - i - 0.95);
        text.rotateY(-Math.PI / 2);
        scene.add(text);
        const textBehind = new THREE.Mesh(textsGeometry, textsMaterial);
        textBehind.position.set(x + arr[0][0].length, y - 0.4, z - i - 0.1);
        textBehind.rotateY(Math.PI / 2);
        scene.add(textBehind);
        if (arr[0].length > doubleAxisSize) {
            const textAbove = new THREE.Mesh(textsGeometry, textsMaterial);
            textAbove.position.set(x, y + 0.1 + arr[0].length, z - i - 0.95);
            textAbove.rotateY(-Math.PI / 2);
            scene.add(textAbove);
            const textAboveBehind = new THREE.Mesh(textsGeometry, textsMaterial);
            textAboveBehind.position.set(x + arr[0][0].length, y + 0.1 + arr[0].length, z - i - 0.1);
            textAboveBehind.rotateY(Math.PI / 2);
            scene.add(textAboveBehind);
        }
    }
}
function axisCoordinates(loc, arr) {
    let doubleAxisSize = 10;
    var loader = new THREE.FontLoader();
    loader.load("fonts/helvetiker_bold.typeface.json", function (font) {
        xAxisLabels(loc, arr, font, doubleAxisSize);
        yAxisLabels(loc, arr, font, doubleAxisSize);
        zAxisLabels(loc, arr, font, doubleAxisSize);
    });
}
function graph3DArray(loc, arr) {
    let [x, y, z] = loc;
    const [min, max] = minMax([...arr.flat().flat()]);
    for (let i = 0; i < arr.length; i++) {
        for (let j = 0; j < arr[0].length; j++) {
            for (let k = 0; k < arr[0][0].length; k++) {
                let opacity = ((arr[i][j][k] - min) / (max - min)) * 0.8;
                graphArrayElement([x + k, y + arr[0].length - 1 - j, z - i], arr[i][j][k], opacity);
            }
        }
    }
    axisCoordinates(loc, arr);
    setArrayShape(arr);
}
function graphAxisLines() {
    graphLine(-100, 0, 0, 100, 0, 0, 0xff0000);
    graphLine(0, -100, 0, 0, 100, 0, 0x00ff00);
    graphLine(0, 0, -100, 0, 0, 100, 0x0000ff);
}
function init() {
    // Set up the Web GL renderer.
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    document.body.appendChild(renderer.domElement);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    controls = new OrbitControls(camera, renderer.domElement);
    let shape = arrayShape(array);
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
            graph1DArray([0, 0, 0], array);
            break;
        case 2:
            graph2DArray([0, 0, 0], array);
            break;
        case 3:
            graph3DArray([0, 0, 0], array);
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
/* Loops to animate the scene. */
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
/* Handle resizing of the browser window. */
function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
function highlightValue(value) {
    for (let i = 0; i < cubes.length; i++) {
        if (cubes[i].value === value) {
            cubes[i].material.opacity = 0.8;
        }
        else {
            cubes[i].material.opacity = 0;
        }
    }
}
function resetScale() {
    const [min, max] = minMax(cubes.map(cube => cube.value));
    for (let i = 0; i < cubes.length; i++) {
        let opacity = ((cubes[i].value - min) / (max - min)) * 0.8;
        cubes[i].material.opacity = opacity;
    }
}
function isNumeric(str) {
    if (typeof str != "string")
        return false;
    return (
    //@ts-ignore
    !isNaN(str) && // Use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !isNaN(parseFloat(str)));
}
function isNumeric2(str) {
    return !isNaN(str) && isFinite(str);
}
let equalityInput = document.getElementById("equalityQuery");
let equalityInputValue = equalityInput === null || equalityInput === void 0 ? void 0 : equalityInput.value;
equalityInput === null || equalityInput === void 0 ? void 0 : equalityInput.addEventListener("keyup", function () {
    equalityInputValue = document.getElementById("equalityQuery").value;
    if (isNumeric(equalityInputValue)) {
        highlightValue(parseFloat(equalityInputValue));
    }
    else if (equalityInputValue === "") {
        resetScale();
    }
    // Erase any inqeuality input
    lessThanInput.value = "";
    greaterThanInput.value = "";
});
function highlightInequality(low, high) {
    for (let i = 0; i < cubes.length; i++) {
        if (low < cubes[i].value && cubes[i].value < high) {
            cubes[i].material.opacity = 0.8;
        }
        else {
            cubes[i].material.opacity = 0;
        }
    }
}
let lessThanInput = document.getElementById("lessThanQuery");
let lessThanInputValue = lessThanInput === null || lessThanInput === void 0 ? void 0 : lessThanInput.value;
lessThanInput === null || lessThanInput === void 0 ? void 0 : lessThanInput.addEventListener("keyup", function () {
    lessThanInputValue = document.getElementById("lessThanQuery").value;
    if (isNumeric(lessThanInputValue)) {
        let high = Number.POSITIVE_INFINITY;
        if (isNumeric(greaterThanInputValue)) {
            high = parseFloat(greaterThanInputValue);
        }
        highlightInequality(parseFloat(lessThanInputValue), high);
    }
    else if (isNumeric(greaterThanInputValue)) {
        // If just erased less than input, but greater than input available.
        highlightInequality(Number.NEGATIVE_INFINITY, parseFloat(greaterThanInputValue));
    }
    else if (greaterThanInputValue === "") {
        resetScale();
    }
    equalityInput.value = ""; // Erase any equality input.
});
let greaterThanInput = document.getElementById("greaterThanQuery");
let greaterThanInputValue = greaterThanInput === null || greaterThanInput === void 0 ? void 0 : greaterThanInput.value;
greaterThanInput === null || greaterThanInput === void 0 ? void 0 : greaterThanInput.addEventListener("keyup", function () {
    greaterThanInputValue = document.getElementById("greaterThanQuery").value;
    if (isNumeric(greaterThanInputValue)) {
        let low = Number.NEGATIVE_INFINITY;
        if (isNumeric(lessThanInputValue)) {
            low = parseFloat(lessThanInputValue);
        }
        highlightInequality(low, parseFloat(greaterThanInputValue));
    }
    else if (isNumeric(lessThanInputValue)) {
        // If just erased greater than input, but less than input still available.
        highlightInequality(parseFloat(lessThanInputValue), Number.POSITIVE_INFINITY);
    }
    else if (greaterThanInputValue === "") {
        resetScale();
    }
    equalityInput.value = ""; // Erase any equality input.
});
