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
  fi_min: { grams: 25, label: { fi: "Saantisuositus, naiset (~25 g/vrk)", sv: "Rekommenderat intag, kvinnor (~25 g/dag)", en: "Recommended intake, women (~25 g/day)" } },
  avg: { grams: 35, label: { fi: "Saantisuositus, miehet (~35 g/vrk)", sv: "Rekommenderat intag, män (~35 g/dag)", en: "Recommended intake, men (~35 g/day)" } },
  high: { grams: 40, label: { fi: "Korkea taso (~40 g/vrk, painonhallinnan tueksi)", sv: "Hög nivå (~40 g/dag, för viktkontroll)", en: "High level (~40 g/day, for weight management)" } }
};

// Käännökset UI-teksteille
const I18N = {
  fi: {
    app_title: "Kuitulaskuri",
    app_description: "Hae ruokia Finelistä, lisää määrät ja seuraa kuitu- ja kalorikertymää suhteessa tavoitteeseen.",
    step1_title: "Hae ruoka Finelistä",
    step2_title: "Lisää suosikkiruokia ja kuitumäärät",
    step2_desc: "Valitse ruoka hakutuloksista. Laskuri käyttää ruoan kokonaista kuitua per 100 g ja muuntaa sen antamasi määrän mukaan.",
    step3_title: "Päivän kuitu- ja kaloriyhteenveto",
    step3_desc: "Valitse tavoite ja seuraa, kuinka lähelle pääset päivän aikana.",
    search: "Hae",
    search_placeholder: "Esim. omena, ruisleipä...",
    api_hint: "Sovellus käyttää Finelin avointa rajapintaa (/api/v1/foods?q=) ja tarjoaa suuntaa-antavaa tietoa. Tiedot haetaan ulkoisista lähteistä, eikä niiden tarkkuutta tai ajantasaisuutta voida taata.",
    empty_list: "Et ole vielä lisännyt yhtään ruokaa.",
    goal_label: "Päivittäinen kuitutavoite",
    total_fiber_label: "Päivän kokonaiskuitu:",
    remaining_label: "Jäljellä tavoitteesta:",
    excess_label: "Ylitys:",
    total_cal_label: "Päivän arvioidut kalorit valintojesi perusteella:",
    clear_all: "Tyhjennä kaikki",
    guidance: "Suositeltu kuidun saanti aikuisille on usein 25–30 g/vrk, ja 35–40 g/vrk voi tukea painonhallintaa. Tarkista ajantasaiset ravitsemussuositukset luotettavasta lähteestä.",
    source_info: "Lähde: Terveyden ja hyvinvoinnin laitos, Fineli – elintarvikkeiden koostumustietokanta. Aineisto käytössä CC BY 4.0 -lisenssillä. Tämä sovellus ei ole THL:n tai Finelin tuottama, suosittelema tai ylläpitämä palvelu.",
    source: "Lähde: Terveyden ja hyvinvoinnin laitos, Fineli – elintarvikkeiden koostumustietokanta. Aineisto käytössä CC BY 4.0 -lisenssillä. Tämä sovellus ei ole THL:n tai Finelin tuottama, suosittelema tai ylläpitämä palvelu.",
    samples_title: "Korkean kuidun esimerkkejä",
    top20_title: "Esimerkkejä runsaskuituisista elintarvikkeista (Fineli, eniten ravintotekijää, g/100 g)",
    add_to_list: "Lisää päivän listalle",
    amount_label: "Määrä grammoina (g)",
    calc_for_amount: "Laskettu kuitu määrälle",
    no_fiber: "Kuitutietoa ei löytynyt tälle ruoalle. Valitse jokin toinen ruoka.",
    no_results: "Ei hakutuloksia. Kokeile toista hakusanaa.",
    progress_text: "Päivän kuitu yhteensä {total} g / tavoite {goal} g ({percent}% tavoitteesta).",
    searching: "Haetaan...",
    search_error: "Haku epäonnistui. Tarkista verkkoyhteys ja yritä uudelleen.",
    service_error: "Finelin palvelussa on häiriö (virhe {status}). Yritä myöhemmin uudelleen.",
    anonymous: "(nimetön)",
    empty_list_hint: "Et ole vielä lisännyt yhtään ruokaa. Hae jokin ruoka ja lisää se listalle.",
    eaten_label: "syöty",
    fiber_word: "kuitua",
    remove_button: "Poista",
    confirm_clear: "Tyhjennetäänkö kaikki päivän ruoat?",
    lead: "Laske päivän kuitu- ja kalorimäärät helposti.",
    search_section_title: "Hae ruoka-aine",
    nav_apps: "Sovellukset.com",
  },
  sv: {
    app_title: "Fiberräknare",
    app_description: "Sök livsmedel från Fineli, lägg till mängder och följ fiber- och kalorimängden i förhållande till målet.",
    step1_title: "Sök livsmedel från Fineli",
    step2_title: "Lägg till favoriter och fiber",
    step2_desc: "Välj livsmedel från resultaten. Räknaren använder totalfiber per 100 g och skalar till din mängd.",
    step3_title: "Dagens fiber- och kaloriöversikt",
    step3_desc: "Välj mål och följ hur nära du kommer under dagen.",
    search: "Sök",
    search_placeholder: "Ex. äpple, rågbröd...",
    api_hint: "Applikationen använder Finels öppna API (/api/v1/foods?q=) och ger vägledande information. Uppgifterna hämtas från externa källor, och vi kan inte garantera deras noggrannhet eller aktualitet.",
    empty_list: "Du har ännu inte lagt till något livsmedel.",
    goal_label: "Dagligt fibermål",
    total_fiber_label: "Dagens totalfiber:",
    remaining_label: "Kvar till målet:",
    excess_label: "Överskott:",
    total_cal_label: "Dagens uppskattade kalorier baserat på dina val:",
    clear_all: "Rensa alla",
    guidance: "Rekommenderat fiberintag för vuxna är ofta 25–30 g/dag och 35–40 g/dag kan stödja viktkontroll. Kontrollera aktuella rekommendationer från en pålitlig källa.",
    source_info: "Källa: Institutet för hälsa och välfärd, Fineli – livsmedelsdatabas. Materialet används under CC BY 4.0-licens. Denna applikation är inte producerad, rekommenderad eller underhållen av THL eller Fineli.",
    source: "Källa: Institutet för hälsa och välfärd, Fineli – livsmedelsdatabas. Materialet används under CC BY 4.0-licens. Denna applikation är inte producerad, rekommenderad eller underhållen av THL eller Fineli.",
    samples_title: "Exempel på fiberrika livsmedel",
    top20_title: "Exempel på fiberrika livsmedel (Fineli, mest näringsämne, g/100 g)",
    add_to_list: "Lägg till på dagens lista",
    amount_label: "Mängd i gram (g)",
    calc_for_amount: "Beräknad fiber för mängden",
    no_fiber: "Ingen fiberdata för detta livsmedel. Välj ett annat.",
    no_results: "Inga träffar. Prova en annan sökning.",
    progress_text: "Dagens fiber totalt {total} g / mål {goal} g ({percent}% av målet).",
    searching: "Söker...",
    search_error: "Sökningen misslyckades. Kontrollera internetanslutningen och försök igen.",
    service_error: "Störning i Fineli-tjänsten (fel {status}). Försök igen senare.",
    anonymous: "(namnlös)",
    empty_list_hint: "Du har ännu inte lagt till något livsmedel. Sök efter ett livsmedel och lägg till det i listan.",
    eaten_label: "ätit",
    fiber_word: "fiber",
    remove_button: "Ta bort",
    confirm_clear: "Rensa alla dagens livsmedel?",
    lead: "Räkna enkelt dagens fiber- och kaloriintag.",
    search_section_title: "Sök livsmedel",
    nav_apps: "Sovellukset.com",
  },
  en: {
    app_title: "Fiber Calculator",
    app_description: "Search foods from Fineli, add amounts, and track fiber and calorie totals relative to your goal.",
    step1_title: "Search foods from Fineli",
    step2_title: "Add favourites and fiber amounts",
    step2_desc: "Pick a food from the results. The calculator uses total dietary fibre per 100 g and scales to your amount.",
    step3_title: "Daily fiber & calorie summary",
    step3_desc: "Choose a target and track your progress during the day.",
    search: "Search",
    search_placeholder: "E.g. apple, rye bread...",
    api_hint: "This application uses Finel’s open API (/api/v1/foods?q=) and provides indicative information only. Data is retrieved from external sources, and its accuracy or timeliness cannot be guaranteed.",
    empty_list: "You have not added any foods yet.",
    goal_label: "Daily fiber goal",
    total_fiber_label: "Total fiber for the day:",
    remaining_label: "Remaining to target:",
    excess_label: "Excess:",
    total_cal_label: "Estimated daily calories based on your selections:",
    clear_all: "Clear all",
    guidance: "Recommended fibre intake for adults is often 25–30 g/day, and 35–40 g/day can support weight management. Always check up-to-date recommendations from reliable sources.",
    source_info: "Source: Finnish Institute for Health and Welfare, Fineli – food composition database. Material used under CC BY 4.0 license. This application is not produced, recommended, or maintained by THL or Fineli.",
    source: "Source: Finnish Institute for Health and Welfare, Fineli – food composition database. Material used under CC BY 4.0 license. This application is not produced, recommended, or maintained by THL or Fineli.",
    samples_title: "High-fibre examples",
    top20_title: "Examples of high-fibre foods (Fineli, highest nutrient, g/100 g)",
    add_to_list: "Add to day list",
    amount_label: "Amount in grams (g)",
    calc_for_amount: "Calculated fibre for amount",
    no_fiber: "No fibre data for this food. Please select another.",
    no_results: "No results. Try another search.",
    progress_text: "Daily fiber total {total} g / goal {goal} g ({percent}% of goal).",
    searching: "Searching...",
    search_error: "Search failed. Check your network connection and try again.",
    service_error: "Fineli service disruption (error {status}). Please try again later.",
    anonymous: "(unnamed)",
    empty_list_hint: "You have not added any foods yet. Search for a food and add it to the list.",
    eaten_label: "eaten",
    fiber_word: "fiber",
    remove_button: "Remove",
    confirm_clear: "Clear all foods for the day?",
    lead: "Calculate daily fiber and calorie totals easily.",
    search_section_title: "Search food item",
    nav_apps: "Sovellukset.com",
  },
};

