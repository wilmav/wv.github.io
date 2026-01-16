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

const defaultSettings = {
    hardMode: false,
    autoFill: true,
    showTimer: false,
    displayMode: 'colors',
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
    nameDayData: null
};

// ...

function saveSettings() {
    STATE.settings.displayMode = document.getElementById('display-mode').value;
    STATE.settings.colorTheme = document.getElementById('color-theme').value;
    STATE.settings.symbolTheme = document.getElementById('symbol-theme').value;
    STATE.settings.darkMode = document.getElementById('dark-mode-toggle').checked;

    STATE.settings.hardMode = document.getElementById('hard-mode-toggle').checked;
    STATE.settings.showTimer = document.getElementById('timer-toggle').checked;

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

    const darkModeEl = document.getElementById('dark-mode-toggle');
    if (darkModeEl) darkModeEl.checked = STATE.settings.darkMode;

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
}

function updateCellStyle(cell, cipherInfo) {
    const isHardMode = STATE.settings.hardMode;
    const isUnlocked = !isHardMode || STATE.unlockedIds.includes(cipherInfo.id);
    const mode = STATE.settings.displayMode;
    const isSolved = STATE.userProgress[cipherInfo.id];

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

const MOCK_DATA = {
    "date": "2026-01-16",
    "id": "daily-2026-01-16",
    "image_url": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1",
    "image_clue": "TARUELÄIN",
    "grid": [
        ["K", "A", "L", "A", "S", "T", "U", "S", ".", "V", "E", "N", "E"],
        [".", "L", ".", "U", ".", "U", ".", "A", "L", "E", ".", "I", "."],
        ["P", "A", "I", "K", "K", "A", ".", "T", ".", "T", "O", "R", "I"],
        [".", "S", ".", "E", ".", "R", "A", "A", "K", "A", ".", "U", "."],
        ["V", "I", "R", "T", "A", ".", ".", ".", ".", "V", "E", "S", "I"],
        [".", ".", ".", ".", "IMG", "IMG", "IMG", "IMG", ".", ".", ".", ".", "."],
        ["M", "E", "R", "I", "IMG", "IMG", "IMG", "IMG", "L", "A", "I", "V", "A"],
        [".", ".", ".", ".", "IMG", "IMG", "IMG", "IMG", ".", ".", ".", ".", "."],
        ["S", "A", "T", "A", "IMG", "IMG", "IMG", "IMG", ".", ".", "K", "U", "U"],
        [".", "A", ".", "J", ".", "K", "A", "L", "L", "I", "O", ".", "."],
        ["L", "A", "I", "T", "U", "R", "I", ".", "O", ".", "T", "Y", "Ö"],
        [".", "M", ".", "U", ".", ".", "M", "A", "I", "S", "E", "M", "A"],
        ["S", "U", "M", "S", ".", "K", "A", "I", "T", "S", "U", ".", "."]
    ],
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
        "Ä": { "id": 18, "color": "#e5447a", "symbol": "☃" }
    },
    "width": 13,
    "height": 13
};

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
    try {
        // For dev: load mock data
        const response = await fetch('puzzles/mock.json');
        if (!response.ok) throw new Error("Fetch failed");
        const data = await response.json();
        STATE.currentPuzzle = data;
        setupGame(data);
    } catch (e) {
        console.warn("Failed to load puzzle (likely CORS), using embedded mock:", e);
        STATE.currentPuzzle = MOCK_DATA;
        setupGame(MOCK_DATA);
    }
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
                                    </div>
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

    // Focus invisible input if we want native keyboard, 
    // but we are using virtual mainly.
}

