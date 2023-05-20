import './index.css';

import * as impactFont from './impact.json';
import * as THREE from 'three';
import {FontLoader} from 'three/examples/jsm/loaders/FontLoader';
import {TextGeometry} from 'three/examples/jsm/geometries/TextGeometry';
import {PMREMGenerator} from 'three/src/extras/PMREMGenerator';

import {SSREffect} from 'screen-space-reflections';
import * as POSTPROCESSING from 'postprocessing';

import * as tweakpane from 'tweakpane';

const PARAMS = {
  text: 'THREE.JS|SEX',
  textColour: '#eeeeff',
  floorColour: '#E6973D',
  xPos: -0.9,
  xLook: -0.4,
  yPos: -0.8,
  yLook: -0.3,
  zAngle: -0.05,
  fov: 120,
};

/* #region SCENE INIT */
const scene = new THREE.Scene();
scene.fog = new THREE.Fog( 0x000000, 1, 5);
scene.add(new THREE.AmbientLight());
/* #endregion SCENE INIT */

/* #region CAMERA INIT */
const camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.01, 1000);

camera.fov = PARAMS.fov;

camera.position.x = PARAMS.xPos;
camera.position.y = PARAMS.yPos;
camera.position.z = 0.9;

camera.lookAt(new THREE.Vector3(PARAMS.xLook, PARAMS.yLook, 0));
camera.rotateZ(PARAMS.zAngle);
/* #endregion CAMERA INIT */

/* #region RENDERER INIT */
const renderer = new THREE.WebGLRenderer({
  powerPreference: 'high-performance',

  antialias: false,
  stencil: false,
  depth: false,
  premultipliedAlpha: true,
  preserveDrawingBuffer: false,
});

renderer.shadowMap.enabled = true;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 2.4;
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
/* #endregion RENDERER INIT */

/* #region POSTPROCESSING INIT */
const composer = new POSTPROCESSING.EffectComposer(renderer);
const ssrEffect = new SSREffect(scene, camera, {
  enabled: true,
  correctionRadius: 4,
  blend: 0.95,
  correction: 0.2,
  blur: 0,
  blurSharpness: 0,
  blurKernel: 0.001,
  distance: 20,
  intensity: 1,
  exponent: 1.75,
  maxRoughness: 0.99,
  jitter: 0.5,
  jitterRoughness: 0.1,
  roughnessFade: 1,
  fade: 5,
  thickness: 10,
  ior: 1.75,
  fade: 20,
  steps: 60,
  refineSteps: 6,
  maxDepthDifference: 50,
  missedRays: false,
});

const bloomEffect = new POSTPROCESSING.BloomEffect({
  intensity: 0.5,
  luminanceThreshold: 0.4,
  luminanceSmoothing: 0.7,
  kernelSize: POSTPROCESSING.KernelSize.HUGE,
  mipmapBlur: true,
});

const vignetteEffect = new POSTPROCESSING.VignetteEffect({
  darkness: 0.5675,
});

const fxaaEffect = new POSTPROCESSING.FXAAEffect();

composer.addPass(new POSTPROCESSING.RenderPass(scene, camera));
composer.addPass(new POSTPROCESSING.EffectPass(
    camera, fxaaEffect, ssrEffect, vignetteEffect, bloomEffect));
/* #endregion POSTPROCESSING INIT */

/* #region FLOOR INIT */
const floorGeometry = new THREE.PlaneGeometry(20, 20);

const floorMaterial = new THREE.MeshStandardMaterial({
  roughness: 0.3,
  metalness: 1,
  color: parseInt(PARAMS.floorColour.slice(1), 16),
});

const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotateX(-Math.PI / 2);
floor.position.y = -1;
scene.add(floor);

floor.receiveShadow = true;
/* #endregion FLOOR INIT */

/* #region DIR LIGHT INIT */
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.castShadow = true;
scene.add(dirLight);

dirLight.position.y = 15;
dirLight.position.z = 10;
dirLight.position.x = 2.5;
/* #endregion DIR LIGHT INIT */

// create initial envmap
scene.environment = new PMREMGenerator(renderer).fromScene(scene).texture;

/* #region TEXT INIT */
const loader = new FontLoader();

const font = loader.parse(impactFont);

const textGeometry = new TextGeometry('THREE.JS\nSEX', {
  font: font,
  size: 1,
  height: 1,
  curveSegments: 12,
});

textGeometry.center(new THREE.Vector3(0.5, 0.5, 0.5));

const textMaterial = new THREE.MeshStandardMaterial({
  roughness: 0.3,
  metalness: 1,
  envMapIntensity: 0.4,
  flatShading: false,
  color: 0xeeeeff,
});

