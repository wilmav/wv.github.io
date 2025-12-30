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
  fi_min: { grams: 25, label: { fi: "Suomen vähimmäistaso (~25 g/vrk)", sv: "Finlands minimumnivå (~25 g/dag)", en: "Finland minimum level (~25 g/day)" } },
  avg: { grams: 30, label: { fi: "Hyvä keskimääräinen taso (~30 g/vrk)", sv: "Bra genomsnittlig nivå (~30 g/dag)", en: "Good average level (~30 g/day)" } },
  high: { grams: 40, label: { fi: "Korkea kuitutaso (~40 g/vrk, painonhallinnan tueksi)", sv: "Hög fibernivå (~40 g/dag, för viktkontroll)", en: "High fiber level (~40 g/day, for weight management)" } }
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
    api_hint: "Hakukenttä käyttää Finelin avointa ohjelmointirajapintaa (/api/v1/foods?q=).",
    empty_list: "Et ole vielä lisännyt yhtään ruokaa.",
    goal_label: "Päivittäinen kuitutavoite",
    total_fiber_label: "Päivän kokonaiskuitu:",
    remaining_label: "Jäljellä tavoitteesta:",
    excess_label: "Ylitys:",
    total_cal_label: "Päivän kalorit:",
    clear_all: "Tyhjennä kaikki",
    guidance: "Suositeltu kuidun saanti aikuisille on usein 25–30 g/vrk, ja 35–40 g/vrk voi tukea painonhallintaa. Tarkista ajantasaiset ravitsemussuositukset luotettavasta lähteestä.",
    source_info: "Lähde: Terveyden ja hyvinvoinnin laitos, Fineli – elintarvikkeiden koostumustietokanta. Aineisto käytössä CC BY 4.0 -lisenssillä. Tämä sovellus ei ole THL:n tai Finelin tuottama, suosittelema tai ylläpitämä palvelu.",
    source: "Lähde: Terveyden ja hyvinvoinnin laitos, Fineli – elintarvikkeiden koostumustietokanta. Aineisto käytössä CC BY 4.0 -lisenssillä. Tämä sovellus ei ole THL:n tai Finelin tuottama, suosittelema tai ylläpitämä palvelu.",
    samples_title: "Korkean kuidun esimerkit",
    top20_title: "Esimerkkejä runsaskuituisista elintarvikkeista (Fineli, eniten ravintotekijää, g/100 g)",
    add_to_list: "Lisää päivän listalle",
    amount_label: "Määrä grammoina (g)",
    calc_for_amount: "Laskettu kuitu määrälle",
    no_fiber: "Kuitutietoa ei löytynyt tälle ruoalle. Valitse jokin toinen ruoka.",
    no_results: "Ei hakutuloksia. Kokeile toista hakusanaa.",
    progress_text: "Päivän kuitu yhteensä {total} g / tavoite {goal} g ({percent}% tavoitteesta).",
    searching: "Haetaan...",
    search_error: "Haku epäonnistui. Tarkista verkkoyhteys ja yritä uudelleen.",
    anonymous: "(nimetön)",
    empty_list_hint: "Et ole vielä lisännyt yhtään ruokaa. Hae jokin ruoka ja lisää se listalle.",
    eaten_label: "syöty",
    fiber_word: "kuitua",
    remove_button: "Poista",
    confirm_clear: "Tyhjennetäänkö kaikki päivän ruoat?",
    lead: "Laske päivän kuitu- ja kalorimäärät helposti.",
    search_section_title: "Hae ruoka-aine",
    nav_apps: "Sovelluksia",
    nav_home: "Etusivu",
    nav_kuitulaskuri: "Kuitulaskuri",
    nav_app2: "Sovellus2",
    nav_blog: "Blogi",
    nav_contact: "Yhteystiedot",
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
    api_hint: "Sökfältet använder Finelis öppna API (/api/v1/foods?q=).",
    empty_list: "Du har ännu inte lagt till något livsmedel.",
    goal_label: "Dagligt fibermål",
    total_fiber_label: "Dagens totalfiber:",
    remaining_label: "Kvar till målet:",
    excess_label: "Överskott:",
    total_cal_label: "Dagens kalorier:",
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
    anonymous: "(namnlös)",
    empty_list_hint: "Du har ännu inte lagt till något livsmedel. Sök efter ett livsmedel och lägg till det i listan.",
    eaten_label: "ätit",
    fiber_word: "fiber",
    remove_button: "Ta bort",
    confirm_clear: "Rensa alla dagens livsmedel?",
    lead: "Räkna enkelt dagens fiber- och kaloriintag.",
    search_section_title: "Sök livsmedel",
    nav_apps: "Appar",
    nav_home: "Startsida",
    nav_kuitulaskuri: "Fiberräknare",
    nav_app2: "App2",
    nav_blog: "Blogg",
    nav_contact: "Kontakt",
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
    api_hint: "Search uses Fineli open API (/api/v1/foods?q=).",
    empty_list: "You have not added any foods yet.",
    goal_label: "Daily fiber goal",
    total_fiber_label: "Total daily fibre:",
    remaining_label: "Remaining to target:",
    excess_label: "Excess:",
    total_cal_label: "Daily calories:",
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
    anonymous: "(unnamed)",
    empty_list_hint: "You have not added any foods yet. Search for a food and add it to the list.",
    eaten_label: "eaten",
    fiber_word: "fiber",
    remove_button: "Remove",
    confirm_clear: "Clear all foods for the day?",
    lead: "Calculate daily fiber and calorie totals easily.",
    search_section_title: "Search food item",
    nav_apps: "Apps",
    nav_home: "Home",
    nav_kuitulaskuri: "Fiber Calculator",
    nav_app2: "App2",
    nav_blog: "Blog",
    nav_contact: "Contact",
  },
};

