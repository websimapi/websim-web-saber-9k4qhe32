import * as THREE from 'three';
import { state } from '../state.js';

// Create a 3D object for a note (v2 format)
export function createNoteObject(noteData) {
    const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    
    // Red for left hand, blue for right hand
    const material = new THREE.MeshLambertMaterial({ 
        color: noteData._type === 0 ? 0xff0055 : 0x00a1ff,
        emissive: noteData._type === 0 ? 0x660022 : 0x003366,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Position based on note data
    // Convert from Beat Saber coordinate system to Three.js
    mesh.position.x = (noteData._lineIndex - 1.5) * 0.6; // Center on the grid
    mesh.position.y = (noteData._lineLayer * 0.6) + 0.2;  // Height starts at 0.2
    mesh.position.z = noteData._time * state.noteSpeed;  // Notes come from positive z
    
    // Store the beat time for animation
    mesh.userData = {
        beatTime: noteData._time,
        type: 'note'
    };
    
    // Add direction indicator
    addDirectionIndicator(mesh, noteData._cutDirection);
    
    // Add to scene and track it
    state.scene.add(mesh);
    state.noteObjects.push(mesh);
    
    return mesh;
}

// Create a 3D object for a note (v3 format)
export function createNoteObjectV3(noteData) {
    const geometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    
    // Red for left hand, blue for right hand (assuming color 0 = red, 1 = blue)
    const material = new THREE.MeshLambertMaterial({ 
        color: noteData.color === 0 ? 0xff0055 : 0x00a1ff,
        emissive: noteData.color === 0 ? 0x660022 : 0x003366,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Position based on V3 note data
    // In V3, positions are stored in x,y,z properties
    mesh.position.x = (noteData.x - 1.5) * 0.6; // Center on the grid
    mesh.position.y = (noteData.y * 0.6) + 0.2;  // Height starts at 0.2
    mesh.position.z = noteData.b * state.noteSpeed;  // Notes come from positive z
    
    // Store the beat time for animation
    mesh.userData = {
        beatTime: noteData.b,
        type: 'note'
    };
    
    // Add direction indicator (in V3, it's "d" for direction)
    addDirectionIndicator(mesh, noteData.d);
    
    // Add to scene and track it
    state.scene.add(mesh);
    state.noteObjects.push(mesh);
    
    return mesh;
}

// Add a direction indicator to a note - fixed arrow direction
export function addDirectionIndicator(noteMesh, direction) {
    // Skip for dot notes (direction 8)
    if (direction === 8) return;
    
    const arrowGeometry = new THREE.ConeGeometry(0.15, 0.3, 4);
    const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    
    // Position at the center of the note
    arrow.position.set(0, 0, -0.2); // Move to front face of cube (-z direction)
    
    // Rotate based on direction - fix the rotation to match Beat Saber
    // 0 = up, 1 = down, 2 = left, 3 = right,
    // 4 = up-left, 5 = up-right, 6 = down-left, 7 = down-right
    switch (direction) {
        case 0: // Up
            arrow.rotation.x = -Math.PI / 2;
            break;
        case 1: // Down
            arrow.rotation.x = Math.PI / 2;
            break;
        case 2: // Left
            arrow.rotation.z = -Math.PI / 2;
            break;
        case 3: // Right
            arrow.rotation.z = Math.PI / 2;
            break;
        case 4: // Up-Left
            arrow.rotation.x = -Math.PI / 4;
            arrow.rotation.z = -Math.PI / 4;
            break;
        case 5: // Up-Right
            arrow.rotation.x = -Math.PI / 4;
            arrow.rotation.z = Math.PI / 4;
            break;
        case 6: // Down-Left
            arrow.rotation.x = Math.PI / 4;
            arrow.rotation.z = -Math.PI / 4;
            break;
        case 7: // Down-Right
            arrow.rotation.x = Math.PI / 4;
            arrow.rotation.z = Math.PI / 4;
            break;
    }
    
    noteMesh.add(arrow);
}
