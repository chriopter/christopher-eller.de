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
    
    // Handle overlay click to close panel on mobile
    const overlay = document.getElementById('mobile-overlay');
    if (overlay) {
        overlay.addEventListener('click', () => {
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
    const overlay = document.getElementById('mobile-overlay');
    
    const isVisible = sidePanel.classList.contains('visible');
    
    if (isVisible) {
        // Hide panel
        sidePanel.classList.remove('visible');
        if (overlay) overlay.classList.remove('visible');
    } else {
        // Show panel
        sidePanel.classList.add('visible');
        if (overlay) overlay.classList.add('visible');
    }
}

/**
 * Update panel visibility based on screen size
 */
export function updatePanelVisibility() {
    const { panelToggle, sidePanel, panelShowToggle, panelHideToggle } = elements;
    
    if (window.innerWidth < panelConfig.mobileBreakpoint) {
        // Mobile mode - show hamburger menu, hide desktop toggles
        if (panelToggle) panelToggle.style.display = 'flex';
        if (panelHideToggle) panelHideToggle.style.display = 'none';
        if (panelShowToggle) panelShowToggle.style.display = 'none';
        // Remove any desktop-specific classes
        if (sidePanel) {
            sidePanel.classList.remove('hidden');
            sidePanel.classList.remove('visible');
        }
        updateState('isPanelVisible', false);
    } else {
        // Desktop mode - hide hamburger menu, show desktop toggles
        if (panelToggle) panelToggle.style.display = 'none';
        if (panelHideToggle) panelHideToggle.style.display = 'flex';
        // Only restore the panel if it was previously visible
        if (isPanelVisible) {
            if (sidePanel) sidePanel.classList.remove('hidden');
            if (panelShowToggle) panelShowToggle.classList.add('hidden');
        } else {
            if (sidePanel) sidePanel.classList.add('hidden');
            if (panelShowToggle) panelShowToggle.classList.remove('hidden');
        }
    }
}
