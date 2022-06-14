import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js';

let camera, controls;
let scene;
let renderer;
let cubes = [];
let array;


// Check whether using GUI
$.get('/gui', function(gui) {
  if (gui) {
    setupGUI();  // Setup gui and wait for button click to fetch array input
  } else {
    disableGUI();
    // Fetch array from saved file from server
    $.get('/data', function (data) {
      $('.result').html(data);
      array = JSON.parse(data);
      console.log(array);
      init();
      animate();
    });
  }
});

function setupGUI() {
  disableViz();
  $('#runViz').bind('click', runInput);
}

function disableGUI() {
  $('#gui').css('display', 'none');  // Disable GUI
}

function disableViz() {
  $('#dataViz').css('display', 'none');
  $('.equality-container').css('display', 'none');
  $('.inequality-container').css('display', 'none');
}

function enableViz() {
  $('#dataViz').css('display', 'block');
  $('.equality-container').css('display', 'flex');
  $('.inequality-container').css('display', 'flex');
}

function validArray(input) {
  try {
    // Test if valid array syntax
    let arr = new Array(JSON.parse(input));
    // Check max of 3 dimensions
    if (arrayShape(arr).length > 3) {
      return false;
    }
  } catch (error) {
    return false;
  }

  return true;
}

function runInput() {
  let input = $('#arrayInput').val().replace(/\s/g, '');
  if (validArray(input)) {
    array = new Array($.parseJSON(input));
    console.log(array);
    disableGUI();
    enableViz();
    init();
    animate();
  } else {
    alert('Array not valid.');
  }
}

function graphLine(x1, y1, z1, x2, y2, z2, colour) {
  if (colour == undefined) {
    colour = 0xff0000;
  }
  let lineMaterial = new THREE.LineBasicMaterial({ color: colour });
  let geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(x1, y1, z1));
  geometry.vertices.push(new THREE.Vector3(x2, y2, z2));
  let line = new THREE.Line(geometry, lineMaterial);
  scene.add(line);
}

function arrayEquals(a, b) {
  return (
    a.length === b.length &&
    a.every(function (value, index) {
      return value === b[index];
    })
  );
}

function arrayShape(arr) {
  if (!(arr instanceof Array) || !arr.length) {
    return [];
  }
  var dim = arr.reduce(function (result, current) {
    return arrayEquals(result, arrayShape(current)) ? result : false;
  }, arrayShape(arr[0]));

  return dim && [arr.length].concat(dim);
}

function setArrayShape(arr) {
  let shape = '(' + arrayShape(arr).toString().replaceAll(',', ', ') + ')';
  document.getElementById('arrayShape').textContent = shape;
}

function graphArrayElement(loc, value, opacity) {
  let [x, y, z] = loc;

  // Cube
  let geometry = new THREE.BoxGeometry();
  let material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    opacity: opacity,
    transparent: true,
  });
  let cube = new THREE.Mesh(geometry, material);
  cube.position.set(x+0.5, y+0.5, z-0.5);
  scene.add(cube);
  cube.value = value;
  cubes.push(cube);

  // Cube edges
  let wireframe = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0x00ff00 })
  );
  wireframe.position.set(x+0.5, y+0.5, z-0.5);
  scene.add(wireframe);

  // Display element value
  let loader = new THREE.FontLoader();
  loader.load('fonts/helvetiker_regular.typeface.json', function (font) {
    let nDigits = value.toString().includes('.') ? 7 : 5;
    let textsShapes = font.generateShapes(
      value.toString().slice(0, nDigits + 1),
      0.15
    );
    let textsGeometry = new THREE.ShapeBufferGeometry(textsShapes);
    let textsMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    let text = new THREE.Mesh(textsGeometry, textsMaterial);
    text.position.set(x + 0.05, y + 0.05, z + 0.01);
    scene.add(text);

    let textReverse = new THREE.Mesh(textsGeometry, textsMaterial);
    textReverse.position.set(x + 0.95, y + 0.05, z - 1.01);
    textReverse.rotateY(Math.PI);
    scene.add(textReverse);
  });
}

function graph1DArray(loc, arr) {
  let [x, y, z] = loc;
  let max = Math.max(...arr.flat());
  let min = Math.min(...arr.flat());
  for (let i = 0; i < arr.length; i++) {
    let opacity = ((arr[i] - min) / (max - min)) * 0.8;
    graphArrayElement([x + i, y, z], arr[i], opacity);
  }
  axisCoordinates(loc, arr);
  setArrayShape(arr);
}

