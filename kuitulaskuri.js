const API_BASE = "https://fineli.fi/fineli/api/v1";

// Kokonaiskuitu (fibre, total dietary)
const FIBER_COMPONENT_ID = 2168;
// Energia (kcal) – Finelin komponenttilistassa energia (laskennallinen) = id 2331.
// Lisätään varmuuden vuoksi fallback-lista, mutta ensisijainen on 2331.
const ENERGY_COMPONENT_IDS = [2331, 1008, 1003, 238, 1009];

// Oletusannokset (g) erityisille ryhmille
const DEFAULT_SERVINGS = {
  nuts: 30, // pähkinät
  default: 100,
};

// Pähkinämäisiä tunnisteita nimen perusteella (yksinkertainen heuristiikka)
const NUT_KEYWORDS = ["pähkinä", "pähkina", "nut", "cashew", "manteli", "almond", "walnut", "pecan", "pista", "hazel"];

// Kuitutavoitteet
const FIBER_GOALS = {
  fi_min: { grams: 25, label: "Suomen vähimmäistaso (~25 g/vrk)" },
  avg: { grams: 30, label: "Hyvä keskimääräinen taso (~30 g/vrk)" },
  high: { grams: 40, label: "Korkea kuitutaso (~40 g/vrk, painonhallinnan tueksi)" },
};

// Käännökset UI-teksteille
const I18N = {
  fi: {
    step1_title: "1. Hae ruoka Finelistä",
    step2_title: "2. Lisää suosikkiruokia ja kuitumäärät",
    step2_desc:
      "Valitse ruoka hakutuloksista. Laskuri käyttää ruoan kokonaista kuitua per 100 g ja muuntaa sen antamasi määrän mukaan.",
    step3_title: "3. Päivän kuitu- ja kaloriyhteenveto",
    step3_desc: "Valitse tavoite ja seuraa, kuinka lähelle pääset päivän aikana.",
    search: "Hae",
    api_hint: "Hakukenttä käyttää Finelin avointa ohjelmointirajapintaa (/api/v1/foods?q=).",
    empty_list: "Et ole vielä lisännyt yhtään ruokaa.",
    total_fiber_label: "Päivän kokonaiskuitu:",
    remaining_label: "Jäljellä tavoitteesta:",
    excess_label: "Ylitys:",
    total_cal_label: "Päivän kalorit:",
    clear_all: "Tyhjennä kaikki",
    guidance:
      "Suositeltu kuidun saanti aikuisille on usein 25–30 g/vrk, ja 35–40 g/vrk voi tukea painonhallintaa. Tarkista ajantasaiset ravitsemussuositukset luotettavasta lähteestä.",
    samples_title: "Korkean kuidun esimerkit",
    plant_title: "Kasvikunnan tuotteet (top 10, g/100 g)",
    animal_title: "Eläinperäiset (top 10, g/100 g)",
    add_to_list: "Lisää päivän listalle",
    amount_label: "Määrä grammoina (g)",
    calc_for_amount: "Laskettu kuitu määrälle",
    no_fiber: "Kuitutietoa ei löytynyt tälle ruoalle. Valitse jokin toinen ruoka.",
    no_results: "Ei hakutuloksia. Kokeile toista hakusanaa.",
  },
  sv: {
    step1_title: "1. Sök livsmedel från Fineli",
    step2_title: "2. Lägg till favoriter och fiber",
    step2_desc:
      "Välj livsmedel från resultaten. Räknaren använder totalfiber per 100 g och skalar till din mängd.",
    step3_title: "3. Dagens fiber- och kaloriöversikt",
    step3_desc: "Välj mål och följ hur nära du kommer under dagen.",
    search: "Sök",
    api_hint: "Sökfältet använder Finelis öppna API (/api/v1/foods?q=).",
    empty_list: "Du har ännu inte lagt till något livsmedel.",
    total_fiber_label: "Dagens totalfiber:",
    remaining_label: "Kvar till målet:",
    excess_label: "Överskott:",
    total_cal_label: "Dagens kalorier:",
    clear_all: "Rensa alla",
    guidance:
      "Rekommenderat fiberintag för vuxna är ofta 25–30 g/dag och 35–40 g/dag kan stödja viktkontroll. Kontrollera aktuella rekommendationer från en pålitlig källa.",
    samples_title: "Exempel på fiberrika livsmedel",
    plant_title: "Växtbaserade (topp 10, g/100 g)",
    animal_title: "Animaliska (topp 10, g/100 g)",
    add_to_list: "Lägg till på dagens lista",
    amount_label: "Mängd i gram (g)",
    calc_for_amount: "Beräknad fiber för mängden",
    no_fiber: "Ingen fiberdata för detta livsmedel. Välj ett annat.",
    no_results: "Inga träffar. Prova en annan sökning.",
  },
  en: {
    step1_title: "1. Search foods from Fineli",
    step2_title: "2. Add favourites and fiber amounts",
    step2_desc:
      "Pick a food from the results. The calculator uses total dietary fibre per 100 g and scales to your amount.",
    step3_title: "3. Daily fiber & calorie summary",
    step3_desc: "Choose a target and track your progress during the day.",
    search: "Search",
    api_hint: "Search uses Fineli open API (/api/v1/foods?q=).",
    empty_list: "You have not added any foods yet.",
    total_fiber_label: "Total daily fibre:",
    remaining_label: "Remaining to target:",
    excess_label: "Excess:",
    total_cal_label: "Daily calories:",
    clear_all: "Clear all",
    guidance:
      "Recommended fibre intake for adults is often 25–30 g/day, and 35–40 g/day can support weight management. Always check up-to-date recommendations from reliable sources.",
    samples_title: "High-fibre examples",
    plant_title: "Plant-based (top 10, g/100 g)",
    animal_title: "Animal-based (top 10, g/100 g)",
    add_to_list: "Add to day list",
    amount_label: "Amount in grams (g)",
    calc_for_amount: "Calculated fibre for amount",
    no_fiber: "No fibre data for this food. Please select another.",
    no_results: "No results. Try another search.",
  },
};

