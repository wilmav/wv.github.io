document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

const MOCK_DATA = {
    helsinki: {
        2023: {
            days: generateMockYearData(2023)
        },
        2022: {
            days: generateMockYearData(2022)
        }
    },
    jyvaskyla: {
        2023: {
            days: generateMockYearData(2023, 10) // More snow
        },
        2022: {
            days: generateMockYearData(2022, 15)
        },
        2021: {
            days: generateMockYearData(2021, 5)
        }
    }
};

function initApp() {
    const locationSelect = document.getElementById('locationSelect');

    // Initialize years based on available data (mock for now, real later)
    // In real app, we might want to fetch available years from metadata
    const availableYears = Array.from({ length: 25 }, (_, i) => 2024 - i); // 2024...2000
    generateYearCheckboxes(availableYears, [2023, 2022]); // Default selected

    // Initial render
    updateVisualization();

    locationSelect.addEventListener('change', () => {
        updateVisualization();
    });
}

function generateYearCheckboxes(years, defaultSelected) {
    const container = document.getElementById('yearSelector');
    container.innerHTML = '';

    years.forEach(year => {
        const label = document.createElement('label');
        label.className = 'year-checkbox';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = year;
        checkbox.checked = defaultSelected.includes(year);
        checkbox.addEventListener('change', updateVisualization);

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(year));

        container.appendChild(label);
    });
}

function updateVisualization() {
    const location = document.getElementById('locationSelect').value;
    const selectedYears = Array.from(document.querySelectorAll('#yearSelector input:checked'))
        .map(cb => parseInt(cb.value))
        .sort((a, b) => b - a); // Newest first

    renderVisualization(location, selectedYears);
}

function renderVisualization(location, selectedYears) {
    const container = document.getElementById('visualizationContainer');
    container.innerHTML = ''; // Clear previous

    if (selectedYears.length === 0) {
        container.innerHTML = '<p class="lead" style="text-align:center; padding:2rem;">Valitse ainakin yksi vuosi.</p>';
        return;
    }

    const data = MOCK_DATA[location] || MOCK_DATA['helsinki']; // Fallback

    // Note: In real app, we might mix years (e.g. winter 2023-2024). 
    // The concept says "tammikuu-joulukuu", but for winter comparison "July-June" or "Sept-May" might be better?
    // Prompt image says: "tammikuu-joulukuu" (Jan-Dec). We stick to that.

    selectedYears.forEach(year => {
        // Mock data generation if missing from static mock
        let yearData = data[year];
        if (!yearData) {
            yearData = { days: generateMockYearData(year) };
        }

        const row = createYearRow(year, yearData.days);
        container.appendChild(row);
    });
}

// Helper for month names
const MONTHS_FI = ['Tammi', 'Helmi', 'Maalis', 'Huhti', 'Touko', 'Kesä', 'Heinä', 'Elo', 'Syys', 'Loka', 'Marras', 'Joulu'];

function createYearRow(year, days) {
    const row = document.createElement('div');
    row.className = 'year-row';

    // Info/Stats block
    const stats = calculateStats(days);

    // Left side label
    const label = document.createElement('div');
    label.className = 'year-label';
    label.innerHTML = `
        <div style="font-size:1.1rem; margin-bottom:0.2rem;">${year}</div>
        <!-- Stats are now visual, but kept small here as summary if needed, or removed? 
             User asked for visual timeline. We can keep summary for quick reading. -->
         <div class="year-stats" style="font-size:0.75rem; color:#666;">
            Stats janalla &rarr;
        </div>
    `;
    row.appendChild(label);

    const bar = document.createElement('div');
    bar.className = 'season-bar';

    // 1. Render segments into a track (to clip them but not labels)
    const track = document.createElement('div');
    track.className = 'bar-track';

    const segments = analyzeSegments(days);

    segments.forEach(seg => {
        const segDiv = document.createElement('div');
        const widthPct = (seg.length / 365) * 100;

        segDiv.style.width = `${widthPct}%`;
        segDiv.className = `segment segment-${seg.type}`;
        segDiv.title = `${seg.type}`; // Tooltip
        track.appendChild(segDiv);
    });
    bar.appendChild(track);

    // 2. Render Month Grid Overlay
    const gridOverlay = document.createElement('div');
    gridOverlay.className = 'months-overlay';

    MONTHS_FI.forEach(mName => {
        const tick = document.createElement('div');
        tick.className = 'month-tick';
        tick.innerHTML = `<span class="month-label">${mName}</span>`;
        gridOverlay.appendChild(tick);
    });
    bar.appendChild(gridOverlay);

    // 3. Add Markers
    // Note: Markers are children of 'bar', so they are positioned relative to bar
    // They should have z-index > overlay

    // First Snow
    const firstSnowDayIndex = days.findIndex(d => d.snowDepth > 0);
    if (firstSnowDayIndex !== -1) {
        addMarker(bar, firstSnowDayIndex, '❄', 'Ensilumi', 'marker-first-snow');
    }

    // Max Temp
    if (stats.maxTempIndex !== -1) {
        addMarker(bar, stats.maxTempIndex, `☀ ${stats.maxTemp}°`, 'Korkein lämpötila', 'marker-extreme-heat', true);
    }

    // Min Temp
    if (stats.minTempIndex !== -1) {
        addMarker(bar, stats.minTempIndex, `❄ ${stats.minTemp}°`, 'Alin lämpötila', 'marker-extreme-cold', true);
    }

    // Longest Dry Spell (Center of the spell)
    if (stats.maxDrySpell > 0 && stats.maxDrySpellIndex !== -1) {
        // Calculate center of the spell
        const centerIndex = stats.maxDrySpellIndex - Math.floor(stats.maxDrySpell / 2);
        // Maybe an icon?
        addMarker(bar, centerIndex, `🌵 ${stats.maxDrySpell}pv`, 'Pisin sateeton jakso', '', true);
    }

    row.appendChild(bar);
    return row;
}

