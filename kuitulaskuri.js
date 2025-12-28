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
  fi_min: { grams: 25, label: { fi:"Suomen vähimmäistaso (~25 g/vrk)", sv:"Finlands minimumnivå (~25 g/dag)", en:"Finland minimum level (~25 g/day)" } },
  avg: { grams: 30, label: { fi:"Hyvä keskimääräinen taso (~30 g/vrk)", sv:"Bra genomsnittlig nivå (~30 g/dag)", en:"Good average level (~30 g/day)" } },
  high: { grams: 40, label: { fi:"Korkea kuitutaso (~40 g/vrk, painonhallinnan tueksi)", sv:"Hög fibernivå (~40 g/dag, för viktkontroll)", en:"High fiber level (~40 g/day, for weight management)" } }
};
// Käännökset UI-teksteille
const I18N = {
  fi: {
    app_title: "Kuitulaskuri",
    app_description: "Hae ruokia Finelistä, lisää määrät ja seuraa kuitu- ja kalorikertymää suhteessa tavoitteeseen.",
    step1_title: "1. Hae ruoka Finelistä",
    step2_title: "2. Lisää suosikkiruokia ja kuitumäärät",
    step2_desc:
      "Valitse ruoka hakutuloksista. Laskuri käyttää ruoan kokonaista kuitua per 100 g ja muuntaa sen antamasi määrän mukaan.",
    step3_title: "3. Päivän kuitu- ja kaloriyhteenveto",
    step3_desc: "Valitse tavoite ja seuraa, kuinka lähelle pääset päivän aikana.",
    search: "Hae",
    search_placeholder: "Esim. omena, ruisleipä...",
    api_hint: "Hakukenttä käyttää Finelin avointa ohjelmointirajapintaa (/api/v1/foods?q=).",
    empty_list: "Et ole vielä lisännyt yhtään ruokaa.",
    goal_label: "Päivittäinen kuitutavoite",
    total_fiber_label: "Päivän kokonaiskuitu:",
    remaining_label: "Jäljellä tavoitteesta:",
    excess_label: "Ylitys:",
    total_cal_label: "Päivän kalorit:",
    clear_all: "Tyhjennä kaikki",
    guidance:
      "Suositeltu kuidun saanti aikuisille on usein 25–30 g/vrk, ja 35–40 g/vrk voi tukea painonhallintaa. Tarkista ajantasaiset ravitsemussuositukset luotettavasta lähteestä.",
    source_info: "Lähde: Terveyden ja hyvinvoinnin laitos, Fineli – elintarvikkeiden koostumustietokanta. Aineisto käytössä CC BY 4.0 -lisenssillä. Tämä sovellus ei ole THL:n tai Finelin tuottama, suosittelema tai ylläpitämä palvelu.",
    samples_title: "Korkean kuidun esimerkit",
    top20_title: "Top 20 kuidukkaimmat elintarvikkeet (Fineli, eniten ravintotekijää, g/100 g)",
    add_to_list: "Lisää päivän listalle",
    amount_label: "Määrä grammoina (g)",
    calc_for_amount: "Laskettu kuitu määrälle",
    no_fiber: "Kuitutietoa ei löytynyt tälle ruoalle. Valitse jokin toinen ruoka.",
    no_results: "Ei hakutuloksia. Kokeile toista hakusanaa.",
    progress_text: "Päivän kuitu yhteensä {total} g / tavoite {goal} g ({percent}% tavoitteesta).",
  },
  sv: {
    app_title: "Fiberräknare",
    app_description: "Sök livsmedel från Fineli, lägg till mängder och följ fiber- och kalorimängden i förhållande till målet.",
    step1_title: "1. Sök livsmedel från Fineli",
    step2_title: "2. Lägg till favoriter och fiber",
    step2_desc:
      "Välj livsmedel från resultaten. Räknaren använder totalfiber per 100 g och skalar till din mängd.",
    step3_title: "3. Dagens fiber- och kaloriöversikt",
    step3_desc: "Välj mål och följ hur nära du kommer under dagen.",
    search: "Sök",
    search_placeholder: "Ex. äpple, rågbröd...",
    api_hint: "Sökfältet använder Finelis öppna API (/api/v1/foods?q=).",
    empty_list: "Du har ännu inte lagt till något livsmedel.",
    goal_label: "Dagligt fibermål",
    total_fiber_label: "Dagens totalfiber:",
    remaining_label: "Kvar till målet:",
    excess_label: "Överskott:",
    total_cal_label: "Dagens kalorier:",
    clear_all: "Rensa alla",
    guidance:
      "Rekommenderat fiberintag för vuxna är ofta 25–30 g/dag och 35–40 g/dag kan stödja viktkontroll. Kontrollera aktuella rekommendationer från en pålitlig källa.",
    source_info: "Källa: Institutet för hälsa och välfärd, Fineli – livsmedelsdatabas. Materialet används under CC BY 4.0-licens. Denna applikation är inte producerad, rekommenderad eller underhållen av THL eller Fineli.",
    samples_title: "Exempel på fiberrika livsmedel",
    top20_title: "Topp 20 fiberrikaste livsmedel (Fineli, mest näringsämne, g/100 g)",
    add_to_list: "Lägg till på dagens lista",
    amount_label: "Mängd i gram (g)",
    calc_for_amount: "Beräknad fiber för mängden",
    no_fiber: "Ingen fiberdata för detta livsmedel. Välj ett annat.",
    no_results: "Inga träffar. Prova en annan sökning.",
    progress_text: "Dagens fiber totalt {total} g / mål {goal} g ({percent}% av målet).",
  },
  en: {
    app_title: "Fiber Calculator",
    app_description: "Search foods from Fineli, add amounts, and track fiber and calorie totals relative to your goal.",
    step1_title: "1. Search foods from Fineli",
    step2_title: "2. Add favourites and fiber amounts",
    step2_desc:
      "Pick a food from the results. The calculator uses total dietary fibre per 100 g and scales to your amount.",
    step3_title: "3. Daily fiber & calorie summary",
    step3_desc: "Choose a target and track your progress during the day.",
    search: "Search",
    search_placeholder: "E.g. apple, rye bread...",
    api_hint: "Search uses Fineli open API (/api/v1/foods?q=).",
    empty_list: "You have not added any foods yet.",
    goal_label: "Daily fiber goal",
    total_fiber_label: "Total daily fibre:",
    remaining_label: "Remaining to target:",
    excess_label: "Excess:",
    total_cal_label: "Daily calories:",
    clear_all: "Clear all",
    guidance:
      "Recommended fibre intake for adults is often 25–30 g/day, and 35–40 g/day can support weight management. Always check up-to-date recommendations from reliable sources.",
    source_info: "Source: Finnish Institute for Health and Welfare, Fineli – food composition database. Material used under CC BY 4.0 license. This application is not produced, recommended, or maintained by THL or Fineli.",
    samples_title: "High-fibre examples",
    top20_title: "Top 20 highest fiber foods (Fineli, most nutrient, g/100 g)",
    add_to_list: "Add to day list",
    amount_label: "Amount in grams (g)",
    calc_for_amount: "Calculated fibre for amount",
    no_fiber: "No fibre data for this food. Please select another.",
    no_results: "No results. Try another search.",
    progress_text: "Daily fiber total {total} g / goal {goal} g ({percent}% of goal).",
  },
};
// Top 20 kuidukkaimmat elintarvikkeet Finelin tietokannasta
// Filtteri: "Eniten ravintotekijää" (most nutrient)
// Lähde: Fineli-tietokanta, järjestetty kuidun määrän mukaan laskevasti
// Arvot perustuvat Finelin viralliseen listaukseen (kokonaiskuitu g/100g)
// Linkit ohjaavat Finelin hakuun (q=<nimi>), jotta käyttäjä pääsee helposti lähdesivulle.
const TOP20_SAMPLES = [
  { name: "Psyllium, siemenkuorijauhe", fiber: 85.0, link: "https://fineli.fi/fineli/fi/foods?q=psyllium" },
  { name: "Kaurakuitunen, kaurarouhe", fiber: 69.7, link: "https://fineli.fi/fineli/fi/foods?q=kaurakuitunen" },
  { name: "Ruusunmarja, kuivattu, ruusunmarjajauhe", fiber: 52.9, link: "https://fineli.fi/fineli/fi/foods?q=ruusunmarja" },
  { name: "Pihlajanmarja, kuivattu, pihlajanmarjajauhe", fiber: 50.3, link: "https://fineli.fi/fineli/fi/foods?q=pihlajanmarja" },
  { name: "Marja-aronia, kuivattu, marja-aroniajauhe", fiber: 49.1, link: "https://fineli.fi/fineli/fi/foods?q=marja-aronia" },
  { name: "Karpalo, kuivattu, karpalojauhe", fiber: 47.4, link: "https://fineli.fi/fineli/fi/foods?q=karpalo" },
  { name: "Merilevä, wakame, kuivattu", fiber: 47.1, link: "https://fineli.fi/fineli/fi/foods?q=wakame" },
  { name: "Katajanmarja", fiber: 45.0, link: "https://fineli.fi/fineli/fi/foods?q=katajanmarja" },
  { name: "Merilevä, nori, kuivattu", fiber: 44.4, link: "https://fineli.fi/fineli/fi/foods?q=nori" },
  { name: "Tyrnimarja, kuivattu, tyrnimarjajauhe", fiber: 44.3, link: "https://fineli.fi/fineli/fi/foods?q=tyrnimarja" },
  { name: "Oregano, kuivattu", fiber: 42.8, link: "https://fineli.fi/fineli/fi/foods?q=oregano" },
  { name: "Mustikka, kuivattu, mustikkajauhe", fiber: 41.8, link: "https://fineli.fi/fineli/fi/foods?q=mustikka" },
  { name: "Johanneksenleipäpuujauhe, carob-jauhe", fiber: 39.8, link: "https://fineli.fi/fineli/fi/foods?q=carob" },
  { name: "Lese, ruislese", fiber: 39.0, link: "https://fineli.fi/fineli/fi/foods?q=ruislese" },
  { name: "Mustaherukka, kuivattu, mustaherukkajauhe", fiber: 38.6, link: "https://fineli.fi/fineli/fi/foods?q=mustaherukka" },
  { name: "Mustatorvisieni, kuivattu", fiber: 38.0, link: "https://fineli.fi/fineli/fi/foods?q=mustatorvisieni" },
  { name: "Basilika, kuivattu", fiber: 37.7, link: "https://fineli.fi/fineli/fi/foods?q=basilika" },
  { name: "Lese, vehnälese", fiber: 37.5, link: "https://fineli.fi/fineli/fi/foods?q=vehnälese" },
  { name: "Paprikajauhe", fiber: 37.4, link: "https://fineli.fi/fineli/fi/foods?q=paprikajauhe" },
  { name: "Timjami, kuivattu", fiber: 37.0, link: "https://fineli.fi/fineli/fi/foods?q=timjami" },
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
const top20SamplesEl = document.getElementById("top20Samples");
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
  // Update placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    const translated = t(key);
    if (translated) el.placeholder = translated;
  });
  searchButton.textContent = t("search") || "Hae";
  // Update search placeholder (fallback)
  if (searchInput && !searchInput.hasAttribute("data-i18n-placeholder")) {
    searchInput.placeholder = t("search_placeholder") || "Esim. omena, ruisleipä...";
  }
  // Update dropdown options
  if (fiberGoalSelect) {
    const options = fiberGoalSelect.querySelectorAll("option");
    options.forEach((opt) => {
      const value = opt.value;
      if (FIBER_GOALS[value] && FIBER_GOALS[value].label[currentLang]) {
        opt.textContent = FIBER_GOALS[value].label[currentLang];
      }
    });
  }
  // Update app title and description
  const titleEl = document.querySelector("h1");
  if (titleEl) titleEl.textContent = t("app_title") || "Kuitulaskuri";
  const descEl = document.querySelector(".lead");
  if (descEl) descEl.textContent = t("app_description") || "";
  // Update source info
  const sourceEl = document.querySelector("[data-i18n='source_info']");
  if (sourceEl) {
    sourceEl.textContent = t("source_info") || "";
  }
  // Update clear button visibility
  if (clearAllButton) {
    clearAllButton.style.display = favorites.length > 0 ? "" : "none";
  }
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
  if (food.name && typeof food.name === "object" && food.name !== null) {
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
function getNameInCurrentLang(food) {
  if (!food) return null;
  
  // Tarkista ensin, onko ruoalla nimi-objekti (useimmiten Fineli palauttaa tämän muodossa)
  // Nimi-objekti on muodossa: {fi: "Porkkana", sv: "Morot", en: "Carrot"}
  if (food.name && typeof food.name === "object" && food.name !== null) {
    // Palauta nimi valitulla kielellä, jos se on olemassa
    const nameInLang = food.name[currentLang];
    if (nameInLang && typeof nameInLang === "string" && nameInLang.trim().length > 0) {
      return nameInLang.trim();
    }
    // Jos nimeä ei löydy valitulla kielellä, palauta null
    return null;
  }
  
  // Tarkista varakentät (nameFi, nameSv, nameEn)
  const byLangKey = food[`name${currentLang.toUpperCase()}`];
  if (byLangKey && typeof byLangKey === "string" && byLangKey.trim().length > 0) {
    return byLangKey.trim();
  }
  
  // Jos nimi on string-muodossa (ei objekti), se on todennäköisesti suomeksi
  // Palauta vain jos valittu kieli on suomi
  if (food.name && typeof food.name === "string" && food.name.trim().length > 0) {
    return currentLang === "fi" ? food.name.trim() : null;
  }
  
  return null;
}
function hasNameInCurrentLang(food) {
  return getNameInCurrentLang(food) !== null;
}
function filterFoodsByLanguage(foods, searchQuery = "") {
  if (!Array.isArray(foods)) return [];
  const query = searchQuery.toLowerCase().trim();
  
  // Jos hakusana on tyhjä, palauta kaikki ruoat joilla on nimi valitulla kielellä
  if (!query) {
    return foods.filter(food => hasNameInCurrentLang(food));
  }
  
  // Suodata ja priorisoi tulokset - sama logiikka kaikille kielille
  const results = foods
    .map(food => {
      // Tarkista ensin, onko ruoalla nimi valitulla kielellä
      const nameInLang = getNameInCurrentLang(food);
      if (!nameInLang) {
        // Jos ruoalla ei ole nimeä valitulla kielellä, hylkää se
        return null;
      }
      
      const nameLower = nameInLang.toLowerCase().trim();
      const queryLower = query.toLowerCase().trim();
      
      // Tarkista, sisältääkö nimi valitulla kielellä hakusanan (case-insensitive)
      // Tämä on kriittinen: tarkistamme vain nimeä valitulla kielellä, ei muita kieliä
      if (!nameLower.includes(queryLower)) {
        return null;
      }
      
      // Laske prioriteetti (sama kaikille kielille):
      // 1. Täysi osuma (esim. "apple" = "Apple" tai "morot" = "Morot" tai "omena" = "Omena") - korkein prioriteetti (3)
      // 2. Alkaa hakusanalla (esim. "app" → "Apple" tai "moro" → "Morot" tai "omen" → "Omena") - toiseksi korkein (2)
      // 3. Sisältää hakusanan muualla (esim. "app" → "Fruit Salad, Apple" tai "moro" → "Morotsallad" tai "omen" → "Hedelmäsalaatti, omena") - alhaisin (1)
      const isExactMatch = nameLower === queryLower;
      const startsWithQuery = nameLower.startsWith(queryLower);
      const priority = isExactMatch ? 3 : startsWithQuery ? 2 : 1;
      
      return { food, priority, nameInLang, nameLower };
    })
    .filter(item => item !== null)
    .sort((a, b) => {
      // Lajittele ensisijaisesti prioriteetin mukaan (korkeampi ensin) - sama kaikille kielille
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      // Jos prioriteetti on sama, lajittele aakkosjärjestykseen valitun kielen mukaan
      const locale = currentLang === "fi" ? "fi" : currentLang === "sv" ? "sv" : "en";
      return a.nameInLang.localeCompare(b.nameInLang, locale, { sensitivity: "base" });
    })
    .map(item => item.food);
  
  return results;
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
    
    // Debug: tarkista mitä dataa saadaan
    if (!Array.isArray(data)) {
      console.error("API palautti ei-taulukon:", data);
      searchResultsEl.innerHTML = '<div class="error-text">Haku palautti virheellisen datan.</div>';
      return;
    }
    
    // Suodata tulokset valitun kielen mukaan ja varmista että nimi vastaa hakusanaa
    const filteredData = filterFoodsByLanguage(data, query);
    
    // Debug: tarkista suodatuksen tulos
    if (filteredData.length === 0 && data.length > 0) {
      console.log(`Haku "${query}" kielellä "${currentLang}" palautti ${data.length} tulosta, mutta suodatuksen jälkeen 0.`);
      // Tarkista ensimmäiset 10 ruokaa
      for (let i = 0; i < Math.min(10, data.length); i++) {
        const food = data[i];
        const nameInLang = getNameInCurrentLang(food);
        const nameLower = nameInLang ? nameInLang.toLowerCase().trim() : null;
        const queryLower = query.toLowerCase().trim();
        const containsQuery = nameLower ? nameLower.includes(queryLower) : false;
        console.log(`Ruoan ${i + 1}:`, {
          id: food.id,
          nameObj: food.name,
          nameInLang: nameInLang,
          nameLower: nameLower,
          queryLower: queryLower,
          containsQuery: containsQuery,
          allNames: food.name && typeof food.name === "object" ? {
            fi: food.name.fi,
            sv: food.name.sv,
            en: food.name.en
          } : food.name
        });
      }
    } else if (filteredData.length > 0) {
      console.log(`Haku "${query}" kielellä "${currentLang}" palautti ${data.length} tulosta, suodatuksen jälkeen ${filteredData.length} tulosta.`);
    }
    
    renderSearchResults(filteredData);
    renderSuggestions(filteredData);
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
        energyPer100g,
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
    if (clearAllButton) {
      clearAllButton.style.display = "none";
    }
    return;
  }
  if (clearAllButton) {
    clearAllButton.style.display = "";
  }
  favoritesListEl.classList.remove("empty-state");
  const rows = favorites
    .map(
      (item, index) => `
      <div class="favorite-row" data-index="${index}">
        <div class="favorite-name">${item.name}</div>
        <div class="favorite-amount">
          <input
            type="number"
            class="amount-input"
            min="1"
            max="2000"
            step="1"
            value="${item.amount}"
            data-index="${index}"
          />
          <span>g</span>
        </div>
        <div class="favorite-fiber">
          <strong class="fiber-value">${formatNumber(item.fiber)}</strong> ${currentLang === "sv" ? "g fiber" : currentLang === "en" ? "g fiber" : "g kuitua"}
        </div>
        <div class="favorite-cal">
          ${
            item.energy != null
              ? `<strong class="energy-value">${formatNumber(item.energy)}</strong> kcal`
              : "–"
          }
        </div>
        <button class="danger-button" data-index="${index}">
          ${currentLang === "sv" ? "Ta bort" : currentLang === "en" ? "Remove" : "Poista"}
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
  // Add event listeners for amount inputs
  favoritesListEl.querySelectorAll(".amount-input").forEach((input) => {
    const updateAmount = (e) => {
      const index = Number(e.target.getAttribute("data-index"));
      const item = favorites[index];
      if (!item) return;
      let newAmount = Number(e.target.value);
      // Validate and clamp amount
      if (!newAmount || newAmount <= 0) {
        newAmount = 1;
      } else if (newAmount > 2000) {
        newAmount = 2000;
      }
      // Update input value if it was clamped
      if (newAmount !== Number(e.target.value)) {
        e.target.value = newAmount;
      }
      const oldAmount = item.amount;
      // Calculate energyPer100g from existing data if not stored (for old items)
      if (item.energyPer100g == null && item.energy != null && oldAmount > 0) {
        item.energyPer100g = (item.energy * 100) / oldAmount;
      }
      // Update amount
      item.amount = newAmount;
      // Recalculate fiber
      if (item.fiberPer100g != null) {
        item.fiber = (item.fiberPer100g * newAmount) / 100;
      }
      // Recalculate energy
      if (item.energyPer100g != null) {
        item.energy = (item.energyPer100g * newAmount) / 100;
      }
      // Update display in the row
      const row = e.target.closest(".favorite-row");
      const fiberValueEl = row.querySelector(".fiber-value");
      const energyValueEl = row.querySelector(".energy-value");
      if (fiberValueEl) {
        fiberValueEl.textContent = formatNumber(item.fiber);
      }
      if (energyValueEl && item.energy != null) {
        energyValueEl.textContent = formatNumber(item.energy);
      }
      // Update totals
      const totalFiber = favorites.reduce((sum, item) => sum + (item.fiber || 0), 0);
      const totalEnergy = favorites.reduce((sum, item) => sum + (item.energy || 0), 0);
      totalFiberEl.textContent = `${formatNumber(totalFiber)} g`;
      totalCaloriesEl.textContent = `${formatNumber(totalEnergy, 0)} kcal`;
      updateFiberGoalProgress(totalFiber);
      // Save to localStorage
      saveFavorites();
    };
    input.addEventListener("input", updateAmount);
    input.addEventListener("blur", updateAmount);
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
  const percentText = `${formatNumber(percent, 0)}`;
  remainingFiberEl.textContent = `${formatNumber(remaining)} g`;
  excessFiberEl.textContent = `${formatNumber(excess)} g`;
  const progressText = t("progress_text")
    .replace("{total}", formatNumber(totalFiber))
    .replace("{goal}", goalGrams)
    .replace("{percent}", percentText);
  fiberGoalProgressEl.textContent = progressText;
}
function populateSamples() {
  if (top20SamplesEl) {
    top20SamplesEl.innerHTML = TOP20_SAMPLES.map((item, idx) => {
      const num = idx + 1;
      return `<li><a href="${item.link}" target="_blank" rel="noreferrer noopener">${num}. ${item.name}</a> – ${item.fiber} g/100 g</li>`;
    }).join("");
  }
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
  populateSamples();
});
// Init
applyTranslations();
populateSamples();
loadFavorites();