// Staattiset samplelistat (kuidukkaimmat esimerkit), arvot suuntaa-antavia (g/100 g)
// Linkit ohjaavat Finelin hakuun (q=<nimi>), jotta käyttäjä pääsee helposti lähdesivulle.
const PLANT_SAMPLES = [
  { name: "Psyllium-kuitu", fiber: 80, link: "https://fineli.fi/fineli/fi/foods?q=psyllium" },
  { name: "Chia-siemen", fiber: 34, link: "https://fineli.fi/fineli/fi/foods?q=chia" },
  { name: "Pellavansiemen", fiber: 27, link: "https://fineli.fi/fineli/fi/foods?q=pellavansiemen" },
  { name: "Kidneypapu, kypsä", fiber: 15, link: "https://fineli.fi/fineli/fi/foods?q=kidneypapu" },
  { name: "Kikherne, kypsä", fiber: 13, link: "https://fineli.fi/fineli/fi/foods?q=kikherne" },
  { name: "Linssi, kypsä", fiber: 11, link: "https://fineli.fi/fineli/fi/foods?q=linssi" },
  { name: "Mustapapu, kypsä", fiber: 9, link: "https://fineli.fi/fineli/fi/foods?q=mustapapu" },
  { name: "Härkäpapu, kypsä", fiber: 9, link: "https://fineli.fi/fineli/fi/foods?q=härkäpapu" },
  { name: "Kaura, täysjyvä", fiber: 9, link: "https://fineli.fi/fineli/fi/foods?q=kaura" },
  { name: "Ruisleipä, täysjyvä", fiber: 8, link: "https://fineli.fi/fineli/fi/foods?q=ruisleipä" },
];

