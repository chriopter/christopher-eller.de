/**
 * Marker management functionality
 */

import { placesMap, markers, isInitialRender, isPanelVisible, updateState } from '../base/state.js';
import { panelConfig } from '../base/config.js';
import { openPlaceInNewTab } from './panel.js';
import { filterPlaces } from './filters.js';

/**
 * Strip quotes from a string
 * @param {string} text - The text to strip quotes from
 * @returns {string} The text with quotes removed
 */
function stripQuotes(text) {
    return text ? text.replace(/['"]/g, '') : '';
}

/**
 * Add a marker for a place
 * @param {Object} place - The place object to create a marker for
 * @returns {Object|null} The created marker or null if creation failed
 */
export function addPlaceMarker(place) {
    try {
        if (!place || typeof place.lat !== 'number' || typeof place.lng !== 'number') {
            console.error('Invalid place data:', place);
            return null;
        }

        const marker = L.marker([place.lat, place.lng], {
            title: place.title
        });

        // Create popup content
        const popupContent = `
            <div class="popup-content">
                <div class="popup-header">
                    <h3 class="popup-title">${stripQuotes(place.title)}</h3>
                    <p class="popup-description">${stripQuotes(place.description)}</p>
                </div>
                ${place.images && place.images.length > 0 ? `
                <div class="place-images-gallery">
                    ${place.images.slice(0, 3).map((img, index) => `
                        <div class="place-image-pin" style="transform: rotate(${index % 2 === 0 ? '-2' : '2'}deg)">
                            <img src="${stripQuotes(img.path)}" alt="${stripQuotes(img.name)}">
                        </div>
                    `).join('')}
                </div>` : ''}
            </div>
        `;

        // Create popup with custom styling and positioning check
        const popup = L.popup({
            className: 'custom-popup simple-popup',
            maxWidth: 500,
            minWidth: 320,
            autoPanPadding: [10, 50], // Add padding for autopan
            keepInView: true // Ensure popup stays in view
        }).setContent(popupContent);

        marker.bindPopup(popup);

        // Add hover events
        marker.on('mouseover', () => {
            marker.openPopup();
        });
        
        marker.on('mouseout', () => {
            marker.closePopup();
        });
        
        // Add click event with position check
        marker.on('click', () => {
            // Get menu height (assuming menu has a fixed height of 60px)
            const menuHeight = 60;
            
            // Get marker position in pixels
            const markerPoint = placesMap.latLngToContainerPoint(marker.getLatLng());
            
            // If marker is too close to top, pan map down
            if (markerPoint.y < menuHeight + 100) { // Add buffer for popup height
                const targetPoint = L.point(markerPoint.x, menuHeight + 100);
                const targetLatLng = placesMap.containerPointToLatLng(targetPoint);
                placesMap.panTo(targetLatLng, { animate: true });
            }
            
            // Open place in new tab
            openPlaceInNewTab(place);
        });

        // Add marker to map
        marker.addTo(placesMap);
        
        // Store marker reference
        const updatedMarkers = { ...markers, [place.permalink]: marker };
        updateState('markers', updatedMarkers);

        return marker;
    } catch (error) {
        console.error(`Error creating marker for place ${place?.title}:`, error);
        return null;
    }
}

/**
 * Render all places on the map
 * @param {boolean} shouldUpdateBounds - Whether to update map bounds
 */
export function renderPlaces(shouldUpdateBounds = false) {
    if (!placesMap) {
        console.error('Map not initialized');
        return;
    }

    // Clear existing markers
    Object.values(markers).forEach(marker => placesMap.removeLayer(marker));
    updateState('markers', {});

    // Filter places
    const filteredPlaces = filterPlaces();

    // Add markers for filtered places
    filteredPlaces.forEach(place => {
        addPlaceMarker(place);
    });

    // Update bounds only if this is the initial render or explicitly requested
    if ((isInitialRender || shouldUpdateBounds) && filteredPlaces.length > 0) {
        const bounds = L.latLngBounds(filteredPlaces.map(place => [place.lat, place.lng]));
        
        // Calculate padding based on sidebar visibility
        let leftPadding = 50;
        if (isPanelVisible && window.innerWidth >= panelConfig.mobileBreakpoint) {
            // Add sidebar width plus a larger margin
            leftPadding = panelConfig.sidebarWidth + 120;
        }
        
        // Use asymmetric padding [top, right, bottom, left]
        placesMap.fitBounds(bounds, { 
            padding: [50, 70, 50, leftPadding]
        });
        
        // Set initial render to false after first render
        if (isInitialRender) {
            updateState('isInitialRender', false);
        }
    }

    // Update places list if available
    if (document.getElementById('places-list')) {
        renderPlacesList(filteredPlaces);
    }
}

/**
 * Render the places list in the sidebar
 * @param {Array} places - Array of places to render
 */
export function renderPlacesList(places = null) {
    const placesList = document.getElementById('places-list');
    if (!placesList) return;
    
    // Use filtered places or all places
    const placesToRender = places || filterPlaces();
    
    // Clear current list
    placesList.innerHTML = '';
    
    // Show message if no places
    if (placesToRender.length === 0) {
        placesList.innerHTML = '<p class="no-results">No places found matching your filters.</p>';
        return;
    }
    
    // Add place items
    placesToRender.forEach(place => {
        const placeItem = document.createElement('div');
        placeItem.className = 'place-item';
        placeItem.dataset.url = place.permalink;
        
        // Process tags for list item
        let tagsToDisplay = [];
        if (typeof place.tags === 'string') {
            try {
                tagsToDisplay = JSON.parse(place.tags);
            } catch (e) {
                console.error(`Error parsing tags for list item "${place.title}":`, e);
            }
        } else if (Array.isArray(place.tags)) {
            tagsToDisplay = place.tags;
        }
        
        placeItem.innerHTML = `
            <div class="place-content">
                <h3 class="place-title">${stripQuotes(place.title)}</h3>
                <p class="place-description">${stripQuotes(place.description)}</p>
                ${tagsToDisplay.length ? `
                <div class="place-tags">
                    ${tagsToDisplay.map(tag => `<span class="place-tag">${stripQuotes(tag)}</span>`).join('')}
                </div>` : ''}
            </div>
            ${place.images && place.images.length > 0 ? `
            <div class="place-images-gallery">
                ${place.images.slice(0, 3).map((img, index) => `
                    <div class="place-image-pin" style="transform: rotate(${index % 2 === 0 ? '-2' : '2'}deg)">
                        <img src="${stripQuotes(img.path)}" alt="${stripQuotes(img.name)}">
                    </div>
                `).join('')}
            </div>` : ''}
        `;
        
        // Add click handler
        placeItem.addEventListener('click', () => {
            // Open place in new tab
            openPlaceInNewTab(place);
            
            // Open marker popup
            if (markers[place.permalink]) {
                markers[place.permalink].openPopup();
            }
        });
        
        placesList.appendChild(placeItem);
    });
}
