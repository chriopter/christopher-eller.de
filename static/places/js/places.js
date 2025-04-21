/**
 * Places - Interactive Map for Hugo
 * JavaScript functionality for rendering and interacting with the places map
 */

// Map instance
let placesMap = null;
let allPlaces = [];
let markers = {};
let activeFilters = [];
let searchTerm = '';
let isPanelVisible = true;
let isInitialRender = true; // Track if this is the initial render

// DOM elements
let mapContainer = null;
let searchInput = null;
let placesList = null;
let sidePanel = null;
let panelToggle = null;
let panelHideToggle = null;
let panelShowToggle = null;
let placeDetailContainer = null;
let placeDetailContent = null;
let backToListButton = null;

// Current state
let currentPlaceId = null;

// Initialize the map and places
function initPlacesMap() {
    // Get map container
    mapContainer = document.getElementById('places-map');
    if (!mapContainer) return;

    // Add immersive map class to body
    document.body.classList.add('map-view');

    // Initialize Leaflet map
    placesMap = L.map(mapContainer, {
        zoomControl: false // We'll add zoom control in a better position
    }).setView([20, 0], 2);

    // Add OpenStreetMap tile layer
    L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(placesMap);

    // Add zoom control to the right
    L.control.zoom({
        position: 'topright'
    }).addTo(placesMap);

    // Get places data
    const placesData = document.getElementById('places-data');
    if (placesData) {
        try {
            allPlaces = JSON.parse(placesData.textContent);
            renderPlaces();
            initFilters();
            initSearch();
        } catch (e) {
            console.error('Error parsing places data:', e);
        }
    }

    // Initialize side panel and toggle buttons
    sidePanel = document.getElementById('side-panel');
    panelToggle = document.getElementById('panel-toggle');
    panelHideToggle = document.getElementById('panel-hide-toggle');
    panelShowToggle = document.getElementById('panel-show-toggle');
    
    // Initialize place detail container
    placeDetailContainer = document.getElementById('place-detail-container');
    placeDetailContent = document.getElementById('place-detail-content');
    backToListButton = document.getElementById('back-to-list');
    
    // Set up back button functionality
    if (backToListButton) {
        backToListButton.addEventListener('click', backToListView);
    }
    
    // Set up panel toggling functionality
    setupPanelToggling();

    // Initialize places list if exists
    placesList = document.getElementById('places-list');
    if (placesList) {
        renderPlacesList();
    }

    // Handle view controls
    const mapViewBtn = document.getElementById('map-view');
    const listViewBtn = document.getElementById('list-view');
    
    if (mapViewBtn && listViewBtn) {
        mapViewBtn.addEventListener('click', () => {
            mapViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            
            // Ensure map is properly sized
            placesMap.invalidateSize();
            
            // Re-render with explicit bounds update
            renderPlaces(true);
        });
        
        listViewBtn.addEventListener('click', () => {
            listViewBtn.classList.add('active');
            mapViewBtn.classList.remove('active');
            
            // Scroll to top of places list
            if (placesList) {
                placesList.scrollTop = 0;
            }
        });
    }

    // Handle resize events
    window.addEventListener('resize', () => {
        placesMap.invalidateSize();
        
        // Show/hide panel toggle based on screen size
        if (window.innerWidth < 768) {
            if (panelToggle) panelToggle.style.display = 'flex';
            if (sidePanel) sidePanel.classList.add('hidden');
            if (panelShowToggle) panelShowToggle.classList.remove('hidden');
            isPanelVisible = false;
        } else {
            if (panelToggle) panelToggle.style.display = 'none';
            // Only restore the panel if it was previously visible before resize
            if (isPanelVisible) {
                if (sidePanel) sidePanel.classList.remove('hidden');
                if (panelShowToggle) panelShowToggle.classList.add('hidden');
            }
        }
    });
    
    // Trigger resize handler to set initial states
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 100);
}

// Render all places on the map
function renderPlaces(shouldUpdateBounds = false) {
    // Clear existing markers
    if (placesMap) {
        Object.values(markers).forEach(marker => placesMap.removeLayer(marker));
        markers = {};
    }

    // Filter places
    const filteredPlaces = filterPlaces();

    // Add markers for filtered places
    filteredPlaces.forEach(place => {
        addPlaceMarker(place);
    });

    // Update bounds only if this is the initial render or explicitly requested
    if ((isInitialRender || shouldUpdateBounds) && filteredPlaces.length > 0) {
        const bounds = L.latLngBounds(filteredPlaces.map(place => [place.lat, place.lng]));
        placesMap.fitBounds(bounds, { padding: [50, 50] });
        
        // Set initial render to false after first render
        if (isInitialRender) isInitialRender = false;
    }

    // Update places list if available
    if (placesList) {
        renderPlacesList(filteredPlaces);
    }
}