const ANIMAL_SAMPLES = [
  { name: "Kuitulisätty jogurtti", fiber: 3, link: "https://fineli.fi/fineli/fi/foods?q=jogurtti%20kuitu" },
  { name: "Kuitu-rahkavalmiste", fiber: 3, link: "https://fineli.fi/fineli/fi/foods?q=rahka%20kuitu" },
  { name: "Kasvipohjainen proteiinijuoma, kuitulisätty", fiber: 3, link: "https://fineli.fi/fineli/fi/foods?q=proteiinijuoma%20kuitu" },
  { name: "Vegaanipihvi, kuitutäydennetty", fiber: 4, link: "https://fineli.fi/fineli/fi/foods?q=vegaanipihvi%20kuitu" },
  { name: "Vegaanimakkara, kuitutäydennetty", fiber: 4, link: "https://fineli.fi/fineli/fi/foods?q=vegaanimakkara%20kuitu" },
  { name: "Vegaanijuusto, kuitutäydennetty", fiber: 2, link: "https://fineli.fi/fineli/fi/foods?q=vegaanijuusto%20kuitu" },
  { name: "Seitan, kuitutuote", fiber: 2, link: "https://fineli.fi/fineli/fi/foods?q=seitan%20kuitu" },
  { name: "Proteiinipatukka kuitulisällä", fiber: 5, link: "https://fineli.fi/fineli/fi/foods?q=proteiinipatukka%20kuitu" },
  { name: "Tofu, kuitutäydennetty", fiber: 2, link: "https://fineli.fi/fineli/fi/foods?q=tofu%20kuitu" },
  { name: "Kuitulisätty juustovalmiste", fiber: 2, link: "https://fineli.fi/fineli/fi/foods?q=juusto%20kuitu" },
];

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const suggestionsEl = document.getElementById("suggestions");
const searchResultsEl = document.getElementById("searchResults");
const selectedFoodEl = document.getElementById("selectedFood");
const favoritesListEl = document.getElementById("favoritesList");
const totalFiberEl = document.getElementById("totalFiber");
const remainingFiberEl = document.getElementById("remainingFiber");
const excessFiberEl = document.getElementById("excessFiber");
const totalCaloriesEl = document.getElementById("totalCalories");
const clearAllButton = document.getElementById("clearAllButton");
const fiberGoalSelect = document.getElementById("fiberGoalSelect");
const fiberGoalProgressEl = document.getElementById("fiberGoalProgress");
const langSelect = document.getElementById("langSelect");
const plantSamplesEl = document.getElementById("plantSamples");
const animalSamplesEl = document.getElementById("animalSamples");

let favorites = [];
let currentLang = "fi";
let searchTimeout = null;

function loadFavorites() {
  try {
    const raw = window.localStorage.getItem("fiberFavorites_v2");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      favorites = parsed;
      renderFavorites();
    }
  } catch (e) {
    console.error("Virhe luettaessa localStoragea", e);
  }
}

function saveFavorites() {
  try {
    window.localStorage.setItem("fiberFavorites_v2", JSON.stringify(favorites));
  } catch (e) {
    console.error("Virhe tallennettaessa localStorageen", e);
  }
}

function formatNumber(value, decimals = 1) {
  return Number(value).toLocaleString(currentLang === "fi" ? "fi-FI" : currentLang === "sv" ? "sv-SE" : "en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || I18N.fi[key] || "";
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const translated = t(key);
    if (translated) el.textContent = translated;
  });
  searchButton.textContent = t("search") || "Hae";
}

function isNutProduct(foodName = "") {
  const lower = foodName.toLowerCase();
  return NUT_KEYWORDS.some((kw) => lower.includes(kw));
}

function getDefaultAmountForFood(foodName = "") {
  return isNutProduct(foodName) ? DEFAULT_SERVINGS.nuts : DEFAULT_SERVINGS.default;
}

function getFiberPer100g(components = []) {
  // 1) Suora komponentti-id
  let comp = components.find((c) => c.componentId === FIBER_COMPONENT_ID);
  if (comp && typeof comp.value === "number") return comp.value;

  // 2) Varakomponentti: etsi FIBRE-tyyppiä
  comp = components.find(
    (c) =>
      c?.type?.code === "FIBRE" && typeof c.value === "number"
  );
  if (comp) return comp.value;

  // 3) Nimen perusteella (kuitu/fibre)
  comp = components.find((c) => {
    const n = (c?.name?.fi || c?.name?.en || c?.name?.sv || c?.shortName?.fi || c?.shortName?.en || "").toLowerCase();
    return typeof c.value === "number" && (n.includes("kuitu") || n.includes("fibre") || n.includes("fiber"));
  });
  if (comp) return comp.value;

  return null;
}

function getEnergyPer100g(components = []) {
  for (const id of ENERGY_COMPONENT_IDS) {
    const comp = components.find((c) => c.componentId === id);
    if (comp && typeof comp.value === "number") return comp.value;
  }
  return null;
}

// Fineli /foods/{id} palauttaa usein myös top-level kentät fiber, energyKcal jne.
function getFiberFromFood(food) {
  if (food && typeof food.fiber === "number") return food.fiber;
  return null;
}

function getEnergyKcalFromFood(food) {
  if (food && typeof food.energyKcal === "number") return food.energyKcal;
  return null;
}

function getFoodNameByLang(food) {
  if (!food) return "(nimetön)";
  // Fineli palauttaa usein nimen oliona: {fi, sv, en}
  if (food.name && typeof food.name === "object") {
    return (
      food.name[currentLang] ||
      food.name.fi ||
      food.name.sv ||
      food.name.en ||
      Object.values(food.name)[0] ||
      "(nimetön)"
    );
  }
  // Varakentät tai suora string
  const byLangKey = food[`name${currentLang.toUpperCase()}`];
  if (typeof byLangKey === "string") return byLangKey;
  if (typeof food.name === "string") return food.name;
  return food.nameFi || food.nameSv || food.nameEn || "(nimetön)";
}

