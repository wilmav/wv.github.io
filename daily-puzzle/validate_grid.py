
grid = [
        ["J", "O", "U", "T", "S", "E", "N", ".", "K", "I", "U", "A", "S"],
        ["O", ".", "S", ".", "I", ".", "O", "A", "A", ".", "S", ".", "A"],
        ["U", "N", "E", "L", "M", "A", ".", "H", "A", "L", "L", "A", "."],
        ["L", ".", "I", ".", "A", ".", "S", ".", "M", ".", "O", ".", "K"],
        ["IMG", "IMG", "IMG", "IMG", "S", "O", "U", "T", "U", "V", "E", "N", "E"],
        ["IMG", "IMG", "IMG", "IMG", "I", ".", "U", ".", "S", ".", "K", ".", "S"],
        ["IMG", "IMG", "IMG", "IMG", "E", "L", "A", "M", "A", "J", "E", "K", "O"],
        ["IMG", "IMG", "IMG", "IMG", "L", ".", "R", ".", "S", ".", "K", ".", "L"],
        ["R", "A", "K", "K", "A", "U", "S", "I", "U", "S", "V", "A", "."],
        ["U", ".", "O", ".", "U", ".", "A", ".", "M", "I", "A", ".", "H"],
        ["O", "P", "I", "S", "K", "E", "L", "U", ".", "V", "L", "O", "G"],
        ["K", ".", "R", ".", "U", ".", "M", ".", "I", ".", "O", ".", "E"],
        ["O", "L", "E", "M", "U", "S", ".", "T", "Ä", "H", "D", "E", "T"]
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
