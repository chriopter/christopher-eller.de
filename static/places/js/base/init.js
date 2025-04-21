/**
 * Main initialization module for Places
 */

import { mapConfig, panelConfig } from './config.js';
import { initializeElements, updateState, elements, allPlaces, isPanelVisible } from './state.js';
import { initMap } from '../components/map.js';
import { initFilters } from '../components/filters.js';
import { initSearch } from '../components/search.js';
import { setupPanelToggling } from '../components/panel.js';
import { initLightbox } from '../components/gallery.js';
import { setupHistoryHandling, initializeFromURL } from '../utils/history.js';
import { initThemeHandling } from '../utils/theme.js';

/**
 * Initialize the Places map and all related functionality
 */
function initPlacesMap() {
    // Initialize DOM elements
    initializeElements();
    if (!elements.mapContainer) return;

    // Add immersive map class to body
    document.body.classList.add('map-view');

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
            
            // Initialize lightbox
            initLightbox();
            
            // Check URL for place parameter
            initializeFromURL();
        } catch (e) {
            console.error('Error parsing places data:', e);
        }
    }

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
    const { mobileBreakpoint } = panelConfig;

    if (window.innerWidth < mobileBreakpoint) {
        if (panelToggle) panelToggle.style.display = 'flex';
        if (sidePanel) sidePanel.classList.add('hidden');
        if (panelShowToggle) panelShowToggle.classList.remove('hidden');
        updateState('isPanelVisible', false);
    } else {
        if (panelToggle) panelToggle.style.display = 'none';
        // Only restore the panel if it was previously visible
        if (isPanelVisible) {
            if (sidePanel) sidePanel.classList.remove('hidden');
            if (panelShowToggle) panelShowToggle.classList.add('hidden');
        }
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('places-map')) {
        initPlacesMap();
    }
});
