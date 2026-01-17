/**
 * Daily Codeword Puzzle
 * Core Application Logic
 */

const COLOR_THEMES = {
    'cute': ['#FFB5E8', '#FF9CEE', '#FFCCF9', '#FCC2FF', '#F6A6FF', '#B28DFF', '#C5A3FF', '#D5AAFF', '#ECD4FF', '#FBE4FF', '#DCD3FF', '#A79AFF', '#B5B9FF', '#97A2FF', '#AFCBFF', '#AFF8DB', '#C4FAF8', '#85E3FF', '#ACE7FF', '#6EB5FF', '#BFFCC6', '#DBFFD6', '#F3FFE3', '#E7FFAC', '#FFFFD1', '#FFC9DE'],
    'blue': ['#001219', '#005f73', '#0a9396', '#94d2bd', '#e9d8a6', '#ee9b00', '#ca6702', '#bb3e03', '#ae2012', '#9b2226', '#caf0f8', '#ade8f4', '#90e0ef', '#48cae4', '#0096c7', '#0077b6', '#023e8a', '#03045e', '#1d3557', '#457b9d', '#a8dadc', '#f1faee', '#e63946', '#264653', '#2a9d8f', '#e9c46a'],
    'earth': ['#606c38', '#283618', '#fefae0', '#dda15e', '#bc6c25', '#8c5c2d', '#5d4037', '#4e342e', '#3e2723', '#795548', '#a1887f', '#d7ccc8', '#558b2f', '#33691e', '#1b5e20', '#2e7d32', '#388e3c', '#4caf50', '#81c784', '#a5d6a7', '#c8e6c9', '#e8f5e9', '#f1f8e9', '#dcedc8', '#c5e1a5', '#aed581']
};

const SYMBOL_THEMES = {
    'solid': ["●", "■", "▲", "▼", "◆", "★", "✚", "✖", "⬟", "♥", "♦", "♠", "♣", "☀", "☾", "☁", "☂", "☃", "☄", "★", "☆", "☇", "☈", "☉", "☊", "☋"],
    'outline': ["○", "□", "△", "▽", "◇", "☆", "✛", "✕", "⬠", "♡", "♢", "♤", "♧", "☼", "☽", "☁", "☂", "☃", "☄", "☆", "★", "☇", "☈", "☉", "☊", "☋"],
    'nature': ["✿", "❀", "❁", "❂", "❃", "❄", "❅", "d", "❦", "❧", "☘", "⚘", "⚝", "⚕", "⚖", "⚗", "⚘", "⚙", "⚚", "⚛", "⚜", "⚝", "⚹", "✴", "✳", "✲"]
};

