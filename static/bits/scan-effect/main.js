/**
 * Scan Effect Tool - Main Module
 * Contains the main application logic for the scan effect tool
 */

// Set PDF.js worker path
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

// DOM Elements
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const controls = document.getElementById('controls');
const previewContainer = document.getElementById('preview-container');
const previewCanvas = document.getElementById('preview-canvas');
const beforeButton = document.getElementById('before-button');
const afterButton = document.getElementById('after-button');
const prevPageButton = document.getElementById('prev-page');
const nextPageButton = document.getElementById('next-page');
const pageIndicator = document.getElementById('page-indicator');
const applyButton = document.getElementById('apply-button');
const downloadSection = document.getElementById('download-section');
const downloadButton = document.getElementById('download-button');
const startOverButton = document.getElementById('start-over-button');
const statusElement = document.getElementById('status');
const settingsHeader = document.getElementById('settings-header');
const toggleSettingsButton = document.getElementById('toggle-settings');
const toggleIcon = document.getElementById('toggle-icon');
const settingsContent = document.getElementById('settings-content');

// Sliders
const effectIntensitySlider = document.getElementById('effect-intensity');
const effectIntensityValue = document.getElementById('effect-intensity-value');
const noiseAmountSlider = document.getElementById('noise-amount');
const noiseAmountValue = document.getElementById('noise-amount-value');
const blurAmountSlider = document.getElementById('blur-amount');
const blurAmountValue = document.getElementById('blur-amount-value');
const edgeDarknessSlider = document.getElementById('edge-darkness');
const edgeDarknessValue = document.getElementById('edge-darkness-value');

// State variables
let originalFile = null;
let fileType = null;
let pdfDocument = null;
let currentPage = 1;
let totalPages = 1;
let originalCanvases = [];
let processedCanvases = [];
let showingOriginal = true;
let isProcessing = false;
let settingsCollapsed = false;

// Theme handling
function initTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('darkMode');
    const shouldBeDark = storedTheme === 'true' || (storedTheme === null && prefersDark);
    
    if (shouldBeDark) {
        document.documentElement.classList.add('dark-mode');
        document.body.classList.add('dark-mode');
    }
}

// Initialize theme
initTheme();

// Listen for theme changes from parent
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

// Toggle settings section
function toggleSettings() {
    settingsCollapsed = !settingsCollapsed;
    
    if (settingsCollapsed) {
        settingsContent.classList.add('collapsed');
        toggleIcon.classList.add('collapsed');
        toggleSettingsButton.setAttribute('aria-expanded', 'false');
    } else {
        settingsContent.classList.remove('collapsed');
        toggleIcon.classList.remove('collapsed');
        toggleSettingsButton.setAttribute('aria-expanded', 'true');
    }
}

// Add event listeners for settings toggle
if (settingsHeader && toggleSettingsButton) {
    settingsHeader.addEventListener('click', toggleSettings);
    toggleSettingsButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent double triggering when clicking the button
        toggleSettings();
    });
}

// Initialize slider value displays
effectIntensityValue.textContent = `${effectIntensitySlider.value}%`;
noiseAmountValue.textContent = `${noiseAmountSlider.value}%`;
blurAmountValue.textContent = `${blurAmountSlider.value}%`;
edgeDarknessValue.textContent = `${edgeDarknessSlider.value}%`;

// Update slider value displays on input
effectIntensitySlider.addEventListener('input', () => {
    effectIntensityValue.textContent = `${effectIntensitySlider.value}%`;
});

noiseAmountSlider.addEventListener('input', () => {
    noiseAmountValue.textContent = `${noiseAmountSlider.value}%`;
});

blurAmountSlider.addEventListener('input', () => {
    blurAmountValue.textContent = `${blurAmountSlider.value}%`;
});

edgeDarknessSlider.addEventListener('input', () => {
    edgeDarknessValue.textContent = `${edgeDarknessSlider.value}%`;
});

