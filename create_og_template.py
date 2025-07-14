#!/usr/bin/env python3
from PIL import Image, ImageDraw

# Create a new image with white background
img = Image.new('RGB', (1200, 630), color='white')
draw = ImageDraw.Draw(img)

# Add a subtle border
border_color = (229, 229, 229)  # #e5e5e5
draw.rectangle([0, 0, 1199, 629], outline=border_color, width=2)

# Save the image
img.save('/Users/christophereller/git/christopher-eller.de/assets/images/og-template.png')
print("Created og-template.png")