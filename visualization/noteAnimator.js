import { state } from '../state.js';
import { updateAudioProgress } from '../audio/audioManager.js';
import { clearVisualization, createPlayerArea, prepareVisualization } from './visualizer.js';

// Animation loop
export function animateNotes() {
    if (!state.isPlaying) return;
    
    requestAnimationFrame(animateNotes);
    updateVisualization();
}

// Update visualization based on current time
function updateVisualization() {
    if (!state.isPlaying || !state.audioContext) return;
    
    const currentTime = updateAudioProgress();
    if (!currentTime) return;
    
    const currentBeat = currentTime / state.beatLength;
    
    // Move notes based on current beat - fixed direction
    state.noteObjects.forEach(note => {
        // Calculate position based on beat time and current beat
        const beatDifference = note.userData.beatTime - currentBeat;
        note.position.z = note.userData.beatTime * state.noteSpeed - (currentBeat * state.noteSpeed);
        
        // Remove notes that have passed the player
        if (beatDifference < -1) {
            state.scene.remove(note);
        }
    });
    
    // Move obstacles similarly - fixed direction
    state.obstacleObjects.forEach(obstacle => {
        const beatDifference = obstacle.userData.beatTime - currentBeat;
        const depth = obstacle.geometry.parameters.depth;
        obstacle.position.z = obstacle.userData.beatTime * state.noteSpeed - (currentBeat * state.noteSpeed) + (depth / 2);
        
        // Remove obstacles that have passed the player
        if (beatDifference < -1) {
            state.scene.remove(obstacle);
        }
    });
}

// Reset note positions to their original positions
export function resetNotePositions() {
    if (state.currentDifficulty) {
        // Clear existing visualization
        clearVisualization();
        
        // Recreate player area
        createPlayerArea();
        
        // Prepare visualization again
        prepareVisualization(state.currentDifficulty);
    }
}