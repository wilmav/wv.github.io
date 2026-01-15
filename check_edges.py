from PIL import Image

def check_edges(image_path):
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    
    # Check top row
    top_cropped = False
    for x in range(width):
        if img.getpixel((x, 0))[3] != 0:
            top_cropped = True
            break
            
    # Check bottom row
    bottom_cropped = False
    for x in range(width):
        if img.getpixel((x, height-1))[3] != 0:
            bottom_cropped = True
            break
            
    print(f"File: {image_path}")
    print(f"Size: {width}x{height}")
    print(f"Top row has content: {top_cropped}")
    print(f"Bottom row has content: {bottom_cropped}")

check_edges("/Users/Wilma/Documents/Kuitulaskuri_projekti/logo.png")