const MOCK_DATA = {
    "date": "2026-01-16",
    "id": "daily-2026-01-16",
    "image_url": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1",
    "image_clue": "SOUTUVENE",
    "start_coords": [[4, 4], [4, 5], [4, 6], [4, 7], [4, 8], [4, 9], [4, 10], [4, 11], [4, 12]],
    "cipher": {
        "A": { "id": 1, "color": "#e54444", "symbol": "●" },
        "E": { "id": 2, "color": "#e57a44", "symbol": "■" },
        "H": { "id": 3, "color": "#e5af44", "symbol": "▲" },
        "I": { "id": 4, "color": "#e5e544", "symbol": "▼" },
        "J": { "id": 5, "color": "#afe544", "symbol": "◆" },
        "K": { "id": 6, "color": "#7ae544", "symbol": "★" },
        "L": { "id": 7, "color": "#44e544", "symbol": "✚" },
        "M": { "id": 8, "color": "#44e57a", "symbol": "✖" },
        "N": { "id": 9, "color": "#44e5af", "symbol": "⬟" },
        "O": { "id": 10, "color": "#44e5e5", "symbol": "♥" },
        "P": { "id": 11, "color": "#44afe5", "symbol": "♦" },
        "R": { "id": 12, "color": "#447ae5", "symbol": "♠" },
        "S": { "id": 13, "color": "#4444e5", "symbol": "♣" },
        "T": { "id": 14, "color": "#7a44e5", "symbol": "☀" },
        "U": { "id": 15, "color": "#af44e5", "symbol": "☾" },
        "V": { "id": 16, "color": "#e544e5", "symbol": "☁" },
        "Y": { "id": 17, "color": "#e544af", "symbol": "☂" },
        "Ä": { "id": 18, "color": "#e5447a", "symbol": "☃" },
        "Ö": { "id": 19, "color": "#e57a7a", "symbol": "☄" },
        "D": { "id": 20, "color": "#afe5af", "symbol": "⚛" }
    },
    "width": 13,
    "height": 13,
    "grid": [
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
};

const defaultSettings = {
    hardMode: false,
    autoFill: false, // Default to manual input as requested
    showTimer: false,
    displayMode: 'numbers', // "Colorless" start as requested
    colorTheme: 'cute',
    symbolTheme: 'solid',
    darkMode: false,
    showNameDay: true,
    showWeather: true,
    showFinance: true
};

const STATE = {
    settings: { ...defaultSettings },
    currentPuzzle: null,
    userProgress: {},
    timerInterval: null,
    unlockedIds: [],
    startTime: null,
    selectedCell: null,
    weatherData: null,
    financeData: null,
    nameDayData: null,
    gridValues: {} // Store manual cell values "row_col": "char"
};

// ...

function saveSettings() {
    STATE.settings.displayMode = document.getElementById('display-mode').value;
    STATE.settings.colorTheme = document.getElementById('color-theme').value;
    STATE.settings.symbolTheme = document.getElementById('symbol-theme').value;
    STATE.settings.darkMode = document.getElementById('dark-mode-toggle').checked;

    STATE.settings.hardMode = document.getElementById('hard-mode-toggle').checked;
    STATE.settings.showTimer = document.getElementById('timer-toggle').checked;
    STATE.settings.autoFill = document.getElementById('auto-fill-toggle').checked;

    // Widget Settings
    STATE.settings.showNameDay = document.getElementById('widget-nameday-toggle').checked;
    STATE.settings.showWeather = document.getElementById('widget-weather-toggle').checked;
    STATE.settings.showFinance = document.getElementById('widget-finance-toggle').checked;

    applyTheme(STATE.settings.darkMode);

    // Save to LocalStorage
    localStorage.setItem('dailyPuzzleSettings', JSON.stringify(STATE.settings));

    // Refresh grid if display mode changed
    if (STATE.currentPuzzle) {
        renderGrid(STATE.currentPuzzle);
        renderCipherKeys(STATE.currentPuzzle);
    }

    updateTimerUI();
    updateHeaderWidgets();
}

function loadSettings() {
    const saved = localStorage.getItem('dailyPuzzleSettings');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            STATE.settings = { ...defaultSettings, ...parsed };
        } catch (e) {
            console.warn("Failed to parse settings", e);
            STATE.settings = { ...defaultSettings };
        }
    } else {
        STATE.settings = { ...defaultSettings };
    }

    // Apply UI from State
    const displayModeEl = document.getElementById('display-mode');
    if (displayModeEl) displayModeEl.value = STATE.settings.displayMode;

    const colorThemeEl = document.getElementById('color-theme');
    if (colorThemeEl) colorThemeEl.value = STATE.settings.colorTheme;

    const symbolThemeEl = document.getElementById('symbol-theme');
    if (symbolThemeEl) symbolThemeEl.value = STATE.settings.symbolTheme;

    // Dark mode applied via applyTheme
    applyTheme(STATE.settings.darkMode);

    const hardModeEl = document.getElementById('hard-mode-toggle');
    if (hardModeEl) hardModeEl.checked = STATE.settings.hardMode;

    const timerToggleEl = document.getElementById('timer-toggle');
    if (timerToggleEl) timerToggleEl.checked = STATE.settings.showTimer;

    // Widget Toggles
    const ndToggle = document.getElementById('widget-nameday-toggle');
    if (ndToggle) ndToggle.checked = STATE.settings.showNameDay;

    const wToggle = document.getElementById('widget-weather-toggle');
    if (wToggle) wToggle.checked = STATE.settings.showWeather;

    const fToggle = document.getElementById('widget-finance-toggle');
    if (fToggle) fToggle.checked = STATE.settings.showFinance;

    updateTimerUI();
    updateHeaderWidgets();
}

// --- Initialization ---

function init() {
    loadSettings();
    setupEventListeners();
    fetchPuzzle();
    applyTheme(STATE.settings.darkMode);
}

function setupEventListeners() {
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => toggleModal('settings-modal', true));
    }

    const closeSettingsBtn = document.getElementById('close-settings');
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', () => {
            saveSettings(); // Update settings from UI
            toggleModal('settings-modal', false);
        });
    }

    // Dynamic Settings Visibility
    const displayModeSelect = document.getElementById('display-mode');
    if (displayModeSelect) {
        displayModeSelect.addEventListener('change', () => {
            STATE.settings.displayMode = displayModeSelect.value;
            updateSettingsVisibility();
        });
    }

    // Virtual Keyboard
    const keyboardContainer = document.getElementById('keyboard');
    if (keyboardContainer) {
        // Generate keys (A-Ö)
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ'.split('');
        keyboardContainer.innerHTML = '';
        letters.forEach(char => {
            const btn = document.createElement('button');
            btn.className = 'key';
            btn.textContent = char;
            btn.onclick = () => handleInput(char);
            keyboardContainer.appendChild(btn);
        });
    }

    // Native Keyboard Input
    document.addEventListener('keydown', (e) => {
        if (STATE.settings.hardMode && !STATE.unlockedIds.length && e.target.id !== 'clue-guess') return;
        if (e.target.tagName === 'INPUT') return; // Don't interfere with inputs

        const key = e.key.toUpperCase();
        const valid = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ'.split('');
        if (valid.includes(key)) {
            handleInput(key);
        } else if (e.key === 'Backspace') {
            handleInput(''); // Or explicit delete
        }
    });

    // Hard Mode Input
    const submitBtn = document.getElementById('submit-clue');
    if (submitBtn) submitBtn.addEventListener('click', checkClue);

    // New Header Buttons
    const helpBtn = document.getElementById('help-btn');
    if (helpBtn) helpBtn.addEventListener('click', () => toggleModal('help-modal', true));

    const statsBtn = document.getElementById('stats-btn');
    if (statsBtn) statsBtn.addEventListener('click', () => toggleModal('stats-modal', true));

    // Theme Toggle
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        themeBtn.addEventListener('click', toggleTheme);
    }
}