// Kielikohtaiset esimerkkilistat
const SAMPLE_LISTS = {
  fi: [
    { name: "Psyllium", fiber: 40.0, link: "https://fineli.fi/fineli/fi/foods?q=psyllium" },
    { name: "Kaurakuitunen", fiber: 35.0, link: "https://fineli.fi/fineli/fi/foods?q=kaurakuitunen" },
    { name: "Passionhedelmä", fiber: 30.0, link: "https://fineli.fi/fineli/fi/foods?q=passionhedelmä" },
    { name: "Papu, kidneypapu, keitetty", fiber: 25.0, link: "https://fineli.fi/fineli/fi/foods?q=kidneypapu" },
    { name: "Lehtikaali", fiber: 20.0, link: "https://fineli.fi/fineli/fi/foods?q=lehtikaali" },
    { name: "Porkkana", fiber: 18.0, link: "https://fineli.fi/fineli/fi/foods?q=porkkana" },
    { name: "Maa-artisokka", fiber: 16.0, link: "https://fineli.fi/fineli/fi/foods?q=maa-artisokka" },
    { name: "Lese, kauralese", fiber: 14.0, link: "https://fineli.fi/fineli/fi/foods?q=kauralese" },
    { name: "Lese, ruislese", fiber: 12.0, link: "https://fineli.fi/fineli/fi/foods?q=ruislese" },
    { name: "Lese, vehnälese", fiber: 10.0, link: "https://fineli.fi/fineli/fi/foods?q=vehnälese" },
    { name: "Pakastekasvissekoitus, herne-maissi-paprika", fiber: 8.0, link: "https://fineli.fi/fineli/fi/foods?q=herne-maissi-paprika" },
    { name: "Chiansiemen", fiber: 6.0, link: "https://fineli.fi/fineli/fi/foods?q=chiansiemen" },
    { name: "Pellavansiemen, kokonainen", fiber: 5.0, link: "https://fineli.fi/fineli/fi/foods?q=pellavansiemen" },
    { name: "Hapankorppu", fiber: 4.0, link: "https://fineli.fi/fineli/fi/foods?q=hapankorppu" },
    { name: "Pähkinä, hasselpähkinä", fiber: 3.0, link: "https://fineli.fi/fineli/fi/foods?q=hasselpähkinä" },
    { name: "Popcorn", fiber: 2.0, link: "https://fineli.fi/fineli/fi/foods?q=popcorn" },
    { name: "Pähkinä, maapähkinä", fiber: 1.5, link: "https://fineli.fi/fineli/fi/foods?q=maapähkinä" },
    { name: "Kikherne suolattomassa vedessä", fiber: 1.0, link: "https://fineli.fi/fineli/fi/foods?q=kikherne" },
  ],
  sv: [
    { name: "Psyllium", fiber: 40.0, link: "https://fineli.fi/fineli/fi/foods?q=psyllium" },
    { name: "Havrekli, Kaurakuitunen", fiber: 35.0, link: "https://fineli.fi/fineli/fi/foods?q=kaurakuitunen" },
    { name: "Passionsfrukt", fiber: 30.0, link: "https://fineli.fi/fineli/fi/foods?q=passionhedelmä" },
    { name: "Böna, kidneyböna, kokt", fiber: 25.0, link: "https://fineli.fi/fineli/fi/foods?q=kidneypapu" },
    { name: "Grönkål", fiber: 20.0, link: "https://fineli.fi/fineli/fi/foods?q=lehtikaali" },
    { name: "Morot", fiber: 18.0, link: "https://fineli.fi/fineli/fi/foods?q=porkkana" },
    { name: "Jordärtskocka", fiber: 16.0, link: "https://fineli.fi/fineli/fi/foods?q=maa-artisokka" },
    { name: "Kli, havrekli", fiber: 14.0, link: "https://fineli.fi/fineli/fi/foods?q=kauralese" },
    { name: "Kli, rågkli", fiber: 12.0, link: "https://fineli.fi/fineli/fi/foods?q=ruislese" },
    { name: "Kli, vetekli", fiber: 10.0, link: "https://fineli.fi/fineli/fi/foods?q=vehnälese" },
    { name: "Fryst grönsaksblandning, ärter-majs-paprika", fiber: 8.0, link: "https://fineli.fi/fineli/fi/foods?q=herne-maissi-paprika" },
    { name: "Chiafrön", fiber: 6.0, link: "https://fineli.fi/fineli/fi/foods?q=chiansiemen" },
    { name: "Linfrö, hela", fiber: 5.0, link: "https://fineli.fi/fineli/fi/foods?q=pellavansiemen" },
    { name: "Hårt knäckebröd", fiber: 4.0, link: "https://fineli.fi/fineli/fi/foods?q=hapankorppu" },
    { name: "Nöt, hasselnöt", fiber: 3.0, link: "https://fineli.fi/fineli/fi/foods?q=hasselpähkinä" },
    { name: "Popcorn", fiber: 2.0, link: "https://fineli.fi/fineli/fi/foods?q=popcorn" },
    { name: "Nöt, jordnöt", fiber: 1.5, link: "https://fineli.fi/fineli/fi/foods?q=maapähkinä" },
    { name: "Kikärter i osaltat vatten", fiber: 1.0, link: "https://fineli.fi/fineli/fi/foods?q=kikherne" },
  ],
  en: [
    { name: "Psyllium", fiber: 40.0, link: "https://fineli.fi/fineli/fi/foods?q=psyllium" },
    { name: "Oat fibre mix, Kaurakuitunen", fiber: 35.0, link: "https://fineli.fi/fineli/fi/foods?q=kaurakuitunen" },
    { name: "Passion fruit", fiber: 30.0, link: "https://fineli.fi/fineli/fi/foods?q=passionhedelmä" },
    { name: "Bean, kidney bean, boiled", fiber: 25.0, link: "https://fineli.fi/fineli/fi/foods?q=kidneypapu" },
    { name: "Kale", fiber: 20.0, link: "https://fineli.fi/fineli/fi/foods?q=lehtikaali" },
    { name: "Carrot", fiber: 18.0, link: "https://fineli.fi/fineli/fi/foods?q=porkkana" },
    { name: "Jerusalem artichoke", fiber: 16.0, link: "https://fineli.fi/fineli/fi/foods?q=maa-artisokka" },
    { name: "Bran, oat bran", fiber: 14.0, link: "https://fineli.fi/fineli/fi/foods?q=kauralese" },
    { name: "Bran, rye bran", fiber: 12.0, link: "https://fineli.fi/fineli/fi/foods?q=ruislese" },
    { name: "Bran, wheat bran", fiber: 10.0, link: "https://fineli.fi/fineli/fi/foods?q=vehnälese" },
    { name: "Frozen vegetable mix, peas-corn-paprika", fiber: 8.0, link: "https://fineli.fi/fineli/fi/foods?q=herne-maissi-paprika" },
    { name: "Chia seeds", fiber: 6.0, link: "https://fineli.fi/fineli/fi/foods?q=chiansiemen" },
    { name: "Flaxseed, whole", fiber: 5.0, link: "https://fineli.fi/fineli/fi/foods?q=pellavansiemen" },
    { name: "Crispbread", fiber: 4.0, link: "https://fineli.fi/fineli/fi/foods?q=hapankorppu" },
    { name: "Nut, hazelnut", fiber: 3.0, link: "https://fineli.fi/fineli/fi/foods?q=hasselpähkinä" },
    { name: "Popcorn", fiber: 2.0, link: "https://fineli.fi/fineli/fi/foods?q=popcorn" },
    { name: "Nut, peanut", fiber: 1.5, link: "https://fineli.fi/fineli/fi/foods?q=maapähkinä" },
    { name: "Chickpeas in unsalted water", fiber: 1.0, link: "https://fineli.fi/fineli/fi/foods?q=kikherne" },
  ]
};

