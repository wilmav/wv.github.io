/**
 * SpotVaiFix.js
 * Electricity price comparison logic
 */

const SPOT_API_CURRENT = "https://api.spot-hinta.fi/JustNow";
const SPOT_API_TODAY = "https://api.spot-hinta.fi/Today";

const CITIES = {
    "Helsinki": { lat: 60.17, lon: 24.94 },
    "Espoo": { lat: 60.21, lon: 24.66 },
    "Tampere": { lat: 61.50, lon: 23.79 },
    "Vantaa": { lat: 60.29, lon: 25.04 },
    "Oulu": { lat: 65.01, lon: 25.47 },
    "Turku": { lat: 60.45, lon: 22.27 },
    "Jyväskylä": { lat: 62.24, lon: 25.75 },
    "Kuopio": { lat: 62.89, lon: 27.68 },
    "Lahti": { lat: 60.98, lon: 25.66 },
    "Pori": { lat: 61.48, lon: 21.80 },
    "Kouvola": { lat: 60.87, lon: 26.70 },
    "Joensuu": { lat: 62.60, lon: 29.76 },
    "Lappeenranta": { lat: 61.06, lon: 28.19 },
    "Hämeenlinna": { lat: 61.00, lon: 24.46 },
    "Vaasa": { lat: 63.10, lon: 21.62 },
    "Seinäjoki": { lat: 62.79, lon: 22.84 },
    "Rovaniemi": { lat: 66.50, lon: 25.73 },
    "Mikkeli": { lat: 61.69, lon: 27.27 },
    "Kotka": { lat: 60.47, lon: 26.94 },
    "Salo": { lat: 60.38, lon: 23.13 },
    "Porvoo": { lat: 60.39, lon: 25.66 },
    "Kokkola": { lat: 63.84, lon: 23.13 },
    "Hyvinkää": { lat: 60.63, lon: 24.86 },
    "Lohja": { lat: 60.25, lon: 24.07 },
    "Järvenpää": { lat: 60.47, lon: 25.09 },
    "Nurmijärvi": { lat: 60.46, lon: 24.81 },
    "Rauma": { lat: 61.13, lon: 21.50 },
    "Kirkkonummi": { lat: 60.12, lon: 24.44 },
    "Tuusula": { lat: 60.40, lon: 25.03 },
    "Kajaani": { lat: 64.23, lon: 27.73 }
};

// UI Elements
const spotMarginInput = document.getElementById("spotMargin");
const spotBasicFeeInput = document.getElementById("spotBasicFee");
const fixedPriceInput = document.getElementById("fixedPrice");
const fixedBasicFeeInput = document.getElementById("fixedBasicFee");
const monthlyConsumptionInput = document.getElementById("monthlyConsumption");
const citySelect = document.getElementById("citySelect");

// UI Elements - Dual estimates
const spotCurrentCostEl = document.getElementById("spotCurrentCost");
const spotCurrentPriceEl = document.getElementById("spotCurrentPrice");
const spotHistoricalCostEl = document.getElementById("spotHistoricalCost");
const spotHistoricalPriceEl = document.getElementById("spotHistoricalPrice");
const fixedTotalCostEl = document.getElementById("fixedTotalCost");
const fixedAvgPriceEl = document.getElementById("fixedAvgPrice");
const verdictEl = document.getElementById("verdict");
const currentSpotPriceValueEl = document.getElementById("currentSpotPriceValue");

const spotCurrentBarEl = document.getElementById("spotCurrentBar");
const spotHistoricalBarEl = document.getElementById("spotHistoricalBar");
const fixedBarEl = document.getElementById("fixedBar");

const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const updateHistoryBtn = document.getElementById("updateHistoryBtn");
const historyChartCanvas = document.getElementById("historyChart");

const ALV_PERCENT = 25.5; // Current ALV in Finland

