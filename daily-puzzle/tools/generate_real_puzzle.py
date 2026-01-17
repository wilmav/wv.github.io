
import random
import time
import sys

# Grid Skeleton (Island Style)
# R4 (Index 4) is constrained: IMG..SOUTUVENE
# We need to fill H0, H2, H4(partial), H6(partial), H8, H10, H12
# And V0, V2, V4, V6, V8, V10, V12

def load_words():
    words_by_len = {}
    with open('data/filtered_words.txt', 'r', encoding='utf-8') as f:
        for line in f:
            w = line.strip()
            l = len(w)
            if l not in words_by_len: words_by_len[l] = []
            words_by_len[l].append(w)
    return words_by_len

def solve():
    words = load_words()
    print("Words loaded.")
    
    # Define slots
    # (row, col, length, orientation 'H'/'V')
    # Row indices 0..12. Col indices 0..12.
    
    # Horizontals (Row 0, 2, ..., 12)
    # H4 is SOUTUVENE (Fixed) at 4,4
    # H5, H6, H7 are beside image. 9 letters?
    # Wait, my grid gen had Image at Rows 4-7, Cols 0-3.
    # So H4, H5, H6, H7 start at Col 4. Length 9.
    

    # Optimized Grid Structure (Avg word len 3.17, No adjacent black squares)
    grid_structure = [
    ["L", "L", "-", "L", "L", "L", "L", "-", "L", "L", "-", "L", "L"],
    ["L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L"],
    ["L", "L", "L", "L", "L", "-", "L", "L", "-", "L", "L", "L", "-"],
    ["-", "L", "L", "-", "L", "L", "-", "L", "L", "L", "-", "L", "L"],
    ["IMG", "IMG", "IMG", "IMG", "S", "O", "U", "T", "U", "V", "E", "N", "E"],
    ["IMG", "IMG", "IMG", "IMG", "L", "L", "L", "L", "-", "L", "L", "L", "-"],
    ["IMG", "IMG", "IMG", "IMG", "-", "L", "L", "-", "L", "L", "-", "L", "L"],
    ["IMG", "IMG", "IMG", "IMG", "L", "L", "-", "L", "L", "-", "L", "L", "L"],
    ["L", "L", "-", "L", "L", "-", "L", "L", "-", "L", "L", "L", "-"],
    ["L", "L", "L", "L", "-", "L", "L", "-", "L", "L", "-", "L", "L"],
    ["-", "L", "L", "-", "L", "L", "-", "L", "L", "-", "L", "L", "L"],
    ["L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L", "L"],
    ["L", "L", "-", "L", "L", "-", "L", "L", "L", "L", "-", "L", "L"],
    ]

    # Parse slots from this structure
    slots = []
    width = 13
    height = 13
    
    # helper to check word bounds
    def get_word_at(r, c, d_r, d_c, grid):
        # find start
        # backtrack
        curr_r, curr_c = r, c
        while 0 <= curr_r - d_r < height and 0 <= curr_c - d_c < width:
            if grid[curr_r - d_r][curr_c - d_c] == '-' or grid[curr_r - d_r][curr_c - d_c] == 'IMG':
                break
            curr_r -= d_r
            curr_c -= d_c
        
        start_r, start_c = curr_r, curr_c
        
        # find length
        length = 0
        curr_r, curr_c = start_r, start_c
        while 0 <= curr_r < height and 0 <= curr_c < width:
            if grid[curr_r][curr_c] == '-' or grid[curr_r][curr_c] == 'IMG':
                break
            length += 1
            curr_r += d_r
            curr_c += d_c
            
        return (start_r, start_c, length)

    seen_slots = set()
    
    # Horizontal
    for r in range(height):
        for c in range(width):
            if grid_structure[r][c] in ['L', 'S', 'O', 'U', 'T', 'V', 'E', 'N']: # Part of word
                 sr, sc, sl = get_word_at(r, c, 0, 1, grid_structure)
                 if sl >= 2:
                     if (sr, sc, sl, 'H') not in seen_slots:
                         fixed = "SOUTUVENE" if r == 4 and sc == 4 else None
                         slots.append({'r': sr, 'c': sc, 'len': sl, 'dir': 'H', 'fixed': fixed})
                         seen_slots.add((sr, sc, sl, 'H'))

    # Vertical
    for r in range(height):
        for c in range(width):
            if grid_structure[r][c] in ['L', 'S', 'O', 'U', 'T', 'V', 'E', 'N']:
                 sr, sc, sl = get_word_at(r, c, 1, 0, grid_structure)
                 if sl >= 2:
                     if (sr, sc, sl, 'V') not in seen_slots:
                         slots.append({'r': sr, 'c': sc, 'len': sl, 'dir': 'V', 'fixed': None})
                         seen_slots.add((sr, sc, sl, 'V'))

    # Sort slots: Fixed first, then Longest
    slots.sort(key=lambda x: (x['fixed'] is None, -x['len']))
    
    # Solve
    grid_state = [['.' if grid_structure[r][c] not in ['-','IMG'] else grid_structure[r][c] for c in range(width)] for r in range(height)]
    
    return backtrack(slots, grid_state, words, 0)

def get_slot_coords(slot):
    coords = []
    if slot['dir'] == 'H':
        for i in range(slot['len']):
            coords.append((slot['r'], slot['c'] + i))
    else:
        for i in range(slot['len']):
            coords.append((slot['r'] + i, slot['c']))
    return coords

def backtrack(slots, grid, words_dict, index):
    if index >= len(slots):
        return grid # Solved!
    
    slot = slots[index]
    
    # If fixed
    if slot['fixed']:
        # Validate fixed word fits
        word = slot['fixed']
        # Place it
        new_grid = [row[:] for row in grid]
        coords = get_slot_coords(slot)
        for i, (r,c) in enumerate(coords):
            if new_grid[r][c] != '.' and new_grid[r][c] != word[i]:
                return None # Conflict
            new_grid[r][c] = word[i]
        
        return backtrack(slots, new_grid, words_dict, index + 1)

    # Not fixed. Find candidates.
    coords = get_slot_coords(slot)
    
    # Build pattern from current grid
    pattern = ""
    for r, c in coords:
        pattern += grid[r][c]
    
    # Optimization: Filter candidates
    # If pattern is ".............", all words of len L.
    # If "S...T...", filter.
    
    candidates = []
    w_len = slot['len']
    if w_len not in words_dict: return None
    
    # Simple regex-like match
    # Taking random sample to speed up (Result doesn't need to be perfect, just existence proof)
    # But for valid grid we need valid overlap.
    source_words = words_dict[w_len]
    random.shuffle(source_words) # Randomize to get different puzzles
    
    for w in source_words:
        match = True
        for i, char in enumerate(pattern):
            if char != '.' and char != w[i]:
                match = False
                break
        if match:
            candidates.append(w)
            if len(candidates) > 200: break # Limit branching factor for speed
    
    # Try candidates
    for w in candidates:
        # Place word
        new_grid = [row[:] for row in grid]
        for i, (r,c) in enumerate(coords):
            new_grid[r][c] = w[i]
            
        res = backtrack(slots, new_grid, words_dict, index + 1)
        if res: return res
        
    return None

start = time.time()
res = solve()
print(f"Time: {time.time() - start:.2f}s")
if res:
    print("SOLUTION FOUND:")
    for row in res:
        print("".join(row).replace('.', '?')) # ? for unfilled spots
else:
    print("NO SOLUTION")
