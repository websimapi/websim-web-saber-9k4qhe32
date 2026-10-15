import * as THREE from 'three';
import { XRControllerModelFactory } from 'three/addons/webxr/XRControllerModelFactory.js';
import { state } from '../state.js';

// Set up VR controllers
export function setupVRControllers() {
    const controllerModelFactory = new XRControllerModelFactory();
    
    // Setup controller grip and events for both hands
    for (let i = 0; i < 2; i++) {
        const controller = state.renderer.xr.getController(i);
        controller.addEventListener('selectstart', onSelectStart);
        controller.addEventListener('selectend', onSelectEnd);
        state.scene.add(controller);
        
        const controllerGrip = state.renderer.xr.getControllerGrip(i);
        const controllerModel = controllerModelFactory.createControllerModel(controllerGrip);
        controllerGrip.add(controllerModel);
        state.scene.add(controllerGrip);
        
        state.controllers.push({ controller, controllerGrip });
    }
}

// Handle controller select start
function onSelectStart(event) {
    // Implement VR interaction here
    console.log('VR controller select start', event);
}

// Handle controller select end
function onSelectEnd(event) {
    // Implement VR interaction here
    console.log('VR controller select end', event);
}