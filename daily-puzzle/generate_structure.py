
import random
import copy

def generate_structure():
    width = 13
    height = 13
    grid = [['L' for _ in range(width)] for _ in range(height)]

    # Fixed Constraints
    # IMG Block
    for r in range(4, 8):
        for c in range(4):
            grid[r][c] = 'IMG'

    # Start Word SOUTUVENE (Row 4, Cols 4-12)
    # This row must be clear of black squares
    # (Already L by default)

    # Strategy: Place Black Squares (B) to break up long lines.
    # Constraints:
    # 1. No B adjacent to B (H or V).
    # 2. Min word length 3 (No isolated L, no B L B).
    
    # We want to place AS MANY Bs as possible to reduce word length.
    
    # Try a randomized greedy approach with backtracking or just repeated attempts.
    
    best_grid = None
    min_avg_word_len = 13.0
    
    for attempt in range(1000):
        temp_grid = [row[:] for row in grid]
        placed_count = 0
        
        # Candidates: All cells that are 'L' and not in Start Word row (Row 4)
        candidates = []
        for r in range(height):
            if r == 4: continue # Don't touch SOUTUVENE row
            for c in range(width):
                if temp_grid[r][c] == 'L':
                    candidates.append((r,c))
        
        random.shuffle(candidates)
        
        for r, c in candidates:
            # Can we place a B here?
            
            # 1. Check Adjacency
            neighbors = [(r-1,c), (r+1,c), (r,c-1), (r,c+1)]
            has_b_neighbor = False
            for nr, nc in neighbors:
                if 0 <= nr < height and 0 <= nc < width:
                    if temp_grid[nr][nc] == 'B':
                        has_b_neighbor = True
                        break
            if has_b_neighbor: continue

            # 2. Check Word Length Constraints (local)
            # Placing B here splits current H-word and V-word.
            # We must prune if it creates a 1 or 2 letter segment.
            
            # Check Horizontal
            # Look left
            l_len = 0
            for k in range(c-1, -1, -1):
                if temp_grid[r][k] != 'L': break
                l_len += 1
            # Look right
            r_len = 0
            for k in range(c+1, width):
                if temp_grid[r][k] != 'L': break
                r_len += 1
            
            # If we place B, we get segments of length l_len and r_len.
            # They must be >= 3 OR 0 (if valid end).
            # But wait, existing boundaries might be edges or Bs.
            # If l_len > 0 and l_len < 3: Invalid.
            # If r_len > 0 and r_len < 3: Invalid.
            
            if (l_len > 0 and l_len < 2) or (r_len > 0 and r_len < 2): # Let's allow 2 for now, prefer 3
                 continue
                 
            # Check Vertical
            u_len = 0
            for k in range(r-1, -1, -1):
                if temp_grid[k][c] != 'L': break
                u_len += 1
            d_len = 0
            for k in range(r+1, height):
                if temp_grid[k][c] != 'L': break
                d_len += 1
                
            if (u_len > 0 and u_len < 2) or (d_len > 0 and d_len < 2): # Allow 2
                continue

            # Place it
            temp_grid[r][c] = 'B'
            placed_count += 1
            
        # Analyze Result
        # Calculate Average Word Length
        total_len = 0
        word_count = 0
        
        # Horizontal Words
        for r in range(height):
            current_len = 0
            for c in range(width):
                if temp_grid[r][c] == 'L' or (r==4 and c>=4): # (Row 4 is special check?)
                     # Actually SOUTUVENE is 'L's effectively for structure
                     current_len += 1
                else:
                    if current_len >= 2:
                        total_len += current_len
                        word_count += 1
                    current_len = 0
            if current_len >= 2:
                total_len += current_len
                word_count += 1
                
        # Vertical Words
        for c in range(width):
            current_len = 0
            for r in range(height):
                if temp_grid[r][c] == 'L' or (r==4 and c>=4):
                    current_len += 1
                else:
                    if current_len >= 2:
                        total_len += current_len
                        word_count += 1
                    current_len = 0
            if current_len >= 2:
                total_len += current_len
                word_count += 1
        
        avg = total_len / word_count if word_count > 0 else 99
        
        if avg < min_avg_word_len:
            min_avg_word_len = avg
            best_grid = temp_grid
            
    # Print Best Grid
    print(f"Best Avg Word Len: {min_avg_word_len:.2f}")
    if best_grid:
        print("grid = [")
        for r in range(height):
            row_str = "["
            for c in range(width):
                if best_grid[r][c] == 'B': val = '"-"' # Dash for Black (reusing logic)
                elif best_grid[r][c] == 'IMG': val = '"IMG"'
                else: val = '"L"'
                row_str += val + ", "
            print("    " + row_str + "],")
        print("]")

generate_structure()