function graph2DArray(loc, arr) {
  let [x, y, z] = loc;
  let max = Math.max(...arr.flat());
  let min = Math.min(...arr.flat());
  for (let i = 0; i < arr.length; i++) {
    for (let j = 0; j < arr[0].length; j++) {
      let opacity = ((arr[i][j] - min) / (max - min)) * 0.8;
      graphArrayElement([x + j, y + arr.length - 1 - i, z], arr[i][j], opacity);
    }
  }
  axisCoordinates(loc, arr);
  setArrayShape(arr);
}

function xAxisLabels(loc, arr, font, doubleAxisSize) {
  let [x, y, z] = loc;
  let shape = arrayShape(arr);

  if (shape.length == 1) {
    for (let i = 0; i < arr.length; i++) {
      let textsShapes = font.generateShapes(i.toString(), 0.3);
      let textsGeometry = new THREE.ShapeBufferGeometry(textsShapes);
      let textsMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

      let text = new THREE.Mesh(textsGeometry, textsMaterial);
      text.position.set(x + i + 0.1, y - 0.4, z);
      scene.add(text);

      let textBehind = new THREE.Mesh(textsGeometry, textsMaterial);
      let depth = shape.length > 2 ? arr[0][0].length : 1;
      textBehind.position.set(x + i + 0.9, y - 0.4, z - depth);
      textBehind.rotateY(Math.PI);
      scene.add(textBehind);
    }
  } else if (shape.length == 2) {
    // x axis coords on floor
    for (let i = 0; i < arr[0].length; i++) {
      let textsShapes = font.generateShapes(i.toString(), 0.3);
      let textsGeometry = new THREE.ShapeBufferGeometry(textsShapes);
      let textsMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

      let text = new THREE.Mesh(textsGeometry, textsMaterial);
      text.position.set(x + i + 0.1, y - 0.4, z);
      scene.add(text);

      if (arr[0].length > doubleAxisSize) {
        let textAbove = new THREE.Mesh(textsGeometry, textsMaterial);
        textAbove.position.set(x + i + 0.1, y + arr.length + 0.1, z);
        scene.add(textAbove);
      }

      let textBehind = new THREE.Mesh(textsGeometry, textsMaterial);
      textBehind.position.set(x + i + 0.9, y - 0.4, z - 1);
      textBehind.rotateY(Math.PI);
      scene.add(textBehind);

      if (arr.length > doubleAxisSize) {
        let textBehindAbove = new THREE.Mesh(textsGeometry, textsMaterial);
        textBehindAbove.position.set(
          x + i + 0.9,
          y + arr.length + 0.1,
          z - 1
        );
        textBehindAbove.rotateY(Math.PI);
        scene.add(textBehindAbove);
      }
    }
  } else if (shape.length == 3) {
    // x axis coords on floor
    for (let i = 0; i < arr[0][0].length; i++) {
      let textsShapes = font.generateShapes(i.toString(), 0.3);
      let textsGeometry = new THREE.ShapeBufferGeometry(textsShapes);
      let textsMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

      let text = new THREE.Mesh(textsGeometry, textsMaterial);
      text.position.set(x + i + 0.1, y - 0.4, z);
      scene.add(text);

      if (arr[0].length > doubleAxisSize) {
        let textAbove = new THREE.Mesh(textsGeometry, textsMaterial);
        textAbove.position.set(x + i + 0.1, y + arr[0].length + 0.1, z);
        scene.add(textAbove);
      }

      let textBehind = new THREE.Mesh(textsGeometry, textsMaterial);
      textBehind.position.set(x + i + 0.9, y - 0.4, z - arr.length);
      textBehind.rotateY(Math.PI);
      scene.add(textBehind);

      if (arr.length > doubleAxisSize) {
        let textBehindAbove = new THREE.Mesh(textsGeometry, textsMaterial);
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
}

function yAxisLabels(loc, arr, font, doubleAxisSize) {
  let [x, y, z] = loc;
  let shape = arrayShape(arr);

  if (shape.length == 2) {
    // y axis coords top to bottom
    for (let i = 0; i < arr.length; i++) {
      let textsShapes = font.generateShapes(
        (arr.length - 1 - i).toString(),
        0.3
      );
      let textsGeometry = new THREE.ShapeBufferGeometry(textsShapes);
      let textsMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

      let text = new THREE.Mesh(textsGeometry, textsMaterial);
      text.position.set(x - 0.35, y + i + 0.1, z);
      scene.add(text);

      if (arr.length > doubleAxisSize) {
        let textRight = new THREE.Mesh(textsGeometry, textsMaterial);
        textRight.position.set(x + arr[0].length + 0.15, y + i + 0.1, z);
        scene.add(textRight);
      }

      let textBehindRight = new THREE.Mesh(textsGeometry, textsMaterial);
      textBehindRight.position.set(
        x + arr[0].length + 0.4,
        y + i + 0.1,
        z - 1
      );
      textBehindRight.rotateY(Math.PI);
      scene.add(textBehindRight);

      if (arr.length > doubleAxisSize) {
        let textBehind = new THREE.Mesh(textsGeometry, textsMaterial);
        textBehind.position.set(x - 0.15, y + i + 0.1, z - 1);
        textBehind.rotateY(Math.PI);
        scene.add(textBehind);
      }
    }
  } else if (shape.length == 3) {
    // y axis coords top to bottom
    for (let i = 0; i < arr[0].length; i++) {
      let textsShapes = font.generateShapes(
        (arr[0].length - 1 - i).toString(),
        0.3
      );
      let textsGeometry = new THREE.ShapeBufferGeometry(textsShapes);
      let textsMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

      let text = new THREE.Mesh(textsGeometry, textsMaterial);
      text.position.set(x - 0.35, y + i + 0.1, z);
      scene.add(text);

      if (arr.length > doubleAxisSize) {
        let textRight = new THREE.Mesh(textsGeometry, textsMaterial);
        textRight.position.set(x + arr[0][0].length + 0.15, y + i + 0.1, z);
        scene.add(textRight);
      }

      let textBehindRight = new THREE.Mesh(textsGeometry, textsMaterial);
      textBehindRight.position.set(
        x + arr[0][0].length + 0.4,
        y + i + 0.1,
        z - arr.length
      );
      textBehindRight.rotateY(Math.PI);
      scene.add(textBehindRight);

      if (arr.length > doubleAxisSize) {
        let textBehind = new THREE.Mesh(textsGeometry, textsMaterial);
        textBehind.position.set(x - 0.15, y + i + 0.1, z - arr.length);
        textBehind.rotateY(Math.PI);
        scene.add(textBehind);
      }
    }

  }
}

function zAxisLabels(loc, arr, font, doubleAxisSize) {
  let [x, y, z] = loc;
  let shape = arrayShape(arr);

  if (shape.length == 3) {
    // z axis coords on floor
    for (let i = 0; i < arr.length; i++) {
      let textsShapes = font.generateShapes(i.toString(), 0.3);
      let textsGeometry = new THREE.ShapeBufferGeometry(textsShapes);
      let textsMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });

      let text = new THREE.Mesh(textsGeometry, textsMaterial);
      text.position.set(x, y - 0.4, z - i - 0.95);
      text.rotateY(-Math.PI / 2);
      scene.add(text);

      let textBehind = new THREE.Mesh(textsGeometry, textsMaterial);
      textBehind.position.set(x + arr[0][0].length, y - 0.4, z - i - 0.1);
      textBehind.rotateY(Math.PI / 2);
      scene.add(textBehind);

      if (arr[0].length > doubleAxisSize) {
        let textAbove = new THREE.Mesh(textsGeometry, textsMaterial);
        textAbove.position.set(x, y + 0.1 + arr[0].length, z - i - 0.95);
        textAbove.rotateY(-Math.PI / 2);
        scene.add(textAbove);

        let textAboveBehind = new THREE.Mesh(textsGeometry, textsMaterial);
        textAboveBehind.position.set(
          x + arr[0][0].length,
          y + 0.1 + arr[0].length,
          z - i - 0.1
        );
        textAboveBehind.rotateY(Math.PI / 2);
        scene.add(textAboveBehind);
      }
    }
  }
}

function axisCoordinates(loc, arr) {
  let doubleAxisSize = 10;
  var loader = new THREE.FontLoader();
  loader.load('fonts/helvetiker_bold.typeface.json', function (font) {
    xAxisLabels(loc, arr, font, doubleAxisSize);
    yAxisLabels(loc, arr, font, doubleAxisSize);
    zAxisLabels(loc, arr, font, doubleAxisSize);
  });
}

function graph3DArray(loc, arr) {
  let [x, y, z] = loc;
  let max = Math.max(...arr.flat().flat());
  let min = Math.min(...arr.flat().flat());
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
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  controls = new OrbitControls(camera, renderer.domElement);
  let shape = arrayShape(array);
  // Shape padded to 3D with 0s for non-existent dimensions
  let shape3D = shape.concat(Array(3 - shape.length).fill(0));
  shape3D[2] = Math.max(Math.max(...shape3D), 3);
  camera.position.set(shape3D[0], shape3D[1], shape3D[2]);

  let center = shape
    .concat(Array(3 - shape.length).fill(0))
    .map((x) => Math.floor(x / 2));
  camera.lookAt(new THREE.Vector3(center[2], center[1], center[0]));
  controls.target.set(center[2], center[1], center[0]);

  graphAxisLines();

  if (shape.length == 1) {
    graph1DArray([0, 0, 0], array);
  } else if (shape.length == 2) {
    graph2DArray([0, 0, 0], array);
  } else if (shape.length == 3) {
    graph3DArray([0, 0, 0], array);
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
  window.addEventListener('resize', handleResize, false);
}

/* Loops to animate the scene */
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
    if (cubes[i].value == value) {
      cubes[i].material.opacity = 0.8;
    } else {
      cubes[i].material.opacity = 0;
    }
  }
}