// Kielikohtaiset esimerkkilistat (Fineli IDs)
const SAMPLE_LISTS = {
  fi: [
    { id: 31681, name: "Psyllium, siemenkuorijauhe" },
    { id: 29237, name: "Lese, ruislese" },
    { id: 116, name: "Lese, vehnälese" },
    { id: 29772, name: "Hapankorppu" },
    { id: 170, name: "Lese, kauralese" },
    { id: 310, name: "Maa-artisokka" },
    { id: 34680, name: "Passionhedelmä" },
    { id: 33069, name: "Popcorn" },
    { id: 378, name: "Pähkinä, maapähkinä" },
    { id: 31214, name: "Papu, kidneypapu, keitetty" },
  ],
  sv: [
    { id: 31681, name: "Psyllium fröskal" },
    { id: 29237, name: "Kli, rågkli" },
    { id: 116, name: "Kli, vetekli" },
    { id: 29772, name: "Surskorpa" },
    { id: 170, name: "Kli, havrekli" },
    { id: 310, name: "Jordärtskocka" },
    { id: 34680, name: "Passionsfrukt" },
    { id: 33069, name: "Popcorn" },
    { id: 378, name: "Nöt, jordnöt" },
    { id: 31214, name: "Bönor, kidneybönor, kokta" },
  ],
  en: [
    { id: 31681, name: "Psyllium Husks" },
    { id: 29237, name: "Rye bran" },
    { id: 116, name: "Wheat bran" },
    { id: 29772, name: "Finn Crisp, Rye Crispbread" },
    { id: 170, name: "Oat bran" },
    { id: 310, name: "Jerusalem Artichoke" },
    { id: 34680, name: "Passion Fruit" },
    { id: 33069, name: "Popcorn" },
    { id: 378, name: "Nut, Peanut" },
    { id: 31214, name: "Bean, Kidney Bean, Boiled" },
  ]
};



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
const sampleListEl = document.getElementById("sampleList");

