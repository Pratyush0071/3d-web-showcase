import * as THREE from 'three';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Create scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x999999); // Light gray background

// Create camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(20, 15, 40); // Adjust camera for better view

// Create renderer
const canvas = document.getElementById('canvas'); // Access canvas by ID
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true, // Transparency support
});

renderer.setSize(window.innerWidth * 0.7, window.innerHeight * 0.7);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.outputEncoding = THREE.sRGBEncoding; // Replaced outdated property
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Add orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 45;
controls.maxDistance = 45;

// Lighting setup
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

// Color options for model
const colors = { red: '#820300', blue: '#000B58', black: '#000000' };
let modelMeshes = [];

// Load HDRI environment map
const rgbeLoader = new RGBELoader();
rgbeLoader.load(
  'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dancing_hall_1k.hdr',
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
  },
  undefined,
  (error) => console.error('Error loading HDR map:', error)
);

// Load primary GLTF model
const loader = new GLTFLoader();
loader.load('./tata.glb',
  (gltf) => {
    const model = gltf.scene;
    model.scale.set(10, 10, 10);
    model.rotateY(Math.PI); // Rotate for initial orientation
    model.traverse((node) => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    scene.add(model);

    // Adjust controls and camera focus
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    camera.lookAt(center);
    controls.target.copy(center);
  },
  undefined,
  (error) => console.error('Error loading primary model:', error)
);

// Load secondary model with color-changing capability
const loader2 = new GLTFLoader();
loader2.load('./tata1.glb',
  (gltf) => {
    const model = gltf.scene;
    model.scale.set(10.01, 10.01, 10.01);
    model.rotateY(Math.PI);
    model.traverse((node) => {
      if (node.isMesh) {
        node.material = new THREE.MeshPhysicalMaterial({
          color: 0x820300,
          metalness: 0.9,
          roughness: 0.3,
          clearcoat: 0.3,
          clearcoatRoughness: 0.2,
          envMapIntensity: 2.0
        });
        node.castShadow = true;
        node.receiveShadow = true;
        modelMeshes.push(node);
      }
    });
    scene.add(model);
  },
  undefined,
  (error) => console.error('Error loading color model:', error)
);

// Create circular plane
const planeGeometry = new THREE.CircleGeometry(40, 70);
const planeMaterial = new THREE.MeshStandardMaterial({
  color: 0x000000,
  metalness: 0.2,
  roughness: 0.8,
  side: THREE.DoubleSide
});
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = -0.1;
plane.receiveShadow = true;
scene.add(plane);

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

// Create color-changing buttons
const colorButtonsContainer = document.createElement('div');
colorButtonsContainer.style.display = 'flex';
colorButtonsContainer.style.justifyContent = 'center';
colorButtonsContainer.style.marginTop = '10px';
canvas.parentElement.appendChild(colorButtonsContainer);

Object.keys(colors).forEach((color) => {
  const button = document.createElement('button');
  button.className = 'color-button'; // Add this line to apply the class
  button.style.backgroundColor = colors[color];
  button.style.color = 'white';
  button.textContent = color.charAt(0).toUpperCase() + color.slice(1);

  button.addEventListener('click', () => changeModelColor(colors[color]));
  colorButtonsContainer.appendChild(button);
});

// Handle window resize
window.addEventListener('resize', () => {
  const width = window.innerWidth * 0.7;
  const height = window.innerHeight * 0.7;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