let currentSpotPrice = null;
let historicalAvgPrice = null; // This will become the dynamic range average
let previousMonthAvgPrice = null; // This stays fixed as previous calendar month
let historicalDateRange = { start: null, end: null };
let historyChart = null;
let cachedPrices = [];
let cachedWeather = [];

// Initialization
async function init() {
    setDefaultDates();
    initCitySelector();
    loadSettings();
    await fetchSpotPrices();
    await fetchHistoricalAverage(); // Fetch previous calendar month
    historicalAvgPrice = previousMonthAvgPrice; // Default comparison to previous month
    calculateComparison();
    await updateHistory();

    // Initialize Flatpickr with Finnish locale
    const fpConfig = {
        locale: "fi",
        dateFormat: "Y-m-d",
        altInput: true,
        altFormat: "d.m.Y",
        allowInput: true,
        maxDate: new Date() // Restrict to today max
    };

    const startPicker = flatpickr("#startDate", {
        ...fpConfig,
        onChange: function (selectedDates, dateStr, instance) {
            endPicker.set('minDate', dateStr);
        }
    });

    const endPicker = flatpickr("#endDate", {
        ...fpConfig,
        onChange: function (selectedDates, dateStr, instance) {
            startPicker.set('maxDate', dateStr);
        }
    });

    // Event Listeners
    [spotMarginInput, spotBasicFeeInput, fixedPriceInput, fixedBasicFeeInput, monthlyConsumptionInput].forEach(input => {
        input.addEventListener("input", () => {
            saveSettings();
            calculateComparison();
            if (historyChart) historyChart.update(); // Update baseline if chart exists
        });
    });

    updateHistoryBtn.addEventListener("click", updateHistory);
    citySelect.addEventListener("change", () => {
        saveSettings();
        // If chart exists, updating just the legend text immediately would be nice,
        // but to change data we need to fetch new weather.
        // Let's trigger updateHistory() if checking history is active?
        // Or just let user click "Päivitä historia".
        // The prompt implies "lisää... ja sen pohjalta lisää legendaan". 
        // Best UX: trigger updateHistory() automatically or just waiting?
        // Let's wait for button click to avoid heavy traffic on every change, 
        // BUT for a smooth experience, maybe we should auto-update if the user just changed the city.
        // Let's stick to updateHistoryBtn for the heavy fetch, but maybe update the chart title if possible?
        // Actually weather needs to be re-fetched. So manual update is safer.
        // However, I'll allow the user to click the button.
    });

    // Theme Change Observer
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                // If chart exists and we have cached data, re-render
                if (historyChart && cachedPrices.length > 0) {
                    renderHistoryChart(cachedPrices, cachedWeather);
                }
            }
        });
    });

    observer.observe(document.body, { attributes: true });
}

function initCitySelector() {
    const sortedCities = Object.keys(CITIES).sort();
    sortedCities.forEach(city => {
        const option = document.createElement("option");
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
    });
    // Default to Helsinki
    citySelect.value = "Helsinki";
}

// Set default dates to the previous calendar month
// Set default dates to: Yesterday AND one month back from yesterday
function setDefaultDates() {
    const now = new Date();
    // Eilinen
    now.setDate(now.getDate() - 1);

    // Loppupäivä = Eilinen
    const endYear = now.getFullYear();
    const endMonth = String(now.getMonth() + 1).padStart(2, '0');
    const endDay = String(now.getDate()).padStart(2, '0');
    const endStr = `${endYear}-${endMonth}-${endDay}`;

    // Alkupäivä = Eilinen - 1 kk
    const startObj = new Date(now);
    startObj.setMonth(startObj.getMonth() - 1);

    const startYear = startObj.getFullYear();
    const startMonth = String(startObj.getMonth() + 1).padStart(2, '0');
    const startDay = String(startObj.getDate()).padStart(2, '0');
    const startStr = `${startYear}-${startMonth}-${startDay}`;

    startDateInput.value = startStr;
    endDateInput.value = endStr;

    // Max date handled by Flatpickr config in init()
}

