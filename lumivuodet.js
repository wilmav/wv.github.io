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
    const availableYears = [2023, 2022, 2021, 2020];
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

function createYearRow(year, days) {
    const row = document.createElement('div');
    row.className = 'year-row';

    const label = document.createElement('div');
    label.className = 'year-label';
    label.textContent = year;
    row.appendChild(label);

    const bar = document.createElement('div');
    bar.className = 'season-bar';

    // Render segments
    // Simple approach: map each day to a pixel slice? 
    // Or just identifying periods of snow vs no snow.

    // For CSS flex visual, we can group consecutive days.
    const segments = analyzeSegments(days);

    segments.forEach(seg => {
        const segDiv = document.createElement('div');
        // Calculate percentage width
        const totalDays = 365; // Approximate
        const widthPct = (seg.length / totalDays) * 100;

        segDiv.style.width = `${widthPct}%`;
        segDiv.className = `segment segment-${seg.type}`;
        segDiv.title = `${seg.start} - ${seg.end}: ${seg.type}`; // Tooltip
        bar.appendChild(segDiv);
    });

    // Add markers (First snow, etc)
    const firstSnowDayIndex = days.findIndex(d => d.snowDepth > 0);
    if (firstSnowDayIndex !== -1) {
        addMarker(bar, firstSnowDayIndex, '❄', 'Ensilumi');
    }

    // Add persistent melt marker (simplified: first day of 0 snow after long snow period)
    // TODO: stricter logic later

    row.appendChild(bar);
    return row;
}

function addMarker(container, dayIndex, symbol, title) {
    const marker = document.createElement('div');
    marker.className = 'marker';
    marker.textContent = symbol;
    marker.title = title;
    marker.style.left = `${(dayIndex / 365) * 100}%`;
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
        // Mock seasonality: Snow roughly Jan-April, Nov-Dec
        // Day 0 = Jan 1. Day 90 = ~April 1. Day 300 = ~Oct 27.
        let snowDepth = 0;

        const isWinterSpring = i < 90; // Jan-Mar
        const isLateAutumn = i > 310; // Nov-Dec

        if (isWinterSpring) {
            snowDepth = Math.max(0, 30 - (i * 0.3) + (Math.random() * 5) + snowBonus);
        } else if (isLateAutumn) {
            snowDepth = Math.max(0, (i - 310) * 0.5 + (Math.random() * 5) + snowBonus);
        }

        // Random melting days
        if (Math.random() > 0.95) snowDepth = 0;

        days.push({
            dayIndex: i,
            snowDepth: snowDepth > 1 ? snowDepth : 0, // Threshold
            temp: 0 // Not used yet
        });
    }
    return days;
}
