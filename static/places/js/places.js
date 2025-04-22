/**
 * Places - Interactive Map for Hugo
 * JavaScript functionality for rendering and interacting with the places map
 */

import { initPlacesMap } from './base/init.js';
import { allPlaces, updateState, markers } from './base/state.js';

// Wait for both DOM and Leaflet to be ready
async function initializeWhenReady() {
    try {
        // Wait for Leaflet to load
        while (typeof L === 'undefined') {
            console.log('Waiting for Leaflet to load...');
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            console.log('Waiting for DOM to be ready...');
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }

        console.log('Leaflet and DOM loaded, initializing...');

        // Make necessary functions and data globally accessible
        window.allPlaces = allPlaces;
        window.updateState = updateState;
        window.initPlacesMap = initPlacesMap;
        window.markers = markers;

        // Initialize places map if container exists
        const mapContainer = document.getElementById('places-map');
        if (mapContainer) {
            console.log('Map container found, initializing map...');
            try {
                await initPlacesMap();
                console.log('Map initialization complete');
            } catch (error) {
                console.error('Error initializing map:', error);
                // Show error message in the places list
                const placesList = document.getElementById('places-list');
                if (placesList) {
                    placesList.innerHTML = '<p class="error-message">Error loading places. Please try refreshing the page.</p>';
                }
            }
        } else {
            console.warn('Map container not found, skipping initialization');
        }
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

// Start initialization process
console.log('Starting initialization process...');
initializeWhenReady().catch(error => {
    console.error('Fatal initialization error:', error);
});

// Export module for use in other files
export {
    allPlaces,
    updateState,
    initPlacesMap,
    markers
};
