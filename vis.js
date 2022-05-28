import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/controls/OrbitControls.js';

let camera, radius, controls;
let mouseDown = false;
let startMouseX, startMouseY, mouseX, mouseY = [0, 0, 0, 0];
let startTheta = 180;
let theta = startTheta;
let startPhi = 74;
let phi = startPhi;
let sceneMain;
let renderer;

init();
animate();

// Listen for keyboard events, to react to them.
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("mousemove", handleMouseMove);
document.body.addEventListener(
  "mousedown",
  function (event) {
    event.preventDefault();
    mouseDown = true;
    startMouseX = event.clientX;
    startMouseY = event.clientY;
    startTheta = theta;
    startPhi = phi;
  },
  false
);
document.addEventListener(
  "mouseup",
  function (event) {
    event.preventDefault();
    mouseDown = false;
    startMouseX = event.clientX - startMouseX;
    startMouseY = event.clientY - startMouseY;
  },
  false
);

function graphLine(x1, y1, z1, x2, y2, z2, colour) {
  if (colour == undefined) {
    colour = 0xff0000;
  }
  let lineMaterial = new THREE.LineBasicMaterial({ color: colour });
  let geometry = new THREE.Geometry();
  geometry.vertices.push(new THREE.Vector3(x1, y1, z1));
  geometry.vertices.push(new THREE.Vector3(x2, y2, z2));
  let line = new THREE.Line(geometry, lineMaterial);
  sceneMain.add(line);
}

function graph1DArray(x, y, z, arr) {
  graphLine(x, y, z, x+arr.length, y, z);
  graphLine(x, y+1, z, x+arr.length, y+1, z);
  graphLine(x, y+1, z-1, x+arr.length, y+1, z-1);
  graphLine(x, y, z-1, x+arr.length, y, z-1);
  for (let i = 0; i < arr.length+1; i++) {
    graphLine(x+i, y, z, x+i, y+1, z);
    graphLine(x+i, y, z-1, x+i, y+1, z-1);
    graphLine(x+i, y+1, z, x+i, y+1, z-1);
    graphLine(x+i, y, z, x+i, y, z-1);
  }
}

function init() {
  // Set up the Web GL renderer.
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  document.body.appendChild(renderer.domElement);

  sceneMain = new THREE.Scene();
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

  graphLine(-100, 0, 0, 100, 0, 0, 0xFF0000);
  graphLine(0, -100, 0, 0, 100, 0, 0x00FF00);
  graphLine(0, 0, -100, 0, 0, 100, 0x0000FF);

  graph1DArray(0, 0, 0, [1, 2, 3, 4, 5]);


  // Add directional lighting to scene.
  let directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
  directionalLight.position.x = 10;
  directionalLight.position.y = 10;
  directionalLight.position.z = 0;
  directionalLight.intensity = 1.5;
  sceneMain.add(directionalLight);
  let ambientLight = new THREE.AmbientLight();
  ambientLight.intensity = 0.2;
  sceneMain.add(ambientLight);


  // Handle resizing of the browser window.
  window.addEventListener("resize", handleResize, false);
  // initialiseGame();
}

/* Loops to animate the scene */
function animate() {
  requestAnimationFrame(animate);

  // Render the current scene to the screen.
  // controls.update();
  renderer.render(sceneMain, camera);
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
    case 37: // Left arrow
      // moveLeftRight("left");
      break;
    case 39: // Right arrow
      // moveLeftRight("right");
      break;
    case 40: // Down arrow
      // moveDown();
      break;
    case 82: // R
      // rotateBlock();
      break;
  }
}

/* Control camera orbit */
function handleMouseMove(event) {
  if (mouseDown) {
    // theta = -((event.clientX - startMouseX) * 0.5) + startTheta;
    // phi = Math.min(
    //   180,
    //   Math.max(0, (event.clientY - startMouseY) * 0.5 + startPhi)
    // );

    // camera.position.x =
    //   radius *
    //   Math.sin((theta * Math.PI) / 360) *
    //   Math.cos((phi * Math.PI) / 360);
    // camera.position.y = radius * Math.sin((phi * Math.PI) / 360);
    // camera.position.z =
    //   radius *
    //   Math.cos((theta * Math.PI) / 360) *
    //   Math.cos((phi * Math.PI) / 360);
    // camera.lookAt(new THREE.Vector3(0, gameHeight / 2, 0));
    camera.updateMatrix();
  }
}
