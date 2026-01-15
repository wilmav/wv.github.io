from PIL import Image

def remove_checkerboard(image_path, output_path):
    img = Image.open(image_path).convert("RGBA")
    datas = img.getdata()

    new_data = []
    for item in datas:
        r, g, b, a = item
        
        # Calculate variance to detect greyscale
        mean = (r + g + b) / 3
        variance = ((r - mean)**2 + (g - mean)**2 + (b - mean)**2) / 3
        
        # Threshold for "neutral color" (greyscale)
        if variance < 50:
             # It's likely white, grey, or black. Make it transparent.
             new_data.append((r, g, b, 0))
        else:
             # It's colorful (orange). Keep it.
             new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Saved to {output_path}")

remove_checkerboard(
    "/Users/Wilma/.gemini/antigravity/brain/02689d75-8600-49ed-add5-939a998c3b2e/uploaded_image_1768489343322.png",
    "/Users/Wilma/.gemini/antigravity/brain/02689d75-8600-49ed-add5-939a998c3b2e/logo_manual_fix.png"
)
