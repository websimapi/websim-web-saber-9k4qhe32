import { state } from '../state.js';
import { logStatus } from '../utils/logger.js';
import { displayMapInfo } from '../utils/uiManager.js';
import { loadAudio } from '../audio/audioManager.js';
import { loadDifficulty } from './difficultyLoader.js';

// Extract ZIP file
export async function extractZipFile(file) {
    logStatus("Extracting ZIP file...");
    
    try {
        const zip = new JSZip();
        const contents = await zip.loadAsync(file);
        logStatus(`ZIP file extracted: ${Object.keys(contents.files).length} files found`);
        return contents.files;
    } catch (error) {
        throw new Error(`Failed to extract ZIP file: ${error.message}`);
    }
}

// Find info.dat file (case insensitive)
export function findInfoFile(files) {
    const infoFileKey = Object.keys(files).find(
        key => key.toLowerCase() === 'info.dat' || 
               key.toLowerCase().endsWith('/info.dat')
    );
    
    return infoFileKey ? files[infoFileKey] : null;
}

// Find a file in the ZIP archive, accounting for potential folder paths
export function findFileInZip(files, filename) {
    // Try direct match
    if (files[filename]) {
        return files[filename];
    }
    
    // Try finding with any parent path
    const key = Object.keys(files).find(
        key => key.endsWith('/' + filename)
    );
    
    return key ? files[key] : null;
}

// Process the uploaded map
export async function processMap(file) {
    try {
        if (!file) return;
        
        logStatus("Processing map file...");
        
        // Extract the ZIP file
        const extractedFiles = await extractZipFile(file);
        state.extractedFiles = extractedFiles;
        
        // Find info.dat or Info.dat
        const infoFile = findInfoFile(extractedFiles);
        if (!infoFile) {
            throw new Error("Info.dat file not found in the ZIP archive");
        }
        
        // Parse info file
        const infoContent = await infoFile.async("text");
        const infoData = JSON.parse(infoContent);
        
        // Store the map data
        state.currentMap = infoData;
        state.beatLength = 60 / infoData._beatsPerMinute;
        
        // Load and display map information
        displayMapInfo(infoData);
        
        // Load audio file
        const audioFile = extractedFiles[infoData._songFilename];
        if (!audioFile) {
            throw new Error(`Audio file '${infoData._songFilename}' not found in the ZIP archive`);
        }
        
        // Load audio
        await loadAudio(audioFile);
        
        // Add event listeners to difficulties
        setupDifficultyListeners();
        
        // Automatically load the first difficulty
        loadFirstDifficulty(infoData);
        
        logStatus("Map processed successfully! Ready to play.");
        return true;
        
    } catch (error) {
        logStatus(`Error processing map: ${error.message}`, true);
        return false;
    }
}

// Setup event listeners for difficulty items
function setupDifficultyListeners() {
    document.querySelectorAll('.difficulty-item').forEach(item => {
        item.addEventListener('click', async () => {
            const difficultyFile = item.getAttribute('data-file');
            await loadDifficulty(difficultyFile);
            
            // Update active state
            document.querySelectorAll('.difficulty-item').forEach(el => {
                el.classList.remove('active');
            });
            item.classList.add('active');
        });
    });
}

// Automatically load the first difficulty
function loadFirstDifficulty(infoData) {
    if (infoData._difficultyBeatmapSets && 
        infoData._difficultyBeatmapSets.length > 0 && 
        infoData._difficultyBeatmapSets[0]._difficultyBeatmaps && 
        infoData._difficultyBeatmapSets[0]._difficultyBeatmaps.length > 0) {
        
        const firstDifficulty = infoData._difficultyBeatmapSets[0]._difficultyBeatmaps[0];
        loadDifficulty(firstDifficulty._beatmapFilename);
        
        // Add active class to first difficulty
        const firstDifficultyItem = document.querySelector('.difficulty-item');
        if (firstDifficultyItem) {
            firstDifficultyItem.classList.add('active');
        }
    }
}