// File upload handling
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    if (e.dataTransfer.files.length) {
        handleFileUpload(e.dataTransfer.files[0]);
    }
});

// Make the upload area clickable (except for the button and file input)
uploadArea.addEventListener('click', (e) => {
    // Only trigger if the click is directly on the upload area or its non-button/non-input children
    if (!e.target.closest('.file-input-wrapper')) {
        fileInput.click();
    }
});

// Handle the file selection - this works in all browsers including Safari
fileInput.addEventListener('change', () => {
    if (fileInput.files.length) {
        handleFileUpload(fileInput.files[0]);
    }
});

// Handle file upload
function handleFileUpload(file) {
    // Reset state
    originalCanvases = [];
    processedCanvases = [];
    currentPage = 1;
    
    // Check file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
        showStatus('Please upload a PDF, JPG, or PNG file.', 'error');
        return;
    }
    
    originalFile = file;
    fileType = file.type;
    
    // Show loading status
    showStatus('Loading file...', 'info');
    
    // Hide upload area and show Start Over button
    uploadArea.style.display = 'none';
    startOverButton.style.display = 'block';
    
    // Process based on file type
    if (fileType === 'application/pdf') {
        loadPDF(file);
    } else {
        loadImage(file);
    }
}

// Load PDF file
function loadPDF(file) {
    const fileReader = new FileReader();
    
    fileReader.onload = function() {
        const typedArray = new Uint8Array(this.result);
        
        pdfjsLib.getDocument(typedArray).promise.then(pdf => {
            pdfDocument = pdf;
            totalPages = pdf.numPages;
            
            // Update UI for PDF
            pageIndicator.textContent = `Page 1 of ${totalPages}`;
            prevPageButton.disabled = true;
            nextPageButton.disabled = totalPages <= 1;
            
            // Preload all pages
            showStatus('Loading PDF pages...', 'info');
            
            // Create an array of promises for loading all pages
            const pagePromises = [];
            for (let i = 1; i <= totalPages; i++) {
                pagePromises.push(loadPDFPage(i));
            }
            
            // Wait for all pages to load
            Promise.all(pagePromises).then(() => {
                // Show controls after all pages are loaded
                controls.style.display = 'block';
                previewContainer.style.display = 'flex'; // Use flex to maintain layout
                showStatus('', ''); // Clear status
            }).catch(error => {
                showStatus('Error loading PDF pages: ' + error.message, 'error');
            });
        }).catch(error => {
            showStatus('Error loading PDF: ' + error.message, 'error');
        });
    };
    
    fileReader.readAsArrayBuffer(file);
}

// Load a specific PDF page
async function loadPDFPage(pageNumber) {
    try {
        const page = await pdfDocument.getPage(pageNumber);
        // Increase scale to get higher quality rendering for vector content
        const viewport = page.getViewport({ scale: 2.0 });
        
        // Create canvas for original page
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // Render PDF page to canvas
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;
        
        // Store original canvas
        if (!originalCanvases[pageNumber - 1]) {
            originalCanvases[pageNumber - 1] = canvas;
        }
        
        // Update preview
        updatePreview();
        
        return canvas;
    } catch (error) {
        console.error('Error loading PDF page:', error);
        throw error;
    }
}

// Load image file
function loadImage(file) {
    const fileReader = new FileReader();
    
    fileReader.onload = function() {
        const img = new Image();
        
        img.onload = function() {
            // Create canvas for original image
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Draw image on canvas
            context.drawImage(img, 0, 0);
            
            // Store original canvas
            originalCanvases[0] = canvas;
            totalPages = 1;
            
            // Update UI for single image
            pageIndicator.textContent = 'Page 1 of 1';
            prevPageButton.disabled = true;
            nextPageButton.disabled = true;
            
            // Update preview
            updatePreview();
            
            // Show controls and preview
            controls.style.display = 'block';
            previewContainer.style.display = 'flex'; // Use flex to maintain layout
            showStatus('', ''); // Clear status
        };
        
        img.onerror = function() {
            showStatus('Error loading image.', 'error');
        };
        
        img.src = this.result;
    };
    
    fileReader.readAsDataURL(file);
}

