/**
 * Main application code for the Countdown Timer
 */

// Global target date
window.targetDate = null;

// Initialize once the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all DOM elements
    elements = {
        // Mode containers
        managementMode: document.getElementById('management-mode'),
        displayMode: document.getElementById('display-mode'),
        
        // Form elements
        dateInput: document.getElementById('countdown-date'),
        timeInput: document.getElementById('countdown-time'),
        labelInput: document.getElementById('countdown-label'),
        emojiSelect: document.getElementById('emoji-select'),
        customEmojiGroup: document.getElementById('custom-emoji-group'),
        customEmojiInput: document.getElementById('custom-emoji'),
        bgColorInput: document.getElementById('bg-color'),
        densitySelect: document.getElementById('density-select'),
        generateBtn: document.getElementById('generate-btn'),
        
        // Preview elements
        previewStatus: document.getElementById('preview-status'),
        previewLabel: document.getElementById('preview-countdown-label'),
        previewHumanReadable: document.getElementById('preview-human-readable'),
        previewDays: document.getElementById('preview-days'),
        previewHours: document.getElementById('preview-hours'),
        previewMinutes: document.getElementById('preview-minutes'),
        previewSeconds: document.getElementById('preview-seconds'),
        previewBackground: document.getElementById('preview-background'),
        
        // URL elements
        urlSection: document.getElementById('url-section'),
        urlDisplay: document.getElementById('url-display'),
        copyBtn: document.getElementById('copy-btn'),
        copySuccess: document.getElementById('copy-success'),
        openCountdownBtn: document.getElementById('open-countdown-btn'),
        
        // Display elements
        displayLabel: document.getElementById('display-countdown-label'),
        displayHumanReadable: document.getElementById('display-human-readable'),
        displayDays: document.getElementById('display-days'),
        displayHours: document.getElementById('display-hours'),
        displayMinutes: document.getElementById('display-minutes'),
        displaySeconds: document.getElementById('display-seconds'),
        displayBackground: document.getElementById('display-background'),
        expiredMessage: document.getElementById('expired-message'),
        editBtn: document.getElementById('edit-btn'),
        shareBtn: document.getElementById('share-btn')
    };
    
    // Initialize theme
    initTheme();
    
    // Set up event listeners for theme changes
    window.addEventListener('message', (event) => {
        if (event.data.type === 'theme') {
            const isDark = event.data.theme === 'dark';
            if (isDark) {
                document.documentElement.classList.add('dark-mode');
                document.body.classList.add('dark-mode');
            } else {
                document.documentElement.classList.remove('dark-mode');
                document.body.classList.remove('dark-mode');
            }
        }
    });
    
    // Setup event listeners
    setupEventListeners();
    
    // Check for URL parameters to determine mode
    const params = parseUrlParams();
    
    // If URL has valid parameters, switch to display mode
    if (params.date && params.time) {
        try {
            window.targetDate = new Date(`${params.date}T${params.time}`);
            
            // If date is valid, switch to display mode
            if (!isNaN(window.targetDate.getTime())) {
                elements.displayLabel.textContent = params.label || '';
                
                // Set background options
                const emoji = params.emoji || '';
                const bgColor = params.bgColor || '#e6f7ff';
                const density = params.density || 'medium';
                
                // Always create background even if emoji is empty
                createEmojiBackground(emoji, bgColor, density, elements.displayBackground);
                console.log("Display background with:", {emoji, bgColor, density});
                
                switchToDisplayMode();
                
                // Start the countdown
                updateCountdown();
                setInterval(updateCountdown, 1000);
                
                return;
            }
        } catch (e) {
            console.error('Error parsing date:', e);
        }
    }
    
    // Otherwise, show management mode with default values
    setDefaultDateTime();
    
    // Initialize the preview background
    updateBackgrounds();
    
    // Start the countdown for preview
    updateCountdown();
    setInterval(updateCountdown, 1000);
});

// Set default date and time (tomorrow)
function setDefaultDateTime() {
    const tomorrow = getTomorrowDate();
    
    elements.dateInput.value = formatDateForInput(tomorrow);
    elements.timeInput.value = formatTimeForInput(tomorrow);
    
    updateTargetDate();
}

// Update the target date from user inputs
function updateTargetDate() {
    const date = elements.dateInput.value;
    const time = elements.timeInput.value;
    
    if (date && time) {
        try {
            window.targetDate = new Date(`${date}T${time}`);
            if (!isNaN(window.targetDate.getTime())) {
                updatePreviewStatus();
                return true;
            }
        } catch (e) {
            console.error('Error setting target date:', e);
        }
    }
    
    elements.previewStatus.textContent = 'Invalid date/time';
    return false;
}

// Set up all event listeners
function setupEventListeners() {
    // Form events
    elements.emojiSelect.addEventListener('change', function() {
        elements.customEmojiGroup.style.display = this.value === 'custom' ? 'grid' : 'none';
        updateBackgrounds();
    });
    
    elements.labelInput.addEventListener('input', function() {
        elements.previewLabel.textContent = this.value;
    });
    
    elements.dateInput.addEventListener('change', updateTargetDate);
    elements.timeInput.addEventListener('change', updateTargetDate);
    
    elements.customEmojiInput.addEventListener('input', updateBackgrounds);
    elements.bgColorInput.addEventListener('input', updateBackgrounds);
    elements.densitySelect.addEventListener('change', updateBackgrounds);
    
    // Button events
    elements.generateBtn.addEventListener('click', generateCountdownUrl);
    elements.copyBtn.addEventListener('click', copyUrlToClipboard);
    
    // Open countdown button event
    if (elements.openCountdownBtn) {
        elements.openCountdownBtn.addEventListener('click', function() {
            const url = elements.urlDisplay.textContent;
            window.open(url, '_blank');
        });
    }
    
    // Share button event in display mode
    if (elements.shareBtn) {
        elements.shareBtn.addEventListener('click', async function() {
            const currentUrl = window.location.href;
            const label = elements.displayLabel.textContent || 'Countdown';
            
            // Use Web Share API if available
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: label,
                        text: `Check out this countdown: ${label}`,
                        url: currentUrl
                    });
                } catch (err) {
                    console.error('Error sharing:', err);
                    copyUrlToClipboard();
                    alert('URL copied to clipboard');
                }
            } else {
                // Fallback to copying to clipboard
                navigator.clipboard.writeText(currentUrl)
                    .then(() => {
                        alert('Countdown URL copied to clipboard');
                    })
                    .catch(err => {
                        console.error('Failed to copy URL:', err);
                        alert('Failed to copy URL. Please copy it manually.');
                    });
            }
        });
    }
    
    // Edit button event
    elements.editBtn.addEventListener('click', function() {
        // Load URL parameters into form
        const params = parseUrlParams();
        
        if (params.date) elements.dateInput.value = params.date;
        if (params.time) elements.timeInput.value = params.time;
        if (params.label) elements.labelInput.value = params.label;
        
        if (params.emoji) {
            const matchingOption = Array.from(elements.emojiSelect.options).find(option => option.value === params.emoji);
            if (matchingOption) {
                elements.emojiSelect.value = params.emoji;
                elements.customEmojiGroup.style.display = 'none';
            } else {
                elements.emojiSelect.value = 'custom';
                elements.customEmojiGroup.style.display = 'grid';
                elements.customEmojiInput.value = params.emoji;
            }
        }
        
        if (params.bgColor) elements.bgColorInput.value = params.bgColor;
        if (params.density) elements.densitySelect.value = params.density;
        
        updateTargetDate();
        updateBackgrounds();
        
        switchToManagementMode();
    });
}