function toggleTheme() {
    STATE.settings.darkMode = !STATE.settings.darkMode;
    applyTheme(STATE.settings.darkMode);
    saveSettings();
}

function updateCellStyle(cell, cipherInfo) {
    const isHardMode = STATE.settings.hardMode;
    const isUnlocked = !isHardMode || STATE.unlockedIds.includes(cipherInfo.id);
    const mode = STATE.settings.displayMode;

    // DECISION: What to show?
    // If AutoFill is ON: Show Global State (userProgress)
    // If AutoFill is OFF: Show Local Manual State (gridValues)
    let isSolved = null;
    if (STATE.settings.autoFill) {
        isSolved = STATE.userProgress[cipherInfo.id];
    } else {
        // Read manual value from coordinate
        const r = cell.dataset.row;
        const c = cell.dataset.col;
        if (r !== undefined && c !== undefined) {
            isSolved = STATE.gridValues[`${r}_${c}`];
        } else {
            // Fallback for non-grid cells (if any?)
            isSolved = STATE.userProgress[cipherInfo.id];
        }
    }

    // Theme Lookups
    const themeColors = COLOR_THEMES[STATE.settings.colorTheme] || COLOR_THEMES['cute'];
    const themeSymbols = SYMBOL_THEMES[STATE.settings.symbolTheme] || SYMBOL_THEMES['solid'];

    // Hash ID to index (1-26 -> 0-25)
    // cipherInfo.id is typically 1-based index
    const themeIndex = (cipherInfo.id - 1) % themeColors.length;
    const color = themeColors[themeIndex];
    const symbol = themeSymbols[themeIndex];

    if (isSolved) {
        cell.textContent = isSolved;
        cell.style.background = '#fff';
        cell.style.color = '#000';
    } else if (!isUnlocked) {
        // Hard Mode: Locked State
        cell.textContent = '';
        cell.style.backgroundColor = '#ccc'; // Grey
        cell.innerHTML = ''; // Clear symbols
    } else {
        // Visible State (Color/Symbol or Number)
        cell.textContent = '';
        cell.innerHTML = '';

        if (mode === 'colors') {
            cell.style.backgroundColor = color;
            const symbolSpan = document.createElement('span');
            symbolSpan.textContent = symbol;
            symbolSpan.style.opacity = '0.5';
            symbolSpan.style.fontSize = '0.8em';
            cell.appendChild(symbolSpan);
        } else if (mode === 'symbols') {
            // Symbols Only Mode (High Contrast / Shape focus)
            cell.style.backgroundColor = '#fff'; // White background
            cell.style.color = '#000';

            const symbolSpan = document.createElement('span');
            symbolSpan.textContent = symbol;
            symbolSpan.style.fontSize = '1.5em';
            symbolSpan.style.fontWeight = 'bold';
            cell.appendChild(symbolSpan);
        } else {
            // Numbers Mode
            cell.textContent = cipherInfo.id;
            cell.style.backgroundColor = '#fff';
            cell.color = '#000';
        }
    }
}




// ... existing code ...

function checkClue() {
    const input = document.getElementById('clue-guess');
    const guess = input.value.trim().toUpperCase();
    const correct = STATE.currentPuzzle.image_clue.toUpperCase();
    const feedback = document.getElementById('clue-feedback');

    if (guess === correct) {
        feedback.textContent = "Oikein! Värit paljastettu.";
        feedback.style.color = "green";

        // Unlock letters
        const puzzle = STATE.currentPuzzle;
        for (const char of correct) {
            const cipherInfo = puzzle.cipher[char];
            if (cipherInfo) {
                // Unlock ID
                if (!STATE.unlockedIds.includes(cipherInfo.id)) {
                    STATE.unlockedIds.push(cipherInfo.id);
                }
                // Fill letter
                STATE.userProgress[cipherInfo.id] = char;
                // Update all cells for this ID
                updateAllCells(cipherInfo.id);
            }
        }
        updateHelpers(puzzle);

        // Hide overlay? Or keep it to show we passed.
        document.getElementById('image-overlay').classList.add('hidden');

    } else {
        feedback.textContent = "Väärin, yritä uudelleen.";
        feedback.style.color = "red";
    }
}

function toggleModal(id, show) {
    const el = document.getElementById(id);
    if (show) el.classList.remove('hidden');
    else el.classList.add('hidden');
}

