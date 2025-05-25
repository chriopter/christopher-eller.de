/**
 * Main initialization module for Places
 */

import { mapConfig, panelConfig } from './config.js';
import { initializeElements, updateState, elements, allPlaces, isPanelVisible, markers, resetState } from './state.js';
import { initMap } from '../components/map.js';
import { initFilters } from '../components/filters.js';
import { initSearch } from '../components/search.js';
import { setupPanelToggling, updatePanelVisibility } from '../components/panel.js';
import { setupHistoryHandling, initializeFromURL } from '../utils/history.js';
import { renderPlaces, initSeeFullButtonHandlers } from '../components/markers.js';

/**
 * Initialize the Places map and all related functionality
 */
export function initPlacesMap() {
    return new Promise((resolve, reject) => {
        // Initialize DOM elements
        initializeElements();
        if (!elements.mapContainer) {
            reject(new Error('Map container not found'));
            return;
        }

        // Add immersive map class to body
        document.body.classList.add('map-view');

        // Get places data first
        const placesData = document.getElementById('places-data');
        if (!placesData) {
            reject(new Error('Places data element not found'));
            return;
        }

        try {
            // Reset any existing state
            resetState();
            
            // Parse and validate places data
            let places;
            try {
                places = JSON.parse(placesData.textContent);
            } catch (parseError) {
                throw new Error(`Failed to parse places data: ${parseError.message}`);
            }
        
            // Validate data structure
            if (!Array.isArray(places)) {
                throw new Error('Invalid places data: Expected an array but received ' + typeof places);
            }
            
            if (places.length === 0) {
                console.warn('Warning: No places found in data');
            }
            
            // Validate required fields and normalize permalinks
            const invalidPlaces = [];
            places = places.map(place => {
                if (!place.title || !place.lat || !place.lng || 
                    typeof place.lat !== 'number' || typeof place.lng !== 'number') {
                    invalidPlaces.push(place.title || 'Untitled');
                    return place;
                }
                
                // Normalize permalink format
                if (place.permalink) {
                    // Strip quotes, remove any leading/trailing slashes, and ensure single places prefix
                    place.permalink = place.permalink
                        .replace(/['"]/g, '') // Remove quotes
                        .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
                        .replace(/^places\//, ''); // Remove leading 'places/'
                    
                    // Add single places prefix
                    place.permalink = `/places/${place.permalink}`;
                }
                return place;
            });
            
            if (invalidPlaces.length > 0) {
                console.error('Warning: Some places have invalid or missing required fields:', invalidPlaces);
            }
            
            // Initialize state and map
            updateState('markers', {});
            updateState('allPlaces', places);
            const map = initMap();
            if (!map) {
                throw new Error('Map initialization failed - map instance is null');
            }
            
            // Initialize components
            initFilters();
            initSearch();
            setupPanelToggling();
            
            // Initialize button handlers
            initSeeFullButtonHandlers();
            
            // Render places
            renderPlaces(true);
            
            // Setup history handling and URL initialization
            setupHistoryHandling();
            initializeFromURL();
            
            // Initialize panel visibility
            updatePanelVisibility();
            
            // Initialize moon toggle (theme switcher)
            initializeMoonToggle();
            
            // Initialize dropdown menu
            initializeDropdown();
            
            // Handle resize events
            window.addEventListener('resize', handleResize);
            
            // Trigger initial resize
            setTimeout(() => {
                window.dispatchEvent(new Event('resize'));
            }, 100);
            
            resolve();
        } catch (e) {
            console.error('Error parsing places data:', e);
            console.error('Raw places data:', placesData.textContent);
            
            // Show error in the places list
            const placesList = document.getElementById('places-list');
            if (placesList) {
                placesList.innerHTML = '<p class="error-message">Error loading places. Please try refreshing the page.</p>';
            }
            
            reject(e);
        }
    });
}

/**
 * Handle window resize events
 */
function handleResize() {
    const { placesMap } = window;
    if (placesMap) {
        placesMap.invalidateSize();
    }

    // Delegate panel visibility handling to the panel module
    updatePanelVisibility();
}

/**
 * Initialize moon toggle (theme switcher)
 */
function initializeMoonToggle() {
    const moonToggle = document.getElementById('moonToggle');
    if (!moonToggle) return;
    
    // Set initial moon phase
    const isDark = document.documentElement.classList.contains('dark-mode');
    moonToggle.textContent = isDark ? '🌑' : '🌕';
    
    // Single click to toggle theme
    moonToggle.addEventListener('click', (e) => {
        e.preventDefault();
        const isDark = document.documentElement.classList.contains('dark-mode');
        const newTheme = !isDark;
        
        // Update classes
        document.documentElement.classList.toggle('dark-mode', newTheme);
        document.body.classList.toggle('dark-mode', newTheme);
        
        // Update moon phase
        moonToggle.textContent = newTheme ? '🌑' : '🌕';
        
        // Store preference
        localStorage.setItem('darkMode', newTheme.toString());
        
        // Update theme color meta tag
        const themeColorMeta = document.getElementById('theme-color');
        if (themeColorMeta) {
            themeColorMeta.content = newTheme ? '#111111' : '#ffffff';
        }
        
        // Update places section if it exists
        const placesSection = document.querySelector('.places-section');
        if (placesSection) {
            placesSection.classList.toggle('dark-mode', newTheme);
        }
    });
    
    // Double click to sync with system
    moonToggle.addEventListener('dblclick', (e) => {
        e.preventDefault();
        localStorage.removeItem('darkMode');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        // Update classes
        document.documentElement.classList.toggle('dark-mode', prefersDark);
        document.body.classList.toggle('dark-mode', prefersDark);
        
        // Update moon phase
        moonToggle.textContent = prefersDark ? '🌑' : '🌕';
        
        // Update theme color meta tag
        const themeColorMeta = document.getElementById('theme-color');
        if (themeColorMeta) {
            themeColorMeta.content = prefersDark ? '#111111' : '#ffffff';
        }
        
        // Update places section if it exists
        const placesSection = document.querySelector('.places-section');
        if (placesSection) {
            placesSection.classList.toggle('dark-mode', prefersDark);
        }
    });
}

/**
 * Initialize dropdown menu functionality
 */
function initializeDropdown() {
    const dropdown = document.querySelector('.dropdown');
    if (!dropdown) return;
    
    const trigger = dropdown.querySelector('.dropdown-trigger');
    if (!trigger) return;
    
    // For touch devices, toggle on click
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        dropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}
