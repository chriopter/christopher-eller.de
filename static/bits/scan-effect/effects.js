/**
 * Scan Effect Tool - Effects Module
 * Contains all the visual effects for the scan effect tool
 */

// Apply edge darkening effect
function applyEdgeDarkening(ctx, width, height, intensity) {
    const gradient = ctx.createRadialGradient(
        width / 2, height / 2, Math.min(width, height) * 0.3,
        width / 2, height / 2, Math.max(width, height) * 0.7
    );
    
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity * 0.5})`);
    
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
}

// Apply noise effect
function applyNoise(ctx, width, height, intensity) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Pre-generate noise pattern to ensure color neutrality
    const noisePattern = new Array(Math.ceil(data.length / 4));
    for (let i = 0; i < noisePattern.length; i++) {
        // Generate a neutral grayscale noise value
        noisePattern[i] = (Math.random() * 2 - 1) * 30 * intensity;
    }
    
    for (let i = 0; i < data.length; i += 4) {
        // Skip fully transparent pixels
        if (data[i + 3] === 0) continue;
        
        // Get the pre-generated noise value
        const noiseValue = noisePattern[Math.floor(i / 4)];
        
        // Apply the SAME noise value to all RGB channels to maintain color balance
        data[i] = Math.max(0, Math.min(255, data[i] + noiseValue));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noiseValue));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noiseValue));
    }
    
    ctx.putImageData(imageData, 0, 0);
}

// Apply blur effect
function applyBlur(ctx, canvas, intensity) {
    // Simple box blur implementation
    // For single-digit percentages (intensity < 0.1), reduce the effect
    let iterations, radius;
    
    if (intensity < 0.1) {
        // More gradual effect for single-digit percentages
        iterations = intensity < 0.05 ? 1 : 2;
        radius = Math.max(0, Math.floor(intensity * 10)) / 2;
        // Ensure minimum radius of 0.5 for values above 0.05
        if (intensity >= 0.05 && radius < 0.5) radius = 0.5;
    } else {
        // Original calculation for higher percentages
        iterations = Math.max(1, Math.floor(intensity * 3));
        radius = Math.max(1, Math.floor(intensity * 5));
    }
    
    // Skip blur entirely for very low values
    if (radius <= 0) return;
    
    for (let i = 0; i < iterations; i++) {
        boxBlur(ctx, canvas, radius);
    }
}

// Box blur helper function
function boxBlur(ctx, canvas, radius) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    const tempData = new Uint8ClampedArray(data);
    
    // Horizontal pass
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0, g = 0, b = 0;
            let count = 0;
            
            for (let i = -radius; i <= radius; i++) {
                const px = Math.min(width - 1, Math.max(0, x + i));
                const index = (y * width + px) * 4;
                
                r += tempData[index];
                g += tempData[index + 1];
                b += tempData[index + 2];
                count++;
            }
            
            const targetIndex = (y * width + x) * 4;
            data[targetIndex] = r / count;
            data[targetIndex + 1] = g / count;
            data[targetIndex + 2] = b / count;
        }
    }
    
    // Update temp data for vertical pass
    tempData.set(data);
    
    // Vertical pass
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            let r = 0, g = 0, b = 0;
            let count = 0;
            
            for (let i = -radius; i <= radius; i++) {
                const py = Math.min(height - 1, Math.max(0, y + i));
                const index = (py * width + x) * 4;
                
                r += tempData[index];
                g += tempData[index + 1];
                b += tempData[index + 2];
                count++;
            }
            
            const targetIndex = (y * width + x) * 4;
            data[targetIndex] = r / count;
            data[targetIndex + 1] = g / count;
            data[targetIndex + 2] = b / count;
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
}


// Final radical solution to completely remove any green text
function fixTextColor(ctx, canvas) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Process each pixel directly - most aggressive approach
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 0) continue; // Skip transparent pixels
        
        // Check for green-dominant pixels (typical for text with green tint issues)
        if (data[i+1] > data[i] && data[i+1] > data[i+2]) {
            
            // Calculate how dominant green is
            const greenDominance = data[i+1] - Math.max(data[i], data[i+2]);
            
            // If green is clearly dominant (likely green text issue)
            if (greenDominance > 5) {
                // Force to perfect grayscale by using ONLY red and blue channels
                // This completely eliminates green channel's influence
                const trueGray = Math.round((data[i] + data[i+2]) / 2);
                
                data[i] = trueGray;     // R
                data[i+1] = trueGray;   // G - force to match R/B average
                data[i+2] = trueGray;   // B
            }
        }
        
        // For all pixels, ensure very dark ones (text) are perfectly neutral
        const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
        if (brightness < 130) {  // Definitely text or dark elements
            // Force to perfect grayscale
            const perfectGray = Math.round((data[i] + data[i+2]) / 2); // Exclude green to avoid green text
            
            data[i] = perfectGray;     // R
            data[i+1] = perfectGray;   // G
            data[i+2] = perfectGray;   // B
        }
        // For light backgrounds
        else if (brightness > 230) {
            // Make whites truly white
            if (brightness > 245) {
                data[i] = 255;
                data[i+1] = 255;
                data[i+2] = 255;
            } 
            // Neutralize very light backgrounds
            else {
                const neutralLight = Math.round(brightness);
                data[i] = neutralLight;
                data[i+1] = neutralLight;
                data[i+2] = neutralLight;
            }
        }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Apply a second pass specifically targeting any remaining green tints
    // This is an extreme measure but necessary for persistent green text
    const imageData2 = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data2 = imageData2.data;
    
    for (let i = 0; i < data2.length; i += 4) {
        if (data2[i + 3] === 0) continue;
        
        // If green is still higher than both red and blue
        if (data2[i+1] > data2[i] && data2[i+1] > data2[i+2]) {
            const luma = (0.299 * data2[i] + 0.587 * data2[i+1] + 0.114 * data2[i+2]);
            
            // For darker areas that might be text
            if (luma < 200) {
                // Set all channels to the minimum of red and blue
                // This completely eliminates green dominance
                const safestGray = Math.min(data2[i], data2[i+2]);
                
                data2[i] = safestGray;
                data2[i+1] = safestGray;
                data2[i+2] = safestGray;
            }
        }
    }
    
    ctx.putImageData(imageData2, 0, 0);
}

// Process a single canvas with scan effects
// Make this function available globally for main.js to use
window.processCanvas = async function(sourceCanvas, settings, variation) {
    console.log('Processing canvas with settings:', settings);
    
    try {
        // Create a high-resolution canvas for processing (simulating 300 DPI print)
        const canvas = document.createElement('canvas');
        // Force standard RGB color space without alpha premultiplication
        const ctx = canvas.getContext('2d', { 
            colorSpace: 'srgb',
            alpha: false
        });
        
        // Calculate the scale factor to simulate 300 DPI
        // Assume source is at screen resolution (96 DPI)
        const dpiScale = 300 / 96;
        
        // Make canvas slightly larger to accommodate rotation
        const padding = Math.max(20, Math.ceil(Math.max(sourceCanvas.width, sourceCanvas.height) * 0.03)) * dpiScale;
        
        // Set canvas dimensions at 300 DPI
        canvas.width = Math.floor(sourceCanvas.width * dpiScale) + padding * 2;
        canvas.height = Math.floor(sourceCanvas.height * dpiScale) + padding * 2;
    
        // Fill with pure white background to ensure no color bias from the start
        ctx.fillStyle = 'rgb(255,255,255)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Apply rotation
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(variation.rotation * Math.PI / 180);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
        
        // Draw original with slight offset at high resolution
        ctx.drawImage(
            sourceCanvas, 
            0, 0, sourceCanvas.width, sourceCanvas.height,
            padding + (variation.offsetX * dpiScale), 
            padding + (variation.offsetY * dpiScale),
            sourceCanvas.width * dpiScale,
            sourceCanvas.height * dpiScale
        );
        
        ctx.restore();
        
        // Apply edge darkening
        applyEdgeDarkening(ctx, canvas.width, canvas.height, settings.edgeDarkness * variation.contrastVariation);
        
        // Apply blur - scale the blur radius to match the higher resolution
        if (settings.blur > 0) {
            // Increase blur radius proportionally to the DPI increase
            applyBlur(ctx, canvas, settings.blur * variation.blurVariation * dpiScale);
        }
        
        // Apply noise - the noise will be finer at higher resolution
        applyNoise(ctx, canvas.width, canvas.height, settings.noise * variation.noiseVariation);
        
        // Fix any green text issues
        fixTextColor(ctx, canvas);
    
        return canvas;
    } catch (error) {
        console.error('Error in processCanvas:', error);
        // Return a simple canvas with an error message if processing fails
        const errorCanvas = document.createElement('canvas');
        errorCanvas.width = sourceCanvas.width;
        errorCanvas.height = sourceCanvas.height;
        const ctx = errorCanvas.getContext('2d');
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, errorCanvas.width, errorCanvas.height);
        ctx.fillStyle = 'red';
        ctx.font = '20px Arial';
        ctx.fillText('Error processing image', 20, 50);
        return errorCanvas;
    }
}