// --- Game Logic ---

function checkClue() {
    const input = document.getElementById('clue-guess');
    const guess = input.value.trim().toUpperCase();
    const correct = STATE.currentPuzzle.image_clue.toUpperCase();
    const feedback = document.getElementById('clue-feedback');

    if (guess === correct) {
        feedback.textContent = "Oikein! Värit paljastettu.";
        feedback.style.color = "green";

        // Unlock letters
        const puzzle = STATE.currentPuzzle;
        for (const char of correct) {
            const cipherInfo = puzzle.cipher[char];
            if (cipherInfo) {
                // Unlock ID
                if (!STATE.unlockedIds.includes(cipherInfo.id)) {
                    STATE.unlockedIds.push(cipherInfo.id);
                }
                // Fill letter
                STATE.userProgress[cipherInfo.id] = char;
                // Update all cells for this ID
                updateAllCells(cipherInfo.id);
            }
        }

        saveProgress();
        updateHelpers(puzzle);

        // Hide overlay? Or keep it to show we passed.
        document.getElementById('image-overlay').classList.add('hidden');

    } else {
        feedback.textContent = "Väärin, yritä uudelleen.";
        feedback.style.color = "red";
    }
}

function toggleModal(id, show) {
    const el = document.getElementById(id);
    if (!el) return;
    if (show) el.classList.remove('hidden');
    else el.classList.add('hidden');
}

async function fetchPuzzle() {
    // Directly use embedded MOCK_DATA to avoid caching issues with external files
    console.log("Using embedded MOCK_DATA");
    STATE.currentPuzzle = MOCK_DATA;
    setupGame(MOCK_DATA);
}

function setupGame(puzzle) {
    console.log("Starting setupGame", puzzle);
    try {
        if (!puzzle) {
            console.error("No puzzle data provided to setupGame");
            return;
        }

        // 1. Setup Image
        const imgEl = document.getElementById('daily-image');
        if (imgEl) {
            imgEl.src = puzzle.image_url;
        } else {
            console.warn("Element 'daily-image' not found");
        }

        // Hard Mode Setup
        const overlayEl = document.getElementById('image-overlay');
        if (overlayEl) {
            if (STATE.settings.hardMode) {
                overlayEl.classList.remove('hidden');
                STATE.unlockedIds = [];
            } else {
                overlayEl.classList.add('hidden');
            }
        }

        // 2. Render Grid
        console.log("Rendering Grid...");
        renderGrid(puzzle);

        // 3. Render Helpers
        console.log("Rendering Helpers...");

        loadProgress(puzzle.id); // Load state before rendering keys

        renderCipherKeys(puzzle);

        // Reveal Button Listener
        const revealBtn = document.getElementById('reveal-btn');
        if (revealBtn) {
            revealBtn.onclick = () => revealSolution(puzzle);
        }

        initTimer();
        updateDateInfo(puzzle.date);

        // Ensure widgets update
        updateHeaderWidgets();

        console.log("setupGame finished successfully");
    } catch (err) {
        console.error("CRITICAL ERROR in setupGame:", err);
        alert("Virhe pelin alustuksessa: " + err.message);
    }
}

function updateDateInfo(dateStr) {
    const dateOpts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const date = new Date(dateStr);

    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        dateEl.textContent = date.toLocaleDateString('fi-FI', dateOpts);
    }
}

// ...



function renderGrid(puzzle) {
    const container = document.getElementById('grid-container');
    container.innerHTML = '';

    // Set grid columns
    container.style.gridTemplateColumns = `repeat(${puzzle.width}, var(--cell-size))`;

    // Track if we rendered the image block
    let imageRendered = false;

    puzzle.grid.forEach((row, rowIndex) => {
        row.forEach((cellContent, colIndex) => {

            // Special Case: Image Block
            if (cellContent === 'IMG') {
                if (!imageRendered) {
                    const cell = document.createElement('div');
                    cell.className = 'grid-cell image-cell';
                    // Explicit Positioning
                    cell.style.gridColumnStart = colIndex + 1;
                    cell.style.gridColumnEnd = `span 4`;
                    cell.style.gridRowStart = rowIndex + 1;
                    cell.style.gridRowEnd = `span 4`;

                    cell.style.padding = "0";
                    cell.style.border = "none";

                    // Move Image and Overlay into this cell
                    cell.innerHTML = `
                       <div class="embedded-image-container">
                           <img src="${puzzle.image_url}" class="grid-image" alt="Daily Clue">
                           <div id="grid-image-overlay" class="grid-overlay ${STATE.settings.hardMode ? '' : 'hidden'}">
                                <div class="overlay-content">
                                    <p>Hard Mode</p>
                                    <div class="clue-inputs">
                                        <input type="text" id="clue-guess" placeholder="???" />
                                        <button id="submit-clue">Arvaa</button>
                                    </div>                        </div>
                                    <p id="clue-feedback"></p>
                                </div>
                           </div>
                       </div>
                   `;

                    container.appendChild(cell);
                    imageRendered = true;

                    setTimeout(() => {
                        const btn = document.getElementById('submit-clue');
                        if (btn) btn.onclick = checkClue;
                    }, 0);
                }
                return;
            }

            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            // Explicit Positioning
            cell.style.gridColumnStart = colIndex + 1;
            cell.style.gridRowStart = rowIndex + 1;

            if (cellContent === '.') {
                cell.classList.add('black');
            } else {
                // It's a letter
                const cipherInfo = puzzle.cipher[cellContent];
                if (cipherInfo) {
                    cell.dataset.row = rowIndex;
                    cell.dataset.col = colIndex;
                    cell.dataset.cipherId = cipherInfo.id;
                    cell.dataset.correctLetter = cellContent;

                    // Highlight Start Word
                    if (puzzle.start_coords) {
                        const isStart = puzzle.start_coords.some(c => c[0] === rowIndex && c[1] === colIndex);
                        if (isStart) cell.classList.add('start-word');
                    }

                    updateCellStyle(cell, cipherInfo);
                    cell.addEventListener('click', () => selectCell(cell));
                }
            }
            container.appendChild(cell);
        });
    });
}

