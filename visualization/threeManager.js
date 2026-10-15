import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { state } from '../state.js';
import { setupVRControllers } from '../vr/vrController.js';

// Set up Three.js environment
export function setupThreeJS() {
    const canvasContainer = document.getElementById('canvas-container');
    
    // Create scene
    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x000000);
    
    // Create camera
    state.camera = new THREE.PerspectiveCamera(75, canvasContainer.clientWidth / canvasContainer.clientHeight, 0.1, 1000);
    state.camera.position.set(0, 1.6, -3); // Move behind the player to see notes coming
    
    // Create renderer
    state.renderer = new THREE.WebGLRenderer({ antialias: true });
    state.renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
    state.renderer.xr.enabled = true;
    canvasContainer.appendChild(state.renderer.domElement);
    
    // Add orbit controls for desktop
    const controls = new OrbitControls(state.camera, state.renderer.domElement);
    controls.target.set(0, 1.6, 0);
    controls.update();
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    state.scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 10, 10);
    state.scene.add(directionalLight);
    
    // Add a grid
    const gridHelper = new THREE.GridHelper(20, 20);
    state.scene.add(gridHelper);
    
    // Add VR button if supported
    if (state.isVRSupported) {
        document.body.appendChild(VRButton.createButton(state.renderer));
        
        // Set up VR controllers
        setupVRControllers();
        
        // Handle VR session events
        setupVRSessionEvents();
    }
    
    // Start animation loop
    state.renderer.setAnimationLoop(render);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
}

// Handle entering/exiting VR
function setupVRSessionEvents() {
    const vrView = document.getElementById('vr-view');
    const desktopView = document.getElementById('desktop-view');
    
    // Handle entering VR
    state.renderer.xr.addEventListener('sessionstart', () => {
        state.isInVR = true;
        vrView.classList.remove('hidden');
        desktopView.classList.add('hidden');
    });
    
    // Handle exiting VR
    state.renderer.xr.addEventListener('sessionend', () => {
        state.isInVR = false;
        vrView.classList.add('hidden');
        desktopView.classList.remove('hidden');
    });
}

// Handle window resize
export function onWindowResize() {
    const canvasContainer = document.getElementById('canvas-container');
    state.camera.aspect = canvasContainer.clientWidth / canvasContainer.clientHeight;
    state.camera.updateProjectionMatrix();
    state.renderer.setSize(canvasContainer.clientWidth, canvasContainer.clientHeight);
}

// Render function (called by animation loop)
export function render() {
    state.renderer.render(state.scene, state.camera);
}