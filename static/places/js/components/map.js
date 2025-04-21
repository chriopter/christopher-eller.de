/**
 * Map component functionality
 */

import { mapConfig, controlConfig } from '../base/config.js';
import { updateState, placesMap } from '../base/state.js';
import { addViewportToggleControl } from './filters.js';
import { renderPlaces } from './markers.js';

/**
 * Initialize the map
 */
export function initMap() {
    const map = L.map('places-map', {
        zoomControl: true
    }).setView(mapConfig.defaultView, mapConfig.defaultZoom);

    // Add tile layer
    L.tileLayer(mapConfig.tileLayer, {
        attribution: mapConfig.attribution,
        maxZoom: mapConfig.maxZoom
    }).addTo(map);

    // Add zoom control
    L.control.zoom({
        position: controlConfig.zoomPosition
    }).addTo(map);

    // Add viewport filter toggle
    addViewportToggleControl(map);

    // Update global map reference
    updateState('placesMap', map);

    // Add event listener for map movement
    map.on('moveend', () => {
        // Only update the places list without changing map bounds
        renderPlaces(false);
    });

    return map;
}

/**
 * Initialize a single place map
 */
export function initSinglePlaceMap() {
    const singleMapContainer = document.getElementById('single-place-map');
    if (!singleMapContainer) return;

    const placeData = document.getElementById('place-data');
    if (!placeData) return;

    try {
        const place = JSON.parse(placeData.textContent);

        // Initialize map
        const singleMap = L.map(singleMapContainer).setView([place.lat, place.lng], 13);

        // Add tile layer
        L.tileLayer(mapConfig.tileLayer, {
            attribution: mapConfig.attribution,
            maxZoom: mapConfig.maxZoom
        }).addTo(singleMap);

        // Add marker
        const marker = L.marker([place.lat, place.lng], {
            title: place.title
        }).addTo(singleMap);

        // Get photo gallery HTML
        const photoGalleryHTML = getPhotoGalleryHTML(place, true);

        // Add popup
        const popupContent = `
            <div class="popup-content">
                <div class="popup-header">
                    <h3 class="popup-title">${place.title}</h3>
                    <p class="popup-description">${place.description || ''}</p>
                </div>
                ${photoGalleryHTML}
            </div>
        `;

        marker.bindPopup(popupContent, {
            className: 'custom-popup simple-popup',
            maxWidth: 500,
            minWidth: 320
        }).openPopup();

    } catch (e) {
        console.error('Error parsing place data:', e);
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