// Yksinkertaiset käännökset yleisimmille hakusanoille
const SEARCH_TRANSLATIONS = {
  sv: {
    "mor": "porkkana",
    "morot": "porkkana",
    "äpple": "omena",
    "banan": "banaani",
    "potatis": "peruna",
    "ris": "riisi",
    "kyckling": "kana",
    "nötkött": "nauta",
    "fläsk": "sika",
    "fisk": "kala",
    "bröd": "leipä",
    "mjölk": "maito",
    "ost": "juusto",
    "ägg": "muna",
  },
  en: {
    "app": "omena",
    "apple": "omena",
    "carrot": "porkkana",
    "banana": "banaani",
    "potato": "peruna",
    "rice": "riisi",
    "chicken": "kana",
    "beef": "nauta",
    "pork": "sika",
    "fish": "kala",
    "bread": "leipä",
    "milk": "maito",
    "cheese": "juusto",
    "egg": "muna",
  }
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
  // Document title
  try {
    document.title = t("app_title") || document.title;
  } catch (e) {}

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
// Kääntää hakusanan suomeksi, jos valittu kieli on ruotsi tai englanti
function translateSearchTerm(term) {
  if (!term || typeof term !== "string") return term;
  const lowerTerm = term.toLowerCase().trim();
  const translations = SEARCH_TRANSLATIONS[currentLang];
  if (!translations) return term;
  return translations[lowerTerm] || term;
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
    // Check for common translations
    let searchQuery = query;
    const translations = SEARCH_TRANSLATIONS[currentLang];
    if (translations) {
      const queryLower = query.toLowerCase();
      if (translations[queryLower]) {
        searchQuery = translations[queryLower];
      } else {
        // Check fuzzy matches in translation keys
        for (const [key, value] of Object.entries(translations)) {
          if (isFuzzyMatch(key, queryLower)) {
            searchQuery = value;
            break;
          }
        }
      }
    }

    // Check cache
    if (searchCache[searchQuery]) {
      const data = searchCache[searchQuery];
      const filteredData = filterFoodsByLanguage(data, searchQuery);
      console.log(`Search "${query}" in "${currentLang}" returned ${data.length} cached foods, ${filteredData.length} after filtering.`);
      renderSearchResults(filteredData);
      return;
    }

    // Fetch from API
    const res = await fetch(`${API_BASE}/foods?q=${encodeURIComponent(searchQuery)}`);
    if (!res.ok) throw new Error(`Search failed (${res.status})`);
    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error("API returned invalid data:", data);
      searchResultsEl.innerHTML = '<div class="error-text">Search returned invalid data.</div>';
      return;
    }

    // Cache the results
    searchCache[searchQuery] = data;

    const filteredData = filterFoodsByLanguage(data, searchQuery);

    console.log(`Search "${query}" in "${currentLang}" returned ${data.length} foods, ${filteredData.length} after filtering.`);

    renderSearchResults(filteredData);
  } catch (err) {
    console.error(err);
    searchResultsEl.innerHTML = '<div class="error-text">Search failed. Check your network connection and try again.</div>';
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

      // Käytetään samaa energyPer100g-arvoa kuin headerissa (komponentit + top-level energyKcal)
      const fiber = (fiberPer100g * amount) / 100;
      const energy = energyPer100g != null ? (energyPer100g * amount) / 100 : 0;

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
  if (!favoritesListEl) return;

  // Update sample names to current language
  favorites.forEach(fav => {
    const fiIndex = SAMPLE_LISTS.fi.findIndex(item => item.name === fav.name);
    if (fiIndex !== -1) {
      fav.name = SAMPLE_LISTS[currentLang][fiIndex].name;
    }
  });

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
          <strong class="fiber-value">${formatNumber(item.fiber)}</strong> ${t("fiber_word") || (currentLang === "sv" || currentLang === "en" ? "g fiber" : "g kuitua")}
        </div>
        <div class="favorite-cal">
          ${
            item.energy != null
              ? `<strong class="energy-value">${formatNumber(item.energy)}</strong> kcal`
              : "–"
          }
        </div>
        <button class="danger-button" data-index="${index}">
          ${t("remove_button")}
        </button>
      </div>
    `
    )
    .join("");

  favoritesListEl.innerHTML = rows;

  const totalFiber = favorites.reduce((sum, item) => sum + (item.fiber || 0), 0);
  const totalEnergy = favorites.reduce((sum, item) => sum + (item.energy || 0), 0);

  totalCaloriesEl.textContent = `${formatNumber(totalEnergy, 0)} kcal`;
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

function populateSamples() {
  if (sampleListEl) {
    const samples = SAMPLE_LISTS[currentLang] || SAMPLE_LISTS.fi;
    sampleListEl.innerHTML = samples
      .map((item) => {
        return `
        <div class="sample-item">
          <span class="sample-name">
            <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="sample-link">
              ${item.name} – ${item.fiber} g/100 g
            </a>
          </span>
          <button
            class="sample-add-button"
            style="padding: 3px 8px; font-size: 0.8rem;"
            data-name="${item.name}"
            data-fiber="${item.fiber}"
            data-link="${item.link}"
          >
            ${t("add_to_list")}
          </button>
        </div>
      `;
      })
      .join("");

    sampleListEl.querySelectorAll(".sample-add-button").forEach((btn) => {
      btn.addEventListener("click", () => {
        const name = btn.getAttribute("data-name");
        const fiber = Number(btn.getAttribute("data-fiber"));
        const link = btn.getAttribute("data-link");
        addSampleToFavorites(name, fiber, link);
      });
    });
  }
}

async function addSampleToFavorites(name, fiberPer100g) {
  const defaultAmount = getDefaultAmountForFood(name);
  const fiber = (fiberPer100g * defaultAmount) / 100;

  // 1) Hae Finelistä oikea tuote nimellä
  let energyPer100g = 0;

  try {
    const res = await fetch(`${API_BASE}/foods?q=${encodeURIComponent(name)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const food = data[0]; // otetaan paras osuma
        const comps = normalizeComponents(food);

        // hae energia kuten muuallakin
        const kcal = getEnergyPer100g(comps) ?? getEnergyKcalFromFood(food);
        if (typeof kcal === "number") {
          energyPer100g = kcal;
        }
      }
    }
  } catch (e) {
    console.error("Energiahaun virhe sample-tuotteelle:", e);
  }

  const energy = (energyPer100g * defaultAmount) / 100;

  favorites.push({
    id: Date.now(),
    name,
    group: "",
    amount: defaultAmount,
    fiberPer100g,
    energyPer100g,
    fiber,
    energy,
  });

  saveFavorites();
  renderFavorites();
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
  applyTranslations();
  renderFavorites(); // Re-render favorites to update language

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

// Init
applyTranslations();
populateSamples();
loadFavorites();