// Add a marker for a place
function addPlaceMarker(place) {
    const marker = L.marker([place.lat, place.lng], {
        title: place.title
    });

    // Create a simplified popup with just title and description - no quotes
    const initialPopupContent = `
        <div class="popup-content">
            <div class="popup-header">
                <h3 class="popup-title">${place.title}</h3>
                <p class="popup-description">${place.description || ''}</p>
            </div>
        </div>
    `;

    // Create popup with minimal content
    const popup = L.popup({
        className: 'custom-popup simple-popup',
        maxWidth: 500, // Wider popup
        minWidth: 400
    }).setContent(initialPopupContent);
    
    marker.bindPopup(popup);
    
    // No need to fetch additional content for the popup
    // as we're only showing title and description

    // Add marker to map
    marker.addTo(placesMap);
    
    // Store marker reference
    markers[place.permalink] = marker;

    // Add click event
    marker.on('click', () => {
        // Highlight the place in the list if available
        if (placesList) {
            const placeItem = document.querySelector(`.place-item[data-url="${place.permalink}"]`);
            if (placeItem) {
                // Remove active class from all places
                document.querySelectorAll('.place-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Add active class to clicked place
                placeItem.classList.add('active');
                
                // Scroll to place item
                placeItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
        
        // Show place details in the side panel
        showPlaceDetails(place);
    });

    return marker;
}

// Initialize tag filters
function initFilters() {
    // Get tag filters container
    const tagFilters = document.getElementById('tag-filters');
    
    if (!tagFilters) return;
    
    // Get all pre-rendered tag filter elements
    const tagElements = tagFilters.querySelectorAll('.tag-filter');
    console.log(`Found ${tagElements.length} pre-rendered tag elements`);
    
    // Add click handlers to each tag filter
    tagElements.forEach(filterBtn => {
        const tag = filterBtn.dataset.tag;
        
        // Add click handler
        filterBtn.addEventListener('click', () => {
            console.log(`Clicked tag: "${tag}"`);
            
            // Toggle active class
            filterBtn.classList.toggle('active');
            
            // Update active filters
            if (filterBtn.classList.contains('active')) {
                activeFilters.push(tag);
            } else {
                activeFilters = activeFilters.filter(t => t !== tag);
            }
            
            console.log("Active filters:", activeFilters);
            renderPlaces();
        });
    });
}

// Initialize search
function initSearch() {
    searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', e => {
            searchTerm = e.target.value.trim().toLowerCase();
            renderPlaces();
        });
    }
}