let favorites = [];
let currentLang = "fi";
let searchTimeout = null;

// Global variables for caching foods
let searchCache = {};

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
  return Number(value).toLocaleString(
    currentLang === "fi" ? "fi-FI" : currentLang === "sv" ? "sv-SE" : "en-US",
    {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }
  );
}

function t(key) {
  return (I18N[currentLang] && I18N[currentLang][key]) || I18N.fi[key] || "";
}

function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    const translated = t(key);
    if (translated) el.innerHTML = translated;
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
  // Document title
  try {
    document.title = t("app_title") || document.title;
  } catch (e) { }

  // Update source info
  const sourceEl1 = document.querySelector("[data-i18n='source_info']");
  if (sourceEl1) {
    sourceEl1.textContent = t("source_info") || t("source") || "";
  }
  const sourceEl2 = document.querySelector("[data-i18n='source']");
  if (sourceEl2) {
    sourceEl2.textContent = t("source") || t("source_info") || "";
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

// Palauttaa energian (kcal/100g) aina kun mahdollista
function getEnergyPer100g(components = []) {

  // 1) Suora Fineli kcal-komponentti
  for (const id of ENERGY_COMPONENT_IDS) {
    const comp = components.find((c) => c.componentId === id);
    if (comp && typeof comp.value === "number") {
      console.log("ENERGY SOURCE: direct kcal component", comp.value);
      return comp.value;
    }
  }

  // 2) Fallback: energia-nimiset komponentit (kcal tai kJ)
  const fallback = components.find(c =>
    typeof c.value === "number" &&
    (
      (c.name?.fi || "").toLowerCase().includes("energia") ||
      (c.name?.en || "").toLowerCase().includes("energy") ||
      (c.shortName?.fi || "").toLowerCase().includes("energia") ||
      (c.shortName?.en || "").toLowerCase().includes("energy") ||
      (c.name?.fi || "").toLowerCase().includes("kcal") ||
      (c.name?.en || "").toLowerCase().includes("kcal")
    )
  );

  if (fallback) {
    const name = (fallback.name?.fi || fallback.name?.en || "").toLowerCase();

    // 2a) Jos arvo on kJ → muunna kcal
    if (name.includes("kj")) {
      const kcal = fallback.value / 4.184;
      console.log("ENERGY SOURCE: kJ → kcal", fallback.value, "→", kcal);
      return kcal;
    }

    // 2b) Muuten käytä suoraan
    console.log("ENERGY SOURCE: fallback kcal", fallback.value);
    return fallback.value;
  }

  // 3) Laske energia makroista (proteiini, hiilarit, rasva)
  let protein = null;
  let carbs = null;
  let fat = null;

  for (const c of components) {
    const name = (c.name?.fi || c.name?.en || "").toLowerCase();

    if (name.includes("proteiini") || name.includes("protein")) {
      protein = typeof c.value === "number" ? c.value : protein;
    }
    if (name.includes("hiilihydraatti") || name.includes("carbohydrate")) {
      carbs = typeof c.value === "number" ? c.value : carbs;
    }
    if (name.includes("rasva") || name.includes("fat")) {
      fat = typeof c.value === "number" ? c.value : fat;
    }
  }

  if (protein != null || carbs != null || fat != null) {
    const kcal =
      (protein || 0) * 4 +
      (carbs || 0) * 4 +
      (fat || 0) * 9;

    console.log("ENERGY SOURCE: macros → kcal", { protein, carbs, fat, kcal });
    return kcal;
  }

  // 4) Ei energiaa saatavilla
  console.log("ENERGY SOURCE: none found");
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
  // Tarkista ensin, onko ruoalla nimi-objekti
  if (food.name && typeof food.name === "object" && food.name !== null) {
    const nameInLang = food.name[currentLang];
    if (nameInLang && typeof nameInLang === "string" && nameInLang.trim().length > 0) {
      return nameInLang.trim();
    }
    return null;
  }
  // Tarkista varakentät (nameFi, nameSv, nameEn)
  const byLangKey = food[`name${currentLang.toUpperCase()}`];
  if (byLangKey && typeof byLangKey === "string" && byLangKey.trim().length > 0) {
    return byLangKey.trim();
  }
  // Jos nimi on string-muodossa (ei objekti), se on todennäköisesti suomeksi
  if (food.name && typeof food.name === "string" && food.name.trim().length > 0) {
    return currentLang === "fi" ? food.name.trim() : null;
  }
  return null;
}

function hasNameInCurrentLang(food) {
  return getNameInCurrentLang(food) !== null;
}


// Priorisoi raaka-aineet hakutuloksissa
function isFuzzyMatch(str, query) {
  if (str.includes(query) || query.includes(str)) return true;
  // Check if differ by one insertion/deletion
  if (Math.abs(str.length - query.length) === 1) {
    const longer = str.length > query.length ? str : query;
    const shorter = str.length > query.length ? query : str;
    let i = 0;
    while (i < shorter.length && longer[i] === shorter[i]) i++;
    if (i === shorter.length || longer.slice(i + 1) === shorter.slice(i)) return true;
  }
  return false;
}

function isRawFood(foodName) {
  if (!foodName || typeof foodName !== "string") return false;
  const lowerName = foodName.toLowerCase();
  const complexNames = [
    "puuro", "piirakka", "leipä", "jauhe", "sekoitus", "sose", "keitto", "pata",
    "pasta", "kastike", "kakku", "leivonnainen", "smoothie", "patukka", "jogurtti",
    "juoma", "mehu", "pizza", "hampurilainen", "makaroni", "spagetti", "nuudeli",
    "flakes", "chips", "jam", "pie", "crisp", "delight", "paisto", "paahdet", "grill"
  ];
  return !complexNames.some(name => lowerName.includes(name));
}

// Korjattu haku: käyttää kaikkia kieliä haussa, mutta näyttää ja järjestää valitulla kielellä
function filterFoodsByLanguage(foods, searchQuery = "") {
  if (!Array.isArray(foods)) return [];

  const query = searchQuery.toLowerCase().trim();
  if (!query) {
    return foods.filter(food => hasNameInCurrentLang(food));
  }

  return foods
    .map(food => {
      // Check all name fields for matching
      const names = [];
      if (food.name && typeof food.name === "object") {
        names.push(food.name.fi, food.name.sv, food.name.en);
      } else if (typeof food.name === "string") {
        names.push(food.name);
      }
      if (food.nameFi) names.push(food.nameFi);
      if (food.nameSv) names.push(food.nameSv);
      if (food.nameEn) names.push(food.nameEn);

      const matchingName = names.find(n => n && n.toLowerCase().includes(query));
      if (!matchingName) return null;

      // Use current lang name for display and sorting
      const displayName = getFoodNameByLang(food) || matchingName;
      const displayLower = displayName.toLowerCase();
      const matchLower = matchingName.toLowerCase();

      // Prioritize based on the matching name
      const isExact = matchLower === query;
      const startsWith = matchLower.startsWith(query);
      const isRaw = isRawFood(matchLower);

      // Calculate common prefix length for better prioritization
      let commonPrefix = 0;
      const minLen = Math.min(matchLower.length, query.length);
      while (commonPrefix < minLen && matchLower[commonPrefix] === query[commonPrefix]) {
        commonPrefix++;
      }

      let priority = commonPrefix * 0.5;  // Longer common prefix = higher priority
      if (isRaw) priority += 3;  // Raw foods get +3
      if (isExact) priority += 2;  // Exact match +2
      else if (startsWith) priority += 1;  // Starts with +1
      else if (matchLower.includes(query)) priority += 0.5;  // Contains +0.5

      return { food, priority, nameLower: displayLower };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.nameLower.localeCompare(b.nameLower, currentLang);
    })
    .map(item => item.food);
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
  searchButton.textContent = t("searching") || "Haetaan...";

  try {
    const searchQuery = query.trim();
    const cacheKey = `${currentLang}:${searchQuery}`;

    // Check cache (key includes language)
    if (searchCache[cacheKey]) {
      const data = searchCache[cacheKey];
      console.log(`Search "${searchQuery}" (lang: ${currentLang}) returned ${data.length} cached foods.`);
      // Filter filtering is less critical now if API returns relevant stuff, 
      // but we still keep it for UI consistency (sorting by match quality).
      const filteredData = filterFoodsByLanguage(data, searchQuery);
      renderSearchResults(filteredData);
      return;
    }

    // Fetch from API with lang parameter
    const url = `${API_BASE}/foods?q=${encodeURIComponent(searchQuery)}&lang=${currentLang}`;
    const res = await fetch(url);

    if (!res.ok) {
      if (res.status === 408 || res.status === 503 || res.status === 500) {
        const msg = (t("service_error") || "Finelin palvelussa on häiriö").replace("{status}", res.status);
        throw new Error(msg);
      }
      throw new Error(`Search failed (${res.status})`);
    }

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("API returned invalid data:", data);
      searchResultsEl.innerHTML = '<div class="error-text">Search returned invalid data.</div>';
      return;
    }

    // Cache the results
    searchCache[cacheKey] = data;

    const filteredData = filterFoodsByLanguage(data, searchQuery);
    console.log(`Search "${searchQuery}" (lang: ${currentLang}) returned ${data.length} foods.`);

    renderSearchResults(filteredData);
  } catch (err) {
    console.error(err);
    // Prefer the error message from the error object if it looks like a user-facing message
    let userMsg = t("search_error");
    if (err.message && (err.message.includes("Finelin") || err.message.includes("Fineli") || err.message.includes("häiriö"))) {
      userMsg = err.message;
    }
    searchResultsEl.innerHTML = `<div class="error-text">${userMsg}</div>`;
  } finally {
    searchButton.disabled = false;
    searchButton.textContent = t("search") || "Hae";
  }
}