function updateCellStyle(cell, cipherInfo) {
    const isHardMode = STATE.settings.hardMode;
    const isUnlocked = !isHardMode || STATE.unlockedIds.includes(cipherInfo.id);
    const mode = STATE.settings.displayMode;
    const isSolved = STATE.userProgress[cipherInfo.id];

    if (isSolved) {
        cell.textContent = isSolved;
        cell.style.background = '#fff';
        cell.style.color = '#000';
    } else if (!isUnlocked) {
        // Hard Mode: Locked State
        cell.textContent = '';
        cell.style.backgroundColor = '#ccc'; // Grey
        cell.innerHTML = ''; // Clear symbols
    } else {
        // Visible State (Color/Symbol or Number)
        cell.textContent = '';
        if (mode === 'colors') {
            cell.style.backgroundColor = cipherInfo.color;
            // Ensure contrast or symbol visibility
            const symbolSpan = document.createElement('span');
            symbolSpan.textContent = cipherInfo.symbol;
            symbolSpan.style.opacity = '0.5';
            symbolSpan.style.fontSize = '0.8em';

            // Clear previous content before appending? (Already done in caller)
            cell.innerHTML = '';
            cell.appendChild(symbolSpan);
        } else {
            cell.textContent = cipherInfo.id;
            cell.style.backgroundColor = '#fff';
            cell.innerHTML = '';
            cell.textContent = cipherInfo.id;
        }
    }
}

function selectCell(cell) {
    // Deselect previous
    if (STATE.selectedCell) STATE.selectedCell.classList.remove('active');

    STATE.selectedCell = cell;
    cell.classList.add('active');
}

function handleHelperClick(cipherId) {
    // Find first cell with this ID and select it
    const cell = document.querySelector(`.grid-cell[data-cipher-id="${cipherId}"]`);
    if (cell) {
        selectCell(cell);
        // Optional: Maybe scroll to it or highlight all?
    }
}

function handleInput(char) {
    if (!STATE.selectedCell) return;

    const cipherId = STATE.selectedCell.dataset.cipherId;
    if (!cipherId) return;

    const row = STATE.selectedCell.dataset.row;
    const col = STATE.selectedCell.dataset.col;
    const key = `${row}_${col}`;

    // 1. Update Manual Grid State (Visual)
    STATE.gridValues[key] = char;

    // 2. Update Logical State (for Helpers/Solving) with UNIQUENESS CHECK
    let oldIdToUpdate = null;
    if (char) {
        // "S leaves 3 and comes to 5" logic
        // Find if this char is already assigned to another ID and remove it
        Object.keys(STATE.userProgress).forEach(existingId => {
            if (STATE.userProgress[existingId] === char && existingId !== cipherId) {
                delete STATE.userProgress[existingId];
                oldIdToUpdate = existingId;
            }
        });
        STATE.userProgress[cipherId] = char;
    } else {
        // If clearing (char is empty), remove mapping
        delete STATE.userProgress[cipherId];
    }

    saveProgress();

    // 3. Visual Update of CURRENT CELL ONLY
    // Use the manual value we just set
    while (STATE.selectedCell.firstChild) STATE.selectedCell.removeChild(STATE.selectedCell.firstChild);

    // We need color info etc.
    const puzzle = STATE.currentPuzzle;
    let correctLetter = null;
    for (const [letter, info] of Object.entries(puzzle.cipher)) {
        if (info.id == cipherId) correctLetter = letter;
    }
    const cipherInfo = puzzle.cipher[correctLetter];

    // Basic render of content
    updateCellStyle(STATE.selectedCell, cipherInfo); // This function will need to check gridValues now!

    // 4. Helper Update (If enabled)
    if (STATE.settings.autoFill) {
        updateHelpers(STATE.currentPuzzle);
        updateAllCells(cipherId); // Propagate new value
        if (oldIdToUpdate) {
            updateAllCells(oldIdToUpdate); // Propagate removal from old cells
        }
    }
}