const text = new THREE.Mesh(textGeometry, textMaterial);

scene.add(text);

text.castShadow = true;

const textSize = new THREE.Vector3();
textGeometry.boundingBox.getSize(textSize);
text.position.x = textSize.x * 0.5 - 1;
text.position.y = textSize.y * 0.5 - 1;
text.position.z = textSize.z * 0.5 - 1 + 0.1;
/* #endregion TEXT INIT */

/* #region SETTINGS PANEL INIT */
const pane = new tweakpane.Pane();

/**
 * get rid of ssr backbuffer artifacts
 */
function refresh() {
  ssrEffect.correction = 0;
  setTimeout(function() {
    ssrEffect.correction = 0.2;
  }, 100);
}

pane.addInput(PARAMS, 'text', {
  label: 'text (lines separated with |)',
}).on('change', function() {
  const textGeometry = new TextGeometry(PARAMS.text.replace(/\|/g, '\n'), {
    font: font,
    size: 1,
    height: 1,
    curveSegments: 12,
  });

  textGeometry.center(new THREE.Vector3(0.5, 0.5, 0.5));

  const textSize = new THREE.Vector3();
  textGeometry.boundingBox.getSize(textSize);
  text.position.x = textSize.x * 0.5 - 1;
  text.position.y = textSize.y * 0.5 - 1;
  text.position.z = textSize.z * 0.5 - 1 + 0.1;

  text.geometry = textGeometry;

  refresh();
});

pane.addInput(PARAMS, 'textColour', {
  label: 'text colour',
}).on('change', () => {
  text.material.color.setHex(parseInt(PARAMS.textColour.slice(1), 16));
  scene.environment = new PMREMGenerator(renderer).fromScene(scene).texture;
  refresh();
});

pane.addInput(PARAMS, 'floorColour', {
  label: 'floor colour',
}).on('change', () => {
  floor.material.color.setHex(parseInt(PARAMS.floorColour.slice(1), 16));
  scene.environment = new PMREMGenerator(renderer).fromScene(scene).texture;
  refresh();
});

pane.addInput(PARAMS, 'fov', {
  label: 'field of view',
  min: 20,
  max: 170,
  step: 1,
}).on('change', () => {
  camera.fov = PARAMS.fov;
  refresh();
});

pane.addInput(PARAMS, 'xPos', {
  label: 'camera x position',
  min: -2,
  max: 5,
  step: 0.1,
}).on('change', () => {
  camera.position.x = PARAMS.xPos;
  camera.lookAt(new THREE.Vector3(PARAMS.xLook, PARAMS.yLook, 0));
  camera.rotateZ(PARAMS.zAngle * (Math.PI / 180));
  refresh();
});

pane.addInput(PARAMS, 'xLook', {
  label: 'camera look at x position',
  min: -2,
  max: 5,
  step: 0.1,
}).on('change', () => {
  camera.lookAt(new THREE.Vector3(PARAMS.xLook, PARAMS.yLook, 0));
  camera.rotateZ(PARAMS.zAngle * (Math.PI / 180));
  refresh();
});

pane.addInput(PARAMS, 'yPos', {
  label: 'camera y position',
  min: -0.9,
  max: 5,
  step: 0.1,
}).on('change', () => {
  camera.position.y = PARAMS.yPos;
  camera.lookAt(new THREE.Vector3(PARAMS.xLook, PARAMS.yLook, 0));
  camera.rotateZ(PARAMS.zAngle * (Math.PI / 180));
  refresh();
});

pane.addInput(PARAMS, 'yLook', {
  label: 'camera look at y position',
  min: -0.9,
  max: 5,
  step: 0.1,
}).on('change', () => {
  camera.lookAt(new THREE.Vector3(PARAMS.xLook, PARAMS.yLook, 0));
  camera.rotateZ(PARAMS.zAngle * (Math.PI / 180));
  refresh();
});

pane.addInput(PARAMS, 'zAngle', {
  label: 'camera roll angle',
  min: -180,
  max: 180,
  step: 0.05,
}).on('change', () => {
  camera.lookAt(new THREE.Vector3(PARAMS.xLook, PARAMS.yLook, 0));
  camera.rotateZ(PARAMS.zAngle * (Math.PI / 180));
  refresh();
});

pane.addSeparator();

pane.addButton({title: 'View on GitHub'}).on('click', function() {
  location.href = 'https://github.com/SneezingCactus/threejs-intercourse-generator';
});
/* #endregion PANEL INIT */

/**
 * render the scene and request animation frame for this same function
 */
function animate() {
  composer.render();
  requestAnimationFrame(animate);
}
animate();
