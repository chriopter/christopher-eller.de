/**
 * Side panel and place interaction functionality
 */

import { elements, updateState, isPanelVisible } from '../base/state.js';
import { panelConfig } from '../base/config.js';

/**
 * Open a place in a new tab
 * @param {Object} place - The place object to open
 */
export function openPlaceInNewTab(place) {
    if (!place || !place.permalink) return;
    window.open(place.permalink, '_blank');
}

/**
 * Setup panel toggling functionality
 */
export function setupPanelToggling() {
    const { sidePanel, panelHideToggle, panelShowToggle, panelToggle } = elements;
    if (!sidePanel || !panelHideToggle || !panelShowToggle) return;
    
    // Handle panel hide toggle
    panelHideToggle.addEventListener('click', () => {
        hideSidePanel();
    });
    
    // Handle panel show toggle
    panelShowToggle.addEventListener('click', () => {
        showSidePanel();
    });
    
    // On mobile, use the panel toggle button (hamburger menu)
    if (panelToggle) {
        panelToggle.addEventListener('click', () => {
            toggleMobilePanel();
        });
    }
}

/**
 * Hide the side panel
 */
export function hideSidePanel() {
    const { sidePanel, panelShowToggle } = elements;
    
    // Hide the side panel
    sidePanel.classList.add('hidden');
    // Show the show panel button
    panelShowToggle.classList.remove('hidden');
    // Update state
    updateState('isPanelVisible', false);
    // Resize map to ensure proper display
    if (window.placesMap) {
        window.placesMap.invalidateSize();
    }
}

/**
 * Show the side panel
 */
export function showSidePanel() {
    const { sidePanel, panelShowToggle } = elements;
    
    // Show the side panel
    sidePanel.classList.remove('hidden');
    // Hide the show panel button
    panelShowToggle.classList.add('hidden');
    // Update state
    updateState('isPanelVisible', true);
    // Resize map to ensure proper display
    if (window.placesMap) {
        window.placesMap.invalidateSize();
    }
}

/**
 * Toggle mobile panel visibility
 */
export function toggleMobilePanel() {
    const { sidePanel } = elements;
    sidePanel.classList.toggle('visible');
}

/**
 * Update panel visibility based on screen size
 */
export function updatePanelVisibility() {
    const { panelToggle, sidePanel, panelShowToggle } = elements;
    
    if (window.innerWidth < panelConfig.mobileBreakpoint) {
        if (panelToggle) panelToggle.style.display = 'flex';
        if (sidePanel) sidePanel.classList.add('hidden');
        if (panelShowToggle) panelShowToggle.classList.remove('hidden');
        updateState('isPanelVisible', false);
    } else {
        if (panelToggle) panelToggle.style.display = 'none';
        // Only restore the panel if it was previously visible
        if (isPanelVisible) {
            if (sidePanel) sidePanel.classList.remove('hidden');
            if (panelShowToggle) panelShowToggle.classList.add('hidden');
        }
    }
}