function calculateStats(days) {
    let minTemp = 100;
    let minTempIndex = -1;
    let maxTemp = -100;
    let maxTempIndex = -1;

    let maxDrySpell = 0;
    let maxDrySpellEndIndex = -1; // This will store the index of the last day of the longest dry spell

    let currentDrySpell = 0;
    let currentDrySpellStartIndex = -1;

    days.forEach((day, index) => {
        if (day.temp < minTemp) {
            minTemp = day.temp;
            minTempIndex = index;
        }
        if (day.temp > maxTemp) {
            maxTemp = day.temp;
            maxTempIndex = index;
        }

        // Dry spell logic (precipitation < 0.1)
        if (day.precipitation < 0.1) {
            if (currentDrySpell === 0) { // Start of a new dry spell
                currentDrySpellStartIndex = index;
            }
            currentDrySpell++;
        } else {
            if (currentDrySpell > maxDrySpell) {
                maxDrySpell = currentDrySpell;
                maxDrySpellEndIndex = index - 1; // The day before precipitation occurred
            }
            currentDrySpell = 0;
            currentDrySpellStartIndex = -1;
        }
    });
    // Check last spell if it extends to the end of the year
    if (currentDrySpell > maxDrySpell) {
        maxDrySpell = currentDrySpell;
        maxDrySpellEndIndex = days.length - 1;
    }

    return {
        minTemp: minTemp.toFixed(1),
        minTempIndex,
        maxTemp: maxTemp.toFixed(1),
        maxTempIndex,
        maxDrySpell,
        maxDrySpellIndex: maxDrySpellEndIndex // Renamed for clarity, it's the end index
    };
}

function addMarker(container, dayIndex, content, title, extraClass = '', showLabel = false) {
    const marker = document.createElement('div');
    marker.className = `marker ${extraClass}`;
    marker.title = title;
    marker.style.left = `${(dayIndex / 365) * 100}%`;

    if (showLabel) {
        // Content is text + icon
        marker.innerHTML = `<span class="marker-label">${content}</span>`;
    } else {
        // Just icon
        marker.textContent = content;
    }

    container.appendChild(marker);
}

function analyzeSegments(days) {
    const segments = [];
    let currentType = days[0].snowDepth > 0 ? 'snow' : 'bare';
    let currentLength = 0;
    let startIndex = 0;

    days.forEach((day, index) => {
        const type = day.snowDepth > 0 ? 'snow' : 'bare';

        if (type !== currentType) {
            segments.push({
                type: currentType,
                start: startIndex,
                end: index - 1,
                length: currentLength
            });
            currentType = type;
            currentLength = 0;
            startIndex = index;
        }
        currentLength++;
    });

    // Push last
    segments.push({
        type: currentType,
        start: startIndex,
        end: days.length - 1,
        length: currentLength
    });

    return segments;
}

// Helper to generate fake data
function generateMockYearData(year, snowBonus = 0) {
    const days = [];
    const daysInYear = 365;

    for (let i = 0; i < daysInYear; i++) {
        let snowDepth = 0;
        let temp = 0;
        let precipitation = 0;

        // Mock seasonality
        const isWinter = i < 90 || i > 310;
        const isSummer = i > 150 && i < 240;

        // Temp
        if (isWinter) {
            temp = -5 + (Math.random() * 10) - 10; // -15 to +5
        } else if (isSummer) {
            temp = 15 + (Math.random() * 15); // 15 to 30
        } else {
            temp = 5 + (Math.random() * 10); // 5 to 15
        }

        // Snow
        if (isWinter && temp < 0) {
            snowDepth = Math.max(0, 30 + (Math.random() * 20) + snowBonus);
        }

        // Precipitation (random dry spells)
        if (Math.random() > 0.7) {
            precipitation = Math.random() * 10;
        } else {
            precipitation = 0;
        }

        days.push({
            dayIndex: i,
            snowDepth: snowDepth > 0 ? snowDepth : 0,
            temp: temp,
            precipitation: precipitation
        });
    }
    return days;
}
