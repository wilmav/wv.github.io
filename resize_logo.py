from PIL import Image

def resize_and_pad(image_path, output_path, size=(300, 300)):
    # Open the image
    img = Image.open(image_path).convert("RGBA")
    
    # Calculate the resizing ratio to fit within the target size
    img.thumbnail(size, Image.Resampling.LANCZOS)
    
    # Create a new transparent image with the target size
    new_img = Image.new("RGBA", size, (0, 0, 0, 0))
    
    # Calculate centering position
    left = (size[0] - img.width) // 2
    top = (size[1] - img.height) // 2
    
    # Paste the resized image onto the center of the new image
    new_img.paste(img, (left, top))
    
    # Save the result
    new_img.save(output_path, "PNG")
    print(f"Saved {img.width}x{img.height} logo centered in {size[0]}x{size[1]} canvas to {output_path}")

resize_and_pad(
    "/Users/Wilma/Documents/Kuitulaskuri_projekti/logo.png",
    "/Users/Wilma/Documents/Kuitulaskuri_projekti/logo2.png"
)
