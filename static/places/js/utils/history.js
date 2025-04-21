/**
 * Browser history management utilities
 */

/**
 * Update URL without page reload
 * @param {Object|null} place - The place object or null for list view
 * @param {boolean} shouldPushState - Whether to push or replace state
 */
export function updateURL(place, shouldPushState = true) {
    const baseURL = '/places/';
    let url = baseURL;
    let state = { type: 'list' };

    if (place) {
        // Add place as query parameter but keep list view
        url = `${baseURL}?place=${encodeURIComponent(place.permalink)}`;
        state = {
            type: 'list',
            placePermalink: place.permalink
        };
    }
    
    if (shouldPushState) {
        history.pushState(state, '', url);
    } else {
        history.replaceState(state, '', url);
    }
}

/**
 * Setup history handling
 */
export function setupHistoryHandling() {
    // Handle browser history navigation
    window.addEventListener('popstate', handleHistoryNavigation);
}

/**
 * Handle browser history navigation
 * @param {PopStateEvent} event - The popstate event
 */
function handleHistoryNavigation(event) {
    const state = event.state;
    if (!state) {
        // Check URL parameters if state is missing
        const urlParams = new URLSearchParams(window.location.search);
        const placeParam = urlParams.get('place');
        if (placeParam) {
            const place = window.allPlaces.find(p => p.permalink === placeParam);
            if (place) {
                window.showPlaceDetails(place, false);
                return;
            }
        }
        window.backToListView(false);
        return;
    }

    if (state.placePermalink) {
        const place = window.allPlaces.find(p => p.permalink === state.placePermalink);
        if (place) {
            window.showPlaceDetails(place, false);
        }
    } else {
        window.backToListView(false);
    }
}

/**
 * Get current place from URL if any
 * @returns {string|null} The place permalink or null if none specified
 */
export function getPlaceFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('place');
}

/**
 * Initialize view based on URL
 * Called when the page first loads
 */
export function initializeFromURL() {
    const placePermalink = getPlaceFromURL();
    if (placePermalink) {
        // Find the place and show its details
        const place = window.allPlaces.find(p => p.permalink === placePermalink);
        if (place) {
            window.showPlaceDetails(place, false);
        }
    }
}
