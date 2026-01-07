// Lumivuodet Visualization - v1.0 (Winter Lanes)
// Author: Antigravity
// Date: 2026-01-07
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
        2023: { days: generateMockYearData(2023, 10) }
    }
};

let REAL_DATA = {}; // Cache for fetched data

function initApp() {
    const locationSelect = document.getElementById('locationSelect');

    // Check available years - for now static range 2000-2024
    // Ideally we would read this from metadata
    const availableYears = Array.from({ length: 25 }, (_, i) => 2024 - i);
    generateYearCheckboxes(availableYears, [2023, 2022]);

    // Initial render
    fetchAndRender();

    locationSelect.addEventListener('change', () => {
        fetchAndRender();
    });
}

async function fetchAndRender() {
    const location = document.getElementById('locationSelect').value;

    // Check if we have data for this location
    if (!REAL_DATA[location]) {
        try {
            const response = await fetch(`data/${location}.json`);
            if (response.ok) {
                REAL_DATA[location] = await response.json();
                console.log(`Loaded data for ${location}`);
            } else {
                console.warn(`No data found for ${location}, using mock.`);
            }
        } catch (e) {
            console.warn(`Fetch error for ${location}:`, e);
        }
    }

    updateVisualization();
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

    // Use Real Data if available, fallback to mock
    const locationData = REAL_DATA[location] || MOCK_DATA[location] || MOCK_DATA['helsinki'];

    selectedYears.forEach(year => {
        let days = [];

        // Check if we have real data for this year
        if (locationData[year] && Array.isArray(locationData[year])) {
            days = locationData[year];
        } else if (locationData[year] && locationData[year].days) {
            // Mock structure format
            days = locationData[year].days;
        } else {
            // Fallback to generator
            days = generateMockYearData(year);
        }

        const row = createYearRow(year, days);
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
        // Tooltip translation map
        const typeNames = {
            'snow': 'Lumi',
            'bare': 'Lumeton',
            'heat': 'Helle',
            'dry': 'Sateeton'
        };
        segDiv.title = typeNames[seg.type] || seg.type;
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

    // First Snow (Ensilumi)
    const firstSnowDayIndex = days.findIndex(d => d.snowDepth > 0);
    if (firstSnowDayIndex !== -1) {
        const dateStr = getDayDateString(year, firstSnowDayIndex);
        addMarker(bar, firstSnowDayIndex, `🌨 ${dateStr}`, `Ensilumi: ${dateStr}`, 'marker-first-snow', true);
    }

    // Max Temp (Helle)
    if (stats.maxTempIndex !== -1) {
        addMarker(bar, stats.maxTempIndex, `☀ ${stats.maxTemp}°`, 'Korkein lämpötila', 'marker-extreme-heat', true);
    }

    // Min Temp (Pakkanen)
    if (stats.minTempIndex !== -1) {
        addMarker(bar, stats.minTempIndex, `❄ ${stats.minTemp}°`, 'Alin lämpötila', 'marker-extreme-cold', true);
    }

    // Longest Dry Spell (Sateeton)
    if (stats.maxDrySpell > 3 && stats.maxDrySpellIndex !== -1) { // Only show significant spells (>3 days)
        const centerIndex = stats.maxDrySpellIndex - Math.floor(stats.maxDrySpell / 2);
        addMarker(bar, centerIndex, `🌵 ${stats.maxDrySpell}pv`, 'Pisin sateeton jakso', 'marker-dry-spell', true);
    }

    row.appendChild(bar);
    return row;
}

// Helper: Convert day index (0-364) to d.m. string
function getDayDateString(year, dayIndex) {
    const date = new Date(year, 0, 1);
    date.setDate(date.getDate() + dayIndex);
    return `${date.getDate()}.${date.getMonth() + 1}.`;
}

function calculateStats(days) {
    let minTemp = 100;
    let minTempIndex = -1;
    let maxTemp = -100;
    let maxTempIndex = -1;

    let maxDrySpell = 0;
    let maxDrySpellEndIndex = -1;

    let currentDrySpell = 0;

    days.forEach((day, index) => {
        // Handle different data formats (real vs mock)
        // Real: tempMin, tempMax, tempMean
        // Mock: temp
        const tMin = day.tempMin !== undefined ? day.tempMin : day.temp;
        const tMax = day.tempMax !== undefined ? day.tempMax : day.temp;
        const precip = day.precipitation !== undefined ? day.precipitation : 0;

        if (tMin < minTemp) {
            minTemp = tMin;
            minTempIndex = index;
        }
        if (tMax > maxTemp) {
            maxTemp = tMax;
            maxTempIndex = index;
        }

        // Dry spell logic (precipitation < 0.1)
        if (precip < 0.1) {
            currentDrySpell++;
        } else {
            if (currentDrySpell > maxDrySpell) {
                maxDrySpell = currentDrySpell;
                maxDrySpellEndIndex = index - 1;
            }
            currentDrySpell = 0;
        }
    });

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
        maxDrySpellIndex: maxDrySpellEndIndex
    };
}

function addMarker(container, dayIndex, content, title, extraClass = '', showLabel = false) {
    const marker = document.createElement('div');

    // Handle edges (First/Last 15 days) to avoid clipping
    let edgeClass = '';
    if (dayIndex < 15) {
        edgeClass = 'marker-left-edge';
        marker.style.left = '0%';
        // No left-position percentage for edge, just stick to side? 
        // Or keep correct pos but change transform.
        marker.style.left = `${(dayIndex / 365) * 100}%`;
    } else if (dayIndex > 350) {
        edgeClass = 'marker-right-edge';
        marker.style.left = `${(dayIndex / 365) * 100}%`;
    } else {
        marker.style.left = `${(dayIndex / 365) * 100}%`;
    }

    marker.className = `marker ${extraClass} ${edgeClass}`;
    marker.title = title;

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
