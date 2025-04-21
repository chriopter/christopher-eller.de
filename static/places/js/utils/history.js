/**
 * Browser history management utilities
 */

/**
 * Update URL without page reload
 * @param {Object|null} place - The place object or null for list view
 * @param {boolean} shouldPushState - Whether to push or replace state
 */
export function updateURL(place, shouldPushState = true) {
    if (!place) {
        // List view
        if (shouldPushState) {
            history.pushState({type: 'list'}, '', '/places/');
        } else {
            history.replaceState({type: 'list'}, '', '/places/');
        }
    } else {
        // Detail view
        const state = {
            type: 'place',
            permalink: place.permalink
        };
        
        if (shouldPushState) {
            history.pushState(state, '', place.permalink);
        } else {
            history.replaceState(state, '', place.permalink);
        }
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
    if (!state) return;

    if (state.type === 'place') {
        // Find the place data
        const place = window.allPlaces.find(p => p.permalink === state.permalink);
        if (place) {
            window.showPlaceDetails(place, false); // false = don't update history again
        }
    } else if (state.type === 'list') {
        window.backToListView(false); // false = don't update history again
    }
}

/**
 * Get current view type from URL
 * @returns {string} 'list' or 'detail'
 */
export function getCurrentViewType() {
    const pathParts = window.location.pathname.split('/');
    const isListPage = pathParts.filter(Boolean).length === 1 && 
                      pathParts.filter(Boolean)[0] === 'places';
    return isListPage ? 'list' : 'detail';
}

/**
 * Get place permalink from current URL
 * @returns {string|null} The place permalink or null if on list view
 */
export function getPlacePermalinkFromURL() {
    const pathParts = window.location.pathname.split('/');
    if (pathParts.filter(Boolean).length > 1) {
        return window.location.pathname;
    }
    return null;
}