function getGroupNameByLang(food) {
  if (!food) return "";
  const g = food.foodGroupName;
  if (g && typeof g === "object") {
    return g[currentLang] || g.fi || g.sv || g.en || Object.values(g)[0] || "";
  }
  if (typeof g === "string") return g;
  return "";
}

function normalizeComponents(food) {
  if (!food) return [];
  return food.components || food.componentValues || [];
}

async function searchFoods(query) {
  if (!query) {
    searchResultsEl.innerHTML = "";
    suggestionsEl.classList.remove("active");
    suggestionsEl.innerHTML = "";
    return;
  }

  searchButton.disabled = true;
  searchButton.textContent = t("search") || "Hae";

  try {
    const res = await fetch(`${API_BASE}/foods?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error(`Virhe haussa (${res.status})`);
    const data = await res.json();
    renderSearchResults(data);
    renderSuggestions(data);
  } catch (err) {
    console.error(err);
    searchResultsEl.innerHTML = '<div class="error-text">Haku epäonnistui.</div>';
  } finally {
    searchButton.disabled = false;
    searchButton.textContent = t("search") || "Hae";
  }
}

function renderSuggestions(foods) {
  if (!Array.isArray(foods) || foods.length === 0) {
    suggestionsEl.classList.remove("active");
    suggestionsEl.innerHTML = "";
    return;
  }
  const items = foods
    .slice(0, 8)
    .map(
      (food) => `
      <div class="suggestion-item" data-id="${food.id}">
        <div class="suggestion-main">
          <div class="food-name">${getFoodNameByLang(food)}</div>
          <div class="food-meta">${getGroupNameByLang(food)}</div>
        </div>
      </div>
    `
    )
    .join("");
  suggestionsEl.innerHTML = items;
  suggestionsEl.classList.add("active");
  suggestionsEl.querySelectorAll(".suggestion-item").forEach((el) => {
    el.addEventListener("click", () => {
      const id = Number(el.getAttribute("data-id"));
      if (!id) return;
      loadFoodDetails(id);
      suggestionsEl.classList.remove("active");
    });
  });
}

function renderSearchResults(foods) {
  if (!Array.isArray(foods) || foods.length === 0) {
    searchResultsEl.innerHTML = `<div class="empty-state">${t("no_results")}</div>`;
    return;
  }

  const items = foods
    .map((food) => {
      const comps = normalizeComponents(food);
  const fiber = getFiberPer100g(comps) ?? getFiberFromFood(food);
      const fiberText = fiber != null ? `${formatNumber(fiber)} g / 100 g` : t("no_fiber") || "ei kuitutietoa";
      return `
        <div class="result-item" data-id="${food.id}">
          <div class="result-main">
            <div class="food-name">${getFoodNameByLang(food)}</div>
            <div class="food-meta">${getGroupNameByLang(food)} · ${fiberText}</div>
          </div>
        </div>
      `;
    })
    .join("");

  searchResultsEl.innerHTML = items;
  searchResultsEl.classList.remove("hidden");

  Array.from(searchResultsEl.querySelectorAll(".result-item")).forEach((el) => {
    el.addEventListener("click", () => {
      const id = Number(el.getAttribute("data-id"));
      if (!id) return;
      loadFoodDetails(id);
    });
  });
}

async function loadFoodDetails(id) {
  try {
    const res = await fetch(`${API_BASE}/foods/${id}`);
    if (!res.ok) throw new Error("Food fetch failed");
    const food = await res.json();
    showSelectedFood(food);
  } catch (e) {
    console.error("Virhe haettaessa ruoan tietoja:", e);
  }
}

function showSelectedFood(food) {
  const components = normalizeComponents(food);
  const fiberPer100g = getFiberPer100g(components) ?? getFiberFromFood(food);
  const energyPer100g = getEnergyPer100g(components) ?? getEnergyKcalFromFood(food);
  const fiberText =
    fiberPer100g != null ? `${formatNumber(fiberPer100g)} g / 100 g` : "–";
  const canAdd = fiberPer100g != null;

  const name = getFoodNameByLang(food);
  const group = getGroupNameByLang(food);
  const defaultAmount = getDefaultAmountForFood(name);

  selectedFoodEl.innerHTML = `
    <div class="selected-simple">
      <div class="selected-row">
        <div class="selected-left">
          <div class="selected-title">${name}</div>
          <div class="selected-sub">${group}</div>
          <div class="selected-meta">
            <span>${t("calc_for_amount")}: <strong id="calculatedFiber">${canAdd ? `${formatNumber((fiberPer100g * defaultAmount) / 100)} g` : "-"}</strong></span>
            <span>· Kalorit: <strong id="calculatedEnergy">${energyPer100g != null ? `${formatNumber((energyPer100g * defaultAmount) / 100)} kcal` : "–"}</strong></span>
          </div>
        </div>
        <div class="selected-right">
          <div class="fiber-badge">${fiberText}</div>
          <div class="amount-row compact">
            <button class="amount-btn" type="button" data-step="-10">-10</button>
            <button class="amount-btn" type="button" data-step="-1">-</button>
            <input
              id="amountInput"
              type="number"
              min="1"
              max="2000"
              step="1"
              value="${defaultAmount}"
            />
            <button class="amount-btn" type="button" data-step="1">+</button>
            <button class="amount-btn" type="button" data-step="10">+10</button>
          </div>
          <button id="addFavoriteButton" ${canAdd ? "" : "disabled"}>${t("add_to_list")}</button>
        </div>
      </div>
    </div>
  `;

  selectedFoodEl.classList.remove("hidden");
  searchResultsEl.innerHTML = "";
  searchResultsEl.classList.add("hidden");

  const amountInput = document.getElementById("amountInput");
  const calculatedFiberEl = document.getElementById("calculatedFiber");
  const calculatedEnergyEl = document.getElementById("calculatedEnergy");
  const addFavoriteButton = document.getElementById("addFavoriteButton");
  const amountButtons = selectedFoodEl.querySelectorAll(".amount-btn");
  const warningPlaceholder =
    fiberPer100g == null
      ? `<div class="warning-banner">${t("no_fiber")}</div>`
      : "";
  if (warningPlaceholder) {
    selectedFoodEl.insertAdjacentHTML("beforeend", warningPlaceholder);
  }

  if (amountInput && calculatedFiberEl) {
    const updateCalc = () => {
      const amount = Number(amountInput.value);
      if (!amount || amount <= 0) {
        calculatedFiberEl.textContent = "-";
        if (calculatedEnergyEl) calculatedEnergyEl.textContent = "-";
        return;
      }
      if (fiberPer100g != null) {
        const fiber = (fiberPer100g * amount) / 100;
        calculatedFiberEl.textContent = `${formatNumber(fiber)} g`;
      } else {
        calculatedFiberEl.textContent = "-";
      }
      if (energyPer100g != null && calculatedEnergyEl) {
        calculatedEnergyEl.textContent = `${formatNumber((energyPer100g * amount) / 100)} kcal`;
      } else if (calculatedEnergyEl) {
        calculatedEnergyEl.textContent = "-";
      }
    };

    amountInput.addEventListener("input", updateCalc);
    updateCalc();

    amountButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const step = Number(btn.getAttribute("data-step")) || 0;
        const current = Number(amountInput.value) || 0;
        const next = Math.min(2000, Math.max(1, current + step));
        amountInput.value = next;
        updateCalc();
      });
    });

    addFavoriteButton?.addEventListener("click", () => {
      if (!canAdd) {
        alert(t("no_fiber"));
        return;
      }
      const amount = Number(amountInput.value);
      if (!amount || amount <= 0) return;
      const fiber = (fiberPer100g * amount) / 100;
      const energy = energyPer100g != null ? (energyPer100g * amount) / 100 : null;
      favorites.push({
        id: food.id,
        name,
        group,
        amount,
        fiberPer100g,
        fiber,
        energy,
      });
      saveFavorites();
      renderFavorites();
    });
  }
}

function renderFavorites() {
  if (!favorites.length) {
    favoritesListEl.classList.add("empty-state");
    favoritesListEl.innerHTML = t("empty_list");
    totalFiberEl.textContent = "0 g";
    remainingFiberEl.textContent = "0 g";
    excessFiberEl.textContent = "0 g";
    totalCaloriesEl.textContent = "0 kcal";
    updateFiberGoalProgress(0);
    return;
  }

  favoritesListEl.classList.remove("empty-state");

  const rows = favorites
    .map(
      (item, index) => `
      <div class="favorite-row">
        <div class="favorite-name">${item.name}</div>
        <div class="favorite-amount">
          <strong>${formatNumber(item.amount, 0)} g</strong>
        </div>
        <div class="favorite-fiber">
          <strong>${formatNumber(item.fiber)} g</strong> kuitua
        </div>
        <div class="favorite-cal">
          ${
            item.energy != null
              ? `<strong>${formatNumber(item.energy)} kcal</strong>`
              : "–"
          }
        </div>
        <button class="danger-button" data-index="${index}">
          Poista
        </button>
      </div>
    `
    )
    .join("");

  favoritesListEl.innerHTML = rows;

  const totalFiber = favorites.reduce((sum, item) => sum + (item.fiber || 0), 0);
  const totalEnergy = favorites.reduce((sum, item) => sum + (item.energy || 0), 0);
  totalFiberEl.textContent = `${formatNumber(totalFiber)} g`;
  totalCaloriesEl.textContent = `${formatNumber(totalEnergy, 0)} kcal`;

  updateFiberGoalProgress(totalFiber);

  favoritesListEl.querySelectorAll("button[data-index]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.getAttribute("data-index"));
      favorites.splice(idx, 1);
      saveFavorites();
      renderFavorites();
    });
  });
}

function getCurrentFiberGoal() {
  if (!fiberGoalSelect) return FIBER_GOALS.fi_min;
  const key = fiberGoalSelect.value;
  return FIBER_GOALS[key] || FIBER_GOALS.fi_min;
}

function updateFiberGoalProgress(totalFiber) {
  if (!fiberGoalProgressEl) return;
  const goal = getCurrentFiberGoal();
  const goalGrams = goal.grams || 0;
  if (!goalGrams) {
    fiberGoalProgressEl.textContent = "";
    remainingFiberEl.textContent = "0 g";
    excessFiberEl.textContent = "0 g";
    return;
  }

  const remaining = Math.max(0, goalGrams - totalFiber);
  const excess = Math.max(0, totalFiber - goalGrams);
  const ratio = totalFiber / goalGrams;
  const percent = Number.isFinite(ratio) ? ratio * 100 : 0;
  const percentText = `${formatNumber(percent, 0)} %`;

  remainingFiberEl.textContent = `${formatNumber(remaining)} g`;
  excessFiberEl.textContent = `${formatNumber(excess)} g`;

  fiberGoalProgressEl.textContent = `Päivän kuitu yhteensä ${formatNumber(
    totalFiber
  )} g / tavoite ${goalGrams} g (${percentText} tavoitteesta).`;
}

function populateSamples() {
  plantSamplesEl.innerHTML = PLANT_SAMPLES.map((item, idx) => {
    const num = idx + 1;
    return `<li><a href="${item.link}" target="_blank" rel="noreferrer noopener">${num}. ${item.name}</a> – ${item.fiber} g/100 g</li>`;
  }).join("");
  animalSamplesEl.innerHTML = ANIMAL_SAMPLES.map((item, idx) => {
    const num = idx + 1;
    return `<li><a href="${item.link}" target="_blank" rel="noreferrer noopener">${num}. ${item.name}</a> – ${item.fiber} g/100 g</li>`;
  }).join("");
}

function debounceSearch() {
  const query = searchInput.value.trim();
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => searchFoods(query), 220);
}

// Event bindings
searchButton.addEventListener("click", () => searchFoods(searchInput.value.trim()));
searchInput.addEventListener("input", debounceSearch);
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    searchFoods(searchInput.value.trim());
  }
});

clearAllButton.addEventListener("click", () => {
  if (!favorites.length) return;
  const ok = window.confirm("Tyhjennetäänkö kaikki päivän ruoat?");
  if (!ok) return;
  favorites = [];
  saveFavorites();
  renderFavorites();
});

fiberGoalSelect?.addEventListener("change", () => {
  const total = favorites.reduce((sum, item) => sum + (item.fiber || 0), 0);
  updateFiberGoalProgress(total);
});

langSelect?.addEventListener("change", () => {
  currentLang = langSelect.value || "fi";
  applyTranslations();
  // Nollaa haku ja valinta, ettei vanha kieli jää hakukenttään/valintaan
  searchInput.value = "";
  searchResultsEl.innerHTML = "";
  suggestionsEl.innerHTML = "";
  suggestionsEl.classList.remove("active");
  selectedFoodEl.innerHTML = "";
  selectedFoodEl.classList.add("hidden");
  renderFavorites();
});

// Init
applyTranslations();
populateSamples();
loadFavorites();


