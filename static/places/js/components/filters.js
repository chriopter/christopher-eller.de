/**
 * Filter functionality for places
 */

import { activeFilters, searchTerm, filterByViewport, placesMap, allPlaces, updateState } from '../base/state.js';
import { controlConfig } from '../base/config.js';

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
                updateState('activeFilters', [...activeFilters, tag]);
            } else {
                updateState('activeFilters', activeFilters.filter(t => t !== tag));
            }
            
            if (window.renderPlaces) {
                window.renderPlaces();
            }
        });
    });
}

/**
 * Add viewport filter toggle control to map
 * @param {Object} map - The Leaflet map instance
 */
export function addViewportToggleControl(map) {
    // Create viewport filter button
    const tagFilters = document.getElementById('tag-filters');
    if (!tagFilters) return;

    const viewportFilter = document.createElement('button');
    viewportFilter.className = 'viewport-filter';
    viewportFilter.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="9"/>
            <line x1="12" y1="3" x2="12" y2="7"/>
            <line x1="12" y1="17" x2="12" y2="21"/>
            <line x1="3" y1="12" x2="7" y2="12"/>
            <line x1="17" y1="12" x2="21" y2="12"/>
        </svg>
    `;
    viewportFilter.title = 'Filter places by current map view';
    tagFilters.appendChild(viewportFilter);

    // Update initial state
    updateViewportToggleState(viewportFilter);

    // Add click handler
    viewportFilter.addEventListener('click', () => {
        updateState('filterByViewport', !filterByViewport);
        updateViewportToggleState(viewportFilter);
        if (window.renderPlaces) {
            window.renderPlaces();
        }
    });

    // Add map move handlers
    map.on('moveend zoomend', () => {
        if (filterByViewport && window.renderPlaces) {
            window.renderPlaces();
        }
    });
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
    console.log('Filtering places...', { 
        totalPlaces: allPlaces.length,
        activeFilters,
        searchTerm,
        filterByViewport
    });

    if (!Array.isArray(allPlaces)) {
        console.error('allPlaces is not an array:', allPlaces);
        return [];
    }

    // Normalize all active filters to lowercase for case-insensitive matching
    const normalizedActiveFilters = activeFilters.map(f => f.toLowerCase());
    
    // Get current map bounds if map is initialized
    const mapBounds = placesMap ? placesMap.getBounds() : null;
    
    const filteredPlaces = allPlaces.filter(place => {
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

    console.log('Filtering complete:', {
        filteredCount: filteredPlaces.length,
        originalCount: allPlaces.length
    });

    return filteredPlaces;
}
