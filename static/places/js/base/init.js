/**
 * Main initialization module for Places
 */

import { mapConfig, panelConfig } from './config.js';
import { initializeElements, updateState, elements, allPlaces, isPanelVisible, markers, resetState } from './state.js';
import { initMap } from '../components/map.js';
import { initFilters } from '../components/filters.js';
import { initSearch } from '../components/search.js';
import { setupPanelToggling } from '../components/panel.js';
import { initLightbox } from '../components/gallery.js';
import { initBackButton } from '../components/placeDetails.js';
import { setupHistoryHandling, initializeFromURL } from '../utils/history.js';
import { initThemeHandling } from '../utils/theme.js';
import { initMenuTheme } from '../utils/menuTheme.js';
import { renderPlaces } from '../components/markers.js';

/**
 * Initialize the Places map and all related functionality
 */
export function initPlacesMap() {
    // Initialize DOM elements
    initializeElements();
    if (!elements.mapContainer) return;

    // Add immersive map class to body
    document.body.classList.add('map-view');

    // Get places data first
    const placesData = document.getElementById('places-data');
    if (!placesData) {
        console.error('Places data element not found');
        return;
    }

    try {
        // Reset any existing state
        resetState();
        
        console.log('Parsing places data...');
        const places = JSON.parse(placesData.textContent);
        console.log('Successfully parsed places data:', places);
        
        if (!Array.isArray(places)) {
            throw new Error('Places data is not an array');
        }
        
        if (places.length === 0) {
            console.warn('No places found in data');
        }
        
        // Initialize empty markers object first
        updateState('markers', {});
        
        // Update state with places data
        updateState('allPlaces', places);
        
        // Initialize map after places data is loaded
        console.log('Initializing map...');
        const map = initMap();
        
        // Ensure map is initialized before proceeding
        if (!map) {
            throw new Error('Failed to initialize map');
        }
        
        // Initialize components in order
        console.log('Initializing components...');
        initFilters();
        initSearch();
        setupPanelToggling();
        initThemeHandling();
        initMenuTheme();
        initLightbox();
        initBackButton();
        setupHistoryHandling();
        initializeFromURL();
        
        // Wait for next tick to ensure all initialization is complete
        setTimeout(() => {
            console.log('Rendering places...');
            renderPlaces(true);
            
            // Log final state
            console.log('Initialization complete:', {
                placesCount: allPlaces.length,
                mapInitialized: !!map,
                markersCount: Object.keys(markers).length
            });
        }, 0);
    } catch (e) {
        console.error('Error parsing places data:', e);
        console.error('Raw places data:', placesData.textContent);
        
        // Show error in the places list
        const placesList = document.getElementById('places-list');
        if (placesList) {
            placesList.innerHTML = '<p class="error-message">Error loading places. Please try refreshing the page.</p>';
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
