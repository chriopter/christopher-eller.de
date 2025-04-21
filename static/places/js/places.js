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

// DOM elements
let mapContainer = null;
let searchInput = null;
let placesList = null;

// Initialize the map and places
function initPlacesMap() {
    // Get map container
    mapContainer = document.getElementById('places-map');
    if (!mapContainer) return;

    // Initialize Leaflet map
    placesMap = L.map(mapContainer).setView([20, 0], 2);

    // Add OpenStreetMap tile layer
    L.tileLayer('//{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
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
            document.body.classList.remove('list-view');
            document.body.classList.add('map-view');
            mapViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            placesMap.invalidateSize();
        });
        
        listViewBtn.addEventListener('click', () => {
            document.body.classList.remove('map-view');
            document.body.classList.add('list-view');
            listViewBtn.classList.add('active');
            mapViewBtn.classList.remove('active');
        });
    }

    // Handle resize events
    window.addEventListener('resize', () => {
        placesMap.invalidateSize();
    });
}

// Render all places on the map
function renderPlaces() {
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

    // Update bounds if we have markers
    if (filteredPlaces.length > 0) {
        const bounds = L.latLngBounds(filteredPlaces.map(place => [place.lat, place.lng]));
        placesMap.fitBounds(bounds, { padding: [50, 50] });
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

    // Create popup content
    const popupContent = `
        <div class="popup-content">
            <div class="popup-header">
                <h3 class="popup-title">${place.title}</h3>
                <p class="popup-description">${place.description || ''}</p>
                ${place.tags && Array.isArray(place.tags) && place.tags.length ? `
                <div class="popup-tags">
                    ${place.tags.map(tag => `<span class="popup-tag">${tag}</span>`).join('')}
                </div>` : ''}
            </div>
        </div>
        <div class="popup-footer">
            <a href="${place.permalink}" class="popup-link">View details</a>
        </div>
    `;

    // Add popup to marker
    marker.bindPopup(popupContent, {
        className: 'custom-popup',
        maxWidth: 300
    });

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
    });

    return marker;
}

// Initialize tag filters
function initFilters() {
    // Get all unique tags
    const allTags = [...new Set(allPlaces.flatMap(place => Array.isArray(place.tags) ? place.tags : []))];
    
    // Create tag filters
    const tagFilters = document.getElementById('tag-filters');
    if (tagFilters && allTags.length) {
        // Sort tags alphabetically
        allTags.sort();
        
        // Create filter buttons
        allTags.forEach(tag => {
            const filterBtn = document.createElement('span');
            filterBtn.className = 'tag-filter';
            filterBtn.dataset.tag = tag;
            filterBtn.textContent = tag;
            
            // Add click handler
            filterBtn.addEventListener('click', () => {
                filterBtn.classList.toggle('active');
                
                // Update active filters
                if (filterBtn.classList.contains('active')) {
                    activeFilters.push(tag);
                } else {
                    activeFilters = activeFilters.filter(t => t !== tag);
                }
                
                renderPlaces();
            });
            
            tagFilters.appendChild(filterBtn);
        });
    }
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
    return allPlaces.filter(place => {
        // Filter by tags
        if (activeFilters.length > 0) {
            const placeTags = Array.isArray(place.tags) ? place.tags : [];
            if (!activeFilters.some(tag => placeTags.includes(tag))) {
                return false;
            }
        }
        
        // Filter by search term
        if (searchTerm) {
            const title = place.title.toLowerCase();
            const description = (place.description || '').toLowerCase();
            const tags = (Array.isArray(place.tags) ? place.tags : []).join(' ').toLowerCase();
            
            if (!title.includes(searchTerm) && 
                !description.includes(searchTerm) && 
                !tags.includes(searchTerm)) {
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
        
        placeItem.innerHTML = `
            <h3 class="place-title">${place.title}</h3>
            <p class="place-description">${place.description || ''}</p>
            ${place.tags && Array.isArray(place.tags) && place.tags.length ? `
            <div class="place-tags">
                ${place.tags.map(tag => `<span class="place-tag">${tag}</span>`).join('')}
            </div>` : ''}
        `;
        
        // Add click handler
        placeItem.addEventListener('click', () => {
            // Open the place page
            window.location.href = place.permalink;
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
        
        // Add popup with better formatting
        const popupContent = `
            <div class="popup-content">
                <h3 class="popup-title">${place.title}</h3>
                <p class="popup-description">${place.description || ''}</p>
                ${place.tags && Array.isArray(place.tags) && place.tags.length ? `
                <div class="popup-tags">
                    ${place.tags.map(tag => `<span class="popup-tag">${tag}</span>`).join('')}
                </div>` : ''}
            </div>
        `;
        marker.bindPopup(popupContent, {
            className: 'custom-popup',
            maxWidth: 300
        }).openPopup();
        
    } catch (e) {
        console.error('Error parsing place data:', e);
    }
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
