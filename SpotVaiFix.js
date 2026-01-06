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
const consumptionProfileSelect = document.getElementById("consumptionProfile");

const spotTotalCostEl = document.getElementById("spotTotalCost");
const spotAvgPriceEl = document.getElementById("spotAvgPrice");
const fixedTotalCostEl = document.getElementById("fixedTotalCost");
const fixedAvgPriceEl = document.getElementById("fixedAvgPrice");
const verdictEl = document.getElementById("verdict");
const currentSpotPriceValueEl = document.getElementById("currentSpotPriceValue");

const spotBarEl = document.getElementById("spotBar");
const fixedBarEl = document.getElementById("fixedBar");

const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const updateHistoryBtn = document.getElementById("updateHistoryBtn");
const historyChartCanvas = document.getElementById("historyChart");

const ALV_PERCENT = 25.5; // Current ALV in Finland

let currentSpotPrice = null;
let todayAvgPrice = null;
let historyChart = null;

// Initialization
async function init() {
    setDefaultDates();
    loadSettings();
    await fetchSpotPrices();
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

function setDefaultDates() {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);

    startDateInput.value = start.toISOString().split('T')[0];
    endDateInput.value = end.toISOString().split('T')[0];
}

// Fetch Prices
async function fetchSpotPrices() {
    try {
        const response = await fetch(SPOT_API_CURRENT);
        if (!response.ok) throw new Error("Price fetch failed");
        const data = await response.json();
        currentSpotPrice = data.PriceWithTax; // Assuming API returns PriceWithTax in c/kWh

        const formattedPrice = currentSpotPrice.toFixed(2).replace('.', ',');
        currentSpotPriceValueEl.innerHTML = `${formattedPrice} <span class="hero-unit">snt / kWh</span>`;

        // Fetch today's average for a better baseline comparison
        const todayResponse = await fetch(SPOT_API_TODAY);
        if (todayResponse.ok) {
            const todayData = await todayResponse.json();
            const total = todayData.reduce((acc, curr) => acc + curr.PriceWithTax, 0);
            todayAvgPrice = total / todayData.length;
        } else {
            todayAvgPrice = currentSpotPrice;
        }
    } catch (error) {
        console.error("Error fetching spot prices:", error);
        currentSpotPriceValueEl.textContent = "Virhe haettaessa";
        // Fallback to a generic average if API fails
        todayAvgPrice = 8.0;
    }
}

// Calculations
function calculateComparison() {
    const margin = parseFloat(spotMarginInput.value) || 0;
    const spotBasic = parseFloat(spotBasicFeeInput.value) || 0;
    const fixedPrice = parseFloat(fixedPriceInput.value) || 0;
    const fixedBasic = parseFloat(fixedBasicFeeInput.value) || 0;
    const consumption = parseFloat(monthlyConsumptionInput.value) || 0;
    const profile = consumptionProfileSelect.value;

    // Profile multipliers (simulated heuristics)
    let profileMultiplier = 1.0;
    if (profile === "evening") profileMultiplier = 1.15; // Typically higher in the evening
    if (profile === "night") profileMultiplier = 0.75;   // Lower at night

    // Spot Calculation
    const effectiveSpotPrice = (todayAvgPrice * profileMultiplier) + margin;
    const spotMonthlyCost = (effectiveSpotPrice * consumption / 100) + spotBasic;

    // Fixed Calculation
    const fixedMonthlyCost = (fixedPrice * consumption / 100) + fixedBasic;

    // Update UI
    spotTotalCostEl.textContent = `${spotMonthlyCost.toFixed(2).replace('.', ',')} €/kk`;
    spotAvgPriceEl.textContent = `${effectiveSpotPrice.toFixed(2).replace('.', ',')} snt/kWh (sis. marginaali)`;

    fixedTotalCostEl.textContent = `${fixedMonthlyCost.toFixed(2).replace('.', ',')} €/kk`;
    fixedAvgPriceEl.textContent = `${fixedPrice.toFixed(2).replace('.', ',')} snt/kWh`;

    updateVerdict(spotMonthlyCost, fixedMonthlyCost);
    updateGraph(spotMonthlyCost, fixedMonthlyCost);
}

function updateGraph(spot, fixed) {
    const max = Math.max(spot, fixed, 1);
    const spotWidth = (spot / max * 100).toFixed(1);
    const fixedWidth = (fixed / max * 100).toFixed(1);

    spotBarEl.style.width = `${spotWidth}%`;
    fixedBarEl.style.width = `${fixedWidth}%`;
}

function updateVerdict(spotCost, fixedCost) {
    const diff = Math.abs(spotCost - fixedCost).toFixed(2).replace('.', ',');
    if (spotCost < fixedCost) {
        verdictEl.textContent = `Pörssisähkö on n. ${diff} € halvempi kuukaudessa.`;
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
        monthlyConsumption: monthlyConsumptionInput.value,
        consumptionProfile: consumptionProfileSelect.value
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
            consumptionProfileSelect.value = settings.consumptionProfile || "flat";
        }
    } catch (e) {
        console.error("Error loading settings:", e);
    }
}

// Historical Data and Charts
async function updateHistory() {
    const start = startDateInput.value;
    const end = endDateInput.value;

    if (!start || !end) return;

    updateHistoryBtn.disabled = true;
    updateHistoryBtn.textContent = "Ladataan...";

    try {
        const [prices, weather] = await Promise.all([
            fetchHistoricalPrices(start, end),
            fetchHistoricalWeather(start, end)
        ]);

        renderHistoryChart(prices, weather);
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
        v: p.value
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

    historyChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                {
                    label: 'Pörssihinta (c/kWh)',
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
                    borderColor: '#3b82f6',
                    yAxisID: 'yTemp',
                    tension: 0.3,
                    borderWidth: 2,
                    pointRadius: 0
                }
            ]
        },
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
                    title: { display: true, text: 'c/kWh' },
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
                annotation: {
                    annotations: {
                        fixedLine: {
                            type: 'line',
                            yMin: fixedPrice,
                            yMax: fixedPrice,
                            borderColor: 'rgba(59, 130, 246, 0.5)',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            label: {
                                content: 'Kiinteä hinta',
                                enabled: true,
                                position: 'end'
                            }
                        }
                    }
                }
            }
        }
    });
}

// Start
init();
