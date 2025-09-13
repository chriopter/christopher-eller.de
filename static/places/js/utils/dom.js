/**
 * DOM manipulation utilities
 */

/**
 * Create an element with attributes and children
 * @param {string} tag - The HTML tag name
 * @param {Object} attrs - Attributes to set on the element
 * @param {Array|string|Node} children - Child elements or text content
 * @returns {HTMLElement} The created element
 */
export function createElement(tag, attrs = {}, children = []) {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attrs).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key.startsWith('data-')) {
            element.setAttribute(key, value);
        } else {
            element[key] = value;
        }
    });
    
    // Add children
    if (Array.isArray(children)) {
        children.forEach(child => appendContent(element, child));
    } else {
        appendContent(element, children);
    }
    
    return element;
}

/**
 * Append content to an element
 * @param {HTMLElement} parent - The parent element
 * @param {string|Node} content - The content to append
 */
function appendContent(parent, content) {
    if (content instanceof Node) {
        parent.appendChild(content);
    } else if (typeof content === 'string' || typeof content === 'number') {
        parent.appendChild(document.createTextNode(content));
    }
}

/**
 * Create an HTML element from an HTML string
 * @param {string} html - The HTML string
 * @returns {HTMLElement} The created element
 */
export function createElementFromHTML(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.firstChild;
}

/**
 * Remove all child nodes from an element
 * @param {HTMLElement} element - The element to clear
 */
export function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Check if an element is visible in its scroll container
 * @param {HTMLElement} element - The element to check
 * @param {HTMLElement} container - The scroll container
 * @returns {boolean} Whether the element is visible
 */
export function isElementVisible(element, container) {
    const elementRect = element.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    
    return (
        elementRect.top >= containerRect.top &&
        elementRect.left >= containerRect.left &&
        elementRect.bottom <= containerRect.bottom &&
        elementRect.right <= containerRect.right
    );
}

/**
 * Scroll an element into view within its container
 * @param {HTMLElement} element - The element to scroll to
 * @param {HTMLElement} container - The scroll container
 * @param {Object} options - Scroll options (behavior, block, inline)
 */
export function scrollIntoViewIfNeeded(element, container, options = {}) {
    if (!isElementVisible(element, container)) {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
            ...options
        });
    }
}

/**
 * Add multiple event listeners to an element
 * @param {HTMLElement} element - The element to add listeners to
 * @param {Object} listeners - Object mapping event types to handlers
 * @returns {Function} Function to remove all listeners
 */
export function addEventListeners(element, listeners) {
    Object.entries(listeners).forEach(([type, handler]) => {
        element.addEventListener(type, handler);
    });
    
    // Return cleanup function
    return () => {
        Object.entries(listeners).forEach(([type, handler]) => {
            element.removeEventListener(type, handler);
        });
    };
}

/**
 * Decode HTML entities in a string
 * @param {string} html - The string containing HTML entities
 * @returns {string} The decoded string
 */
export function decodeHTML(html) {
    const textarea = document.createElement('textarea');
    textarea.innerHTML = html;
    return textarea.value;
}

/**
 * Parse HTML string and extract text content
 * @param {string} html - The HTML string
 * @returns {string} The text content
 */
export function getTextFromHTML(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
}

/**
 * Check if an element matches a selector
 * @param {HTMLElement} element - The element to check
 * @param {string} selector - The selector to match against
 * @returns {boolean} Whether the element matches
 */
export function matches(element, selector) {
    const matchesFunc = element.matches || 
                       element.webkitMatchesSelector || 
                       element.mozMatchesSelector || 
                       element.msMatchesSelector;
    return matchesFunc.call(element, selector);
}

/**
 * Find closest ancestor matching a selector
 * @param {HTMLElement} element - The starting element
 * @param {string} selector - The selector to match against
 * @returns {HTMLElement|null} The matching ancestor or null
 */
export function closest(element, selector) {
    let current = element;
    while (current && current !== document) {
        if (matches(current, selector)) {
            return current;
        }
        current = current.parentElement;
    }
    return null;
}
