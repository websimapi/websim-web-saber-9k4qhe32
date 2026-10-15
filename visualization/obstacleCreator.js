import * as THREE from 'three';
import { state } from '../state.js';

// Create a 3D object for an obstacle (v2 format)
export function createObstacleObject(obstacleData) {
    const width = obstacleData._width * 0.6;
    const height = obstacleData._type === 0 ? 3.0 : 1.0; // Full height or half height
    const depth = obstacleData._duration * 2.0;
    
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshLambertMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.5
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Position based on obstacle data - fixed direction
    mesh.position.x = (obstacleData._lineIndex - 1.5) * 0.6 + (width / 2) - 0.3;
    mesh.position.y = (height / 2);
    mesh.position.z = obstacleData._time * state.noteSpeed + (depth / 2);
    
    // Store the beat time for animation
    mesh.userData = {
        beatTime: obstacleData._time,
        duration: obstacleData._duration,
        type: 'obstacle'
    };
    
    // Add to scene and track it
    state.scene.add(mesh);
    state.obstacleObjects.push(mesh);
    
    return mesh;
}

// Create a 3D object for an obstacle (v3 format)
export function createObstacleObjectV3(obstacleData) {
    // In V3, wall width is defined by w, height by h, and duration by d
    const width = obstacleData.w * 0.6;
    const height = obstacleData.h * 0.6;
    const depth = obstacleData.d * 2.0;
    
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshLambertMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.5
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Position based on V3 obstacle data - fixed direction
    mesh.position.x = (obstacleData.x - 1.5) * 0.6 + (width / 2) - 0.3;
    mesh.position.y = obstacleData.y * 0.6 + (height / 2);
    mesh.position.z = obstacleData.b * state.noteSpeed + (depth / 2); // b is the beat time
    
    // Store the beat time for animation
    mesh.userData = {
        beatTime: obstacleData.b,
        duration: obstacleData.d,
        type: 'obstacle'
    };
    
    // Add to scene and track it
    state.scene.add(mesh);
    state.obstacleObjects.push(mesh);
    
    return mesh;
}