// Update preview canvas
function updatePreview() {
    if (currentPage < 1 || currentPage > originalCanvases.length || !originalCanvases[currentPage - 1]) {
        return;
    }
    
    const sourceCanvas = showingOriginal ? 
        originalCanvases[currentPage - 1] : 
        (processedCanvases[currentPage - 1] || originalCanvases[currentPage - 1]);
    
    // Resize preview canvas to match source
    previewCanvas.width = sourceCanvas.width;
    previewCanvas.height = sourceCanvas.height;
    
    // Draw source canvas on preview
    const context = previewCanvas.getContext('2d');
    
    // If it's a processed canvas (which is high-res), scale it down for display
    if (!showingOriginal && processedCanvases[currentPage - 1]) {
        // Scale down for preview while maintaining aspect ratio
        const maxWidth = window.innerWidth * 0.8; // 80% of window width
        const maxHeight = window.innerHeight * 0.6; // 60% of window height
        
        let displayWidth = sourceCanvas.width;
        let displayHeight = sourceCanvas.height;
        
        // Scale down if needed
        if (displayWidth > maxWidth) {
            const scale = maxWidth / displayWidth;
            displayWidth = maxWidth;
            displayHeight = displayHeight * scale;
        }
        
        if (displayHeight > maxHeight) {
            const scale = maxHeight / displayHeight;
            displayHeight = maxHeight;
            displayWidth = displayWidth * scale;
        }
        
        // Update preview canvas size
        previewCanvas.width = displayWidth;
        previewCanvas.height = displayHeight;
        
        // Draw scaled image
        context.drawImage(sourceCanvas, 0, 0, displayWidth, displayHeight);
    } else {
        // Original canvas can be displayed as is
        context.drawImage(sourceCanvas, 0, 0);
    }
}

// Loading bar elements
const loadingContainer = document.getElementById('loading-container');
const loadingBar = document.getElementById('loading-bar');
const loadingPercentage = document.getElementById('loading-percentage');

// Show loading bar with initial progress
function showLoadingBar(initialProgress = 0) {
    loadingBar.style.width = `${initialProgress}%`;
    loadingPercentage.textContent = `${initialProgress}%`;
    loadingContainer.style.display = 'block';
}

// Update loading bar progress
function updateLoadingProgress(progress) {
    loadingBar.style.width = `${progress}%`;
    loadingPercentage.textContent = `${progress}%`;
}

// Hide loading bar
function hideLoadingBar() {
    loadingContainer.style.display = 'none';
}