// Fetch current spot price for display
async function fetchSpotPrices() {
    try {
        // Use sahkotin.fi which supports CORS and 15-min (if available)
        // Fetch valid range: 6 hour back and 6 forward to ensure coverage
        const now = new Date();
        const start = new Date(now.getTime() - 21600000); // -6h
        const end = new Date(now.getTime() + 21600000);   // +6h

        const startStr = start.toISOString();
        const endStr = end.toISOString();

        const response = await fetch(`https://sahkotin.fi/prices?vat&quarter&start=${startStr}&end=${endStr}`);
        if (!response.ok) throw new Error("Price fetch failed");
        const data = await response.json();

        // Find price matching current time
        // We need the *latest* point that is in the past/present
        // Since data.prices is usually chronological, we can filter <= and take last?
        // Or find logic?
        // Let's grab all points <= now, and take the last one (most recent start time)
        const validPoints = data.prices.filter(p => new Date(p.date) <= now);

        if (validPoints.length > 0) {
            const latest = validPoints[validPoints.length - 1];
            // Value is EUR/MWh (with tax if ?vat used). 
            // 1 EUR/MWh = 0.1 snt/kWh.
            // Wait: 100 EUR/MWh = 10 snt/kWh.
            // So divide by 10.
            currentSpotPrice = latest.value / 10;
        } else {
            throw new Error("No current price found");
        }

        const formattedPrice = currentSpotPrice.toFixed(2).replace('.', ',');
        currentSpotPriceValueEl.innerHTML = `${formattedPrice} <span class="hero-unit">snt / kWh</span>`;
    } catch (error) {
        console.error("Error fetching spot prices:", error);
        currentSpotPriceValueEl.textContent = "Virhe haettaessa";
    }
}

// Fetch historical average from PREVIOUS MONTH (Rolling 30 days ending yesterday)
async function fetchHistoricalAverage() {
    try {
        const now = new Date();
        now.setDate(now.getDate() - 1); // Eilinen

        // Rolling month: Yesterday and Yesterday - 1 month
        const endDayDate = new Date(now);

        const startDayDate = new Date(now);
        startDayDate.setMonth(startDayDate.getMonth() - 1);

        const startStr = `${startDayDate.getFullYear()}-${String(startDayDate.getMonth() + 1).padStart(2, '0')}-${String(startDayDate.getDate()).padStart(2, '0')}`;
        const endStr = `${endDayDate.getFullYear()}-${String(endDayDate.getMonth() + 1).padStart(2, '0')}-${String(endDayDate.getDate()).padStart(2, '0')}`;

        // Päivitä päivämääränäyttö
        const formatDate = (d) => `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;
        document.getElementById("fixedPeriodDates").textContent = `(${formatDate(startDayDate)} - ${formatDate(endDayDate)})`;

        const url = `https://sahkotin.fi/prices?fix&vat&quarter&start=${startStr}T00:00:00.000Z&end=${endStr}T23:59:59.999Z`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Historical price fetch failed");
        const data = await res.json();

        const pricesArray = data.prices || data;
        if (Array.isArray(pricesArray) && pricesArray.length > 0) {
            const total = pricesArray.reduce((acc, p) => acc + p.value, 0);
            previousMonthAvgPrice = total / pricesArray.length;
        } else {
            previousMonthAvgPrice = currentSpotPrice || 8.0;
        }
    } catch (error) {
        console.error("Error fetching historical average:", error);
        previousMonthAvgPrice = currentSpotPrice || 8.0;
        document.getElementById("fixedPeriodDates").textContent = "(Tietoja ei saatavilla)";
    }
}

