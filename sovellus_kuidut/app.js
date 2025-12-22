const API_BASE = "https://fineli.fi/fineli/api/v1";
// Komponentti-ID kokonaista ravintokuitua varten. Tämä kannattaa tarvittaessa
// tarkistaa Finelin komponenttilistasta (GET /components).
// Jos komponentin tunnus muuttuu, päivitä FIBER_COMPONENT_ID.
// Finelin komponenttilistan perusteella kokonaista ravintokuitua (fibre, total dietary)
// vastaava komponentti-id on 2168.
const FIBER_COMPONENT_ID = 2168;

const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const searchResultsEl = document.getElementById("searchResults");
const selectedFoodEl = document.getElementById("selectedFood");
const favoritesListEl = document.getElementById("favoritesList");
const totalFiberEl = document.getElementById("totalFiber");
const clearAllButton = document.getElementById("clearAllButton");
const fiberGoalSelect = document.getElementById("fiberGoalSelect");
const fiberGoalProgressEl = document.getElementById("fiberGoalProgress");

// Kolme tasoa päivän kuitutavoitteelle:
// - Suomen vähimmäistaso (noin 25 g/vrk)
// - Kansainvälisesti usein suositeltu keskimääräinen taso (~30 g/vrk)
// - Korkeampi taso (~40 g/vrk), jota monet asiantuntijat pitävät hyödyllisenä
//   painonhallinnan ja terveyden kannalta.
const FIBER_GOALS = {
  fi_min: { grams: 25, label: "Suomen vähimmäistaso (~25 g/vrk)" },
  avg: { grams: 30, label: "Hyvä keskimääräinen taso (~30 g/vrk)" },
  high: {
    grams: 40,
    label: "Korkea kuitutaso (~40 g/vrk, painonhallinnan tueksi)",
  },
};

let favorites = [];

function loadFavorites() {
  try {
    const raw = window.localStorage.getItem("fiberFavorites_v1");
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
    window.localStorage.setItem("fiberFavorites_v1", JSON.stringify(favorites));
  } catch (e) {
    console.error("Virhe tallennettaessa localStorageen", e);
  }
}

