/**
 * SpotVaiFix.js
 * Electricity price comparison logic
 */

const SPOT_API_CURRENT = "https://api.spot-hinta.fi/JustNow";
const SPOT_API_TODAY = "https://api.spot-hinta.fi/Today";

// UI Elements
const spotMarginInput = document.getElementById("spotMargin");
const spotBasicFeeInput = document.getElementById("spotBasicFee");
const fixedPriceInput = document.getElementById("fixedPrice");
const fixedBasicFeeInput = document.getElementById("fixedBasicFee");
const monthlyConsumptionInput = document.getElementById("monthlyConsumption");

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
let historicalAvgPrice = null;
let historicalDateRange = { start: null, end: null };
let historyChart = null;

// Initialization
async function init() {
    setDefaultDates();
    loadSettings();
    await fetchSpotPrices();
    await fetchHistoricalAverage(); // Fetch 30-day average
    calculateComparison();
    await updateHistory();

    // Event Listeners
    [spotMarginInput, spotBasicFeeInput, fixedPriceInput, fixedBasicFeeInput, monthlyConsumptionInput, consumptionProfileSelect].forEach(input => {
        input.addEventListener("input", () => {
            saveSettings();
            calculateComparison();
            if (historyChart) historyChart.update(); // Update baseline if chart exists
        });
    });

    updateHistoryBtn.addEventListener("click", updateHistory);
}

// Set default dates to last month for chart
function setDefaultDates() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 30);

    startDateInput.value = start.toISOString().split('T')[0];
    endDateInput.value = end.toISOString().split('T')[0];
}

// Fetch current spot price for display
async function fetchSpotPrices() {
    try {
        const response = await fetch(SPOT_API_CURRENT);
        if (!response.ok) throw new Error("Price fetch failed");
        const data = await response.json();
        currentSpotPrice = data.PriceWithTax * 100; // API returns EUR/kWh, convert to snt/kWh

        const formattedPrice = currentSpotPrice.toFixed(2).replace('.', ',');
        currentSpotPriceValueEl.innerHTML = `${formattedPrice} <span class="hero-unit">snt / kWh</span>`;
    } catch (error) {
        console.error("Error fetching spot prices:", error);
        currentSpotPriceValueEl.textContent = "Virhe haettaessa";
    }
}

// Fetch historical average from LAST MONTH (fixed, not affected by chart range)
async function fetchHistoricalAverage() {
    try {
        // Always use last 30 days for the estimate, regardless of chart settings
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 30);

        historicalDateRange.start = start;
        historicalDateRange.end = end;

        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        const url = `https://sahkotin.fi/prices?fix&vat&start=${startStr}T00:00:00.000Z&end=${endStr}T23:59:59.999Z`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Historical price fetch failed");
        const data = await res.json();

        const pricesArray = data.prices || data;
        if (Array.isArray(pricesArray) && pricesArray.length > 0) {
            const total = pricesArray.reduce((acc, p) => acc + p.value, 0); // Sahkotin API with 'fix' returns snt/kWh
            historicalAvgPrice = total / pricesArray.length;
        } else {
            historicalAvgPrice = currentSpotPrice || 8.0;
        }
    } catch (error) {
        console.error("Error fetching historical average:", error);
        historicalAvgPrice = currentSpotPrice || 8.0;
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
    if (!currentSpotPrice || !historicalAvgPrice) {
        spotCurrentCostEl.textContent = "Ladataan...";
        spotCurrentPriceEl.textContent = "Haetaan hintoja";
        spotHistoricalCostEl.textContent = "Ladataan...";
        spotHistoricalPriceEl.textContent = "Haetaan hintoja";
        return;
    }

    // Spot Calculation - Current hourly price (no profile multiplier)
    const effectiveCurrentSpotPrice = currentSpotPrice + margin;
    const spotCurrentMonthlyCost = (effectiveCurrentSpotPrice * consumption / 100) + spotBasic;

    // Spot Calculation - Historical average from selected time range
    const effectiveHistoricalSpotPrice = historicalAvgPrice + margin;
    const spotHistoricalMonthlyCost = (effectiveHistoricalSpotPrice * consumption / 100) + spotBasic;

    // Fixed Calculation
    const fixedMonthlyCost = (fixedPrice * consumption / 100) + fixedBasic;

    // Update UI - Current estimate
    spotCurrentCostEl.textContent = `${spotCurrentMonthlyCost.toFixed(2).replace('.', ',')} €/kk`;
    spotCurrentPriceEl.textContent = `${effectiveCurrentSpotPrice.toFixed(2).replace('.', ',')} snt/kWh (sis. marginaali)`;

    // Update UI - Historical estimate
    spotHistoricalCostEl.textContent = `${spotHistoricalMonthlyCost.toFixed(2).replace('.', ',')} €/kk`;
    spotHistoricalPriceEl.textContent = `${effectiveHistoricalSpotPrice.toFixed(2).replace('.', ',')} snt/kWh (sis. marginaali)`;

    // Update UI - Fixed
    fixedTotalCostEl.textContent = `${fixedMonthlyCost.toFixed(2).replace('.', ',')} €/kk`;
    fixedAvgPriceEl.textContent = `${fixedPrice.toFixed(2).replace('.', ',')} snt/kWh`;

    updateVerdict(spotCurrentMonthlyCost, spotHistoricalMonthlyCost, fixedMonthlyCost);
    updateGraph(spotCurrentMonthlyCost, spotHistoricalMonthlyCost, fixedMonthlyCost);
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
    // Compare the better spot option (lower of current or historical) with fixed
    const bestSpot = Math.min(spotCurrent, spotHistorical);
    const diff = Math.abs(bestSpot - fixedCost).toFixed(2).replace('.', ',');

    if (bestSpot < fixedCost) {
        const whichSpot = spotCurrent < spotHistorical ? "tämän hetken hinnalla" : "valitun ajanjakson keskiarvolla";
        verdictEl.textContent = `Pörssisähkö ${whichSpot} on n. ${diff} € halvempi kuukaudessa.`;
        verdictEl.className = "verdict-box"; // Default green
    } else {
        verdictEl.textContent = `Kiinteä hinta on n. ${diff} € halvemmin kuukaudessa.`;
        verdictEl.className = "verdict-box cheaper-fixed"; // Blue style
    }
}