// Calculations
function calculateComparison() {
    const margin = parseFloat(spotMarginInput.value) || 0;
    const spotBasic = parseFloat(spotBasicFeeInput.value) || 0;
    const fixedPrice = parseFloat(fixedPriceInput.value) || 0;
    const fixedBasic = parseFloat(fixedBasicFeeInput.value) || 0;
    const consumption = parseFloat(monthlyConsumptionInput.value) || 0;

    // Error handling - check if we have valid price data
    if (!currentSpotPrice || !previousMonthAvgPrice) {
        spotCurrentCostEl.textContent = "Ladataan...";
        spotCurrentPriceEl.textContent = "Haetaan hintoja";
        spotHistoricalCostEl.textContent = "Ladataan...";
        spotHistoricalPriceEl.textContent = "Haetaan hintoja";
        return;
    }

    // Spot Calculation - Current hourly price
    const effectiveCurrentSpotPrice = currentSpotPrice + margin;
    const spotCurrentMonthlyCost = (effectiveCurrentSpotPrice * consumption / 100) + spotBasic;

    // Spot Calculation - PREVIOUS MONTH (always stays the same)
    const effectivePrevMonthSpotPrice = previousMonthAvgPrice + margin;
    const spotPrevMonthMonthlyCost = (effectivePrevMonthSpotPrice * consumption / 100) + spotBasic;

    // Spot Calculation - SELECTED RANGE (for verdict/graph)
    const currentHistAvg = historicalAvgPrice || previousMonthAvgPrice;
    const effectiveSelectedSpotPrice = currentHistAvg + margin;
    const spotSelectedMonthlyCost = (effectiveSelectedSpotPrice * consumption / 100) + spotBasic;

    // Fixed Calculation
    const fixedMonthlyCost = (fixedPrice * consumption / 100) + fixedBasic;

    // Update UI - Current estimate
    spotCurrentCostEl.textContent = `${spotCurrentMonthlyCost.toFixed(2).replace('.', ',')} €/kk`;
    spotCurrentPriceEl.textContent = `${effectiveCurrentSpotPrice.toFixed(2).replace('.', ',')} snt/kWh (sis. marginaali)`;

    // Update UI - Fixed Previous Month box (as requested: "ei muutu")
    spotHistoricalCostEl.textContent = `${spotPrevMonthMonthlyCost.toFixed(2).replace('.', ',')} €/kk`;
    spotHistoricalPriceEl.textContent = `${effectivePrevMonthSpotPrice.toFixed(2).replace('.', ',')} snt/kWh (sis. marginaali)`;

    // Update UI - Fixed
    fixedTotalCostEl.textContent = `${fixedMonthlyCost.toFixed(2).replace('.', ',')} €/kk`;
    fixedAvgPriceEl.textContent = `${fixedPrice.toFixed(2).replace('.', ',')} snt/kWh`;

    // Verdict and Graph use the SELECTED range (dynamic)
    updateVerdict(spotCurrentMonthlyCost, spotSelectedMonthlyCost, fixedMonthlyCost);
    updateGraph(spotCurrentMonthlyCost, spotSelectedMonthlyCost, fixedMonthlyCost);
}

function updateGraph(spotCurrent, spotHistorical, fixed) {
    const max = Math.max(spotCurrent, spotHistorical, fixed, 1);
    const spotCurrentWidth = (spotCurrent / max * 100).toFixed(1);
    const spotHistoricalWidth = (spotHistorical / max * 100).toFixed(1);
    const fixedWidth = (fixed / max * 100).toFixed(1);

    spotCurrentBarEl.style.width = `${spotCurrentWidth}%`;
    spotHistoricalBarEl.style.width = `${spotHistoricalWidth}%`;
    fixedBarEl.style.width = `${fixedWidth}%`;
}

