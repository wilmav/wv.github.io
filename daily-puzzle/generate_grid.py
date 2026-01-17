
def generate():
    width = 13
    height = 13
    grid = [["L" for _ in range(width)] for _ in range(height)]

    # 1. Apply Checkerboard Pattern (Odd sum = Black)
    # This guarantees no orthogonal adjacency for black squares.
    for y in range(height):
        for x in range(width):
            if (x + y) % 2 == 1:
                grid[y][x] = "."

    # 2. Clear IMG Block (R4-R7, C0-3) - Must be IMG
    for y in range(4, 8):
        for x in range(4):
            grid[y][x] = "IMG"

    # 3. Clear Row 4 for SOUTUVENE (C4-12)
    # Row 4 is index 4.
    for x in range(4, 13):
        grid[4][x] = "L"

    # 4. Improve Vertical Connectivity for Row 4
    # Current state around R4:
    # R3: Checkerboard (Dots at 0, 2, 4...)
    # R4: L L L L L L L L L
    # R5: Checkerboard (Dots at 0, 2, 4...)
    # This leaves single letters. We need to clear R3 or R5 spots.
    
    # Strategy: Clear Column 4, 6, 8, 10, 12 completely? 
    # Or just clear specific cells in R3 and R5 to ensure 3-letter words.
    
    # Let's clear R3 and R5 completely? No, too open.
    # Let's clear neighbors of R4.
    for x in range(4, 13):
        grid[3][x] = "L"
        grid[5][x] = "L"

    # Check for consecutive dots created by clearing? 
    # Clearing turns dot to L. Never creates dots. Safe.

    # 5. Handle Start word SOUTUVENE
    word = "SOUTUVENE" # 9 letters
    # grid[4][0..3] is IMG. grid[4][4..12] is Word.
    for i, char in enumerate(word):
        grid[4][4+i] = char

    # Print Grid in Format
    print("grid = [")
    for row in grid:
        print("    " + str(row) + ",")
    print("]")

    # Verify
    errors = []
    for y in range(height):
        for x in range(width - 1):
            if grid[y][x] == "." and grid[y][x+1] == ".":
                errors.append(f"H ({x},{y})")
    for x in range(width):
        for y in range(height - 1):
            if grid[y][x] != "IMG" and grid[y+1][x] != "IMG":
                if grid[y][x] == "." and grid[y+1][x] == ".":
                    errors.append(f"V ({x},{y})")
    
    if errors:
        print("GENERATION FAILED:", errors)
    else:
        print("GENERATION SUCCESS")

generate()