// Local Storage
function saveSettings() {
    const settings = {
        spotMargin: spotMarginInput.value,
        spotBasicFee: spotBasicFeeInput.value,
        fixedPrice: fixedPriceInput.value,
        fixedBasicFee: fixedBasicFeeInput.value,
        monthlyConsumption: monthlyConsumptionInput.value
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
            fixedPriceInput.value = settings.fixedPrice || "7.50";
            fixedBasicFeeInput.value = settings.fixedBasicFee || "0.00";
            monthlyConsumptionInput.value = settings.monthlyConsumption || "200";
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

        renderHistoryChart(prices, weather);
        // NOTE: Historical estimate is NOT updated here - it always uses last 30 days
    } catch (e) {
        console.error("History update failed", e);
    } finally {
        updateHistoryBtn.disabled = false;
        updateHistoryBtn.textContent = "Päivitä historia";
    }
}

async function fetchHistoricalPrices(start, end) {
    // Correct Sahkotin URL format with fix (snt/kWh) and vat included
    const url = `https://sahkotin.fi/prices?fix&vat&start=${start}T00:00:00.000Z&end=${end}T23:59:59.999Z`;
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
    // Open-Meteo Historical API (Helsinki coordinates 60.17, 24.94)
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=60.17&longitude=24.94&start_date=${start}&end_date=${end}&hourly=temperature_2m`;
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
            label: 'Lämpötila (°C)',
            data: weather.map(w => ({ x: w.t, y: w.v })),
            borderColor: '#14b8a6', // Turquoise
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
            borderColor: '#8b5cf6', // Violet
            backgroundColor: 'rgba(139, 92, 246, 0.05)',
            yAxisID: 'yPrice',
            tension: 0,
            borderWidth: 2.5,
            pointRadius: 0,
            fill: false
        });
    }

    historyChart = new Chart(ctx, {
        type: 'line',
        data: { datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'd.M.'
                        }
                    },
                    title: { display: true, text: 'Aika' }
                },
                yPrice: {
                    type: 'linear',
                    position: 'left',
                    title: { display: true, text: 'snt/kWh' },
                    grid: { drawOnChartArea: true }
                },
                yTemp: {
                    type: 'linear',
                    position: 'right',
                    title: { display: true, text: '°C' },
                    grid: { drawOnChartArea: false }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'line',
                        boxWidth: 600,
                        boxHeight: 5
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
