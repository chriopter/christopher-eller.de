#!/bin/bash

# Process all images in import directory
for img in import/*.{jpeg,heic}; do
    # Skip if no matches found
    [ -e "$img" ] || continue
    
    # Get original filename and extension
    ORIG_NAME=$(basename "$img")
    EXT="${ORIG_NAME##*.}"
    
    # Ask for desired filename and title
    echo "Processing $ORIG_NAME"
    echo -n "Enter desired filename (without extension): "
    read NAME
    echo -n "Enter post title: "
    read TITLE
    
    # Use original name if no filename provided
    if [ -z "$NAME" ]; then
        NAME="${ORIG_NAME%.*}"
    fi
    
    # Use filename as title if no title provided
    if [ -z "$TITLE" ]; then
        TITLE=$(echo "$NAME" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++)sub(/./,toupper(substr($i,1,1)),$i)}1')
    fi
    
    # Create content directory
    CONTENT_PATH="content/photos/$NAME"
    mkdir -p "$CONTENT_PATH"
    
    # Move the image
    mv "$img" "$CONTENT_PATH/$NAME.$EXT"
    
    # Create index.md with frontmatter
    cat > "$CONTENT_PATH/index.md" << EOL
+++
date = '$(date +"%Y-%m-%dT%H:%M:%S%z")'
title = "$TITLE"
+++
EOL

    echo "Created photo post for $NAME with title: $TITLE"
done

echo "Done processing images"
