/**
 * Global state management for Places
 */

// Map instance
export let placesMap = null;

// Data state
export let allPlaces = [];
export let markers = {};

// Filter and search state
export let activeFilters = [];
export let searchTerm = '';
export let filterByViewport = true;

// UI state
export let isPanelVisible = true;
export let isInitialRender = true;
export let currentPlaceId = null;

// Gallery state
export let currentLightboxIndex = 0;
export let lightboxImages = [];

// DOM elements cache
export const elements = {
    mapContainer: null,
    searchInput: null,
    placesList: null,
    sidePanel: null,
    panelToggle: null,
    panelHideToggle: null,
    panelShowToggle: null,
    placeDetailContainer: null,
    placeDetailContent: null,
    backToListButton: null
};

/**
 * Update a state value
 * @param {string} key - The state key to update
 * @param {any} value - The new value
 * @returns {boolean} - Whether the update was successful
 */
export function updateState(key, value) {
    if (key in this && key !== 'updateState') {
        this[key] = value;
        return true;
    }
    return false;
}

/**
 * Cache DOM elements for reuse
 */
export function initializeElements() {
    elements.mapContainer = document.getElementById('places-map');
    elements.searchInput = document.getElementById('search-input');
    elements.placesList = document.getElementById('places-list');
    elements.sidePanel = document.getElementById('side-panel');
    elements.panelToggle = document.getElementById('panel-toggle');
    elements.panelHideToggle = document.getElementById('panel-hide-toggle');
    elements.panelShowToggle = document.getElementById('panel-show-toggle');
    elements.placeDetailContainer = document.getElementById('place-detail-container');
    elements.placeDetailContent = document.getElementById('place-detail-content');
    elements.backToListButton = document.getElementById('back-to-list');
}

/**
 * Reset state to initial values
 */
export function resetState() {
    allPlaces = [];
    markers = {};
    activeFilters = [];
    searchTerm = '';
    filterByViewport = true;
    isPanelVisible = true;
    isInitialRender = true;
    currentPlaceId = null;
    currentLightboxIndex = 0;
    lightboxImages = [];
}