function updateVerdict(spotCurrent, spotHistorical, fixedCost) {
    // Determine the relevant spot price for comparison (using the selected historical range as primary context)
    // Actually, usually users compare "Should I switch to Spot?" using historical data as the "realistic" expectation.
    // The previous prompt text was "Pörssisähkö valitun ajanjakson keskiarvolla..." implies we prioritize spotHistorical for the text logic.

    // We compare spotHistorical to fixedCost for the main "winner" text, as spotCurrent is "theoretical".
    const spotVal = spotHistorical;
    const diff = Math.abs(spotVal - fixedCost).toFixed(2).replace('.', ',');

    if (spotVal < fixedCost) {
        verdictEl.textContent = `Pörssisähkö valitun ajanjakson keskiarvolla on n. ${diff} € halvempi kuukaudessa kuin kiinteähintainen.`;
        verdictEl.className = "verdict-box spot-win";
    } else {
        verdictEl.textContent = `Kiinteähintainen sopimus valitulla ajanjaksolla on n. ${diff} € halvempi kuukaudessa kuin pörssisähkö.`;
        verdictEl.className = "verdict-box fixed-win";
    }
}

// Local Storage
function saveSettings() {
    const settings = {
        spotMargin: spotMarginInput.value,
        fixedBasicFee: fixedBasicFeeInput.value,
        monthlyConsumption: monthlyConsumptionInput.value,
        selectedCity: citySelect.value
    };
    localStorage.setItem("spotVaiFixSettings", JSON.stringify(settings));
}

function loadSettings() {
    const raw = localStorage.getItem("spotVaiFixSettings");
    if (!raw) return;
    try {
        const settings = JSON.parse(raw);
        if (settings) {
            spotMarginInput.value = settings.spotMargin || "0.50";
            spotBasicFeeInput.value = settings.spotBasicFee || "4.50";
            fixedPriceInput.value = settings.fixedPrice || "8.50";
            fixedBasicFeeInput.value = settings.fixedBasicFee || "3.90";
            monthlyConsumptionInput.value = settings.monthlyConsumption || "300";
            if (settings.selectedCity && CITIES[settings.selectedCity]) {
                citySelect.value = settings.selectedCity;
            }
        }
    } catch (e) {
        console.error("Error loading settings:", e);
    }
}

// Historical Data and Charts
async function updateHistory() {
    updateHistoryBtn.disabled = true;
    updateHistoryBtn.textContent = "Ladataan...";

    try {
        const start = startDateInput.value;
        const end = endDateInput.value;

        const [prices, weather] = await Promise.all([
            fetchHistoricalPrices(start, end),
            fetchHistoricalWeather(start, end)
        ]);

        // Calculate average for the selected range
        if (prices.length > 0) {
            const total = prices.reduce((acc, p) => acc + p.v, 0);
            historicalAvgPrice = total / prices.length;
        }

        // Cache data for theme switching
        cachedPrices = prices;
        cachedWeather = weather;

        renderHistoryChart(prices, weather);
        calculateComparison(); // Update verdict and bars based on new selected range
    } catch (e) {
        console.error("History update failed", e);
    } finally {
        updateHistoryBtn.disabled = false;
        updateHistoryBtn.textContent = "Päivitä historia";
    }
}

async function fetchHistoricalPrices(start, end) {
    // Correct Sahkotin URL format with fix (snt/kWh) and vat included. Add quarter for 15-min resolution.
    const url = `https://sahkotin.fi/prices?fix&vat&quarter&start=${start}T00:00:00.000Z&end=${end}T23:59:59.999Z`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Price history fetch failed");
    const data = await res.json();

    // Sahkotin may return { prices: [...] } or a direct array
    const pricesArray = data.prices || data;
    if (!Array.isArray(pricesArray)) {
        throw new Error("API response did not contain a valid prices array");
    }

    return pricesArray.map(p => ({
        t: new Date(p.date),
        v: p.value  // Sahkotin API with 'fix' parameter returns snt/kWh already
    })).sort((a, b) => a.t - b.t);
}

