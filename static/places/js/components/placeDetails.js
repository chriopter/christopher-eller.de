/**
 * Place details functionality
 */

import { elements, currentPlaceId, updateState } from '../base/state.js';
import { getPhotoGalleryHTML } from './gallery.js';
import { hideListElements, showListElements } from './panel.js';
import { zoomToPlace } from './map.js';
import { updateURL } from '../utils/history.js';

/**
 * Show place details in sidebar
 * @param {Object} place - The place object to show
 * @param {boolean} updateHistory - Whether to update browser history
 * @param {boolean} doZoom - Whether to zoom the map to the place
 */
export function showPlaceDetails(place, updateHistory = true, doZoom = false) {
    const { placeDetailContainer, placeDetailContent } = elements;
    if (!placeDetailContainer || !placeDetailContent || !place) return;
    
    // Store current place
    updateState('currentPlaceId', place.permalink);
    
    // Update URL if requested
    if (updateHistory) {
        updateURL(place);
    }
    
    // Get photo gallery HTML
    const photoGalleryHTML = getPhotoGalleryHTML(place, false);
    
    // Create detail HTML
    const detailHTML = `
        <article class="place-detail">
            <header class="place-header" style="text-align: left; width: 100%; display: block;">
                <h1 style="text-align: left; margin-left: 0; padding-left: 0; display: block; width: 100%;">${place.title}</h1>
                ${place.description ? `<p class="place-description" style="text-align: left; margin-left: 0; padding-left: 0; display: block; width: 100%;">${place.description}</p>` : ''}
            </header>
            <div class="place-action-buttons" style="margin: 1.5rem 0 2rem 0;" id="place-action-buttons">
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
            ${photoGalleryHTML}
            <div class="place-content">
                <div class="loading-content">Loading content...</div>
            </div>
        </article>
    `;
    
    // Update content
    placeDetailContent.innerHTML = detailHTML;
    
    // Add web button if URL exists
    addWebButton(place);
    
    // Hide list elements and show detail view
    hideListElements();
    placeDetailContainer.style.display = 'block';
    
    // Zoom map if requested
    if (doZoom) {
        zoomToPlace(place);
    }
    
    // Load place content
    loadPlaceContent(place);
    
    // Setup action buttons
    setupActionButtons(place);
}

/**
 * Add web button if place has URL
 * @param {Object} place - The place object
 */
function addWebButton(place) {
    if (!place.urls) return;
    
    const actionButtonsContainer = document.getElementById('place-action-buttons');
    if (!actionButtonsContainer) return;
    
    const webButton = document.createElement('a');
    // Clean up URL
    let cleanUrl = place.urls;
    if (typeof cleanUrl === 'string') {
        cleanUrl = cleanUrl.replace(/^["'](.*)["']$/, '$1')
                          .replace(/%22/g, '')
                          .replace(/%2522/g, '');
    }
    
    webButton.href = cleanUrl;
    webButton.className = 'place-action-btn';
    webButton.target = '_blank';
    webButton.rel = 'noopener noreferrer';
    webButton.title = 'Visit website';
    webButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
        </svg>
        Web
    `;
    
    actionButtonsContainer.appendChild(webButton);
}

/**
 * Setup action buttons for place detail view
 * @param {Object} place - The place object
 */
function setupActionButtons(place) {
    // Zoom button
    const zoomBtn = document.querySelector('.zoom-to-place');
    if (zoomBtn) {
        zoomBtn.addEventListener('click', () => {
            zoomToPlace(place);
        });
    }
    
    // Copy link button
    const copyBtn = document.querySelector('.copy-link');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const fullUrl = window.location.origin + place.permalink;
            navigator.clipboard.writeText(fullUrl)
                .then(() => {
                    const originalText = copyBtn.innerHTML;
                    copyBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Link copied!
                    `;
                    copyBtn.classList.add('success');
                    
                    setTimeout(() => {
                        copyBtn.innerHTML = originalText;
                        copyBtn.classList.remove('success');
                    }, 2000);
                })
                .catch(err => {
                    console.error('Error copying text to clipboard:', err);
                });
        });
    }
}

/**
 * Load place content from permalink
 * @param {Object} place - The place object
 */
function loadPlaceContent(place) {
    const contentContainer = document.querySelector('.place-content');
    if (!contentContainer) return;
    
    fetch(place.permalink)
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Try to find the content
            let contentElement = null;
            
            // Option 1: Try specific content container
            contentElement = doc.querySelector('article .place-content') || 
                           doc.querySelector('main .place-content');
            
            if (!contentElement) {
                // Option 2: Extract from article/main
                const article = doc.querySelector('article') || doc.querySelector('main');
                
                if (article) {
                    // Remove navigation, headers, footers, etc.
                    const elementsToRemove = article.querySelectorAll(
                        'header, .header, nav, .nav, footer, .footer, ' +
                        '.place-action-buttons, .map-container, .side-panel, ' +
                        '.panel-toggle, .menu-pill, .back-button'
                    );
                    elementsToRemove.forEach(el => el.remove());
                    
                    // Process the article
                    const h2Elements = article.querySelectorAll('h2');
                    
                    if (h2Elements.length > 0) {
                        // Create content wrapper for h2 sections
                        contentElement = document.createElement('div');
                        contentElement.className = 'extracted-content';
                        
                        h2Elements.forEach(h2 => {
                            const section = document.createElement('div');
                            section.className = 'content-section';
                            section.appendChild(h2.cloneNode(true));
                            
                            let nextElement = h2.nextElementSibling;
                            while (nextElement && nextElement.tagName !== 'H2') {
                                section.appendChild(nextElement.cloneNode(true));
                                nextElement = nextElement.nextElementSibling;
                            }
                            
                            contentElement.appendChild(section);
                        });
                    } else {
                        contentElement = article;
                    }
                }
            }
            
            // Update content
            contentContainer.innerHTML = '';
            if (contentElement) {
                // Final cleanup
                const scripts = contentElement.querySelectorAll('script');
                scripts.forEach(script => script.remove());
                
                contentContainer.appendChild(contentElement);
            } else {
                contentContainer.innerHTML = '<div class="error-content">Sorry, content could not be loaded.</div>';
            }
        })
        .catch(error => {
            contentContainer.innerHTML = '<div class="error-content">Error loading content.</div>';
            console.error('Error fetching content:', error);
        });
}

/**
 * Return to the list view
 * @param {boolean} updateHistory - Whether to update browser history
 */
export function backToListView(updateHistory = true) {
    const { placeDetailContainer } = elements;
    if (!placeDetailContainer) return;
    
    // Clear current place
    updateState('currentPlaceId', null);
    
    // Show list elements, hide detail view
    showListElements();
    placeDetailContainer.style.display = 'none';
    
    // Update URL
    if (updateHistory) {
        updateURL(null);
    }
}

/**
 * Handle single place view when directly accessing a place URL
 */
export function handleSinglePlaceView() {
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
            const place = allPlaces.find(p => p.permalink === singlePlace.permalink);
            if (place) {
                showPlaceDetails(place, false);
            }
        }, 500);
    } catch (e) {
        console.error('Error parsing single place data:', e);
    }
}