function updateAllCells(cipherId) {
    const cells = document.querySelectorAll(`[data-cipher-id="${cipherId}"]`);
    const puzzle = STATE.currentPuzzle;

    // Find the original correct letter for this ID to look up cipher info again
    // In a real app we'd have a map ID -> cipherInfo. 
    // For now, scan the cipher map.
    let correctLetter = null;
    for (const [letter, info] of Object.entries(puzzle.cipher)) {
        if (info.id == cipherId) correctLetter = letter;
    }
    const cipherInfo = puzzle.cipher[correctLetter];

    cells.forEach(cell => {
        // Re-render
        // clear content
        while (cell.firstChild) cell.removeChild(cell.firstChild);
        updateCellStyle(cell, cipherInfo);
    });
}

function saveSettings() {
    STATE.settings.displayMode = document.getElementById('display-mode').value;
    STATE.settings.colorTheme = document.getElementById('color-theme').value;
    STATE.settings.symbolTheme = document.getElementById('symbol-theme').value;
    STATE.settings.darkMode = document.getElementById('dark-mode-toggle').checked;

    STATE.settings.hardMode = document.getElementById('hard-mode-toggle').checked;
    STATE.settings.showTimer = document.getElementById('timer-toggle').checked;

    applyTheme(STATE.settings.darkMode);

    // Save to LocalStorage
    try {
        localStorage.setItem('dailyPuzzleSettings_v2', JSON.stringify(STATE.settings));
    } catch (e) {
        console.warn("Storage restricted (file:// protocol?)", e);
    }

    // Refresh grid if display mode changed
    if (STATE.currentPuzzle) {
        // Clear containers to force full re-render
        document.getElementById('grid-container').innerHTML = '';
        document.getElementById('cipher-keys').innerHTML = '';

        renderGrid(STATE.currentPuzzle);
        renderCipherKeys(STATE.currentPuzzle);
    }

    updateTimerUI();
    updateHeaderWidgets();
}
function loadSettings() {
    let saved = null;
    try {
        saved = localStorage.getItem('dailyPuzzleSettings_v2');
    } catch (e) {
        console.warn("Storage restricted", e);
    }
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Merge parsed settings into current (default) settings
            STATE.settings = { ...STATE.settings, ...parsed };
        } catch (e) {
            console.warn("Failed to parse settings", e);
        }
    }

    // Apply UI from State
    const displayModeEl = document.getElementById('display-mode');
    if (displayModeEl) displayModeEl.value = STATE.settings.displayMode;

    const colorThemeEl = document.getElementById('color-theme');
    if (colorThemeEl) colorThemeEl.value = STATE.settings.colorTheme;

    const symbolThemeEl = document.getElementById('symbol-theme');
    if (symbolThemeEl) symbolThemeEl.value = STATE.settings.symbolTheme;

    const darkModeEl = document.getElementById('dark-mode-toggle');
    if (darkModeEl) darkModeEl.checked = STATE.settings.darkMode;

    const hardModeEl = document.getElementById('hard-mode-toggle');
    if (hardModeEl) hardModeEl.checked = STATE.settings.hardMode;

    const timerToggleEl = document.getElementById('timer-toggle');
    if (timerToggleEl) timerToggleEl.checked = STATE.settings.showTimer;

    const autoFillToggleEl = document.getElementById('auto-fill-toggle');
    if (autoFillToggleEl) autoFillToggleEl.checked = STATE.settings.autoFill;

    const ndToggle = document.getElementById('widget-nameday-toggle');
    if (ndToggle) ndToggle.checked = STATE.settings.showNameDay;

    const wToggle = document.getElementById('widget-weather-toggle');
    if (wToggle) wToggle.checked = STATE.settings.showWeather;

    const fToggle = document.getElementById('widget-finance-toggle');
    if (fToggle) fToggle.checked = STATE.settings.showFinance;

    updateTimerUI();
    updateHeaderWidgets();
    updateSettingsVisibility(); // Update on load
}

function updateSettingsVisibility() {
    const mode = STATE.settings.displayMode;
    const colorContainer = document.getElementById('container-color-theme');
    const symbolContainer = document.getElementById('container-symbol-theme');

    if (colorContainer) {
        if (mode === 'colors') {
            colorContainer.classList.remove('hidden');
        } else {
            colorContainer.classList.add('hidden');
        }
    }

    if (symbolContainer) {
        if (mode === 'symbols') {
            symbolContainer.classList.remove('hidden');
        } else {
            symbolContainer.classList.add('hidden');
        }
    }
    // If 'numbers', both are hidden
}

function saveProgress() {
    if (!STATE.currentPuzzle) return;
    const key = `dailyProgress_v2_${STATE.currentPuzzle.id}`;
    const data = {
        userProgress: STATE.userProgress,
        gridValues: STATE.gridValues, // Save manual grid
        unlockedIds: STATE.unlockedIds,
        timestamp: Date.now()
    };
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) { console.warn("Saving progess failed", e); }
}

