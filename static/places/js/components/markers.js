/**
 * Marker management functionality
 */

import { placesMap, markers, allPlaces, isInitialRender, isPanelVisible, updateState } from '../base/state.js';
import { panelConfig } from '../base/config.js';
import { showPlaceDetails } from './placeDetails.js';
import { getPhotoGalleryHTML } from './gallery.js';
import { filterPlaces } from './filters.js';

/**
 * Add a marker for a place
 * @param {Object} place - The place object to create a marker for
 * @returns {Object} The created marker
 */
export function addPlaceMarker(place) {
    const marker = L.marker([place.lat, place.lng], {
        title: place.title
    });

    const photoGalleryHTML = getPhotoGalleryHTML(place, true);

    // Create popup content
    const popupContent = `
        <div class="popup-content">
            <div class="popup-header">
                <h3 class="popup-title">${place.title}</h3>
                <p class="popup-description">${place.description || ''}</p>
            </div>
            ${photoGalleryHTML}
        </div>
    `;

    // Create popup with custom styling
    const popup = L.popup({
        className: 'custom-popup simple-popup',
        maxWidth: 500,
        minWidth: 320
    }).setContent(popupContent);

    marker.bindPopup(popup);
    
    // Add click event
    marker.on('click', () => {
        // Highlight the place in the list if available
        if (document.getElementById('places-list')) {
            const placeItem = document.querySelector(`.place-item[data-url="${place.permalink}"]`);
            if (placeItem) {
                // Remove active class from all places
                document.querySelectorAll('.place-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Add active class to clicked place
                placeItem.classList.add('active');
                
                // Scroll to place item
                placeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
        
        // Show place details without zooming
        showPlaceDetails(place, true, false);
    });

    // Add marker to map
    marker.addTo(placesMap);
    
    // Store marker reference
    const updatedMarkers = { ...markers, [place.permalink]: marker };
    updateState('markers', updatedMarkers);

    return marker;
}

/**
 * Render all places on the map
 * @param {boolean} shouldUpdateBounds - Whether to update map bounds
 */
export function renderPlaces(shouldUpdateBounds = false) {
    // Clear existing markers
    if (placesMap) {
        Object.values(markers).forEach(marker => placesMap.removeLayer(marker));
        updateState('markers', {});
    }

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
            ${place.images && place.images.length > 0 ? `
            <div class="place-thumbnail">
                <img src="${place.images[0].path}" alt="Image of ${place.title}">
            </div>` : ''}
            <div class="place-content">
                <h3 class="place-title">${place.title}</h3>
                <p class="place-description">${place.description || ''}</p>
                ${tagsToDisplay.length ? `
                <div class="place-tags">
                    ${tagsToDisplay.map(tag => `<span class="place-tag">${tag}</span>`).join('')}
                </div>` : ''}
            </div>
        `;
        
        // Add click handler
        placeItem.addEventListener('click', () => {
            // Highlight this item
            document.querySelectorAll('.place-item').forEach(item => {
                item.classList.remove('active');
            });
            placeItem.classList.add('active');
            
            // Open marker popup without zooming
            if (markers[place.permalink]) {
                markers[place.permalink].openPopup();
            }
            
            // Show place details without zooming
            showPlaceDetails(place, true, false);
        });
        
        placesList.appendChild(placeItem);
    });
}
