import { state } from '../state.js';
import { logStatus } from '../utils/logger.js';
import { updatePlaybackControls, updateProgressBar } from '../utils/uiManager.js';
import { resetNotePositions, animateNotes } from '../visualization/noteAnimator.js';

// Load audio file
export async function loadAudio(audioFile) {
    try {
        logStatus("Loading audio file...");
        
        // Get audio data
        const audioData = await audioFile.async("arraybuffer");
        
        // Create audio context if needed
        if (!state.audioContext) {
            state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Decode audio data
        const audioBuffer = await state.audioContext.decodeAudioData(audioData);
        
        // Store the audio buffer
        state.audio = audioBuffer;
        
        logStatus("Audio loaded successfully!");
    } catch (error) {
        throw new Error(`Failed to load audio: ${error.message}`);
    }
}

// Play the map
export function playMap() {
    if (!state.currentMap || !state.currentDifficulty || !state.audio) {
        logStatus("Cannot play: Map not fully loaded", true);
        return;
    }
    
    try {
        // Stop any existing audio source
        if (state.audioSource) {
            state.audioSource.stop();
        }
        
        // Create a new audio source
        state.audioSource = state.audioContext.createBufferSource();
        state.audioSource.buffer = state.audio;
        state.audioSource.connect(state.audioContext.destination);
        
        // Start playback
        state.audioSource.start();
        state.startTime = state.audioContext.currentTime;
        state.isPlaying = true;
        
        // Reset note positions
        resetNotePositions();
        
        // Update UI
        updatePlaybackControls(true);
        
        // Start animation
        animateNotes();
        
        logStatus("Playback started");
    } catch (error) {
        logStatus(`Error starting playback: ${error.message}`, true);
    }
}

// Pause the map
export function pauseMap() {
    if (!state.isPlaying) return;
    
    try {
        if (state.audioSource) {
            state.audioSource.stop();
            state.audioSource = null;
        }
        state.isPlaying = false;
        
        // Update UI
        updatePlaybackControls(false);
        
        logStatus("Playback paused");
    } catch (error) {
        logStatus(`Error pausing playback: ${error.message}`, true);
    }
}

// Update progress bar based on current audio time
export function updateAudioProgress() {
    if (!state.isPlaying || !state.audioContext || !state.audio) return;
    
    const currentTime = state.audioContext.currentTime - state.startTime;
    const progress = (currentTime / state.audio.duration) * 100;
    updateProgressBar(progress);
    
    return currentTime;
}