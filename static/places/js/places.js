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

    // Check if we're on a single place page or list page
    const pathParts = window.location.pathname.split('/');
    const isListPage = pathParts.filter(Boolean).length === 1 && pathParts.filter(Boolean)[0] === 'places';
    
    // Add immersive map class to body
    document.body.classList.add('map-view');

    // Initialize Leaflet map
    placesMap = L.map(mapContainer, {
        zoomControl: false // We'll add zoom control in a better position
    }).setView([20, 0], 2);

    // Setup popstate event to handle browser navigation
    window.addEventListener('popstate', handleHistoryNavigation);

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
        backToListButton.addEventListener('click', () => {
            backToListView(true); // true indicates we should update history
        });
    }
    
    // Check if we're on a single place page and handle it accordingly
    if (!isListPage) {
        handleSinglePlaceView();
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
        
        // Calculate padding based on sidebar visibility
        let leftPadding = 50;
        if (isPanelVisible && window.innerWidth >= 768) {
            // Add sidebar width (350px) plus some margin
            leftPadding = 350 + 70;
        }
        
        // Use asymmetric padding [top, right, bottom, left]
        placesMap.fitBounds(bounds, { 
            padding: [50, 50, 50, leftPadding]
        });
        
        // Set initial render to false after first render
        if (isInitialRender) isInitialRender = false;
    }

    // Update places list if available
    if (placesList) {
        renderPlacesList(filteredPlaces);
    }
}

// Get photo gallery HTML for a place
function getPhotoGalleryHTML(placeSlug, isPopup = false) {
    // Try to find images within the place folder
    const placeDirPath = `/places/${placeSlug}/`;
    const galleryClass = isPopup ? 'popup-photo-gallery' : 'photo-gallery';
    
    // Check for the Dortmund coffee shop images as in the example
    if (placeSlug === 'dortmund-coffee-shop') {
        return `
            ${!isPopup ? '<h2>Photos</h2>' : ''}
            <div class="${galleryClass}">
                <div class="gallery-image ${isPopup ? 'popup-gallery-image' : ''}">
                    <img src="${placeDirPath}Bildschirmfoto 2025-04-21 um 17.38.54.png" alt="Dortmund Coffee Shop">
                </div>
                <div class="gallery-image ${isPopup ? 'popup-gallery-image' : ''}">
                    <img src="${placeDirPath}Bildschirmfoto 2025-04-21 um 17.38.59.png" alt="Dortmund Coffee Shop">
                </div>
            </div>
        `;
    } else {
        // Generic implementation - no photos message only for sidebar, not for popup
        return isPopup ? '' : `
            <h2>Photos</h2>
            <div class="${galleryClass}">
                <p>No photos available</p>
            </div>
        `;
    }
}