function resetScale() {
  let max = cubes[0].value;
  let min = cubes[0].value;
  for (let i = 1; i < cubes.length; i++) {
    if (cubes[i].value > max) {
      max = cubes[i].value;
    }
    if (cubes[i].value < min) {
      min = cubes[i].value;
    }
  }

  for (let i = 0; i < cubes.length; i++) {
    let opacity = ((cubes[i].value - min) / (max - min)) * 0.8;
    cubes[i].material.opacity = opacity;
  }
}

function isNumeric(str) {
  if (typeof str != 'string') return false;
  return (
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  );
}

let equalityInput = document.getElementById('equalityQuery');
let equalityInputValue = equalityInput.value;

equalityInput.addEventListener('keyup', function () {
  equalityInputValue = document.getElementById('equalityQuery').value;
  if (isNumeric(equalityInputValue)) {
    highlightValue(parseFloat(equalityInputValue));
  } else if (equalityInputValue == '') {
    resetScale();
  }
  // Erase any inqeuality input
  lessThanInput.value = '';
  greaterThanInput.value = '';
});

function highlightInequality(low, high) {
  for (let i = 0; i < cubes.length; i++) {
    if (low < cubes[i].value && cubes[i].value < high) {
      cubes[i].material.opacity = 0.8;
    } else {
      cubes[i].material.opacity = 0;
    }
  }
}

