import { logStatus } from '../utils/logger.js';
import { processMap } from './mapLoader.js';
import { displayMapInfo } from '../utils/uiManager.js';

// Initialize WebsimSocket connection for database access
const room = new WebsimSocket();

// Share a map to the gallery
export async function shareMapToGallery(file, mapInfo, description = '', tags = '') {
    try {
        logStatus("Sharing map to gallery...");
        
        if (!file || !mapInfo) {
            throw new Error("No map file or information available to share");
        }
        
        // Upload map file to blob storage
        const mapUrl = await websim.upload(file);
        
        // Create record in the database
        const mapRecord = await room.collection('beatmap').create({
            songName: mapInfo._songName || 'Unknown Song',
            songAuthor: mapInfo._songAuthorName || 'Unknown Artist',
            mapper: mapInfo._levelAuthorName || 'Unknown Mapper',
            bpm: mapInfo._beatsPerMinute || 0,
            description: description,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            fileUrl: mapUrl,
            difficulties: mapInfo._difficultyBeatmapSets 
                ? mapInfo._difficultyBeatmapSets.flatMap(set => 
                    set._difficultyBeatmaps.map(diff => diff._difficulty)
                  ) 
                : []
        });
        
        logStatus("Map shared successfully!");
        return mapRecord;
    } catch (error) {
        logStatus(`Error sharing map: ${error.message}`, true);
        throw error;
    }
}

// Load maps from the gallery
export async function loadGalleryMaps(sortOrder = 'newest', searchTerm = '', page = 1, pageSize = 10) {
    try {
        logStatus("Loading maps from gallery...");
        
        let mapsCollection = room.collection('beatmap');
        let maps = mapsCollection.getList();
        
        // Filter by search term if provided
        if (searchTerm) {
            maps = maps.filter(map => 
                map.songName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                map.songAuthor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                map.mapper.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (map.description && map.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (map.tags && map.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
            );
        }
        
        // Sort maps based on selected order
        switch (sortOrder) {
            case 'oldest':
                maps.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                break;
            case 'name':
                maps.sort((a, b) => a.songName.localeCompare(b.songName));
                break;
            case 'newest':
            default:
                // Default sort is already newest first
                break;
        }
        
        // Calculate pagination
        const totalMaps = maps.length;
        const totalPages = Math.ceil(totalMaps / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedMaps = maps.slice(startIndex, endIndex);
        
        return {
            maps: paginatedMaps,
            page,
            totalPages,
            totalMaps
        };
    } catch (error) {
        logStatus(`Error loading gallery maps: ${error.message}`, true);
        throw error;
    }
}

// Load a map from the gallery
export async function loadMapFromGallery(mapRecord) {
    try {
        logStatus(`Loading map from gallery: ${mapRecord.songName}...`);
        
        // Fetch the map file from the URL
        const response = await fetch(mapRecord.fileUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch map file: ${response.statusText}`);
        }
        
        // Convert to blob
        const blob = await response.blob();
        
        // Create a File object from the blob
        const file = new File([blob], `${mapRecord.songName}.zip`, { type: 'application/zip' });
        
        // Process the map as if it was uploaded locally
        await processMap(file);
        
        logStatus(`Gallery map "${mapRecord.songName}" loaded successfully!`);
        return true;
    } catch (error) {
        logStatus(`Error loading map from gallery: ${error.message}`, true);
        return false;
    }
}

// Generate HTML for a map card
export function createMapCardHTML(map) {
    // Create a random color from the map name for the color box (if no cover image)
    const stringToColor = str => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        let color = '#';
        for (let i = 0; i < 3; i++) {
            const value = (hash >> (i * 8)) & 0xFF;
            color += ('00' + value.toString(16)).substr(-2);
        }
        return color;
    };
    
    const cardColor = stringToColor(map.songName);
    
    // Format the date
    const date = new Date(map.created_at);
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    
    // Create difficulty badges
    const difficultyBadges = map.difficulties.map(diff => 
        `<span class="difficulty-badge">${diff}</span>`
    ).join('');
    
    return `
    <div class="map-card" data-map-id="${map.id}">
        <div class="map-card-color" style="background-color: ${cardColor}"></div>
        <div class="map-card-content">
            <h3 class="map-title">${map.songName}</h3>
            <div class="map-artist">${map.songAuthor}</div>
            <div class="map-mapper">Mapped by ${map.mapper}</div>
            <div class="map-details">
                <span class="map-bpm">${map.bpm} BPM</span>
                <span class="map-uploaded">Uploaded by ${map.username}</span>
            </div>
            <div class="map-difficulties">
                ${difficultyBadges}
            </div>
            <div class="map-date">${formattedDate}</div>
        </div>
        <div class="map-card-actions">
            <button class="load-map-btn" data-map-id="${map.id}">Load Map</button>
        </div>
    </div>
    `;
}

// Subscribe to updates on the map collection
export function subscribeToGalleryUpdates(callback) {
    return room.collection('beatmap').subscribe(callback);
}