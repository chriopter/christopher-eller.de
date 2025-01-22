import os
import re
from datetime import datetime

def extract_url(content):
    # Extract URL from HTML anchor tag
    match = re.search(r'<a href="([^"]+)">', content)
    if match:
        return match.group(1)
    return None

def process_file(input_path, output_path):
    with open(input_path, 'r') as f:
        content = f.read()
    
    # Split into frontmatter and body
    parts = content.split('---\n')
    if len(parts) < 3:
        print(f"Skipping {input_path}: Invalid format")
        return
    
    frontmatter = parts[1]
    body = parts[2]
    
    # Extract URL
    url = extract_url(body)
    if not url:
        print(f"Skipping {input_path}: No URL found")
        return
    
    # Create new content
    new_content = f"---\n{frontmatter}---\n{url}"
    
    # Write to new file
    with open(output_path, 'w') as f:
        f.write(new_content)
    print(f"Processed: {os.path.basename(input_path)} -> {os.path.basename(output_path)}")

def main():
    import_dir = 'import'
    output_dir = 'content/links'
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    # Process each markdown file
    for filename in os.listdir(import_dir):
        if filename.endswith('.markdown'):
            input_path = os.path.join(import_dir, filename)
            # Convert .markdown extension to .md
            output_filename = filename[:-9] + '.md'
            output_path = os.path.join(output_dir, output_filename)
            process_file(input_path, output_path)

if __name__ == '__main__':
    main()