// Apply scan effects to all pages
async function applyEffects() {
    if (isProcessing || !originalCanvases.length) return;
    
    isProcessing = true;
    showStatus('Applying scan effects...', 'info');
    showLoadingBar(0);
    
    // Clear previous processed canvases
    processedCanvases = [];
    
    // Get effect settings
    const settings = {
        intensity: parseInt(effectIntensitySlider.value) / 100,
        noise: parseInt(noiseAmountSlider.value) / 100,
        blur: parseInt(blurAmountSlider.value) / 100,
        edgeDarkness: parseInt(edgeDarknessSlider.value) / 100,
        effects: {}
    };
    
    // Process each page
    const totalPages = originalCanvases.length;
    for (let i = 0; i < totalPages; i++) {
        // Create a slight variation for each page
        const pageVariation = {
            rotation: (Math.random() * 2 - 1) * settings.intensity * 2, // -2 to 2 degrees
            offsetX: (Math.random() * 10 - 5) * settings.intensity,
            offsetY: (Math.random() * 10 - 5) * settings.intensity,
            noiseVariation: 0.8 + Math.random() * 0.4, // 0.8 to 1.2
            blurVariation: 0.8 + Math.random() * 0.4,
            contrastVariation: 0.9 + Math.random() * 0.2 // 0.9 to 1.1
        };
        
        // Process the page with variations
        try {
            // Calculate progress percentage
            const progress = Math.round((i / totalPages) * 100);
            updateLoadingProgress(progress);
            
            // Process the canvas
            const processedCanvas = await processCanvas(originalCanvases[i], settings, pageVariation);
            processedCanvases[i] = processedCanvas;
            
            // Update progress status
            showStatus(`Processing page ${i + 1} of ${totalPages}...`, 'info');
            
            // Add a small delay to allow UI to update
            await new Promise(resolve => setTimeout(resolve, 10));
        } catch (error) {
            console.error('Error processing page:', error);
            showStatus(`Error processing page ${i + 1}: ${error.message}`, 'error');
        }
    }
    
    // Update to 100% when done
    updateLoadingProgress(100);
    
    // Show processed result
    showingOriginal = false;
    beforeButton.classList.remove('active');
    afterButton.classList.add('active');
    updatePreview();
    
    // Show download section
    downloadSection.style.display = 'block';
    
    // Hide loading bar and show success message
    setTimeout(() => {
        hideLoadingBar();
        showStatus('Scan effects applied successfully!', 'success');
        isProcessing = false;
    }, 500); // Short delay to show 100% completion
}

// Reset the application to initial state
function resetApplication() {
    // Reset state variables
    originalFile = null;
    fileType = null;
    pdfDocument = null;
    currentPage = 1;
    totalPages = 1;
    originalCanvases = [];
    processedCanvases = [];
    showingOriginal = true;
    isProcessing = false;
    
    // Reset UI
    uploadArea.style.display = 'block';
    controls.style.display = 'none';
    previewContainer.style.display = 'none';
    downloadSection.style.display = 'none';
    startOverButton.style.display = 'none';
    
    // Clear file input
    fileInput.value = '';
    
    // Clear status
    showStatus('', '');
    
    // Hide loading bar
    hideLoadingBar();
}

// Show status message
function showStatus(message, type) {
    if (!message) {
        statusElement.style.display = 'none';
        return;
    }
    
    statusElement.textContent = message;
    statusElement.className = 'status';
    
    if (type) {
        statusElement.classList.add(type);
    }
    
    statusElement.style.display = 'block';
}

// Page navigation
prevPageButton.addEventListener('click', async () => {
    if (currentPage > 1) {
        currentPage--;
        updatePageControls();
        
        // Ensure the page is loaded if it's a PDF
        if (fileType === 'application/pdf' && !originalCanvases[currentPage - 1]) {
            await loadPDFPage(currentPage);
        }
        
        updatePreview();
    }
});

nextPageButton.addEventListener('click', async () => {
    if (currentPage < totalPages) {
        currentPage++;
        updatePageControls();
        
        // Ensure the page is loaded if it's a PDF
        if (fileType === 'application/pdf' && !originalCanvases[currentPage - 1]) {
            await loadPDFPage(currentPage);
        }
        
        updatePreview();
    }
});

function updatePageControls() {
    pageIndicator.textContent = `Page ${currentPage} of ${totalPages}`;
    prevPageButton.disabled = currentPage <= 1;
    nextPageButton.disabled = currentPage >= totalPages;
}

// Before/After toggle
beforeButton.addEventListener('click', () => {
    showingOriginal = true;
    beforeButton.classList.add('active');
    afterButton.classList.remove('active');
    updatePreview();
    console.log('Showing original');
});

afterButton.addEventListener('click', () => {
    if (processedCanvases.length > 0) {
        showingOriginal = false;
        beforeButton.classList.remove('active');
        afterButton.classList.add('active');
        updatePreview();
        console.log('Showing processed');
    } else {
        console.log('No processed canvases available');
    }
});