function formatNumber(value, decimals = 1) {
  return Number(value).toLocaleString("fi-FI", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

async function searchFoods() {
  const query = searchInput.value.trim();
  if (!query) {
    searchResultsEl.innerHTML = "";
    return;
  }

  searchButton.disabled = true;
  searchButton.textContent = "Haetaan...";
  searchResultsEl.innerHTML = "";

  try {
    const res = await fetch(`${API_BASE}/foods?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      throw new Error(`Virhe haussa (${res.status})`);
    }
    const data = await res.json();
    renderSearchResults(data);
  } catch (err) {
    console.error(err);
    searchResultsEl.innerHTML =
      '<div class="error-text">Haku epäonnistui. Tarkista verkkoyhteys ja yritä uudelleen.</div>';
  } finally {
    searchButton.disabled = false;
    searchButton.textContent = "Hae";
  }
}

function getFiberPer100g(components = []) {
  const comp = components.find((c) => c.componentId === FIBER_COMPONENT_ID);
  if (!comp || typeof comp.value !== "number") return null;
  return comp.value;
}

function renderSearchResults(foods) {
  if (!Array.isArray(foods) || foods.length === 0) {
    searchResultsEl.innerHTML =
      '<div class="empty-state">Ei hakutuloksia. Kokeile toista hakusanaa.</div>';
    return;
  }

  const items = foods
    .map((food) => {
      const fiber = getFiberPer100g(food.components);
      const fiberText =
        fiber != null ? `${formatNumber(fiber)} g / 100 g` : "ei kuitutietoa";
      const name = food.name || "(nimetön)";
      const group = food.foodGroupName || "";

      return `
        <div class="result-item" data-id="${food.id}">
          <div class="result-main">
            <div class="food-name">${name}</div>
            <div class="food-meta">${group}</div>
          </div>
          <div class="fiber-badge">${fiberText}</div>
        </div>
      `;
    })
    .join("");

  searchResultsEl.innerHTML = items;

  Array.from(searchResultsEl.querySelectorAll(".result-item")).forEach(
    (el) => {
      el.addEventListener("click", () => {
        const id = Number(el.getAttribute("data-id"));
        const food = foods.find((f) => f.id === id);
        if (food) {
          showSelectedFood(food);
        }
      });
    }
  );
}

function showSelectedFood(food) {
  const fiberPer100g = getFiberPer100g(food.components);
  const fiberText =
    fiberPer100g != null
      ? `${formatNumber(fiberPer100g)} g / 100 g`
      : "Kuitutietoa ei löytynyt tälle ruoalle.";

  const name = food.name || "(nimetön)";
  const group = food.foodGroupName || "";

  selectedFoodEl.innerHTML = `
    <div class="selected-header">
      <div>
        <div class="selected-title">${name}</div>
        <div class="selected-sub">${group}</div>
      </div>
      <div class="fiber-badge">${fiberText}</div>
    </div>
    ${
      fiberPer100g == null
        ? `<p class="error-text">Tälle ruoalle ei ole tallennettu kokonaista kuitua. Valitse jokin toinen ruoka.</p>`
        : `
    <div class="selected-grid">
      <div>
        <label class="field-label" for="amountInput">
          Määrä grammoina (g)
        </label>
        <input
          id="amountInput"
          type="number"
          min="1"
          max="2000"
          step="1"
          value="100"
        />
      </div>
      <div>
        <div class="field-label">Laskettu kuitu määrälle</div>
        <div id="calculatedFiber" class="summary-value small">
          ${formatNumber(fiberPer100g)} g
        </div>
      </div>
      <div>
        <button id="addFavoriteButton">
          Lisää päivän listalle
        </button>
      </div>
    </div>`
    }
  `;

  selectedFoodEl.classList.remove("hidden");

  const amountInput = document.getElementById("amountInput");
  const calculatedFiberEl = document.getElementById("calculatedFiber");
  const addFavoriteButton = document.getElementById("addFavoriteButton");

  if (fiberPer100g != null && amountInput && calculatedFiberEl) {
    const updateCalc = () => {
      const amount = Number(amountInput.value);
      if (!amount || amount <= 0) {
        calculatedFiberEl.textContent = "-";
        return;
      }
      const fiber = (fiberPer100g * amount) / 100;
      calculatedFiberEl.textContent = `${formatNumber(fiber)} g`;
    };

    amountInput.addEventListener("input", updateCalc);
    updateCalc();

    addFavoriteButton?.addEventListener("click", () => {
      const amount = Number(amountInput.value);
      if (!amount || amount <= 0) return;
      const fiber = (fiberPer100g * amount) / 100;
      favorites.push({
        id: food.id,
        name,
        group,
        amount,
        fiberPer100g,
        fiber,
      });
      saveFavorites();
      renderFavorites();
    });
  }
}

function renderFavorites() {
  if (!favorites.length) {
    favoritesListEl.classList.add("empty-state");
    favoritesListEl.innerHTML =
      "Et ole vielä lisännyt yhtään ruokaa. Hae jokin ruoka ja lisää se listalle.";
    totalFiberEl.textContent = "0 g";
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
          <strong>${formatNumber(item.amount, 0)} g</strong> syöty
        </div>
        <div class="favorite-fiber">
          <strong>${formatNumber(item.fiber)} g</strong> kuitua
        </div>
        <button class="danger-button" data-index="${index}">
          Poista
        </button>
      </div>
    `
    )
    .join("");

  favoritesListEl.innerHTML = rows;

  const total = favorites.reduce((sum, item) => sum + (item.fiber || 0), 0);
  totalFiberEl.textContent = `${formatNumber(total)} g`;
  updateFiberGoalProgress(total);

  Array.from(
    favoritesListEl.querySelectorAll("button[data-index]")
  ).forEach((btn) => {
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
    return;
  }

  const ratio = totalFiber / goalGrams;
  const percent = Number.isFinite(ratio) ? ratio * 100 : 0;
  const clampedPercent = Math.max(0, Math.min(percent, 999));
  const percentText = `${formatNumber(clampedPercent, 0)} %`;

  fiberGoalProgressEl.textContent = `Päivän kuitu yhteensä ${formatNumber(
    totalFiber
  )} g / tavoite ${goalGrams} g (${percentText} tavoitteesta).`;
}

searchButton.addEventListener("click", searchFoods);
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    searchFoods();
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

loadFavorites();


