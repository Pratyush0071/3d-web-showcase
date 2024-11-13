import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Create scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff); // Set background color to white

// Create camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(20, 15, 40); // Adjusted camera position for better view of model

// Create renderer
const canvas = document.getElementById('canvas'); // Directly access the canvas by ID
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true
});

renderer.setSize(window.innerWidth * 0.6, window.innerHeight * 0.6); // Initial renderer size to ~60% screen
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;

// Add orbital controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Add smooth damping effect
controls.dampingFactor = 0.05;
controls.minDistance = 20;
controls.maxDistance = 100;

// Adjust the camera aspect ratio accordingly
camera.aspect = (window.innerWidth * 0.6) / (window.innerHeight * 0.6);
camera.updateProjectionMatrix();

// Handle window resize for 60% screen display
window.addEventListener('resize', () => {
  const width = window.innerWidth * 0.6;
  const height = window.innerHeight * 0.6;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

// Define color options
const colors = { red: '#820300', blue: '#000B58', black: '#000000' };
let modelMeshes = []; // Array to store meshes for easy color change

// Load HDRI environment map
const rgbeLoader = new RGBELoader();
rgbeLoader.load(
  'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dancing_hall_1k.hdr',
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
  },
  undefined,
  (error) => console.error('An error occurred while loading HDR map:', error)
);

// Load primary GLTF model
const loader = new GLTFLoader();
loader.load('./tata.glb', (gltf) => {
  scene.add(gltf.scene);
  gltf.scene.rotateY(Math.PI);
  gltf.scene.scale.set(10, 10, 10); // Adjusted scale to match new camera position

  // Point camera at the model
  const box = new THREE.Box3().setFromObject(gltf.scene);
  const center = box.getCenter(new THREE.Vector3());
  camera.lookAt(center);
  controls.target.copy(center); // Set orbital controls target to model center
});

// Load second GLTF model (for color-changing)
const loader2 = new GLTFLoader();
loader2.load('./tata1.glb', (gltf) => {
  scene.add(gltf.scene);
  gltf.scene.rotateY(Math.PI);
  gltf.scene.scale.set(10.01, 10.01, 10.01); // Adjusted scale to match new camera position
  gltf.scene.traverse((node) => {
    if (node.isMesh) {
      node.material = new THREE.MeshStandardMaterial({
        color: 0x820300, // Default color
        metalness: 1.0, // High metalness for shininess
        roughness: 0.4, // Low roughness for a polished, shiny look
        envMapIntensity: 1.5 // Increase to enhance reflection effect
      });
      modelMeshes.push(node); // Store the mesh for color changes
    }
  });
});

// Function to change model color
function changeModelColor(color) {
  const newColor = new THREE.Color(color);
  modelMeshes.forEach(mesh => {
    if (mesh.material) {
      mesh.material.color.set(newColor);
      mesh.material.needsUpdate = true;
    }
  });
}

// Add color option buttons container under the canvas
const colorButtonsContainer = document.createElement('div');
colorButtonsContainer.style.display = 'flex';
colorButtonsContainer.style.justifyContent = 'center';
colorButtonsContainer.style.marginTop = '10px';
canvas.parentElement.appendChild(colorButtonsContainer); // Place under the canvas

Object.keys(colors).forEach((color) => {
  const button = document.createElement('button');
  button.style.backgroundColor = colors[color];
  button.style.color = 'white';
  button.style.margin = '0 5px';
  button.style.padding = '10px 15px';
  button.style.borderRadius = '8px';
  button.style.cursor = 'pointer';
  button.textContent = color.charAt(0).toUpperCase() + color.slice(1);

  button.addEventListener('click', () => changeModelColor(colors[color]));
  colorButtonsContainer.appendChild(button);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // Update controls in animation loop
  renderer.render(scene, camera);
}
animate();
