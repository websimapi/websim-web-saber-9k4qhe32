import * as THREE from 'three';
import { state } from '../state.js';
import { logStatus } from '../utils/logger.js';
import { createNoteObject, createNoteObjectV3 } from './noteCreator.js';
import { createObstacleObject, createObstacleObjectV3 } from './obstacleCreator.js';

// Create a visual representation of the player area
export function createPlayerArea() {
    // Remove existing player area if present
    if (state.playerArea) {
        state.scene.remove(state.playerArea);
        state.playerArea = null;
    }
    
    // Create a group to hold all player area elements
    const playerArea = new THREE.Group();
    
    // Create a floor plate
    const floorGeometry = new THREE.PlaneGeometry(4, 4);
    const floorMaterial = new THREE.MeshBasicMaterial({
        color: 0x333333,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    playerArea.add(floor);
    
    // Create grid for the playable area (4x3 grid)
    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x555555 });
    
    // Horizontal lines
    for (let i = 0; i <= 3; i++) {
        const y = i * 0.6;
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-1.2, y, 0),
            new THREE.Vector3(1.2, y, 0)
        ]);
        const line = new THREE.Line(lineGeometry, gridMaterial);
        playerArea.add(line);
    }
    
    // Vertical lines
    for (let i = 0; i <= 4; i++) {
        const x = (i - 2) * 0.6;
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x, 0, 0),
            new THREE.Vector3(x, 1.8, 0)
        ]);
        const line = new THREE.Line(lineGeometry, gridMaterial);
        playerArea.add(line);
    }
    
    // Add the player area to the scene
    state.scene.add(playerArea);
    state.playerArea = playerArea;
}

// Clear visualization
export function clearVisualization() {
    // Remove existing notes and obstacles
    state.noteObjects.forEach(note => {
        state.scene.remove(note);
    });
    
    state.obstacleObjects.forEach(obstacle => {
        state.scene.remove(obstacle);
    });
    
    state.noteObjects = [];
    state.obstacleObjects = [];
}

// Prepare visualization
export function prepareVisualization(diffData) {
    try {
        logStatus("Preparing map visualization...");
        
        // Handle different Beat Saber map formats
        // Check for v2 format (_notes property)
        if (diffData._notes && Array.isArray(diffData._notes)) {
            logStatus("Using V2 note format (_notes)");
            diffData._notes.forEach(note => {
                createNoteObject(note);
            });
        } 
        // Check for v3 format (colorNotes property)
        else if (diffData.colorNotes && Array.isArray(diffData.colorNotes)) {
            logStatus("Using V3 note format (colorNotes)");
            diffData.colorNotes.forEach(note => {
                createNoteObjectV3(note);
            });
        } else {
            logStatus("No notes found or unsupported format in the difficulty file", true);
            console.warn("Difficulty data:", diffData);
        }
        
        // Handle obstacles (walls)
        if (diffData._obstacles && Array.isArray(diffData._obstacles)) {
            logStatus("Using V2 obstacle format (_obstacles)");
            diffData._obstacles.forEach(obstacle => {
                createObstacleObject(obstacle);
            });
        } 
        else if (diffData.obstacles && Array.isArray(diffData.obstacles)) {
            logStatus("Using V3 obstacle format (obstacles)");
            diffData.obstacles.forEach(obstacle => {
                createObstacleObjectV3(obstacle);
            });
        }
        
        logStatus(`Map visualization ready: ${state.noteObjects.length} notes, ${state.obstacleObjects.length} obstacles`);
    } catch (error) {
        logStatus(`Error preparing visualization: ${error.message}`, true);
        console.error("Error in prepareVisualization:", error);
    }
}