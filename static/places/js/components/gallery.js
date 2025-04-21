/**
 * Gallery functionality for places
 */

import { galleryConfig } from '../base/config.js';
import { currentLightboxIndex, lightboxImages, updateState } from '../base/state.js';

/**
 * Get photo gallery HTML for a place
 * @param {Object} place - The place object
 * @param {boolean} isPopup - Whether this is for a popup view
 * @returns {string} The gallery HTML
 */
export function getPhotoGalleryHTML(place, isPopup = false) {
    // Images array to hold all gallery images
    const galleryImages = [];
    
    try {
        // Check if the place has images from Hugo
        if (place.images && Array.isArray(place.images) && place.images.length > 0) {
            galleryImages.push(...place.images);
        }
    } catch (e) {
        console.error('Error getting gallery images:', e);
    }
    
    // If no images found, don't show a photo section
    if (galleryImages.length === 0) {
        return '';
    }
    
    // For non-popup view, limit visible images and show +N indicator
    let visibleImages = galleryImages;
    let moreIndicator = '';
    
    if (!isPopup) {
        const maxVisibleImages = galleryConfig.maxVisibleImages;
        const hiddenCount = galleryImages.length - maxVisibleImages;
        
        if (hiddenCount > 0) {
            visibleImages = galleryImages.slice(0, maxVisibleImages);
            moreIndicator = `<div class="more-photos-indicator">+${hiddenCount}</div>`;
        }
    }
    
    // Create gallery HTML
    const imageHTML = visibleImages.map(img => `
        <div class="${isPopup ? 'popup-gallery-image' : 'gallery-image'}">
            <img src="${img.path}" alt="${img.name}">
        </div>
    `).join('');
    
    // Return gallery HTML
    if (isPopup) {
        return `
            <div class="popup-photo-gallery">
                ${imageHTML}
            </div>
        `;
    } else {
        return `
            <div class="place-photos">
                <h2>Photos</h2>
                <div class="photo-gallery">
                    ${imageHTML}
                    ${moreIndicator}
                </div>
            </div>
        `;
    }
}

/**
 * Initialize lightbox functionality
 */
export function initLightbox() {
    createLightboxElements();
    setupLightboxHandlers();
}

/**
 * Create lightbox elements if they don't exist
 */
function createLightboxElements() {
    if (!document.querySelector('.lightbox-overlay')) {
        const lightboxHTML = `
            <div class="lightbox-overlay">
                <div class="lightbox-container">
                    <button class="lightbox-close">&times;</button>
                    <button class="lightbox-nav lightbox-prev">&#10094;</button>
                    <button class="lightbox-nav lightbox-next">&#10095;</button>
                    <img class="lightbox-image" src="" alt="Fullsize image">
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', lightboxHTML);
    }
}

/**
 * Setup lightbox event handlers
 */
function setupLightboxHandlers() {
    const lightbox = document.querySelector('.lightbox-overlay');
    const closeBtn = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    
    // Close button handler
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
    
    // Navigation handlers
    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', showPrevImage);
        nextBtn.addEventListener('click', showNextImage);
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            
            if (e.key === 'ArrowLeft') {
                showPrevImage();
            } else if (e.key === 'ArrowRight') {
                showNextImage();
            }
        });
    }
    
    // Gallery image click handler
    document.addEventListener('click', (e) => {
        const galleryImage = e.target.closest('.gallery-image img') || 
                           e.target.closest('.popup-gallery-image img');
        
        if (galleryImage) {
            openLightbox(galleryImage);
        }
    });
}

/**
 * Open lightbox with clicked image
 * @param {HTMLElement} clickedImage - The clicked image element
 */
function openLightbox(clickedImage) {
    const isPopup = clickedImage.closest('.popup-gallery-image') !== null;
    const container = isPopup ? 
        clickedImage.closest('.popup-photo-gallery') : 
        clickedImage.closest('.photo-gallery');
        
    if (container) {
        // Get all images in this gallery
        const images = Array.from(container.querySelectorAll('img')).map(img => img.src);
        updateState('lightboxImages', images);
        
        // Find the index of the clicked image
        const index = images.findIndex(src => src === clickedImage.src);
        updateState('currentLightboxIndex', index);
        
        const lightbox = document.querySelector('.lightbox-overlay');
        const lightboxImage = document.querySelector('.lightbox-image');
        
        if (lightbox && lightboxImage) {
            // Set the image source
            lightboxImage.src = clickedImage.src;
            
            // Show the lightbox
            lightbox.classList.add('active');
            
            // Show/hide navigation based on image count
            toggleNavigationButtons();
        }
    }
}

/**
 * Show previous image in lightbox
 */
function showPrevImage() {
    if (lightboxImages.length <= 1) return;
    
    const newIndex = (currentLightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
    updateState('currentLightboxIndex', newIndex);
    updateLightboxImage();
}

/**
 * Show next image in lightbox
 */
function showNextImage() {
    if (lightboxImages.length <= 1) return;
    
    const newIndex = (currentLightboxIndex + 1) % lightboxImages.length;
    updateState('currentLightboxIndex', newIndex);
    updateLightboxImage();
}

/**
 * Update lightbox image source
 */
function updateLightboxImage() {
    const lightboxImage = document.querySelector('.lightbox-image');
    if (lightboxImage && lightboxImages[currentLightboxIndex]) {
        lightboxImage.src = lightboxImages[currentLightboxIndex];
    }
}

/**
 * Toggle navigation buttons based on image count
 */
function toggleNavigationButtons() {
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    
    if (prevBtn && nextBtn) {
        // Only show navigation if we have more than one image
        const display = lightboxImages.length > 1 ? 'flex' : 'none';
        prevBtn.style.display = display;
        nextBtn.style.display = display;
    }
}
