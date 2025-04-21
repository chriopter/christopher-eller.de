/**
 * Search functionality for places
 */

import { elements, updateState } from '../base/state.js';
import { renderPlaces } from './markers.js';

/**
 * Initialize search functionality
 */
export function initSearch() {
    const { searchInput } = elements;
    if (!searchInput) return;

    // Add event listener for search input
    searchInput.addEventListener('input', e => {
        updateState('searchTerm', e.target.value.trim().toLowerCase());
        renderPlaces();
    });
    
    // Create search container with viewport toggle
    wrapSearchInput();
}

/**
 * Wrap search input in container with viewport toggle
 */
function wrapSearchInput() {
    const { searchInput } = elements;
    
    // Only proceed if input isn't already wrapped
    if (!searchInput.parentElement.classList.contains('search-container')) {
        const searchParent = searchInput.parentElement;
        const searchContainer = document.createElement('div');
        searchContainer.className = 'search-container';
        
        // Insert the container before the search input
        searchParent.insertBefore(searchContainer, searchInput);
        
        // Move the search input into the container
        searchContainer.appendChild(searchInput);
        
        // Create viewport toggle switch
        const viewportToggle = document.createElement('div');
        viewportToggle.className = 'sidebar-viewport-toggle';
        viewportToggle.innerHTML = `
            <span class="toggle-label">Map View Only</span>
            <label class="toggle-switch">
                <input type="checkbox" id="viewport-toggle-checkbox" ${filterByViewport ? 'checked' : ''}>
                <span class="toggle-slider"></span>
            </label>
        `;
        
        // Add the toggle to the container
        searchContainer.appendChild(viewportToggle);
        
        // Add event listener for the toggle
        const toggleCheckbox = viewportToggle.querySelector('#viewport-toggle-checkbox');
        toggleCheckbox.addEventListener('change', function() {
            updateState('filterByViewport', this.checked);
            renderPlaces(false);
        });
    }
}

/**
 * Clear search input
 */
export function clearSearch() {
    const { searchInput } = elements;
    if (searchInput) {
        searchInput.value = '';
        updateState('searchTerm', '');
        renderPlaces();
    }
}

/**
 * Set search term programmatically
 * @param {string} term - The search term to set
 */
export function setSearchTerm(term) {
    const { searchInput } = elements;
    if (searchInput) {
        searchInput.value = term;
        updateState('searchTerm', term.toLowerCase());
        renderPlaces();
    }
}
