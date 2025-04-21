/**
 * Places - Interactive Map for Hugo
 * JavaScript functionality for rendering and interacting with the places map
 */

import { initPlacesMap, initSinglePlaceMap } from './base/init.js';
import { showPlaceDetails } from './components/placeDetails.js';
import { backToListView } from './components/placeDetails.js';
import { allPlaces } from './base/state.js';

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

// Export functions that need to be globally accessible
window.showPlaceDetails = showPlaceDetails;
window.backToListView = backToListView;
window.allPlaces = allPlaces;

// Export module for use in other files
export {
    showPlaceDetails,
    backToListView,
    allPlaces
};