function loadProgress(puzzleId) {
    const key = `dailyProgress_v2_${puzzleId}`;
    let saved = null;
    try {
        saved = localStorage.getItem(key);
    } catch (e) { console.warn("Loading progress failed", e); }
    if (saved) {
        try {
            const data = JSON.parse(saved);
            // Verify date/id match if needed, but key implies it
            STATE.userProgress = data.userProgress || {};
            STATE.gridValues = data.gridValues || {}; // Load manual grid
            STATE.unlockedIds = data.unlockedIds || [];
        } catch (e) {
            console.warn("Failed to parse progress", e);
        }
    }
}

function applyTheme(isDark) {
    if (isDark) {
        document.body.setAttribute('data-theme', 'dark');
    } else {
        document.body.removeAttribute('data-theme');
    }
}

// --- Timer Logic ---

function initTimer() {
    if (STATE.timerInterval) clearInterval(STATE.timerInterval);
    STATE.startTime = Date.now();
    STATE.timerInterval = setInterval(updateTimer, 1000);
    updateTimerUI();
}

function updateTimer() {
    if (!STATE.settings.showTimer) return;
    const diff = Math.floor((Date.now() - STATE.startTime) / 1000);
    const mins = Math.floor(diff / 60).toString().padStart(2, '0');
    const secs = (diff % 60).toString().padStart(2, '0');

    // Target the inner value span
    const el = document.getElementById('timer-val');
    if (el) el.textContent = `${mins}:${secs}`;
}

function updateTimerUI() {
    // Target the wrapper widget
    const el = document.getElementById('timer-display');
    if (!el) return;

    if (STATE.settings.showTimer) {
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
    }
}

// --- Helper Renderers ---


function renderCipherKeys(puzzle) {
    const container = document.getElementById('cipher-keys');
    container.classList.remove('hidden'); // Show it
    container.innerHTML = '';

    const sortedKeys = Object.values(puzzle.cipher).sort((a, b) => a.id - b.id);
    const mode = STATE.settings.displayMode;

    sortedKeys.forEach(info => {
        // Container for "Cue = Letter"
        const div = document.createElement('div');
        div.className = 'cipher-key-cell';
        div.dataset.cipherId = info.id; // Allow clicking
        div.onclick = () => handleHelperClick(info.id); // Click handler

        div.style.display = 'flex';
        div.style.alignItems = 'center';

        const idSpan = document.createElement('span');
        idSpan.className = 'key-id';
        idSpan.textContent = info.id;
        idSpan.style.width = '24px';

        const valInput = document.createElement('input');
        valInput.className = 'key-val-input';
        valInput.dataset.cipherId = info.id;
        valInput.maxLength = 1;
        valInput.style.flex = '0 0 40px'; // Fixed width, don't grow
        valInput.style.width = '40px';
        valInput.style.height = '30px';
        valInput.style.textAlign = 'center';
        valInput.style.border = '1px solid #ddd';
        valInput.style.borderRadius = '4px';
        valInput.style.fontWeight = 'bold';
        valInput.style.textTransform = 'uppercase';
        valInput.style.margin = '0 auto'; // Center if container allows

        // Initial Layout
        if (mode === 'colors') {
            valInput.style.backgroundColor = info.color;
            valInput.style.color = '#fff';
            valInput.style.textShadow = '0 0 2px #000';
            valInput.style.border = 'none';
        } else if (mode === 'symbols') {
            valInput.placeholder = info.symbol; // Symbols can stay as hint? Or remove? User said "ei numerolla". Symbols are hints.
            valInput.style.fontSize = '1.2rem';
        } else {
            valInput.placeholder = ""; // Empty!
        }

        div.appendChild(idSpan);
        div.appendChild(valInput);
        container.appendChild(div);
    });

    updateHelpers(puzzle);
}

function updateHelpers(puzzle) {
    if (!puzzle) return;

    const mode = STATE.settings.displayMode;

    // Update Cipher Keys
    // Update Cipher Keys
    document.querySelectorAll('.key-val-input').forEach(el => {
        const id = el.dataset.cipherId;
        const letter = STATE.userProgress[id];

        // Only auto-fill if setting is enabled OR if we want to show 'current state'
        // User requested: "kun kirjoitan... se ilmestyy" (Step 1268) seems to imply they WANT this link.
        // But Step 1223 ("13=S") implied they didn't.
        // The synthesis: 
        // IF Auto-fill is ON -> It updates automatically AND propagates.
        // IF Auto-fill is OFF -> It is manual. 
        // The user complained about "13=S" when they thought it should be empty.
        // So we KEEP the check: Only update if autoFill is true.
        if (STATE.settings.autoFill && letter) {
            el.value = letter;
        }
        // If manual, we don't touch el.value programmatically from STATE.
        // User types into it directly.
    });
}

