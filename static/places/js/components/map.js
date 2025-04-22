/**
 * Map component functionality
 */

import { mapConfig, controlConfig } from '../base/config.js';
import { updateState, placesMap, markers } from '../base/state.js';
import { addViewportToggleControl } from './filters.js';
import { renderPlaces } from './markers.js';

/**
 * Initialize the map
 */
export function initMap() {
    try {
        // Check if map is already initialized
        if (placesMap) {
            console.warn('Map is already initialized, returning existing instance');
            return placesMap;
        }

        const mapContainer = document.getElementById('places-map');
        if (!mapContainer) {
            throw new Error('Map container element not found');
        }

        console.log('Creating map instance...');
        const map = L.map('places-map', {
            zoomControl: false,
            // Add padding to ensure popups don't go under menu
            paddingTopLeft: [0, 60]
        }).setView(mapConfig.defaultView, mapConfig.defaultZoom);

        console.log('Adding tile layer...');
        // Add tile layer
        L.tileLayer(mapConfig.tileLayer, {
            attribution: mapConfig.attribution,
            maxZoom: mapConfig.maxZoom
        }).addTo(map);

        console.log('Adding controls...');
        // Add zoom control
        L.control.zoom({
            position: controlConfig.zoomPosition
        }).addTo(map);

        // Add viewport filter toggle
        addViewportToggleControl(map);

        console.log('Updating map reference...');
        // Update global map reference
        updateState('placesMap', map);

        // Add event listener for map movement
        map.on('moveend', () => {
            // Update places list without changing map bounds
            renderPlaces(false);
        });

        console.log('Map initialization complete');
        return map;
    } catch (error) {
        console.error('Error initializing map:', error);
        return null;
    }
}

/**
 * Zoom to a specific place on the map
 * @param {Object} place - The place object to zoom to
 */
export function zoomToPlace(place) {
    if (!placesMap || !place || !place.lat || !place.lng) return;

    // Zoom to place with animation
    placesMap.flyTo([place.lat, place.lng], 15, {
        animate: true,
        duration: 1
    });

    // Open popup for this place if marker exists
    if (markers[place.permalink]) {
        // Wait for zoom animation to complete
        setTimeout(() => {
            markers[place.permalink].openPopup();
        }, 1100);
    }
}

/**
 * Update map for dark/light mode
 * @param {boolean} isDark - Whether dark mode is enabled
 */
export function updateMapForDarkMode(isDark) {
    // This would ideally switch to a dark theme map tileset
    // For demonstration, we'll just log the change
    console.log('Map dark mode:', isDark);
}
