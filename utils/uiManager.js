import { state } from '../state.js';
import { logStatus } from './logger.js';

// Update VR Status Display
export function updateVRStatus() {
    const vrStatus = document.getElementById('vr-status');
    vrStatus.textContent = `VR Status: ${state.isVRSupported ? 'Supported' : 'Not Supported'}`;
    vrStatus.style.backgroundColor = state.isVRSupported ? '#1a6e1a' : '#6e1a1a';
}

// Display map information
export function displayMapInfo(infoData) {
    const mapDetails = document.getElementById('map-details');
    let html = `
        <div class="map-property">
            <div class="property-name">Song Name:</div>
            <div>${infoData._songName || 'Unknown'}</div>
        </div>
        <div class="map-property">
            <div class="property-name">Song Artist:</div>
            <div>${infoData._songAuthorName || 'Unknown'}</div>
        </div>
        <div class="map-property">
            <div class="property-name">Mapper:</div>
            <div>${infoData._levelAuthorName || 'Unknown'}</div>
        </div>
        <div class="map-property">
            <div class="property-name">BPM:</div>
            <div>${infoData._beatsPerMinute || 'Unknown'}</div>
        </div>
        <div class="map-property">
            <div class="property-name">Difficulties:</div>
            <div class="difficulties-list">
    `;
    
    // Check different formats for difficulty data
    if (infoData._difficultyBeatmapSets && Array.isArray(infoData._difficultyBeatmapSets)) {
        infoData._difficultyBeatmapSets.forEach(set => {
            if (set._difficultyBeatmaps && Array.isArray(set._difficultyBeatmaps)) {
                set._difficultyBeatmaps.forEach(diff => {
                    html += `<div class="difficulty-item" data-file="${diff._beatmapFilename}">${diff._difficulty}</div>`;
                });
            }
        });
    }
    
    html += `
            </div>
        </div>
    `;
    
    mapDetails.innerHTML = html;
}

export function updatePlaybackControls(isPlaying) {
    const playBtn = document.getElementById('play-btn');
    const pauseBtn = document.getElementById('pause-btn');
    
    playBtn.disabled = isPlaying;
    pauseBtn.disabled = !isPlaying;
}

export function updateProgressBar(progress) {
    const progressBar = document.getElementById('progress-bar');
    progressBar.style.width = `${progress}%`;
}