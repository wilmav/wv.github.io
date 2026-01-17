
grid = [
    ["J", "O", "U", "T", "S", "E", "N", ".", "H", "A", "L", "L", "A"],
    ["A", ".", "S", ".", "I", ".", "O", ".", "E", ".", "E", ".", "A"],
    ["K", "A", "V", "A", "L", "A", ".", "K", "I", "U", "A", "S", "."],
    ["O", ".", "A", ".", "M", ".", "R", ".", "M", ".", "L", ".", "K"],
    ["IMG", "IMG", "IMG", "IMG", "S", "O", "U", "T", "U", "V", "E", "N", "E"],
    ["IMG", "IMG", "IMG", "IMG", "I", ".", "O", ".", "L", ".", "R", ".", "V"],
    ["IMG", "IMG", "IMG", "IMG", "L", "A", "K", "I", ".", "A", "H", "M", "A"],
    ["IMG", "IMG", "IMG", "IMG", "M", ".", "A", ".", "I", ".", "O", ".", "T"],
    ["R", "A", "K", "K", "A", "U", "S", ".", "S", "I", "E", "L", "U"],
    ["U", ".", "U", ".", ".", ".", "V", ".", "A", ".", ".", ".", "L"],
    ["K", "I", "I", "R", "E", ".", "A", "A", "M", "U", "S", "U", "U"],
    ["K", ".", "T", ".", "L", ".", "L", ".", "Ä", ".", "A", ".", "L"],
    ["I", "H", "M", "I", "N", "E", "N", ".", "T", "A", "I", "V", "A"]
]

def check_grid(grid):
    height = len(grid)
    width = len(grid[0])
    print(f"Grid size: {width}x{height}")
    
    errors = []

    # Check horizontal
    for y in range(height):
        for x in range(width - 1):
            if grid[y][x] == "." and grid[y][x+1] == ".":
                errors.append(f"Horizontal adjacent dots at ({x},{y}) and ({x+1},{y})")

    # Check vertical
    for x in range(width):
        for y in range(height - 1):
            cell1 = grid[y][x]
            cell2 = grid[y+1][x]
            # Ignore IMG
            if cell1 == "IMG" or cell2 == "IMG":
                continue
            if cell1 == "." and cell2 == ".":
                errors.append(f"Vertical adjacent dots at ({x},{y}) and ({x},{y+1})")

    if errors:
        print("ERRORS FOUND:")
        for e in errors:
            print(e)
        return False
    else:
        print("Grid is VALID!")
        return True

check_grid(grid)