// Korjattu renderöinti: näyttää nimen valitulla kielellä
function renderSearchResults(foods) {
  if (!Array.isArray(foods) || foods.length === 0) {
    searchResultsEl.innerHTML = `<div class="empty-state">${t("no_results")}</div>`;
    return;
  }

  const items = foods
    .map(food => {
      const comps = normalizeComponents(food);
      const fiber = getFiberPer100g(comps) ?? getFiberFromFood(food);
      const fiberText = fiber != null
        ? `${formatNumber(fiber)} g / 100 g`
        : t("no_fiber");

      const name = getFoodNameByLang(food);
      const group = getGroupNameByLang(food);

      return `
        <div class="result-item" data-id="${food.id}">
          <div class="result-main">
            <div class="food-name">${name}</div>
            <div class="food-meta">${group} · ${fiberText}</div>
          </div>
        </div>
      `;
    })
    .join("");

  searchResultsEl.innerHTML = items;
  searchResultsEl.classList.remove("hidden");

  searchResultsEl.querySelectorAll(".result-item").forEach(el => {
    el.addEventListener("click", () => {
      const id = Number(el.getAttribute("data-id"));
      if (id) loadFoodDetails(id);
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
  const fiberText = fiberPer100g != null ? `${formatNumber(fiberPer100g)} g / 100 g` : "–";
  const canAdd = fiberPer100g != null;
  const name = getFoodNameByLang(food);
  const group = getGroupNameByLang(food);
  const defaultAmount = getDefaultAmountForFood(name);

  selectedFoodEl.innerHTML = `
    <div class="selected-simple">
      <div class="selected-row">
        <div class="selected-left">
          <div class="selected-title">${name}, ${group} ${fiberText}</div>
          <div class="selected-meta">
            <div>Laskettu kuitu määrälle: <strong id="calculatedFiber">${canAdd ? `${formatNumber((fiberPer100g * defaultAmount) / 100)} g` : "-"}</strong></div>
            <div>Kalorit: <strong id="calculatedEnergy">${energyPer100g != null ? `${formatNumber((energyPer100g * defaultAmount) / 100)} kcal` : "–"}</strong></div>
          </div>
        </div>
        <div class="selected-right">
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
            <span style="font-size: 0.9rem; margin: 0 0.3rem;">g</span>
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

      doAddFoodToFavorites(food, amount, fiberPer100g, energyPer100g);
    });
  }
}

function doAddFoodToFavorites(food, amount, fiberPer100g, energyPer100g) {
  // Create multilingual name object
  let nameObj = {};

  // If food.name is already an object, use it (or parts of it)
  if (food.name && typeof food.name === "object") {
    nameObj = { ...food.name };
  }

  // If we only derived a string, try to fill known languages if available in food object properties
  if (!nameObj.fi && food.nameFi) nameObj.fi = food.nameFi;
  if (!nameObj.sv && food.nameSv) nameObj.sv = food.nameSv;
  if (!nameObj.en && food.nameEn) nameObj.en = food.nameEn;

  // Fallbacks if still empty
  if (!nameObj.fi) nameObj.fi = getNameInCurrentLang(food) || getFoodNameByLang(food);

  const fiber = (fiberPer100g * amount) / 100;
  const energy = energyPer100g != null ? (energyPer100g * amount) / 100 : 0;
  const group = getGroupNameByLang(food);

  favorites.push({
    id: food.id,
    name: nameObj, // Store object instead of string
    group,
    amount,
    fiberPer100g,
    energyPer100g,
    fiber,
    energy,
  });

  saveFavorites();
  renderFavorites();
}
function renderFavorites() {
  if (!favoritesListEl) return;

  // Note: We no longer need to update sample names here because we store multilingual objects.
  // Legacy support: if favorites have string names, we leave them as is or could try to match them (risky).

  if (!favorites.length) {
    favoritesListEl.classList.add("empty-state");
    favoritesListEl.innerHTML = t("empty_list_hint") || t("empty_list");
    totalFiberEl.textContent = `0 g`;
    remainingFiberEl.textContent = `0 g`;
    excessFiberEl.textContent = `0 g`;
    totalCaloriesEl.textContent = `0 kcal`;
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
      (item, index) => {
        // Resolve name for display
        let displayName = "(nimetön)";
        if (typeof item.name === "object" && item.name !== null) {
          displayName = item.name[currentLang] || item.name.fi || item.name.sv || item.name.en || Object.values(item.name)[0] || "(nimetön)";
        } else if (typeof item.name === "string") {
          displayName = item.name;
        }

        return `
      <div class="favorite-row" data-index="${index}">
        <div class="favorite-name">${displayName}</div>
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
          <strong class="fiber-value">${formatNumber(item.fiber)}</strong> ${t("fiber_word") || (currentLang === "sv" || currentLang === "en" ? "g fiber" : "g kuitua")}
        </div>
        <div class="favorite-cal">
          ${item.energy != null
            ? `<strong class="energy-value">${formatNumber(item.energy)}</strong> kcal`
            : "–"
          }
        </div>
        <button class="danger-button" data-index="${index}">
          ${t("remove_button")}
        </button>
      </div>
    `;
      })
    .join("");

  favoritesListEl.innerHTML = rows;

  const totalFiber = favorites.reduce((sum, item) => sum + (item.fiber || 0), 0);
  const totalEnergy = favorites.reduce((sum, item) => sum + (item.energy || 0), 0);

  totalCaloriesEl.textContent = `${formatNumber(totalEnergy, 0)} kcal`;
  totalFiberEl.textContent = `${formatNumber(totalFiber)} g`;
  // totalCaloriesEl (duplicate assignment removed)
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
      if (!newAmount || newAmount <= 0) {
        newAmount = 1;
      } else if (newAmount > 2000) {
        newAmount = 2000;
      }

      if (newAmount !== Number(e.target.value)) {
        e.target.value = newAmount;
      }

      const oldAmount = item.amount;

      // Laske energyPer100g vanhoille riveille tarvittaessa
      if (item.energyPer100g == null && item.energy != null && oldAmount > 0) {
        item.energyPer100g = (item.energy * 100) / oldAmount;
      }

      item.amount = newAmount;

      if (item.fiberPer100g != null) {
        item.fiber = (item.fiberPer100g * newAmount) / 100;
      }

      if (item.energyPer100g != null) {
        item.energy = (item.energyPer100g * newAmount) / 100;
      }

      const row = e.target.closest(".favorite-row");
      const fiberValueEl = row.querySelector(".fiber-value");
      const energyValueEl = row.querySelector(".energy-value");

      if (fiberValueEl) {
        fiberValueEl.textContent = formatNumber(item.fiber);
      }
      if (energyValueEl && item.energy != null) {
        energyValueEl.textContent = formatNumber(item.energy);
      }

      const totalFiber = favorites.reduce((sum, item) => sum + (item.fiber || 0), 0);
      const totalEnergy = favorites.reduce((sum, item) => sum + (item.energy || 0), 0);

      totalFiberEl.textContent = `${formatNumber(totalFiber)} g`;
      totalCaloriesEl.textContent = `${formatNumber(totalEnergy, 0)} kcal`;
      updateFiberGoalProgress(totalFiber);

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

// Päivittää tavoitteen, jäljellä- ja ylitysmäärät
function updateFiberGoalProgress(totalFiber) {
  const goal = getCurrentFiberGoal();
  const goalGrams = goal.grams || 0;

  if (!goalGrams) {
    remainingFiberEl.textContent = "0 g";
    excessFiberEl.textContent = "0 g";
    if (fiberGoalProgressEl) {
      fiberGoalProgressEl.textContent = "";
    }
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

  if (fiberGoalProgressEl) {
    fiberGoalProgressEl.textContent = progressText;
  }
}

async function populateSamples() {
  if (!sampleListEl) return;

  const samples = SAMPLE_LISTS[currentLang] || SAMPLE_LISTS.fi;
  sampleListEl.innerHTML = `<div class="loading-samples">${t("searching") || "Haetaan..."}</div>`;

  try {
    // Haetaan kaikkien sample-tuotteiden tiedot rinnakkain
    const promises = samples.map(async (s) => {
      try {
        const res = await fetch(`${API_BASE}/foods/${s.id}`);
        if (!res.ok) return null;
        const food = await res.json();
        return {
          id: s.id,
          name: getFoodNameByLang(food) || s.name,
          fiber: getFiberPer100g(normalizeComponents(food)) ?? getFiberFromFood(food),
          link: `https://fineli.fi/fineli/${currentLang}/foods/${s.id}`
        };
      } catch (e) {
        console.error(`Error fetching sample ${s.id}:`, e);
        return null;
      }
    });

    const results = (await Promise.all(promises)).filter(Boolean);

    sampleListEl.innerHTML = results
      .map((item, index) => {
        const fiberText = item.fiber != null ? `${formatNumber(item.fiber)} g/100 g` : t("no_fiber");
        return `
        <div class="sample-item">
          <span class="sample-name">
            <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="sample-link">
              ${item.name} – ${fiberText}
            </a>
          </span>
          <button
            class="sample-add-button"
            style="padding: 3px 8px; font-size: 0.8rem;"
            data-id="${item.id}"
          >
            ${t("add_to_list")}
          </button>
        </div>
      `;
      })
      .join("");

    sampleListEl.querySelectorAll(".sample-add-button").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = Number(btn.getAttribute("data-id"));
        if (!id) return;

        try {
          const res = await fetch(`${API_BASE}/foods/${id}`);
          if (!res.ok) throw new Error("Food fetch failed");
          const food = await res.json();

          const components = normalizeComponents(food);
          const fiberPer100g = getFiberPer100g(components) ?? getFiberFromFood(food);
          const energyPer100g = getEnergyPer100g(components) ?? getEnergyKcalFromFood(food);

          if (fiberPer100g == null) {
            alert(t("no_fiber"));
            return;
          }

          const name = getFoodNameByLang(food);
          const amount = getDefaultAmountForFood(name);

          doAddFoodToFavorites(food, amount, fiberPer100g, energyPer100g);
        } catch (e) {
          console.error("Virhe lisättäessä suosikkia:", e);
        }
      });
    });
  } catch (err) {
    console.error("Error populating samples:", err);
    sampleListEl.innerHTML = `<div class="error-text">${t("search_error")}</div>`;
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
  const ok = window.confirm(t("confirm_clear") || (t("clear_all") + "?"));
  if (!ok) return;
  favorites = [];
  saveFavorites();
  renderFavorites();
});

fiberGoalSelect?.addEventListener("change", () => {
  const total = favorites.reduce((sum, item) => sum + (item.fiber || 0), 0);
  updateFiberGoalProgress(total);
});

langSelect.onchange = () => {
  currentLang = langSelect.value || "fi";

  // Tallenna kieli
  localStorage.setItem("fiberLang", currentLang);

  applyTranslations();
  renderFavorites();

  // Nollaa haku ja valinta
  if (searchInput) searchInput.value = "";
  if (searchResultsEl) searchResultsEl.innerHTML = "";
  if (suggestionsEl) {
    suggestionsEl.innerHTML = "";
    suggestionsEl.classList.remove("active");
  }
  if (selectedFoodEl) {
    selectedFoodEl.innerHTML = "";
    selectedFoodEl.classList.add("hidden");
  }

  renderFavorites();
  populateSamples();
};

// Init — KORJATTU
const savedLang = localStorage.getItem("fiberLang");
currentLang = savedLang || "fi";

if (langSelect) {
  langSelect.value = currentLang;
}

applyTranslations();
populateSamples();
loadFavorites();