// Add a marker for a place
function addPlaceMarker(place) {
    const marker = L.marker([place.lat, place.lng], {
        title: place.title
    });

    // Extract place slug from permalink for photos
    const permalinkParts = place.permalink.split('/');
    const placeSlug = permalinkParts[permalinkParts.length - 2] || '';
    
    // Get photo gallery HTML if available for this place
    const photoGalleryHTML = getPhotoGalleryHTML(placeSlug, true);
    
    // Create a popup with title, description, and photos if available
    const initialPopupContent = `
        <div class="popup-content">
            <div class="popup-header">
                <h3 class="popup-title">${place.title}</h3>
                <p class="popup-description">${place.description || ''}</p>
            </div>
            ${photoGalleryHTML ? `<div class="popup-photos">${photoGalleryHTML}</div>` : ''}
        </div>
    `;

    // Create popup with minimal content
    const popup = L.popup({
        className: 'custom-popup simple-popup',
        maxWidth: 500, // Wider popup
        minWidth: 320  // Balanced width - not too wide, not too narrow
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
        
        // Show place details in the side panel without zooming
        showPlaceDetails(place, true, false);
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
            
            // Show place details in sidebar without zooming
            showPlaceDetails(place, true, false);
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
        
        // Extract place slug from permalink for photos
        const permalinkParts = place.permalink.split('/');
        const placeSlug = permalinkParts[permalinkParts.length - 2] || '';
        
        // Get photo gallery HTML if available for this place
        const photoGalleryHTML = getPhotoGalleryHTML(placeSlug, true);
        
        // Add popup with title, description, and photos if available
        const popupContent = `
            <div class="popup-content">
                <div class="popup-header">
                    <h3 class="popup-title">${place.title}</h3>
                    <p class="popup-description">${place.description || ''}</p>
                </div>
                ${photoGalleryHTML ? `<div class="popup-photos">${photoGalleryHTML}</div>` : ''}
            </div>
        `;
        marker.bindPopup(popupContent, {
            className: 'custom-popup simple-popup',
            maxWidth: 500, // Wider popup
            minWidth: 320  // Balanced width - not too wide, not too narrow
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
function showPlaceDetails(place, updateHistory = true, doZoom = false) {
    if (!placeDetailContainer || !placeDetailContent || !place) return;
    
    // Store current place
    currentPlaceId = place.permalink;
    
    // Update URL
    if (updateHistory) {
        updateURL(place);
    }
    
    // Create detail HTML - simplified to just show title and description
    const detailHTML = `
        <article class="place-detail">
            <header class="place-header">
                <h1>${place.title}</h1>
                ${place.description ? `<p class="place-description">${place.description}</p>` : ''}
            </header>
            <div class="place-action-buttons">
                <button class="place-action-btn zoom-to-place" title="Zoom to this place">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        <line x1="11" y1="8" x2="11" y2="14"></line>
                        <line x1="8" y1="11" x2="14" y2="11"></line>
                    </svg>
                    Zoom
                </button>
                <button class="place-action-btn copy-link" title="Copy link to clipboard">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Copy
                </button>
            </div>
        </article>
    `;
    
    // Update content
    placeDetailContent.innerHTML = detailHTML;
    
    // Hide search, tag filters, places list, and header content in single view
    if (searchInput && searchInput.parentElement) {
        searchInput.parentElement.style.display = 'none';
    }
    if (document.getElementById('tag-filters')) {
        document.getElementById('tag-filters').style.display = 'none';
    }
    // Hide the header title and description
    document.querySelector('.side-panel-header').style.display = 'none';
    
    // Hide places list, show detail view
    placesList.style.display = 'none';
    placeDetailContainer.style.display = 'block';
    
    // Zoom map to place only if specifically requested
    if (doZoom) {
        zoomToPlace(place);
    }
    
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
            
            // Extract place slug from permalink for photos
            const permalinkParts = permalink.split('/');
            const placeSlug = permalinkParts[permalinkParts.length - 2] || '';
            
            // If we're updating the sidebar
            if (placeDetailContent && !marker) {
                const placeDetail = placeDetailContent.querySelector('.place-detail');
                if (placeDetail) {
                    // First, handle content from the Markdown file
                    const contentSection = document.createElement('div');
                    contentSection.className = 'place-content';
                    
                    // Find the article element which contains the rendered markdown
                    const article = doc.querySelector('article');
                    
                    if (article) {
                        // Extract the real content (exclude the header that we already display)
                        // Look specifically for elements inside the article that aren't in the header
                        const header = article.querySelector('header');
                        let headerSection = null;
                        if (header) {
                            headerSection = header;
                        }
                        
                        // Get all direct children of the article
                        const articleContent = Array.from(article.children).filter(el => {
                            // Skip the header and any elements with place-header or place-description classes
                            return el !== headerSection && 
                                  !el.classList.contains('place-header') && 
                                  !el.classList.contains('place-description');
                        });
                        
                        if (articleContent.length > 0) {
                            // Add a heading for the content section
                            contentSection.innerHTML = '<h2>About this place</h2>';
                            
                            // Add all content elements
                            articleContent.forEach(element => {
                                contentSection.appendChild(element.cloneNode(true));
                            });
                            
                            // Add the content section to the place detail
                            placeDetail.appendChild(contentSection);
                        }
                    }
                    
                    // Look for images in the place folder
                    const photoGallery = document.createElement('div');
                    photoGallery.className = 'place-photos';
                    
                    // Create photo gallery section only if we have a valid slug
                    if (placeSlug) {
                        // Use a better placeholder approach for images
                        // In a real implementation, you would dynamically discover images
                        
                        // For Dortmund coffee shop, use actual placeholder images
                        if (placeSlug === 'dortmund-coffee-shop') {
                            photoGallery.innerHTML = `
                                <h2>Photos</h2>
                                <div class="photo-gallery">
                                    <div class="gallery-image">
                                        <img src="https://placehold.co/300x200?text=Coffee+Shop+1" alt="Dortmund Coffee Shop">
                                    </div>
                                    <div class="gallery-image">
                                        <img src="https://placehold.co/300x200?text=Coffee+Shop+2" alt="Dortmund Coffee Shop">
                                    </div>
                                </div>
                            `;
                            
                            // Add the photo gallery after the content
                            placeDetail.appendChild(photoGallery);
                        }
                    }
                    
                    // Add URLs section if found
                    const urlsSection = doc.querySelector('.place-urls');
                    if (urlsSection) {
                        placeDetail.appendChild(urlsSection.cloneNode(true));
                    }
                }
            }
        })
        .catch(error => {
            console.error('Error fetching place content:', error);
        });
}

// Return to the list view
function backToListView(updateHistory = true) {
    if (!placesList || !placeDetailContainer) return;
    
    // Clear current place
    currentPlaceId = null;
    
    // Show search and tag filters again
    if (searchInput && searchInput.parentElement) {
        searchInput.parentElement.style.display = '';
    }
    if (document.getElementById('tag-filters')) {
        document.getElementById('tag-filters').style.display = '';
    }
    
    // Show the header title and description again
    if (document.querySelector('.side-panel-header')) {
        document.querySelector('.side-panel-header').style.display = '';
    }
    
    // Show places list, hide detail view
    placesList.style.display = 'block';
    placeDetailContainer.style.display = 'none';
    
    // Reset map to show all places with explicit bounds update
    renderPlaces(true);
    
    // Update URL
    if (updateHistory) {
        updateURL(null);
    }
}

// Handle browser history navigation
function handleHistoryNavigation(event) {
    // Get the state from history API
    const state = event.state;
    
    if (!state) return;
    
    if (state.type === 'place') {
        // Find the place data
        const place = allPlaces.find(p => p.permalink === state.permalink);
        if (place) {
            showPlaceDetails(place, false); // false = don't update history again
        }
    } else if (state.type === 'list') {
        backToListView(false); // false = don't update history again
    }
}

// Update URL without page reload
function updateURL(place, shouldPushState = true) {
    if (!place) {
        // List view
        if (shouldPushState) {
            history.pushState({type: 'list'}, '', '/places/');
        }
    } else {
        // Detail view
        if (shouldPushState) {
            history.pushState({
                type: 'place',
                permalink: place.permalink
            }, '', place.permalink);
        }
    }
}

// Handle single place view when directly accessing a place URL
function handleSinglePlaceView() {
    // Get place data from the single page
    const placeData = document.getElementById('place-data');
    if (!placeData) return;
    
    try {
        const singlePlace = JSON.parse(placeData.textContent);
        
        // Add this place to allPlaces array if not already there
        if (!allPlaces.some(p => p.permalink === singlePlace.permalink)) {
            allPlaces.push(singlePlace);
        }
        
        // Show the place details in the sidebar
        setTimeout(() => {
            // Find the place object in allPlaces
            const place = allPlaces.find(p => p.permalink === singlePlace.permalink);
            if (place) {
                showPlaceDetails(place, false); // Don't update history
            }
        }, 500); // Short delay to allow map to initialize
    } catch (e) {
        console.error('Error parsing single place data:', e);
    }
}

// Lightbox functionality
function createLightbox() {
    // Create lightbox elements if they don't exist
    if (!document.querySelector('.lightbox-overlay')) {
        const lightboxHTML = `
            <div class="lightbox-overlay">
                <div class="lightbox-container">
                    <button class="lightbox-close">&times;</button>
                    <img class="lightbox-image" src="" alt="Fullsize image">
                </div>
            </div>
        `;
        
        // Append to body
        document.body.insertAdjacentHTML('beforeend', lightboxHTML);
        
        // Add close handler
        const lightbox = document.querySelector('.lightbox-overlay');
        const closeBtn = document.querySelector('.lightbox-close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                lightbox.classList.remove('active');
            });
        }
        
        // Close on overlay click
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.classList.remove('active');
            }
        });
        
        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) {
                lightbox.classList.remove('active');
            }
        });
    }
    
    // Add click handler to all gallery images
    document.addEventListener('click', (e) => {
        const galleryImage = e.target.closest('.gallery-image img');
        if (galleryImage) {
            const lightbox = document.querySelector('.lightbox-overlay');
            const lightboxImage = document.querySelector('.lightbox-image');
            
            if (lightbox && lightboxImage) {
                // Set the image source
                lightboxImage.src = galleryImage.src;
                
                // Show the lightbox
                lightbox.classList.add('active');
            }
        }
    });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the places list or single place page
    if (document.getElementById('places-map')) {
        initPlacesMap();
        
        // Add event handlers for the action buttons
        document.addEventListener('click', e => {
            // Handle "Zoom to this place" button
            if (e.target.closest('.zoom-to-place')) {
                const place = allPlaces.find(p => p.permalink === currentPlaceId);
                if (place) zoomToPlace(place);
            }
            
            // Handle "Copy link" button
            if (e.target.closest('.copy-link')) {
                if (currentPlaceId) {
                    const fullUrl = window.location.origin + currentPlaceId;
                    navigator.clipboard.writeText(fullUrl)
                        .then(() => {
                            // Show feedback that link was copied
                            const button = e.target.closest('.copy-link');
                            const originalText = button.innerHTML;
                            button.innerHTML = `
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                Link copied!
                            `;
                            button.classList.add('success');
                            
                            // Reset button after 2 seconds
                            setTimeout(() => {
                                button.innerHTML = originalText;
                                button.classList.remove('success');
                            }, 2000);
                        })
                        .catch(err => {
                            console.error('Error copying text to clipboard:', err);
                        });
                }
            }
        });
        
        // Initialize lightbox functionality
        createLightbox();
    } else if (document.getElementById('single-place-map')) {
        initSinglePlaceMap();
        
        // Initialize lightbox functionality for single place view too
        createLightbox();
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
