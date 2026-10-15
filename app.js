import { state } from './state.js';
import { logStatus } from './utils/logger.js';
import { checkVRSupport } from './vr/vrManager.js';
import { setupThreeJS } from './visualization/threeManager.js';
import { processMap } from './files/mapLoader.js';
import { playMap, pauseMap } from './audio/audioManager.js';
import { 
    shareMapToGallery, 
    loadGalleryMaps, 
    loadMapFromGallery, 
    createMapCardHTML,
    subscribeToGalleryUpdates
} from './files/mapGallery.js';

// DOM Elements
const uploadInput = document.getElementById('map-upload');
const fileNameDisplay = document.getElementById('file-name');
const processBtn = document.getElementById('process-btn');
const shareBtn = document.getElementById('share-btn');
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const sortSelect = document.getElementById('sort-select');
const galleryContainer = document.getElementById('gallery-container');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const shareModal = document.getElementById('share-modal');
const shareForm = document.getElementById('share-form');
const closeModalBtn = document.querySelector('.close-modal');

// Gallery state
let galleryState = {
    currentPage: 1,
    totalPages: 1,
    searchTerm: '',
    sortOrder: 'newest'
};

// Initialize application
function init() {
    logStatus("Initializing application...");
    checkVRSupport();
    setupEventListeners();
    setupThreeJS();
    loadInitialGallery();
    logStatus("Application initialized and ready!");
}

// Set up event listeners
function setupEventListeners() {
    uploadInput.addEventListener('change', handleFileSelect);
    processBtn.addEventListener('click', handleProcessMap);
    shareBtn.addEventListener('click', handleShareButtonClick);
    playBtn.addEventListener('click', playMap);
    pauseBtn.addEventListener('click', pauseMap);
    
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });
    
    // Gallery controls
    searchBtn.addEventListener('click', handleGallerySearch);
    searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') handleGallerySearch();
    });
    sortSelect.addEventListener('change', handleGallerySort);
    prevPageBtn.addEventListener('click', () => navigateGalleryPage(-1));
    nextPageBtn.addEventListener('click', () => navigateGalleryPage(1));
    
    // Modal controls
    closeModalBtn.addEventListener('click', () => shareModal.style.display = 'none');
    window.addEventListener('click', e => {
        if (e.target === shareModal) shareModal.style.display = 'none';
    });
    shareForm.addEventListener('submit', handleShareMap);
    
    // Live updates for gallery
    subscribeToGalleryUpdates(updateGalleryDisplay);
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.name.endsWith('.zip')) {
        fileNameDisplay.textContent = file.name;
        processBtn.disabled = false;
        logStatus(`File selected: ${file.name}`);
    } else {
        fileNameDisplay.textContent = "Invalid file format (must be .zip)";
        processBtn.disabled = true;
        logStatus("Invalid file format. Please select a .zip file.", true);
    }
}

// Handle process map button click
async function handleProcessMap() {
    try {
        const file = uploadInput.files[0];
        if (!file) return;
        
        processBtn.disabled = true;
        const success = await processMap(file);
        
        if (success) {
            shareBtn.disabled = false;
        } else {
            processBtn.disabled = false;
        }
    } catch (error) {
        logStatus(`Error in process map handler: ${error.message}`, true);
        processBtn.disabled = false;
    }
}

// Switch between tabs
function switchTab(tabId) {
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabId);
    });
    
    if (tabId === 'map-gallery') {
        refreshGallery();
    }
}

// Load initial gallery data
function loadInitialGallery() {
    refreshGallery();
}

// Refresh gallery with current filters
async function refreshGallery() {
    try {
        galleryContainer.innerHTML = '<p>Loading maps...</p>';
        
        const result = await loadGalleryMaps(
            galleryState.sortOrder,
            galleryState.searchTerm,
            galleryState.currentPage
        );
        
        galleryState.totalPages = result.totalPages;
        updateGalleryDisplay(result.maps);
        updatePagination();
    } catch (error) {
        galleryContainer.innerHTML = `<p class="error">Error loading maps: ${error.message}</p>`;
    }
}

// Update gallery display
function updateGalleryDisplay(maps) {
    if (!maps || maps.length === 0) {
        galleryContainer.innerHTML = '<p class="no-maps">No maps found. Share your own maps!</p>';
        return;
    }
    
    let galleryHTML = '<div class="map-cards">';
    maps.forEach(map => {
        galleryHTML += createMapCardHTML(map);
    });
    galleryHTML += '</div>';
    
    galleryContainer.innerHTML = galleryHTML;
    
    // Add event listeners to load buttons
    document.querySelectorAll('.load-map-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const mapId = btn.dataset.mapId;
            const map = maps.find(m => m.id === mapId);
            if (map) {
                await loadMapFromGallery(map);
                switchTab('local-upload');
            }
        });
    });
}

// Handle gallery search
function handleGallerySearch() {
    galleryState.searchTerm = searchInput.value.trim();
    galleryState.currentPage = 1;
    refreshGallery();
}

// Handle gallery sort
function handleGallerySort() {
    galleryState.sortOrder = sortSelect.value;
    refreshGallery();
}

// Navigate gallery pages
function navigateGalleryPage(direction) {
    const newPage = galleryState.currentPage + direction;
    if (newPage >= 1 && newPage <= galleryState.totalPages) {
        galleryState.currentPage = newPage;
        refreshGallery();
    }
}

// Update pagination controls
function updatePagination() {
    pageInfo.textContent = `Page ${galleryState.currentPage} of ${galleryState.totalPages || 1}`;
    prevPageBtn.disabled = galleryState.currentPage <= 1;
    nextPageBtn.disabled = galleryState.currentPage >= galleryState.totalPages;
}

// Handle share button click (open modal)
function handleShareButtonClick() {
    if (!state.currentMap) {
        logStatus("Cannot share: No map is currently loaded", true);
        return;
    }
    
    shareModal.style.display = 'block';
}

// Handle share map form submission
async function handleShareMap(event) {
    event.preventDefault();
    
    try {
        const file = uploadInput.files[0];
        const description = document.getElementById('share-description').value;
        const tags = document.getElementById('share-tags').value;
        
        if (!file || !state.currentMap) {
            throw new Error("No map file or information available to share");
        }
        
        const confirmShareBtn = document.getElementById('confirm-share-btn');
        confirmShareBtn.disabled = true;
        confirmShareBtn.textContent = 'Uploading...';
        
        await shareMapToGallery(file, state.currentMap, description, tags);
        
        shareModal.style.display = 'none';
        confirmShareBtn.disabled = false;
        confirmShareBtn.textContent = 'Share Map';
        
        // Clear form
        document.getElementById('share-description').value = '';
        document.getElementById('share-tags').value = '';
        
        // Refresh gallery
        refreshGallery();
    } catch (error) {
        logStatus(`Error sharing map: ${error.message}`, true);
        const confirmShareBtn = document.getElementById('confirm-share-btn');
        confirmShareBtn.disabled = false;
        confirmShareBtn.textContent = 'Share Map';
    }
}

// Initialize application when document is ready
document.addEventListener('DOMContentLoaded', init);