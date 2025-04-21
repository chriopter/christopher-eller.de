/**
 * Places - Interactive Map for Hugo
 * JavaScript functionality for rendering and interacting with the places map
 */

import { initPlacesMap } from './base/init.js';
import { showPlaceDetails, backToListView } from './components/placeDetails.js';
import { allPlaces, updateState, markers } from './base/state.js';

// Wait for Leaflet to be available
function initializeWhenReady() {
    if (typeof L === 'undefined') {
        console.log('Waiting for Leaflet to load...');
        setTimeout(initializeWhenReady, 100);
        return;
    }

    console.log('Leaflet loaded, initializing places...');

    // Make necessary functions and data globally accessible
    window.showPlaceDetails = showPlaceDetails;
    window.backToListView = backToListView;
    window.allPlaces = allPlaces;
    window.updateState = updateState;
    window.initPlacesMap = initPlacesMap;
    window.markers = markers;

    // Initialize places map
    if (document.getElementById('places-map')) {
        initPlacesMap();
    }
}

// Start initialization process
initializeWhenReady();

// Export module for use in other files
export {
    showPlaceDetails,
    backToListView,
    allPlaces,
    updateState,
    initPlacesMap,
    markers
};
