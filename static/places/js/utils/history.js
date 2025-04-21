/**
 * Browser history management utilities
 */

/**
 * Normalize a permalink to a consistent format
 * @param {string} permalink - The permalink to normalize
 * @returns {string} The normalized permalink
 */
function normalizePermalink(permalink) {
    if (!permalink) return '';
    // Remove leading/trailing slashes and ensure consistent format
    return `/places/${permalink.replace(/^\/places\//, '').replace(/\/$/, '')}`;
}

/**
 * Update URL without page reload
 * @param {Object|null} place - The place object or null for list view
 * @param {boolean} shouldPushState - Whether to push or replace state
 */
export function updateURL(place, shouldPushState = true) {
    let url = '/places';
    let state = { type: 'list' };

    if (place) {
        // Normalize permalink format
        url = normalizePermalink(place.permalink);
        state = {
            type: 'single',
            placePermalink: url
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
    
    // Log initial state
    console.log('History handling initialized with places:', {
        placesCount: window.allPlaces?.length || 0,
        currentPath: window.location.pathname
    });
}

/**
 * Find a place by its permalink
 * @param {string} permalink - The permalink to search for
 * @returns {Object|null} The matching place object or null if not found
 */
function findPlaceByPermalink(permalink) {
    if (!permalink) return null;
    
    // Ensure places data is available
    if (!window.allPlaces || !Array.isArray(window.allPlaces)) {
        console.warn('Places data not available for permalink matching');
        return null;
    }
    
    console.log('Looking for permalink:', permalink);
    
    // Normalize the target permalink
    const normalizedPermalinkToFind = normalizePermalink(permalink);
    
    // Try to find exact matching place
    const place = window.allPlaces.find(p => {
        const normalizedPermalink = normalizePermalink(p.permalink);
        const matches = normalizedPermalink === normalizedPermalinkToFind;
        console.log(`Comparing normalized paths:`, {
            target: normalizedPermalinkToFind,
            current: normalizedPermalink,
            matches: matches
        });
        return matches;
    });
    
    if (place) {
        console.log('Found matching place:', place);
        return place;
    }
    
    console.warn('No matching place found for:', permalink);
    console.warn('Available permalinks:', window.allPlaces.map(p => normalizePermalink(p.permalink)));
    return null;
}

/**
 * Handle browser history navigation
 * @param {PopStateEvent} event - The popstate event
 */
function handleHistoryNavigation(event) {
    // Ensure places data is available
    if (!window.allPlaces || !Array.isArray(window.allPlaces)) {
        console.warn('Places data not available during navigation, retrying in 100ms...');
        setTimeout(() => handleHistoryNavigation(event), 100);
        return;
    }

    const state = event.state;

    try {
        if (!state) {
            // Check path if state is missing
            const placePermalink = getPlaceFromURL();
            if (placePermalink) {
                const place = findPlaceByPermalink(placePermalink);
                if (place) {
                    console.log('Navigating to place:', place.title);
                    window.showPlaceDetails(place, false);
                    return;
                } else {
                    console.warn('Place not found during navigation:', placePermalink);
                }
            }
            window.backToListView(false);
            return;
        }

        if (state.placePermalink) {
            const place = findPlaceByPermalink(state.placePermalink);
            if (place) {
                console.log('Navigating to place:', place.title);
                window.showPlaceDetails(place, false);
            } else {
                console.warn('Place not found during navigation:', state.placePermalink);
                window.backToListView(false);
            }
        } else {
            window.backToListView(false);
        }
    } catch (error) {
        console.error('Error during history navigation:', error);
        window.backToListView(false);
    }
}

/**
 * Get current place from URL if any
 * @returns {string|null} The place permalink or null if none specified
 */
export function getPlaceFromURL() {
    try {
        // Get the path portion of the URL
        const fullPath = window.location.pathname;
        console.log('Full path:', fullPath);
        
        // If not in /places/ section, return null
        if (!fullPath.startsWith('/places/')) {
            return null;
        }
        
        // If we have places data, try to find a match
        if (window.allPlaces && Array.isArray(window.allPlaces)) {
            // Log the raw data for debugging
            console.log('Raw places data:', window.allPlaces);
            
            // Find the place with matching normalized permalink
            const normalizedPath = normalizePermalink(fullPath);
            const place = window.allPlaces.find(p => {
                const normalizedPermalink = normalizePermalink(p.permalink);
                const matches = normalizedPath === normalizedPermalink;
                console.log(`Comparing normalized paths:`, {
                    path: normalizedPath,
                    permalink: normalizedPermalink,
                    matches: matches
                });
                return matches;
            });
            
            if (place) {
                console.log('Found matching place:', place);
                return place.permalink;
            }
            
            console.warn('No matching place found for path:', fullPath);
            console.warn('Available permalinks:', window.allPlaces.map(p => normalizePermalink(p.permalink)));
        } else {
            console.warn('Places data not available for permalink matching');
        }
        
        // If no match found, return null to trigger list view
        return null;
    } catch (error) {
        console.error('Error getting place from URL:', error);
        return null;
    }
}

/**
 * Initialize view based on URL
 * Called when the page first loads
 */
export function initializeFromURL() {
    try {
        const placePermalink = getPlaceFromURL();
        if (!placePermalink) {
            // No valid permalink found, show list view
            window.backToListView(false);
            return;
        }

        // Ensure places data is available
        if (!window.allPlaces || !Array.isArray(window.allPlaces)) {
            console.warn('Places data not available yet, retrying in 100ms...');
            setTimeout(initializeFromURL, 100);
            return;
        }

        // Find the place with matching normalized permalink
        const place = findPlaceByPermalink(placePermalink);
        
        if (place) {
            console.log('Showing place details for:', place.title);
            window.showPlaceDetails(place, false);
        } else {
            console.warn('Place not found:', placePermalink);
            console.warn('Available permalinks:', window.allPlaces.map(p => normalizePermalink(p.permalink)));
            // If place not found, go to list view
            window.backToListView(false);
            // Update URL to /places to reflect list view
            history.replaceState({ type: 'list' }, '', '/places');
        }
    } catch (error) {
        console.error('Error initializing from URL:', error);
        window.backToListView(false);
        history.replaceState({ type: 'list' }, '', '/places');
    }
}
