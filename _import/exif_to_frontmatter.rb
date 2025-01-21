#!/usr/bin/env ruby
require 'yaml'
require 'json'

# This script is meant to be run as part of the pre-commit hook
# It extracts EXIF data using exiftool (already required by the project)
# and embeds it in the front matter of photo posts

def extract_exif(image_path)
  # Use exiftool to get EXIF data as JSON
  # Excluding GPS data since it's removed by the existing hook
  exif_json = `exiftool -json -n \
    -Make \
    -Model \
    -LensModel \
    -LensMake \
    -FocalLength \
    -FocalLengthIn35mmFormat \
    -ExposureTime \
    -FNumber \
    -ISO \
    -DateTimeOriginal \
    -CameraSerialNumber \
    -LensSerialNumber \
    -Software \
    -ImageSize \
    -Megapixels \
    -ShutterSpeed \
    -Aperture \
    -ExposureProgram \
    -ExposureCompensation \
    -MeteringMode \
    -LightValue \
    -Flash \
    -FlashType \
    -WhiteBalance \
    -ColorSpace \
    "#{image_path}"`
  
  begin
    data = JSON.parse(exif_json).first
    
    # Combine Make and Model for camera name
    camera = if data['Make'] && data['Model']
      # Remove redundant make from model if present
      model = data['Model'].sub(/^#{data['Make']}\s+/i, '')
      "#{data['Make']} #{model}"
    else
      data['Model']
    end

    # Format focal length with 35mm equivalent if available
    focal_length = if data['FocalLength']
      fl = data['FocalLength'].round
      if data['FocalLengthIn35mmFormat']
        "#{fl}mm (#{data['FocalLengthIn35mmFormat'].round}mm)"
      else
        "#{fl}mm"
      end
    end

    # Format exposure time as fraction
    exposure = if data['ExposureTime']
      fraction = (1.0 / data['ExposureTime']).round
      "1/#{fraction}"
    end

    # Clean up lens model
    lens = if data['LensModel']
      data['LensModel'].sub(/\s+\d+.*$/, '')  # Remove focal length/aperture info from lens name
    end

    return {
      'manufacturer' => data['Make'],
      'camera' => camera,
      'lens_make' => data['LensMake'],
      'lens' => lens,
      'focal_length' => focal_length,
      'exposure' => exposure,
      'f_number' => data['FNumber'],
      'iso' => data['ISO'],
      'date_taken' => data['DateTimeOriginal'],
      'camera_serial' => data['CameraSerialNumber'],
      'lens_serial' => data['LensSerialNumber'],
      'software' => data['Software'],
      'image_size' => data['ImageSize'],
      'megapixels' => data['Megapixels'],
      'shutter_speed' => data['ShutterSpeed'],
      'aperture' => data['Aperture'],
      'exposure_program' => data['ExposureProgram'],
      'exposure_compensation' => data['ExposureCompensation'],
      'metering_mode' => data['MeteringMode'],
      'light_value' => data['LightValue'],
      'flash' => data['Flash'],
      'flash_type' => data['FlashType'],
      'white_balance' => data['WhiteBalance'],
      'color_space' => data['ColorSpace']
    }.compact
  rescue
    puts "Warning: Could not extract EXIF data from #{image_path}"
    return {}
  end
end

def process_photo_post(post_path, image_path)
  return unless File.exist?(post_path) && File.exist?(image_path)
  
  content = File.read(post_path)
  
  # Parse existing front matter
  if content =~ /\A(---\s*\n.*?\n?)^(---\s*$\n?)/m
    front_matter = YAML.load($1)
    content_body = content[$1.length + $2.length..-1]
    
    # Extract EXIF data
    exif_data = extract_exif(image_path)
    
    # Always replace existing EXIF data with new data
    front_matter.delete('exif')  # Remove existing EXIF data
    front_matter['exif'] = exif_data unless exif_data.empty?  # Add new EXIF data if any was extracted
    
    # Write updated content back
    File.write(post_path, [
      "---",
      front_matter.to_yaml.sub(/\A---\n/, ''),
      "---",
      content_body
    ].join)
  end
end

# Process all photo posts
Dir.glob('_posts/photos/*.markdown') do |post_path|
  # Extract image filename from post filename
  post_name = File.basename(post_path, '.markdown')
  date = post_name[0..9] # YYYY-MM-DD
  slug = post_name[11..-1] # rest of filename after date-
  
  # Look for corresponding image
  image_path = nil
  ['jpeg', 'jpg', 'heic'].each do |ext|
    path = "assets/images/photos/#{post_name}.#{ext}"
    if File.exist?(path)
      image_path = path
      break
    end
  end
  
  process_photo_post(post_path, image_path) if image_path
end
