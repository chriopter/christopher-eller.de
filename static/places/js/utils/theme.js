/**
 * Theme handling utilities
 */

import { updateMapForDarkMode } from '../components/map.js';

/**
 * Initialize theme handling
 */
export function initThemeHandling() {
    // Get HTML element for theme observation
    const htmlElement = document.documentElement;
    
    // Create observer to watch for theme changes
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.attributeName === 'class') {
                const isDark = htmlElement.classList.contains('dark-mode');
                updateMapForDarkMode(isDark);
            }
        });
    });
    
    // Start observing theme changes
    observer.observe(htmlElement, { attributes: true });
    
    // Set initial theme
    const isDark = htmlElement.classList.contains('dark-mode');
    updateMapForDarkMode(isDark);
}

/**
 * Get current theme mode
 * @returns {boolean} True if dark mode is active
 */
export function isDarkMode() {
    return document.documentElement.classList.contains('dark-mode');
}

/**
 * Set theme mode
 * @param {boolean} isDark - Whether to enable dark mode
 */
export function setThemeMode(isDark) {
    const htmlElement = document.documentElement;
    if (isDark) {
        htmlElement.classList.add('dark-mode');
    } else {
        htmlElement.classList.remove('dark-mode');
    }
}

/**
 * Toggle theme mode
 */
export function toggleThemeMode() {
    const htmlElement = document.documentElement;
    htmlElement.classList.toggle('dark-mode');
}

/**
 * Get system theme preference
 * @returns {boolean} True if system prefers dark mode
 */
export function getSystemThemePreference() {
    return window.matchMedia && 
           window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Watch for system theme changes
 * @param {Function} callback - Function to call when theme changes
 * @returns {Function} Function to remove the listener
 */
export function watchSystemTheme(callback) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const listener = (e) => {
        callback(e.matches);
    };
    
    mediaQuery.addListener(listener);
    
    // Return cleanup function
    return () => mediaQuery.removeListener(listener);
}