// Start the app
// Start the app
init();

function updateHeaderWidgets() {
    // 1. Name Day
    const ndWidget = document.getElementById('widget-nameday');
    if (ndWidget) {
        if (STATE.settings.showNameDay) {
            ndWidget.classList.remove('hidden');
            if (!STATE.nameDayData) fetchNameDays();
            else {
                const el = document.getElementById('nameday-text');
                if (el) el.textContent = STATE.nameDayData;
            }
        } else {
            ndWidget.classList.add('hidden');
        }
    }

    // 2. Weather
    const wWidget = document.getElementById('widget-weather');
    if (wWidget) {
        if (STATE.settings.showWeather) {
            wWidget.classList.remove('hidden');
            if (!STATE.weatherData) fetchWeather();
            else {
                const el = document.getElementById('weather-text');
                if (el) el.textContent = STATE.weatherData;
            }
        } else {
            wWidget.classList.add('hidden');
        }
    }

    // 3. Finance
    const fWidget = document.getElementById('widget-finance');
    if (fWidget) {
        if (STATE.settings.showFinance) {
            fWidget.classList.remove('hidden');
            if (!STATE.financeData) fetchFinance();
            else {
                const el = document.getElementById('finance-text');
                if (el) el.textContent = STATE.financeData;
            }
        } else {
            fWidget.classList.add('hidden');
        }
    }
}

function fetchNameDays() {
    // Mock for demo
    const today = new Date();
    const mockNames = ["Ilmari, Ilmo", "Anton, Anttoni, Toni", "Kari, Karri", "Heikki, Henrik", "Paavali, Pauli", "Joonatan", "Viljo"];
    const name = mockNames[today.getDay()] || "Matti, Teppo";
    STATE.nameDayData = name;

    const el = document.getElementById('nameday-text');
    if (el) el.textContent = name;
}

function fetchFinance() {
    // Mock Data
    const indices = ["OMXH25 +0.5%", "S&P500 -0.2%", "EUR/USD 1.09", "Bitcoin $95k"];
    const random = indices[Math.floor(Math.random() * indices.length)];
    STATE.financeData = random;

    const el = document.getElementById('finance-text');
    if (el) el.textContent = random;
}

function fetchWeather() {
    if (!navigator.geolocation) {
        STATE.weatherData = "Sijainti ei tuettu";
        const el = document.getElementById('weather-text');
        if (el) el.textContent = STATE.weatherData;
        return;
    }

    const el = document.getElementById('weather-text');
    if (el) el.textContent = "Haetaan...";

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&wind_speed_unit=ms&timeformat=unixtime`;
            const res = await fetch(url);
            const data = await res.json();

            const temp = Math.round(data.current.temperature_2m);
            // Simple weather code map could be added here
            STATE.weatherData = `${temp}°C`;
            if (el) el.textContent = STATE.weatherData;
        } catch (e) {
            console.error("Weather fetch failed", e);
            STATE.weatherData = "Virhe";
            if (el) el.textContent = STATE.weatherData;
        }
    }, (err) => {
        console.warn("Geolocation denied", err);
        STATE.weatherData = "Ei sijaintia";
        if (el) el.textContent = STATE.weatherData;
    });
}



function revealSolution(puzzle) {
    if (!confirm("Haluatko varmasti paljastaa ratkaisun? Peli päättyy.")) return;

    // Reveal Logic
    const correctIds = Object.keys(puzzle.cipher).map(char => puzzle.cipher[char].id);
    correctIds.forEach(id => {
        // Find char for this ID
        let char = null;
        for (const [key, val] of Object.entries(puzzle.cipher)) {
            if (val.id === id) char = key;
        }
        if (char) {
            STATE.userProgress[id] = char;
            STATE.unlockedIds.push(id); // Visually unlock too
        }
    });

    saveProgress();

    // Update visuals
    correctIds.forEach(id => updateAllCells(id));

    updateHelpers(puzzle);

    // Also unlock hard mode
    const overlay = document.getElementById('image-overlay');
    if (overlay) overlay.classList.add('hidden');
}

function resetGame() {
    if (!confirm("Haluatko varmasti aloittaa alusta? Kaikki edistyminen nollataan.")) return;

    // Reset State
    STATE.userProgress = {};
    STATE.unlockedIds = [];

    // Clear storage
    if (STATE.currentPuzzle) {
        localStorage.removeItem('dailyProgress_' + STATE.currentPuzzle.id);
    }

    // Hard Mode Reset
    const overlay = document.getElementById('image-overlay');
    if (overlay && STATE.settings.hardMode) {
        overlay.classList.remove('hidden');
    }

    // Re-render
    const puzzle = STATE.currentPuzzle;

    // Clear all cell contents
    document.querySelectorAll('.grid-cell').forEach(cell => {
        if (cell.dataset.cipherId) {
            const info = puzzle.cipher[cell.dataset.correctLetter];
            if (info) updateCellStyle(cell, info);
        }
    });

    updateHelpers(puzzle);
}







