/**
 * Places - Interactive Map for Hugo
 * JavaScript functionality for rendering and interacting with the places map
 */

import { initPlacesMap } from './base/init.js';
import { showPlaceDetails, backToListView } from './components/placeDetails.js';
import { allPlaces, updateState } from './base/state.js';

// Make necessary functions and data globally accessible
const exports = {
    showPlaceDetails,
    backToListView,
    allPlaces,
    updateState,
    initPlacesMap
};

Object.assign(window, exports);

// Export module for use in other files
export default exports;
