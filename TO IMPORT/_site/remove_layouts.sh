#!/bin/bash

# Find all markdown files in _posts directory and subdirectories
find _posts -type f -name "*.markdown" | while read file; do
    # Remove the layout line from frontmatter using sed
    # The pattern matches "layout: X" where X can be any word, with optional quotes and spaces
    sed -i.bak '/^layout:.*$/d' "$file"
    rm "${file}.bak"
    echo "Removed layout from $file"
done

echo "Done! All layout declarations have been removed from posts."