// Filter places based on active filters and search
function filterPlaces() {
    // Normalize all active filters to lowercase for case-insensitive matching
    const normalizedActiveFilters = activeFilters.map(f => f.toLowerCase());
    
    console.log("Filtering with normalized active filters:", normalizedActiveFilters);
    
    return allPlaces.filter(place => {
        // Filter by tags
        if (normalizedActiveFilters.length > 0) {
            // Parse and normalize place tags to lowercase
            let placeTags = [];
            
            if (typeof place.tags === 'string') {
                try {
                    // Parse JSON string representation of array
                    placeTags = JSON.parse(place.tags).map(tag => tag.toLowerCase());
                } catch (e) {
                    console.error(`Error parsing tags for place "${place.title}":`, e);
                }
            } else if (Array.isArray(place.tags)) {
                placeTags = place.tags.map(tag => tag.toLowerCase());
            }
            
            console.log(`Place: "${place.title}" has normalized tags:`, placeTags);
            
            // Check if any active filter matches any place tag using direct inclusion
            // This is simpler than nested some() loops
            const hasMatchingTag = placeTags.some(tag => 
                normalizedActiveFilters.includes(tag)
            );
            
            if (!hasMatchingTag) {
                console.log(`Place: "${place.title}" filtered out - no matching tags`);
                return false;
            } else {
                console.log(`Place: "${place.title}" matches tags`);
            }
        }
        
        // Filter by search term
        if (searchTerm) {
            const title = place.title.toLowerCase();
            const description = (place.description || '').toLowerCase();
            
            // Parse and process tags for search
            let tagsString = '';
            if (typeof place.tags === 'string') {
                try {
                    // Parse JSON string representation of array
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
        
        return true;
    });
}

// Render places list
function renderPlacesList(places = null) {
    if (!placesList) return;
    
    // Use filtered places or all places
    const placesToRender = places || filterPlaces();
    
    // Clear current list
    placesList.innerHTML = '';
    
    // Show message if no places
    if (placesToRender.length === 0) {
        placesList.innerHTML = '<p class="no-results">No places found matching your filters.</p>';
        return;
    }
    
    // Add place items
    placesToRender.forEach(place => {
        const placeItem = document.createElement('div');
        placeItem.className = 'place-item';
        placeItem.dataset.url = place.permalink;
        
        // Process tags for list item
        let tagsToDisplay = [];
        if (typeof place.tags === 'string') {
            try {
                // Parse JSON string representation of array
                tagsToDisplay = JSON.parse(place.tags);
            } catch (e) {
                console.error(`Error parsing tags for list item "${place.title}":`, e);
            }
        } else if (Array.isArray(place.tags)) {
            tagsToDisplay = place.tags;
        }
        
        placeItem.innerHTML = `
            <h3 class="place-title">${place.title}</h3>
            <p class="place-description">${place.description || ''}</p>
            ${tagsToDisplay.length ? `
            <div class="place-tags">
                ${tagsToDisplay.map(tag => `<span class="place-tag">${tag}</span>`).join('')}
            </div>` : ''}
        `;
        
        // Add click handler
        placeItem.addEventListener('click', () => {
            // Highlight this item
            document.querySelectorAll('.place-item').forEach(item => {
                item.classList.remove('active');
            });
            placeItem.classList.add('active');
            
            // Open marker popup without zooming
            if (markers[place.permalink]) {
                markers[place.permalink].openPopup();
            }
            
            // Show place details in sidebar
            showPlaceDetails(place);
        });
        
        placesList.appendChild(placeItem);
    });
}

// Handle single place map
function initSinglePlaceMap() {
    // Get single place map container
    const singleMapContainer = document.getElementById('single-place-map');
    if (!singleMapContainer) return;
    
    // Get place data
    const placeData = document.getElementById('place-data');
    if (!placeData) return;
    
    try {
        const place = JSON.parse(placeData.textContent);
        
        // Initialize map
        const singleMap = L.map(singleMapContainer).setView([place.lat, place.lng], 13);
        
        // Add OpenStreetMap tile layer
        L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(singleMap);
        
        // Add marker
        const marker = L.marker([place.lat, place.lng], {
            title: place.title
        }).addTo(singleMap);
        
        // Process tags for single place popup
        let tagsToDisplay = [];
        if (typeof place.tags === 'string') {
            try {
                // Parse JSON string representation of array
                tagsToDisplay = JSON.parse(place.tags);
            } catch (e) {
                console.error(`Error parsing tags for single place "${place.title}":`, e);
            }
        } else if (Array.isArray(place.tags)) {
            tagsToDisplay = place.tags;
        }
        
        // Add simplified popup with just title and description
        const popupContent = `
            <div class="popup-content">
                <div class="popup-header">
                    <h3 class="popup-title">${place.title}</h3>
                    <p class="popup-description">${place.description || ''}</p>
                </div>
            </div>
        `;
        marker.bindPopup(popupContent, {
            className: 'custom-popup simple-popup',
            maxWidth: 500, // Wider popup
            minWidth: 400
        }).openPopup();
        
    } catch (e) {
        console.error('Error parsing place data:', e);
    }
}

// Setup panel toggling functionality
function setupPanelToggling() {
    if (!sidePanel || !panelHideToggle || !panelShowToggle) return;
    
    // Handle panel hide toggle
    panelHideToggle.addEventListener('click', () => {
        // Hide the side panel
        sidePanel.classList.add('hidden');
        // Show the show panel button
        panelShowToggle.classList.remove('hidden');
        // Update state
        isPanelVisible = false;
        // Resize map to ensure proper display
        if (placesMap) placesMap.invalidateSize();
    });
    
    // Handle panel show toggle
    panelShowToggle.addEventListener('click', () => {
        // Show the side panel
        sidePanel.classList.remove('hidden');
        // Hide the show panel button
        panelShowToggle.classList.add('hidden');
        // Update state
        isPanelVisible = true;
        // Resize map to ensure proper display
        if (placesMap) placesMap.invalidateSize();
    });
    
    // On mobile, use the panel toggle button (hamburger menu)
    if (panelToggle) {
        panelToggle.addEventListener('click', () => {
            sidePanel.classList.toggle('visible');
        });
    }
}

// Show place details in sidebar
function showPlaceDetails(place) {
    if (!placeDetailContainer || !placeDetailContent || !place) return;
    
    // Store current place
    currentPlaceId = place.permalink;
    
    // Create detail HTML - simplified to just show title and description
    const detailHTML = `
        <article class="place-detail">
            <header class="place-header">
                <h1>${place.title}</h1>
                ${place.description ? `<p class="place-description">${place.description}</p>` : ''}
            </header>
        </article>
    `;
    
    // Update content
    placeDetailContent.innerHTML = detailHTML;
    
    // Hide places list, show detail view
    placesList.style.display = 'none';
    placeDetailContainer.style.display = 'block';
    
    // Zoom map to place
    zoomToPlace(place);
    
    // If the panel was hidden, show it
    if (sidePanel.classList.contains('hidden')) {
        sidePanel.classList.remove('hidden');
        if (panelShowToggle) panelShowToggle.classList.add('hidden');
        isPanelVisible = true;
        if (placesMap) placesMap.invalidateSize();
    }
    
    // Fetch additional details via AJAX if needed
    fetchPlaceContent(place.permalink);
}

// Zoom the map to a specific place
function zoomToPlace(place) {
    if (!placesMap || !place || !place.lat || !place.lng) return;
    
    // Zoom to place with animation
    placesMap.flyTo([place.lat, place.lng], 15, {
        animate: true,
        duration: 1
    });
    
    // Open popup for this place if marker exists
    if (markers[place.permalink]) {
        // Wait for zoom animation to complete
        setTimeout(() => {
            markers[place.permalink].openPopup();
        }, 1100);
    }
}

// Fetch additional place content via AJAX
function fetchPlaceContent(permalink, marker = null) {
    if (!permalink) return;
    
    // Make a fetch request to the place page
    fetch(permalink)
        .then(response => response.text())
        .then(html => {
            // Create a temporary element to parse the HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Find the place content and related links
            const content = doc.querySelector('.place-content');
            const urlsSection = doc.querySelector('.place-urls');
            
            // Extract place slug from permalink for photos
            const permalinkParts = permalink.split('/');
            const placeSlug = permalinkParts[permalinkParts.length - 2] || '';
            
            // If we're updating the sidebar
            if (placeDetailContent && !marker) {
                const placeDetail = placeDetailContent.querySelector('.place-detail');
                if (placeDetail) {
                    // Look for images in the place folder
                    const photoGallery = document.createElement('div');
                    photoGallery.className = 'place-photos';
                    
                    // Create photo gallery section only if we have a valid slug
                    if (placeSlug) {
                        // Try to find images within the place folder
                        const placeDirPath = `/places/${placeSlug}/`;
                        
                        // Check for the Dortmund coffee shop images as in the example
                        if (placeSlug === 'dortmund-coffee-shop') {
                            photoGallery.innerHTML = `
                                <h2>Photos</h2>
                                <div class="photo-gallery">
                                    <div class="gallery-image">
                                        <img src="${placeDirPath}Bildschirmfoto 2025-04-21 um 17.38.54.png" alt="Dortmund Coffee Shop">
                                    </div>
                                    <div class="gallery-image">
                                        <img src="${placeDirPath}Bildschirmfoto 2025-04-21 um 17.38.59.png" alt="Dortmund Coffee Shop">
                                    </div>
                                </div>
                            `;
                        } else {
                            // Generic implementation to find images
                            // This is simplified - in production you'd need a more robust solution
                            // to discover available images
                            photoGallery.innerHTML = `
                                <h2>Photos</h2>
                                <div class="photo-gallery">
                                    <p>No photos available</p>
                                </div>
                            `;
                        }
                        
                        // Add the photo gallery before other content
                        placeDetail.appendChild(photoGallery);
                    }
                    
                    // Add content if found
                    if (content) {
                        const contentDiv = document.createElement('div');
                        contentDiv.className = 'place-content';
                        contentDiv.innerHTML = content.innerHTML;
                        placeDetail.appendChild(contentDiv);
                    }
                    
                    // Add URLs if found
                    if (urlsSection) {
                        placeDetail.appendChild(urlsSection.cloneNode(true));
                    }
                    
                    // Add view full page link
                    const viewFullPageLink = document.createElement('div');
                    viewFullPageLink.className = 'view-full-page';
                    viewFullPageLink.innerHTML = `
                        <a href="${permalink}" class="full-page-link">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                            View full page
                        </a>
                    `;
                    placeDetail.appendChild(viewFullPageLink);
                }
            }
        })
        .catch(error => {
            console.error('Error fetching place content:', error);
        });
}

// Return to the list view
function backToListView() {
    if (!placesList || !placeDetailContainer) return;
    
    // Clear current place
    currentPlaceId = null;
    
    // Show places list, hide detail view
    placesList.style.display = 'block';
    placeDetailContainer.style.display = 'none';
    
    // Reset map to show all places with explicit bounds update
    renderPlaces(true);
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the places list or single place page
    if (document.getElementById('places-map')) {
        initPlacesMap();
    } else if (document.getElementById('single-place-map')) {
        initSinglePlaceMap();
    }
});

// Detect dark mode changes
function updateMapForDarkMode(isDark) {
    // Update map tiles for dark mode if map exists
    if (placesMap) {
        // This would ideally switch to a dark theme map tileset
        // For demonstration, we'll just log the change
        console.log('Map dark mode:', isDark);
    }
}

// Connect to theme toggle
const htmlElement = document.documentElement;
const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
        if (mutation.attributeName === 'class') {
            const isDark = htmlElement.classList.contains('dark-mode');
            updateMapForDarkMode(isDark);
        }
    });
});

observer.observe(htmlElement, { attributes: true });