function handleInput(char) {
    if (!STATE.selectedCell) return;

    const cipherId = STATE.selectedCell.dataset.cipherId;
    if (!cipherId) return;

    // Update Logic
    STATE.userProgress[cipherId] = char;
    saveProgress(); // Save on input
    updateHelpers(STATE.currentPuzzle);

    // Auto-fill Check
    if (STATE.settings.autoFill) {
        updateAllCells(cipherId);
    } else {
        // Only update this specific cell visually
        // Note: This creates a disconnect where other cells of same ID are not updated
        // But the underlying STATE is updated. 
        // We probably simply re-render this one cell.
        const puzzle = STATE.currentPuzzle;
        let correctLetter = null;
        for (const [letter, info] of Object.entries(puzzle.cipher)) {
            if (info.id == cipherId) correctLetter = letter;
        }
        const cipherInfo = puzzle.cipher[correctLetter];

        // Render just the selected cell
        while (STATE.selectedCell.firstChild) STATE.selectedCell.removeChild(STATE.selectedCell.firstChild);
        updateCellStyle(STATE.selectedCell, cipherInfo);
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
    localStorage.setItem('dailyPuzzleSettings', JSON.stringify(STATE.settings));

    // Refresh grid if display mode changed
    if (STATE.currentPuzzle) {
        renderGrid(STATE.currentPuzzle);
        renderCipherKeys(STATE.currentPuzzle); // Also refresh helpers
    }

    updateTimerUI();
}

function loadSettings() {
    const saved = localStorage.getItem('dailyPuzzleSettings');
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

    const ndToggle = document.getElementById('widget-nameday-toggle');
    if (ndToggle) ndToggle.checked = STATE.settings.showNameDay;

    const wToggle = document.getElementById('widget-weather-toggle');
    if (wToggle) wToggle.checked = STATE.settings.showWeather;

    const fToggle = document.getElementById('widget-finance-toggle');
    if (fToggle) fToggle.checked = STATE.settings.showFinance;

    updateTimerUI();
    updateHeaderWidgets();
}

function saveProgress() {
    if (!STATE.currentPuzzle) return;
    const key = `dailyProgress_${STATE.currentPuzzle.id}`;
    const data = {
        userProgress: STATE.userProgress,
        unlockedIds: STATE.unlockedIds,
        timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(data));
}

function loadProgress(puzzleId) {
    const key = `dailyProgress_${puzzleId}`;
    const saved = localStorage.getItem(key);
    if (saved) {
        try {
            const data = JSON.parse(saved);
            // Verify date/id match if needed, but key implies it
            STATE.userProgress = data.userProgress || {};
            STATE.unlockedIds = data.unlockedIds || [];
        } catch (e) {
            console.warn("Failed to parse progress", e);
        }
    }
}

function applyTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
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
        const div = document.createElement('div');
        div.className = 'cipher-key-cell';

        const idSpan = document.createElement('span');
        idSpan.className = 'key-id';
        idSpan.textContent = info.id;
        idSpan.style.width = '24px';

        const valSpan = document.createElement('div');
        valSpan.className = 'key-val';
        valSpan.dataset.cipherId = info.id;
        valSpan.dataset.originalSymbol = info.symbol; // Store for reuse
        valSpan.dataset.originalColor = info.color;   // Store for reuse

        valSpan.style.flex = '1';
        valSpan.style.height = '24px';
        valSpan.style.display = 'flex';
        valSpan.style.alignItems = 'center';
        valSpan.style.justifyContent = 'center';
        valSpan.style.borderRadius = '4px';
        valSpan.style.fontWeight = 'bold';

        // Initial Render
        if (mode === 'colors') {
            valSpan.style.backgroundColor = info.color;
            valSpan.style.color = '#fff'; // Assume white text for contrast on colors
            valSpan.style.textShadow = '0 0 2px #000'; // Shadow for readability
        } else if (mode === 'symbols') {
            valSpan.textContent = info.symbol;
            valSpan.style.fontSize = '1.2rem';
            valSpan.style.color = '#000';
            valSpan.style.background = '#fff';
        } else {
            // Numbers
            valSpan.textContent = info.id;
            valSpan.style.color = '#000';
            valSpan.style.background = '#fff';
        }

        div.appendChild(idSpan);
        div.appendChild(valSpan);
        container.appendChild(div);
    });

    updateHelpers(puzzle);
}

function updateHelpers(puzzle) {
    if (!puzzle) return;

    const mode = STATE.settings.displayMode;

    // Update Cipher Keys
    document.querySelectorAll('.key-val').forEach(el => {
        const id = el.dataset.cipherId;
        const letter = STATE.userProgress[id];

        if (mode === 'colors') {
            el.style.backgroundColor = el.dataset.originalColor; // Restore color
            if (letter) {
                el.textContent = letter;
                // Ensure visibility on color
                el.style.color = '#fff';
                el.style.textShadow = '0 1px 2px rgba(0,0,0,0.8)';
            } else {
                el.textContent = '';
            }
        } else if (mode === 'symbols') {
            const sym = el.dataset.originalSymbol;
            if (letter) {
                // "vieressä" -> Symbol Letter
                el.textContent = `${sym} ${letter}`;
                el.style.fontSize = '0.9rem'; // Slightly smaller to fit both
            } else {
                el.textContent = sym;
                el.style.fontSize = '1.2rem';
            }
        } else {
            // Numbers
            if (letter) {
                el.textContent = letter; // Just show letter for numbers mode, or "1 = A"
            } else {
                el.textContent = id;
            }
        }
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


