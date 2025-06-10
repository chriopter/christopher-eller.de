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
 * Create a marker for a place without updating global state
 * @param {Object} place - The place object to create a marker for
 * @returns {Object|null} The created marker or null if creation failed
 */
export function createPlaceMarker(place) {
    try {
        if (!place || typeof place.lat !== 'number' || typeof place.lng !== 'number') {
            console.error('Invalid place data:', place);
            return null;
        }

        // Parse place tags to check for unvisited
        let placeTags = [];
        if (typeof place.tags === 'string') {
            try {
                placeTags = JSON.parse(place.tags).map(tag => tag.toLowerCase());
            } catch (e) {
                console.error(`Error parsing tags for marker "${place.title}":`, e);
            }
        } else if (Array.isArray(place.tags)) {
            placeTags = place.tags.map(tag => tag.toLowerCase());
        }
        
        // Create custom icon for unvisited places
        let markerOptions = {
            title: place.title
        };
        
        // Use a different icon for unvisited places
        if (placeTags.includes('unvisited')) {
            const unvisitedIcon = L.divIcon({
                className: 'unvisited-marker',
                html: '<div class="marker-pin"></div>',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34]
            });
            markerOptions.icon = unvisitedIcon;
        }
        
        const marker = L.marker([place.lat, place.lng], markerOptions);

        // Process tags for popup
        let tagsToDisplay = [];
        if (typeof place.tags === 'string') {
            try {
                tagsToDisplay = JSON.parse(place.tags);
            } catch (e) {
                console.error(`Error parsing tags for popup "${place.title}":`, e);
            }
        } else if (Array.isArray(place.tags)) {
            tagsToDisplay = place.tags;
        }

        // Create popup content - now with tags right after title
        const popupContent = `
            <div class="popup-content">
                <div class="place-content">
                    <h3 class="place-title">${stripQuotes(place.title)}</h3>
                    ${tagsToDisplay.length ? `
                    <div class="place-tags">
                        ${tagsToDisplay.map(tag => `<span class="place-tag">${stripQuotes(tag)}</span>`).join('')}
                    </div>` : ''}
                    <p class="place-description">${stripQuotes(place.description)}</p>
                </div>
                ${place.images && place.images.length > 0 ? `
                <div class="place-images-gallery">
                    ${place.images.slice(0, 3).map((img, index) => `
                        <div class="place-image-pin" style="transform: rotate(${index % 2 === 0 ? '-2' : '2'}deg)">
                            <img src="${stripQuotes(img.path)}" alt="${stripQuotes(img.name)}">
                        </div>
                    `).join('')}
                </div>` : ''}
                <div class="popup-actions">
                    <button class="see-full-btn" data-permalink="${place.permalink}">Show more →</button>
                </div>
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

        // Track if popup is pinned (opened by click)
        let isPinned = false;
        // Track hover timeout for smooth popup behavior
        let hoverTimeout = null;
        let isHoveringMarker = false;
        let isHoveringPopup = false;

        // Function to close popup only if not hovering either marker or popup
        const tryClosePopup = () => {
            if (!isPinned && !isHoveringMarker && !isHoveringPopup) {
                marker.closePopup();
            }
        };

        // Add hover events with position check
        marker.on('mouseover', () => {
            // Don't show hover popup if already pinned
            if (isPinned) return;
            
            isHoveringMarker = true;
            
            // Clear any pending close timeout
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                hoverTimeout = null;
            }
            
            // Get menu height (header pill is about 60px + padding)
            const menuHeight = 240;
            
            // Get marker position in pixels
            const markerPoint = placesMap.latLngToContainerPoint(marker.getLatLng());
            
            // If marker is too close to top, pan map down before opening popup
            if (markerPoint.y < menuHeight + 100) { // Add buffer for popup height
                const targetPoint = L.point(markerPoint.x, menuHeight + 100);
                const targetLatLng = placesMap.containerPointToLatLng(targetPoint);
                placesMap.panTo(targetLatLng, { animate: true, duration: 0.3 });
                
                // Open popup after brief delay to allow panning
                setTimeout(() => {
                    marker.openPopup();
                }, 300);
            } else {
                marker.openPopup();
            }
        });
        
        marker.on('mouseout', () => {
            // Don't close if popup is pinned
            if (isPinned) return;
            
            isHoveringMarker = false;
            
            // Set a timeout to close popup, allowing time to move to popup
            hoverTimeout = setTimeout(tryClosePopup, 200);
        });

        // Add popup hover events
        marker.on('popupopen', () => {
            const popupElement = marker.getPopup()._container;
            if (popupElement) {
                popupElement.addEventListener('mouseenter', () => {
                    isHoveringPopup = true;
                    // Clear any pending close timeout
                    if (hoverTimeout) {
                        clearTimeout(hoverTimeout);
                        hoverTimeout = null;
                    }
                });
                
                popupElement.addEventListener('mouseleave', () => {
                    isHoveringPopup = false;
                    // Set timeout to close if not hovering marker either
                    hoverTimeout = setTimeout(tryClosePopup, 200);
                });
            }
        });
        
        // Add click event with position check
        marker.on('click', (e) => {
            // Prevent map click when clicking on marker
            L.DomEvent.stopPropagation(e);
            
            // Get menu height (assuming menu has a fixed height of 60px)
            const menuHeight = 60;
            
            // Get marker position in pixels
            const markerPoint = placesMap.latLngToContainerPoint(marker.getLatLng());
            
            // Pin the popup (keep it open)
            isPinned = true;
            
            // Clear any hover timeouts when pinning
            if (hoverTimeout) {
                clearTimeout(hoverTimeout);
                hoverTimeout = null;
            }
            
            // If marker is too close to top, pan map down
            if (markerPoint.y < menuHeight + 100) { // Add buffer for popup height
                const targetPoint = L.point(markerPoint.x, menuHeight + 100);
                const targetLatLng = placesMap.containerPointToLatLng(targetPoint);
                placesMap.panTo(targetLatLng, { animate: true });
                
                // Open popup after brief delay to allow panning
                setTimeout(() => {
                    marker.openPopup();
                }, 400);
            } else {
                // Just open the popup, don't navigate away
                marker.openPopup();
            }
        });

        // Close pinned popup when clicking elsewhere on map
        placesMap.on('click', () => {
            isPinned = false;
            isHoveringMarker = false;
            isHoveringPopup = false;
            marker.closePopup();
        });

        return marker;
    } catch (error) {
        console.error(`Error creating marker for place ${place?.title}:`, error);
        return null;
    }
}

/**
 * Add a marker for a place (legacy function that calls createPlaceMarker and updates state)
 * @param {Object} place - The place object to create a marker for
 * @returns {Object|null} The created marker or null if creation failed
 */
export function addPlaceMarker(place) {
    const marker = createPlaceMarker(place);
    if (marker) {
        // Add marker to map
        marker.addTo(placesMap);
        
        // Store marker reference
        const updatedMarkers = { ...markers, [place.permalink]: marker };
        updateState('markers', updatedMarkers);
    }
    return marker;
}

/**
 * Initialize event handlers for "See full" buttons
 */
export function initSeeFullButtonHandlers() {
    // Use event delegation to handle dynamically created buttons
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('see-full-btn')) {
            e.preventDefault();
            e.stopPropagation();
            
            const permalink = e.target.dataset.permalink;
            if (permalink) {
                // Find the place data by permalink
                const place = filterPlaces().find(p => p.permalink === permalink);
                if (place) {
                    openPlaceInNewTab(place);
                }
            }
        }
    });
}

// Prevent recursive rendering
let isRendering = false;

/**
 * Render all places on the map
 * @param {boolean} shouldUpdateBounds - Whether to update map bounds
 */
export function renderPlaces(shouldUpdateBounds = false) {
    if (!placesMap) {
        console.error('Map not initialized');
        return;
    }

    // Prevent recursive rendering
    if (isRendering) {
        console.warn('Preventing recursive renderPlaces call');
        return;
    }

    isRendering = true;

    try {
        // Clear existing markers
        Object.values(markers).forEach(marker => placesMap.removeLayer(marker));
        
        // Filter places
        const filteredPlaces = filterPlaces();

        // Batch create all markers
        const newMarkers = {};
        filteredPlaces.forEach(place => {
            const marker = createPlaceMarker(place);
            if (marker) {
                newMarkers[place.permalink] = marker;
                marker.addTo(placesMap);
            }
        });

        // Update markers state once at the end
        updateState('markers', newMarkers);

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
    } finally {
        isRendering = false;
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
            <button class="see-full-btn" data-permalink="${place.permalink}">Show more →</button>
        `;
        
        // Add click handler for the place item to open the corresponding marker popup
        placeItem.addEventListener('click', (e) => {
            // Don't trigger if the click was on the "See full" button (it has its own handler)
            if (e.target.classList.contains('see-full-btn')) {
                return;
            }
            
            // Find the corresponding marker and trigger hover behavior
            const marker = markers[place.permalink];
            if (marker && placesMap) {
                // Trigger the marker's mouseover event to get the same behavior as hovering over the pin
                marker.fire('mouseover');
                
                // On mobile, close the side panel after selection
                if (window.innerWidth < 768) {
                    const sidePanel = document.getElementById('side-panel');
                    const overlay = document.getElementById('mobile-overlay');
                    if (sidePanel) sidePanel.classList.remove('visible');
                    if (overlay) overlay.classList.remove('visible');
                }
            }
        });
        
        // Add hover handlers to highlight corresponding map marker
        placeItem.addEventListener('mouseenter', () => {
            const marker = markers[place.permalink];
            if (marker && marker._icon) {
                // Add highlight class to marker
                marker._icon.classList.add('marker-highlight');
            }
        });
        
        placeItem.addEventListener('mouseleave', () => {
            const marker = markers[place.permalink];
            if (marker && marker._icon) {
                // Remove highlight class from marker
                marker._icon.classList.remove('marker-highlight');
            }
        });
        
        placesList.appendChild(placeItem);
    });
}