// Apply effects button
applyButton.addEventListener('click', () => {
    console.log('Apply Effects button clicked');
    applyEffects();
});

// Start over button
startOverButton.addEventListener('click', () => {
    console.log('Start Over button clicked');
    resetApplication();
});

// Download functionality
downloadButton.addEventListener('click', async () => {
    if (processedCanvases.length === 0) return;
    
    showStatus('Preparing download...', 'info');
    showLoadingBar(0);
    
    try {
        let downloadUrl;
        let filename;
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
        
        if (fileType === 'application/pdf' && processedCanvases.length > 1) {
            // Create PDF with multiple pages
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                compress: true
            });
            
            for (let i = 0; i < processedCanvases.length; i++) {
                const canvas = processedCanvases[i];
                
                // Calculate PDF page size to match canvas aspect ratio
                // The canvas is already at 300 DPI from the processCanvas function
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                
                // Create the image data directly from the high-resolution canvas
                const imgData = canvas.toDataURL('image/jpeg', 0.95);
                
                // Add new page for all pages except the first
                if (i > 0) {
                    pdf.addPage([pdfWidth, pdfHeight]);
                }
                
                // Add the high-resolution image to the PDF
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            }
            
            // Add metadata
            pdf.setProperties({
                title: `Scanned Document ${timestamp}`,
                creator: 'Scan Effect Tool',
                subject: 'Scanned Document',
                keywords: 'scan, document',
                modDate: new Date()
            });
            
            // Update progress
            updateLoadingProgress(70);
            
            downloadUrl = URL.createObjectURL(pdf.output('blob'));
            filename = `scan_${timestamp}.pdf`;
            
            // Update progress
            updateLoadingProgress(90);
        } else if (fileType === 'application/pdf' && processedCanvases.length === 1) {
            // Single page PDF
            const { jsPDF } = window.jspdf;
            const canvas = processedCanvases[0];
            
            // Calculate PDF page size to match canvas aspect ratio
            const pdfWidth = 595; // A4 width in points
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'pt',
                format: [pdfWidth, pdfHeight],
                compress: true
            });
            
            // Create the image data directly from the high-resolution canvas
            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            
            // Add the high-resolution image to the PDF
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            
            // Add metadata
            pdf.setProperties({
                title: `Scanned Document ${timestamp}`,
                creator: 'Scan Effect Tool',
                subject: 'Scanned Document',
                keywords: 'scan, document',
                modDate: new Date()
            });
            
            // Update progress
            updateLoadingProgress(70);
            
            downloadUrl = URL.createObjectURL(pdf.output('blob'));
            filename = `scan_${timestamp}.pdf`;
            
            // Update progress
            updateLoadingProgress(90);
        } else {
            // Image file - the canvas is already at 300 DPI from the processCanvas function
            const canvas = processedCanvases[0];
            
            // Create the image data URL directly from the high-resolution canvas
            const imgData = canvas.toDataURL(
                fileType === 'image/png' ? 'image/png' : 'image/jpeg', 
                fileType === 'image/png' ? 1.0 : 0.95
            );
            
            // Update progress
            updateLoadingProgress(80);
            
            downloadUrl = imgData;
            filename = `scan_${timestamp}.${fileType === 'image/png' ? 'png' : 'jpg'}`;
            
            // Update progress
            updateLoadingProgress(90);
        }
        
        // Create download link
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Update to 100% when done
        updateLoadingProgress(100);
        
        // Hide loading bar and show success message
        setTimeout(() => {
            hideLoadingBar();
            showStatus('Download complete!', 'success');
        }, 500); // Short delay to show 100% completion
        
        // Clean up URL object if needed
        if (downloadUrl.startsWith('blob:')) {
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
        }
    } catch (error) {
        console.error('Download error:', error);
        hideLoadingBar();
        showStatus('Error preparing download: ' + error.message, 'error');
    }
});
