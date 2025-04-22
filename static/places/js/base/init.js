/**
 * Main initialization module for Places
 */

import { mapConfig, panelConfig } from './config.js';
import { initializeElements, updateState, elements, allPlaces, isPanelVisible, markers, resetState } from './state.js';
import { initMap } from '../components/map.js';
import { initFilters } from '../components/filters.js';
import { initSearch } from '../components/search.js';
import { setupPanelToggling } from '../components/panel.js';
import { setupHistoryHandling, initializeFromURL } from '../utils/history.js';
import { renderPlaces } from '../components/markers.js';

/**
 * Initialize the Places map and all related functionality
 */
export function initPlacesMap() {
    return new Promise((resolve, reject) => {
        // Initialize DOM elements
        initializeElements();
        if (!elements.mapContainer) {
            reject(new Error('Map container not found'));
            return;
        }

        // Add immersive map class to body
        document.body.classList.add('map-view');

        // Get places data first
        const placesData = document.getElementById('places-data');
        if (!placesData) {
            reject(new Error('Places data element not found'));
            return;
        }

        try {
            // Reset any existing state
            resetState();
            
            // Parse and validate places data
            let places;
            try {
                places = JSON.parse(placesData.textContent);
            } catch (parseError) {
                throw new Error(`Failed to parse places data: ${parseError.message}`);
            }
        
            // Validate data structure
            if (!Array.isArray(places)) {
                throw new Error('Invalid places data: Expected an array but received ' + typeof places);
            }
            
            if (places.length === 0) {
                console.warn('Warning: No places found in data');
            }
            
            // Validate required fields and normalize permalinks
            const invalidPlaces = [];
            places = places.map(place => {
                if (!place.title || !place.lat || !place.lng || 
                    typeof place.lat !== 'number' || typeof place.lng !== 'number') {
                    invalidPlaces.push(place.title || 'Untitled');
                    return place;
                }
                
                // Normalize permalink format
                if (place.permalink) {
                    // Strip quotes, remove any leading/trailing slashes, and ensure single places prefix
                    place.permalink = place.permalink
                        .replace(/['"]/g, '') // Remove quotes
                        .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
                        .replace(/^places\//, ''); // Remove leading 'places/'
                    
                    // Add single places prefix
                    place.permalink = `/places/${place.permalink}`;
                }
                return place;
            });
            
            if (invalidPlaces.length > 0) {
                console.error('Warning: Some places have invalid or missing required fields:', invalidPlaces);
            }
            
            // Initialize state and map
            updateState('markers', {});
            updateState('allPlaces', places);
            const map = initMap();
            if (!map) {
                throw new Error('Map initialization failed - map instance is null');
            }
            
            // Initialize components
            initFilters();
            initSearch();
            setupPanelToggling();
            
            // Render places
            renderPlaces(true);
            
            // Setup history handling and URL initialization
            setupHistoryHandling();
            initializeFromURL();
            
            // Handle resize events
            window.addEventListener('resize', handleResize);
            
            // Trigger initial resize
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 100);
            
            resolve();
        } catch (e) {
            console.error('Error parsing places data:', e);
            console.error('Raw places data:', placesData.textContent);
            
            // Show error in the places list
            const placesList = document.getElementById('places-list');
            if (placesList) {
                placesList.innerHTML = '<p class="error-message">Error loading places. Please try refreshing the page.</p>';
            }
            
            reject(e);
        }
    });
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
