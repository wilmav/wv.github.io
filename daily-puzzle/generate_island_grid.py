
def is_valid_island(grid, x, y):
    h = len(grid)
    w = len(grid[0])
    
    # Check orthogonal neighbors
    for dx, dy in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
        nx, ny = x + dx, y + dy
        if 0 <= nx < w and 0 <= ny < h:
            if grid[ny][nx] == ".":
                return False
    return True

def generate():
    width = 13
    height = 13
    # Initialize with all Letters
    grid = [["L" for _ in range(width)] for _ in range(height)]

    # 1. Place fixed IMG block
    for y in range(4, 8):
        for x in range(4):
            grid[y][x] = "IMG"

    # 2. Place mandatory START WORD "SOUTUVENE" at R4 C4-12
    # This row CANNOT have black squares in this range
    for x in range(4, 13):
        grid[4][x] = "S" # Just marker for occupied

    # 3. Create Island Pattern
    # Strategy: Place dots at (odd, odd) or similar pattern that guarantees separation.
    # Pattern: 
    # L L L L L L ...
    # L . L . L . ...
    # L L L L L L ...
    
    # We want a dense grid but strict separation.
    # Let's try placing dots at fixed intervals if valid.
    
    for y in range(height):
        # Determine offset for this row
        # Row 0: No dots (Long words)
        # Row 1: dots at 1, 3, 5, 7, 9, 11
        # Row 2: No dots
        # Row 3: dots at 1, 3, 5...
        
        if y >= 4 and y < 8:
            # Beside image.
            # R4 is word.
            # R5, R6, R7 need some dots?
             pass 

        if y % 2 == 1:
            for x in range(1, width, 2):
                # Candidate for dot
                # Must check if valid island
                
                # Special checks:
                if grid[y][x] == "IMG": continue
                if grid[y][x] == "S": continue # Start word
                
                # Check if placing a dot here creates adjacency
                # Since we iterate y by 2 and x by 2, we are naturally safe?
                # (1,1) -> neighbors (1,0), (1,2), (0,1), (2,1)
                # If we only place dots on Odd Y and Odd X, then:
                # (1,1) and (1,3) are separated by (1,2).
                # (1,1) and (3,1) are separated by (2,1).
                # So (odd, odd) placement guarantees isolation!
                
                grid[y][x] = "."

    # 4. Print and Validate
    errors = []
    print("grid = [")
    for y in range(height):
        row_str = "["
        for x in range(width):
            val = grid[y][x]
            if val == "IMG": row_str += '"IMG", '
            elif val == ".": row_str += '"-", ' # Use - for visual placeholder of dot
            else: row_str += '"L", '
        print("    " + row_str + "],")
    print("]")

    # Validate
    for y in range(height):
        for x in range(width):
            if grid[y][x] == ".":
                if not is_valid_island(grid, x, y):
                    errors.append(f"Adj at {x},{y}")

    if errors:
        print("ERRORS:", errors)
    else:
        print("ISLAND CHECK PASSED")

generate()
