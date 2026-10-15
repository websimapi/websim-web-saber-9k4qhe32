import { state } from '../state.js';
import { logStatus } from '../utils/logger.js';
import { findFileInZip } from './mapLoader.js';
import { clearVisualization, createPlayerArea, prepareVisualization } from '../visualization/visualizer.js';

// Load a specific difficulty
export async function loadDifficulty(difficultyFile) {
    try {
        logStatus(`Loading difficulty: ${difficultyFile}`);
        
        // Find the difficulty file
        const file = findFileInZip(state.extractedFiles, difficultyFile);
        if (!file) {
            throw new Error(`Difficulty file '${difficultyFile}' not found in the ZIP archive`);
        }
        
        // Parse difficulty data
        const diffContent = await file.async("text");
        const diffData = JSON.parse(diffContent);
        
        // Log the difficulty structure to help with debugging
        console.log("Difficulty data structure:", diffData);
        
        state.currentDifficulty = diffData;
        
        // Clear existing notes and obstacles
        clearVisualization();
        
        // Create player area
        createPlayerArea();
        
        // Prepare notes and obstacles for visualization
        prepareVisualization(diffData);
        
        // Enable play button
        document.getElementById('play-btn').disabled = false;
        
        logStatus(`Difficulty '${difficultyFile}' loaded successfully`);
        return true;
    } catch (error) {
        logStatus(`Error loading difficulty: ${error.message}`, true);
        return false;
    }
}