let lessThanInput = document.getElementById('lessThanQuery');
let lessThanInputValue = lessThanInput.value;

lessThanInput.addEventListener('keyup', function () {
  lessThanInputValue = document.getElementById('lessThanQuery').value;
  if (isNumeric(lessThanInputValue)) {
    let high = Number.POSITIVE_INFINITY;
    if (isNumeric(greaterThanInputValue)) {
      high = parseFloat(greaterThanInputValue);
    }
    highlightInequality(parseFloat(lessThanInputValue), high);
  } else if (isNumeric(greaterThanInputValue)) {
    // If just erased less than input, but greater than input available
    highlightInequality(
      Number.NEGATIVE_INFINITY,
      parseFloat(greaterThanInputValue)
    );
  } else if (greaterThanInputValue == '') {
    resetScale();
  }
  equalityInput.value = '';  // Erase any equality input
});

let greaterThanInput = document.getElementById('greaterThanQuery');
let greaterThanInputValue = greaterThanInput.value;

greaterThanInput.addEventListener('keyup', function () {
  greaterThanInputValue = document.getElementById('greaterThanQuery').value;
  if (isNumeric(greaterThanInputValue)) {
    let low = Number.NEGATIVE_INFINITY;
    if (isNumeric(lessThanInputValue)) {
      low = parseFloat(lessThanInputValue);
    }
    highlightInequality(low, parseFloat(greaterThanInputValue));
  } else if (isNumeric(lessThanInputValue)) {
    // If just erased greater than input, but less than input still available
    highlightInequality(
      parseFloat(lessThanInputValue),
      Number.POSITIVE_INFINITY
    );
  } else if (greaterThanInputValue == '') {
    resetScale();
  }

  equalityInput.value = '';  // Erase any equality input
});
