import json
import random
import os
from datetime import datetime
import colorsys

# Configuration
PUZZLE_OUTPUT_DIR = "puzzles"
ASSETS_DIR = "assets"
GRID_SIZE = 13

# Load words from file
WORD_LIST = []
WORDS_FILE = os.path.join(os.path.dirname(__file__), "words.txt")

try:
    with open(WORDS_FILE, "r", encoding="utf-8") as f:
        # Filter: length 3-10, uppercase only, no hyphens
        for line in f:
            w = line.strip().upper()
            if 3 <= len(w) <= 10 and w.isalpha():
                WORD_LIST.append(w)
    print(f"Loaded {len(WORD_LIST)} words from {WORDS_FILE}")
except FileNotFoundError:
    print("Warning: words.txt not found, using fallback list.")
    WORD_LIST = ["TALVI", "LUMI", "PAKKANEN", "AURINKO", "METSÄ", "JÄRVI", "SAUNA", "KAHVI", "SUOMI", "KOIVU"]

class PuzzleGenerator:
    def __init__(self):
        self.grid_size = GRID_SIZE
        self.alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ"
    
    def generate_colors(self, count):
        """Generate distinct colors using HSV space"""
        colors = []
        for i in range(count):
            hue = i / count
            saturation = 0.7
            value = 0.9
            rgb = colorsys.hsv_to_rgb(hue, saturation, value)
            hex_color = "#{:02x}{:02x}{:02x}".format(int(rgb[0]*255), int(rgb[1]*255), int(rgb[2]*255))
            colors.append(hex_color)
        return colors

    def generate_cipher(self, letters_in_grid):
        """Map letters to colors and symbols"""
        cipher = {}
        unique_letters = list(set(letters_in_grid))
        unique_letters.sort()
        
        palette = self.generate_colors(len(unique_letters))
        symbols = ["●", "■", "▲", "▼", "◆", "★", "✚", "✖", "⬟", "♥", "♦", "♠", "♣", "☀", "☾", "☁", "☂", "☃", "☄", "★", "☆", "☇", "☈", "☉", "☊", "☋", "☌", "☍", "☎"]
        
        for idx, letter in enumerate(unique_letters):
            cipher[letter] = {
                "id": idx + 1,
                "color": palette[idx],
                "symbol": symbols[idx % len(symbols)]
            }
        return cipher

    def generate_grid(self):
        """Create a dense grid using intersection-based growth"""
        grid = [['.' for _ in range(self.grid_size)] for _ in range(self.grid_size)]
        
        # 0. Reserve Image Area (4x4)
        # Randomly choose position: TL, TR, BL, BR, Center
        positions = [
            (0, 0), # Top-Left
            (0, self.grid_size - 4), # Top-Right
            (self.grid_size - 4, 0), # Bottom-Left
            (self.grid_size - 4, self.grid_size - 4), # Bottom-Right
            ((self.grid_size - 4) // 2, (self.grid_size - 4) // 2) # Center
        ]
        img_r, img_c = random.choice(positions)
        
        for r in range(img_r, img_r + 4):
            for c in range(img_c, img_c + 4):
                grid[r][c] = 'IMG'
                
        placed_words = []
        
        # 1. Place the Key Word (Central)
        key_word = random.choice([w for w in WORD_LIST if len(w) >= 6])
        row = self.grid_size // 2
        col = (self.grid_size - len(key_word)) // 2
        if col < 0: col = 0
        
        # Ensure it doesn't overlap IMG
        valid_start = True
        for i in range(len(key_word)):
            if grid[row][col+i] != '.': valid_start = False
            
        if valid_start:
            for i, char in enumerate(key_word):
                grid[row][col + i] = char
            placed_words.append(key_word)
        
        # 2. Grow the grid
        # We maintain a list of 'hooks': (r, c) of placed letters that can be intersections
        # But brute force iterating over the grid is easier for this scale.
        
        attempts = 0
        max_failures = 100
        failures = 0
        
        while failures < max_failures and len(placed_words) < 40:
            # Find a hook
            potential_hooks = []
            for r in range(self.grid_size):
                for c in range(self.grid_size):
                    if grid[r][c] != '.' and grid[r][c] != 'IMG':
                        # Check if this cell can be an intersection
                        # i.e. is not surrounded by letters in the OTHER direction
                         potential_hooks.append((r,c))
            
            if not potential_hooks: break
            
            r, c = random.choice(potential_hooks)
            char_at_hook = grid[r][c]
            
            # Decide direction based on neighbors
            # If (r, c) has neighbors horizontal, we must place Vertical, and vice versa.
            has_h_neighbors = (c > 0 and grid[r][c-1] not in ['.', 'IMG']) or (c < self.grid_size-1 and grid[r][c+1] not in ['.', 'IMG'])
            has_v_neighbors = (r > 0 and grid[r-1][c] not in ['.', 'IMG']) or (r < self.grid_size-1 and grid[r+1][c] not in ['.', 'IMG'])
            
            if has_h_neighbors and has_v_neighbors:
                failures += 1; continue # Already crossed
            
            direction = 'V' if has_h_neighbors else 'H'
            
            # Find words that contain `char_at_hook`
            # We need to pick a position index for the char in the new word
            # e.g. if char is 'A', new word could be "K A L A" (index 1) or "A U T O" (index 0)
            
            # Optimisation: Pre-filter word list by letter?
            # For now, just random choice from matching candidates
            candidates = [w for w in WORD_LIST if char_at_hook in w]
            random.shuffle(candidates)
            
            placed = False
            for word in candidates:
                # Try all positions where `word` has `char_at_hook`
                indices = [i for i, l in enumerate(word) if l == char_at_hook]
                for idx in indices:
                    # Try to place `word` such that word[idx] is at (r, c)
                    start_r = r - idx if direction == 'V' else r
                    start_c = c - idx if direction == 'H' else c
                    
                    if self.can_place_word(grid, word, start_r, start_c, direction):
                        self.place_word(grid, word, start_r, start_c, direction)
                        placed_words.append(word)
                        placed = True
                        break
                if placed: break
            
            if placed:
                failures = 0
            else:
                failures += 1
                
        print(f"Placed {len(placed_words)} words.")
        return grid, key_word

    def can_place_word(self, grid, word, r, c, direction):
        if r < 0 or c < 0: return False
        
        if direction == 'H':
            if c + len(word) > self.grid_size: return False
            for i, char in enumerate(word):
                cell = grid[r][c + i]
                if cell == 'IMG': return False
                
                # Conflict check
                if cell != '.' and cell != char: return False
                
                # Neighbor check
                # If we are placing on an empty cell '.', we must ensure no accidental adjacencies
                if cell == '.':
                   if r > 0 and grid[r-1][c+i] not in ['.', 'IMG']: return False
                   if r < self.grid_size - 1 and grid[r+1][c+i] not in ['.', 'IMG']: return False

            # End caps
            if c > 0 and grid[r][c-1] not in ['.', 'IMG']: return False
            if c + len(word) < self.grid_size and grid[r][c+len(word)] not in ['.', 'IMG']: return False

        else: # V
            if r + len(word) > self.grid_size: return False
            for i, char in enumerate(word):
                cell = grid[r + i][c]
                if cell == 'IMG': return False
                
                if cell != '.' and cell != char: return False
                
                if cell == '.':
                   if c > 0 and grid[r+i][c-1] not in ['.', 'IMG']: return False
                   if c < self.grid_size - 1 and grid[r+i][c+1] not in ['.', 'IMG']: return False

            if r > 0 and grid[r-1][c] not in ['.', 'IMG']: return False
            if r + len(word) < self.grid_size and grid[r+len(word)][c] not in ['.', 'IMG']: return False
            
        return True

    def place_word(self, grid, word, r, c, direction):
        if direction == 'H':
            for i, char in enumerate(word):
                grid[r][c + i] = char
        else:
            for i, char in enumerate(word):
                grid[r + i][c] = char

    def generate_daily_puzzle(self):
        print("Generating puzzle...")
        
        grid, key_word = self.generate_grid()
        
        # Flatten grid to find used letters (Exclude IMG)
        used_letters = [cell for row in grid for cell in row if cell != '.' and cell != 'IMG']
        cipher = self.generate_cipher(used_letters)
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        puzzle_data = {
            "date": today,
            "id": f"daily-{today}",
            "image_url": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1", # Placeholder
            "image_clue": key_word,
            "grid": grid,
            "cipher": cipher,
            "width": self.grid_size,
            "height": self.grid_size
        }
        
        filename = f"{today}.json"
        filepath = os.path.join(PUZZLE_OUTPUT_DIR, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(puzzle_data, f, indent=2, ensure_ascii=False)
            
        print(f"Saved to {filepath}")

if __name__ == "__main__":
    if not os.path.exists(PUZZLE_OUTPUT_DIR):
        os.makedirs(PUZZLE_OUTPUT_DIR)
        
    generator = PuzzleGenerator()
    generator.generate_daily_puzzle()
