/**
 * Main initialization module for Places
 */

import { mapConfig } from './config.js';
import { initializeElements, updateState, elements } from './state.js';
import { initMap } from '../components/map.js';
import { initFilters } from '../components/filters.js';
import { initSearch } from '../components/search.js';
import { setupPanelToggling } from '../components/panel.js';
import { initLightbox } from '../components/lightbox.js';
import { handleSinglePlaceView } from '../components/placeDetails.js';
import { setupHistoryHandling } from '../utils/history.js';
import { initThemeHandling } from '../utils/theme.js';

/**
 * Initialize the Places map and all related functionality
 */
export function initPlacesMap() {
    // Initialize DOM elements
    initializeElements();
    if (!elements.mapContainer) return;

    // Add immersive map class to body
    document.body.classList.add('map-view');

    // Check if we're on a single place page or list page
    const pathParts = window.location.pathname.split('/');
    const isListPage = pathParts.filter(Boolean).length === 1 && 
                      pathParts.filter(Boolean)[0] === 'places';

    // Initialize map
    initMap();
    
    // Setup history handling
    setupHistoryHandling();

    // Get places data
    const placesData = document.getElementById('places-data');
    if (placesData) {
        try {
            const places = JSON.parse(placesData.textContent);
            updateState('allPlaces', places);
            
            // Initialize components
            initFilters();
            initSearch();
            setupPanelToggling();
            
            // Initialize theme handling
            initThemeHandling();
            
            // Check for single place view
            if (!isListPage) {
                handleSinglePlaceView();
            }
        } catch (e) {
            console.error('Error parsing places data:', e);
        }
    }

    // Initialize lightbox
    initLightbox();

    // Handle resize events
    window.addEventListener('resize', handleResize);
    
    // Trigger initial resize
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 100);
}

/**
 * Handle window resize events
 */
function handleResize() {
    const { placesMap } = window;
    if (placesMap) {
        placesMap.invalidateSize();
    }

    // Show/hide panel toggle based on screen size
    const { panelToggle, sidePanel, panelShowToggle } = elements;
    const { mobileBreakpoint } = window.panelConfig;

    if (window.innerWidth < mobileBreakpoint) {
        if (panelToggle) panelToggle.style.display = 'flex';
        if (sidePanel) sidePanel.classList.add('hidden');
        if (panelShowToggle) panelShowToggle.classList.remove('hidden');
        updateState('isPanelVisible', false);
    } else {
        if (panelToggle) panelToggle.style.display = 'none';
        // Only restore the panel if it was previously visible
        if (window.isPanelVisible) {
            if (sidePanel) sidePanel.classList.remove('hidden');
            if (panelShowToggle) panelShowToggle.classList.add('hidden');
        }
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on a places page
    if (document.getElementById('places-map')) {
        initPlacesMap();
    } else if (document.getElementById('single-place-map')) {
        // Initialize single place map if on a single place page
        initSinglePlaceMap();
    }
});
