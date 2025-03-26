/**
 * UI-related functions for the countdown timer
 */

// DOM elements - will be initialized in main.js
let elements = {};

// Create emoji background pattern
function createEmojiBackground(emoji, bgColor, density, container) {
    if (!container) return;
    
    // Clear previous background
    container.innerHTML = '';
    container.style.backgroundColor = bgColor;
    
    // If no emoji, just use background color
    if (!emoji || emoji === 'none') return;
    
    // Create emoji pattern container
    const patternDiv = document.createElement('div');
    patternDiv.className = 'emoji-pattern';
    container.appendChild(patternDiv);
    
    // Determine emoji count based on density
    let emojiCount;
    switch (density) {
        case 'low': emojiCount = 50; break;
        case 'medium': emojiCount = 100; break;
        case 'high': emojiCount = 200; break;
        default: emojiCount = 100; // Default to medium
    }
    
    // Create grid of emojis to fill the container
    const containerWidth = container.offsetWidth || 600;
    const containerHeight = container.offsetHeight || 300;
    
    // Add emoji elements with random positioning for a more natural look
    for (let i = 0; i < emojiCount; i++) {
        const span = document.createElement('span');
        span.className = 'emoji-cell';
        span.textContent = emoji;
        
        // Add some randomness to positioning
        span.style.position = 'absolute';
        span.style.left = `${Math.random() * 100}%`;
        span.style.top = `${Math.random() * 100}%`;
        span.style.transform = `rotate(${Math.random() * 40 - 20}deg)`;
        span.style.opacity = `${0.4 + Math.random() * 0.6}`;
        span.style.fontSize = `${16 + Math.random() * 12}px`;
        
        patternDiv.appendChild(span);
    }
}

// Update backgrounds for both preview and display
function updateBackgrounds() {
    const emoji = elements.emojiSelect.value === 'custom' 
        ? elements.customEmojiInput.value 
        : elements.emojiSelect.value;
    const bgColor = elements.bgColorInput.value;
    const density = elements.densitySelect.value;
    
    createEmojiBackground(emoji, bgColor, density, elements.previewBackground);
    createEmojiBackground(emoji, bgColor, density, elements.displayBackground);
}

// Update countdown display
function updateCountdown() {
    if (!window.targetDate) return;
    
    const now = new Date();
    const diffMs = window.targetDate - now;
    
    if (diffMs <= 0) {
        // Countdown expired
        elements.previewDays.textContent = '00';
        elements.previewHours.textContent = '00';
        elements.previewMinutes.textContent = '00';
        elements.previewSeconds.textContent = '00';
        elements.previewHumanReadable.textContent = 'Countdown complete';
        
        elements.displayDays.textContent = '00';
        elements.displayHours.textContent = '00';
        elements.displayMinutes.textContent = '00';
        elements.displaySeconds.textContent = '00';
        elements.displayHumanReadable.textContent = 'Countdown complete';
        
        elements.expiredMessage.style.display = 'block';
        return;
    }
    
    // Format human-readable text
    const readableText = formatTimeHumanReadable(diffMs);
    elements.previewHumanReadable.textContent = readableText;
    elements.displayHumanReadable.textContent = readableText;
    
    // Calculate time units
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    // Format with leading zeros
    const daysStr = String(days).padStart(2, '0');
    const hoursStr = String(hours).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');
    const secondsStr = String(seconds).padStart(2, '0');
    
    // Update preview display
    elements.previewDays.textContent = daysStr;
    elements.previewHours.textContent = hoursStr;
    elements.previewMinutes.textContent = minutesStr;
    elements.previewSeconds.textContent = secondsStr;
    
    // Update main display
    elements.displayDays.textContent = daysStr;
    elements.displayHours.textContent = hoursStr;
    elements.displayMinutes.textContent = minutesStr;
    elements.displaySeconds.textContent = secondsStr;
    
    // Hide expired message
    elements.expiredMessage.style.display = 'none';
}

// Update the preview status message
function updatePreviewStatus() {
    if (!window.targetDate) {
        elements.previewStatus.textContent = '';
        return;
    }
    
    const now = new Date();
    
    if (window.targetDate > now) {
        const diffMs = window.targetDate - now;
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        elements.previewStatus.textContent = `${diffDays} days from now`;
    } else {
        elements.previewStatus.textContent = 'Date is in the past';
    }
}

// Generate and display the countdown URL
function generateCountdownUrl() {
    if (!updateTargetDate()) {
        alert('Please enter a valid date and time');
        return;
    }
    
    const baseUrl = window.location.href.split('?')[0];
    const date = elements.dateInput.value;
    const time = elements.timeInput.value;
    const label = encodeURIComponent(elements.labelInput.value || '');
    
    // Get background options
    let emoji = elements.emojiSelect.value;
    if (emoji === 'custom') {
        emoji = elements.customEmojiInput.value;
    }
    const bgColor = elements.bgColorInput.value;
    const density = elements.densitySelect.value;
    
    // Build URL with all parameters
    let url = `${baseUrl}?date=${date}&time=${time}`;
    if (label) url += `&label=${label}`;
    if (emoji && emoji !== 'none') url += `&emoji=${encodeURIComponent(emoji)}`;
    if (bgColor) url += `&bgColor=${encodeURIComponent(bgColor)}`;
    if (density) url += `&density=${density}`;
    
    elements.urlDisplay.textContent = url;
    elements.urlSection.style.display = 'block';
    elements.urlSection.scrollIntoView({ behavior: 'smooth' });
}

// Copy URL to clipboard
function copyUrlToClipboard() {
    navigator.clipboard.writeText(elements.urlDisplay.textContent)
        .then(() => {
            elements.copySuccess.classList.add('visible');
            setTimeout(() => {
                elements.copySuccess.classList.remove('visible');
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy URL:', err);
            alert('Failed to copy URL. Please copy it manually.');
        });
}

// Toggle between management mode and display mode
function switchToDisplayMode() {
    elements.managementMode.style.display = 'none';
    elements.displayMode.style.display = 'block';
}

function switchToManagementMode() {
    elements.managementMode.style.display = 'block';
    elements.displayMode.style.display = 'none';
}
