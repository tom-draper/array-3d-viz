import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js";

let camera, controls;
let scene;
let renderer;

init();
animate();

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

function graph1DArray2(x, y, z, arr) {
  graphLine(x, y, z, x + arr.length, y, z);
  graphLine(x, y + 1, z, x + arr.length, y + 1, z);
  graphLine(x, y + 1, z - 1, x + arr.length, y + 1, z - 1);
  graphLine(x, y, z - 1, x + arr.length, y, z - 1);
  for (let i = 0; i < arr.length + 1; i++) {
    graphLine(x + i, y, z, x + i, y + 1, z);
    graphLine(x + i, y, z - 1, x + i, y + 1, z - 1);
    graphLine(x + i, y + 1, z, x + i, y + 1, z - 1);
    graphLine(x + i, y, z, x + i, y, z - 1);
  }
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
  let shape = "(" + arrayShape(arr).toString().replaceAll(",", ", ") + ")";
  document.getElementById("arrayShape").textContent = shape;
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
  cube.position.x = x + 0.5;
  cube.position.y = y + 0.5;
  cube.position.z = z - 0.5;
  scene.add(cube);

  // Cube edges
  let wireframe = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0x00FF00})
  );
  wireframe.position.x = x + 0.5;
  wireframe.position.y = y + 0.5;
  wireframe.position.z = z - 0.5;
  scene.add(wireframe);

  // Display element value
  var loader = new THREE.FontLoader();
  loader.load("fonts/helvetiker_bold.typeface.json", function (font) {
    var textsShapes = font.generateShapes(value.toString(), 0.2);
    var textsGeometry = new THREE.ShapeBufferGeometry(textsShapes);
    var textsMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    var text = new THREE.Mesh(textsGeometry, textsMaterial);
    text.position.set(x + 0.1, y + 0.1, z);
    // text.rotateY(Math.PI/2);
    text.name = "text";

    scene.add(text);
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

function axisCoordinates(loc, arr) {
  let [x, y, z] = loc;

  let shape = arrayShape(arr);

  var loader = new THREE.FontLoader();
  loader.load("fonts/helvetiker_bold.typeface.json", function (font) {
    if (shape.length > 0) {
      // x axis coords on floor
      for (let i = 0; i < arr.length; i++) {
        let textsShapes = font.generateShapes(i.toString(), 0.2);
        let textsGeometry = new THREE.ShapeBufferGeometry(textsShapes);
        let textsMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

        let text = new THREE.Mesh(textsGeometry, textsMaterial);
        text.position.set(x + i + 0.1, y, z + 0.35);
        text.rotateX((3 * Math.PI) / 2);

        scene.add(text);
      }
    }

    if (shape.length > 1) {
      // y axis coords top to bottom
      for (let i = 0; i < arr[0].length; i++) {
        let textsShapes = font.generateShapes(
          (arr[0].length - 1 - i).toString(),
          0.2
        );
        let textsGeometry = new THREE.ShapeBufferGeometry(textsShapes);
        let textsMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

        let text = new THREE.Mesh(textsGeometry, textsMaterial);
        text.position.set(x - 0.25, y + i + 0.1, z);

        scene.add(text);
      }
    }

    if (shape.length > 2) {
      // z axis coords on floor
      for (let i = 0; i < arr[0][0].length; i++) {
        let textsShapes = font.generateShapes(i.toString(), 0.2);
        let textsGeometry = new THREE.ShapeBufferGeometry(textsShapes);
        let textsMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });

        let text = new THREE.Mesh(textsGeometry, textsMaterial);
        text.position.set(x - 0.3, y, z - i - 0.95);
        text.rotateX((3 * Math.PI) / 2);
        text.rotateZ((3 * Math.PI) / 2);

        scene.add(text);
      }
    }
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
          [x + i, y + arr[0].length - 1 - j, z - k],
          arr[i][j][k],
          opacity
        );
      }
    }
  }
  axisCoordinates(loc, arr);
  setArrayShape(arr);
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
    100,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  controls = new OrbitControls(camera, renderer.domElement);

  camera.position.set(3, 3, 3);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // controls.update();

  graphLine(-100, 0, 0, 100, 0, 0, 0xff0000);
  graphLine(0, -100, 0, 0, 100, 0, 0x00ff00);
  graphLine(0, 0, -100, 0, 0, 100, 0x0000ff);

  // graph1DArray([0, 0, 0], [1, 2, 3]);
  // graph2DArray([0, 0, 0], [[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
  array3D[12][0][3] = 1;
  graph3DArray([0, 0, 0], array3D);

  // Add directional lighting to scene.
  let directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.x = 10;
  directionalLight.position.y = 10;
  directionalLight.position.z = 0;
  directionalLight.intensity = 1.5;
  scene.add(directionalLight);
  let ambientLight = new THREE.AmbientLight();
  ambientLight.intensity = 0.2;
  scene.add(ambientLight);

  // Handle resizing of the browser window.
  window.addEventListener("resize", handleResize, false);
  // initialiseGame();
}

/* Loops to animate the scene */
function animate() {
  requestAnimationFrame(animate);

  // Render the current scene to the screen.
  // controls.update();
  renderer.render(scene, camera);
}

/* Handle resizing of the browser window. */
function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ------------Button controls-------------

/* Handle keyboard presses */
function handleKeyDown(event) {
  switch (event.keyCode) {
    case 32:
      camera.position.y += 0.1;
      break;
    case 16:
      camera.position.y -= 0.1;
      break;
    case 37: // Left arrow
      camera.translateX(-0.1);
      break;
    case 39: // Right arrow
      camera.translateX(0.1);
      break;
    case 40: // Down arrow
      camera.translateZ(0.1);
      break;
    case 82: // R
      camera.translateZ(-0.1);
      break;
  }
  controls.update();
}
