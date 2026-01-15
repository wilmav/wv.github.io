from PIL import Image

def create_favicon(image_path, output_path, size=(300, 300), padding=20):
    # Open the image
    img = Image.open(image_path).convert("RGBA")
    
    # Crop to the bounding box of non-zero alpha pixels
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        print(f"Cropped to content: {bbox}")
    else:
        print("Warning: No content found in image!")
        return

    # Calculate safe area size
    safe_width = size[0] - (2 * padding)
    safe_height = size[1] - (2 * padding)

    # Calculate new size maintaining aspect ratio
    img_ratio = img.width / img.height
    target_ratio = safe_width / safe_height
    
    if img_ratio > target_ratio:
        # Width is the limiting factor
        new_width = safe_width
        new_height = int(safe_width / img_ratio)
    else:
        # Height is the limiting factor
        new_height = safe_height
        new_width = int(safe_height * img_ratio)
        
    img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
    
    # Create new transparent canvas
    new_img = Image.new("RGBA", size, (0, 0, 0, 0))
    
    # Center the resized logo
    x = (size[0] - new_width) // 2
    y = (size[1] - new_height) // 2
    
    new_img.paste(img, (x, y))
    
    new_img.save(output_path, "PNG")
    print(f"Saved padded favicon to {output_path} (Content: {new_width}x{new_height}, Padding: {padding}px)")

create_favicon(
    "/Users/Wilma/Documents/Kuitulaskuri_projekti/logo.png",
    "/Users/Wilma/Documents/Kuitulaskuri_projekti/logo2.png"
)
