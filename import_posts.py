import os
import re
from datetime import datetime

def convert_html_to_markdown(content):
    # Convert HTML links to markdown
    content = re.sub(r'<a href="([^"]+)">([^<]+)</a>', r'[\2](\1)', content)
    
    # Remove <p> tags
    content = content.replace('<p>', '')
    
    # Replace </p> with newline
    content = content.replace('</p>', '\n')
    
    # Clean up any extra newlines
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    return content.strip()

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
    
    # Convert HTML to markdown
    body = convert_html_to_markdown(body)
    
    # Create new content
    new_content = f"---\n{frontmatter}---\n{body}"
    
    # Create output directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Write to new file
    with open(output_path, 'w') as f:
        f.write(new_content)
    print(f"Processed: {os.path.basename(input_path)} -> {os.path.basename(output_path)}")

def main():
    import_dir = 'import'
    output_dir = 'content/posts'
    
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