async function fetchHistoricalWeather(start, end) {
    const city = citySelect.value || "Helsinki";
    const coords = CITIES[city] || CITIES["Helsinki"];

    // Open-Meteo Historical API
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${coords.lat}&longitude=${coords.lon}&start_date=${start}&end_date=${end}&hourly=temperature_2m`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Weather history fetch failed");
    const data = await res.json();

    return data.hourly.time.map((t, i) => ({
        t: new Date(t),
        v: data.hourly.temperature_2m[i]
    }));
}

function renderHistoryChart(prices, weather) {
    if (historyChart) {
        historyChart.destroy();
    }

    const ctx = historyChartCanvas.getContext('2d');
    const fixedPrice = parseFloat(fixedPriceInput.value) || 0;

    // Determine Theme Colors
    const isLight = document.body.classList.contains('light-mode');
    const textColor = isLight ? '#334155' : '#e2e8f0'; // Slate-700 vs Slate-200
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.06)' : 'rgba(255, 255, 255, 0.06)';
    const headingsColor = isLight ? '#0f172a' : '#f8fafc'; // Darker/Lighter for titles

    // Update date range display
    updateDateRangeDisplay(prices);

    // Create fixed price line data matching the time range of prices
    const fixedPriceData = fixedPrice > 0 ? prices.map(p => ({ x: p.t, y: fixedPrice })) : [];

    const datasets = [
        {
            label: 'Pörssihinta (snt/kWh)',
            data: prices.map(p => ({ x: p.t, y: p.v })),
            borderColor: '#DFAF2B',
            backgroundColor: 'rgba(223, 175, 43, 0.1)',
            yAxisID: 'yPrice',
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 0
        },
        {
            label: `Lämpötila, ${citySelect.value || 'Helsinki'} (°C)`,
            data: weather.map(w => ({ x: w.t, y: w.v })),
            borderColor: '#2dd4bf', // Brighter Turquoise for dark mode
            yAxisID: 'yTemp',
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 0
        }
    ];

    // Add fixed price as a solid line if user has entered a value
    if (fixedPriceData.length > 0) {
        datasets.splice(1, 0, {
            label: 'Kiinteä hinta (snt/kWh)',
            data: fixedPriceData,
            borderColor: '#a78bfa', // Lighter Violet for visibility
            backgroundColor: 'rgba(139, 92, 246, 0.05)',
            yAxisID: 'yPrice',
            tension: 0,
            borderWidth: 2.5,
            pointRadius: 0,
            fill: false
        });
    }

    // Parse dates for strict axis limits
    const startParts = document.getElementById("startDate").value.split('-');
    const endParts = document.getElementById("endDate").value.split('-');
    const startObj = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    const endObj = new Date(endParts[0], endParts[1] - 1, endParts[2]);
    endObj.setHours(23, 59, 59);

    historyChart = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    min: startObj.getTime(),
                    max: endObj.getTime(),
                    time: {
                        unit: 'day',
                        displayFormats: { day: 'd.M.' },
                        tooltipFormat: 'd.M.yyyy HH:mm'
                    },
                    title: { display: true, text: 'Aika', color: headingsColor },
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                yPrice: {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'snt/kWh', color: headingsColor },
                    grid: { drawOnChartArea: true, color: gridColor },
                    ticks: { color: textColor }
                },
                yTemp: {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: '°C', color: headingsColor },
                    grid: { drawOnChartArea: false },
                    ticks: { color: textColor }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: textColor,
                        usePointStyle: false,
                        boxWidth: 40,
                        boxHeight: 2,
                        padding: 20
                    }
                }
            }
        }
    });
}

function updateDateRangeDisplay(prices) {
    if (!prices || prices.length === 0) return;

    const startDate = new Date(prices[0].t);
    const endDate = new Date(prices[prices.length - 1].t);

    const formatDate = (date) => {
        return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
    };

    const dateRangeEl = document.getElementById('chartDateRange');
    if (dateRangeEl) {
        dateRangeEl.textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
}

// Start
init();
