/**
 * Filter functionality for places
 */

import { activeFilters, searchTerm, filterByViewport, placesMap } from '../base/state.js';
import { controlConfig } from '../base/config.js';
import { renderPlaces } from './markers.js';

/**
 * Initialize tag filters
 */
export function initFilters() {
    const tagFilters = document.getElementById('tag-filters');
    if (!tagFilters) return;
    
    // Get all pre-rendered tag filter elements
    const tagElements = tagFilters.querySelectorAll('.tag-filter');
    
    // Add click handlers to each tag filter
    tagElements.forEach(filterBtn => {
        const tag = filterBtn.dataset.tag;
        
        filterBtn.addEventListener('click', () => {
            // Toggle active class
            filterBtn.classList.toggle('active');
            
            // Update active filters
            if (filterBtn.classList.contains('active')) {
                activeFilters.push(tag);
            } else {
                activeFilters = activeFilters.filter(t => t !== tag);
            }
            
            renderPlaces();
        });
    });
}

/**
 * Add viewport filter toggle control to map
 * @param {Object} map - The Leaflet map instance
 */
export function addViewportToggleControl(map) {
    const ViewportToggleControl = L.Control.extend({
        options: {
            position: controlConfig.viewportFilterPosition
        },
        
        onAdd: function(map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
            const button = L.DomUtil.create('a', 'viewport-filter-toggle', container);
            button.href = '#';
            button.title = 'Toggle viewport filtering';
            button.role = 'button';
            button.setAttribute('aria-label', 'Toggle viewport filtering');
            button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>';
            
            // Set initial state
            updateViewportToggleState(button);
            
            L.DomEvent.on(button, 'click', function(e) {
                L.DomEvent.stop(e);
                filterByViewport = !filterByViewport;
                updateViewportToggleState(button);
                
                // Update sidebar toggle if it exists
                const sidebarToggle = document.getElementById('viewport-toggle-checkbox');
                if (sidebarToggle) {
                    sidebarToggle.checked = filterByViewport;
                }
                
                renderPlaces(false);
            });
            
            return container;
        }
    });
    
    // Add the viewport toggle control to the map
    new ViewportToggleControl().addTo(map);
}

/**
 * Update viewport toggle button state
 * @param {HTMLElement} button - The toggle button element
 */
function updateViewportToggleState(button) {
    if (filterByViewport) {
        button.classList.add('active');
        button.title = 'Viewport filtering: ON - Click to show all places';
    } else {
        button.classList.remove('active');
        button.title = 'Viewport filtering: OFF - Click to show only places in view';
    }
}

/**
 * Filter places based on active filters, search, and map viewport
 * @returns {Array} Filtered places array
 */
export function filterPlaces() {
    // Normalize all active filters to lowercase for case-insensitive matching
    const normalizedActiveFilters = activeFilters.map(f => f.toLowerCase());
    
    // Get current map bounds if map is initialized
    const mapBounds = placesMap ? placesMap.getBounds() : null;
    
    return allPlaces.filter(place => {
        // Filter by tags
        if (normalizedActiveFilters.length > 0) {
            // Parse and normalize place tags to lowercase
            let placeTags = [];
            
            if (typeof place.tags === 'string') {
                try {
                    placeTags = JSON.parse(place.tags).map(tag => tag.toLowerCase());
                } catch (e) {
                    console.error(`Error parsing tags for place "${place.title}":`, e);
                }
            } else if (Array.isArray(place.tags)) {
                placeTags = place.tags.map(tag => tag.toLowerCase());
            }
            
            // Check if any active filter matches any place tag
            const hasMatchingTag = placeTags.some(tag => 
                normalizedActiveFilters.includes(tag)
            );
            
            if (!hasMatchingTag) return false;
        }
        
        // Filter by search term
        if (searchTerm) {
            const title = place.title.toLowerCase();
            const description = (place.description || '').toLowerCase();
            
            // Parse and process tags for search
            let tagsString = '';
            if (typeof place.tags === 'string') {
                try {
                    tagsString = JSON.parse(place.tags).join(' ').toLowerCase();
                } catch (e) {
                    console.error(`Error parsing tags for search "${place.title}":`, e);
                }
            } else if (Array.isArray(place.tags)) {
                tagsString = place.tags.join(' ').toLowerCase();
            }
            
            if (!title.includes(searchTerm) && 
                !description.includes(searchTerm) && 
                !tagsString.includes(searchTerm)) {
                return false;
            }
        }
        
        // Filter by map viewport
        if (filterByViewport && mapBounds) {
            const placeLatLng = L.latLng(place.lat, place.lng);
            if (!mapBounds.contains(placeLatLng)) {
                return false;
            }
        }
        
        return true;
    });
}
