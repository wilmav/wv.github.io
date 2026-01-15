// Theme Logic
// Theme Logic removed - handled globally by theme.js

document.addEventListener('DOMContentLoaded', async () => {
    // initTheme(); // Handled globally

    // --- Configuration ---
    const API_SEARCH = "https://api.finna.fi/v1/search";

    // --- State ---
    const state = {
        staticAuthors: [], // From authors.js
        userAuthors: [],   // From localStorage
        books: {},         // Combined static + fetched books
        selectedAuthor: null,
        selectedLanguages: JSON.parse(localStorage.getItem('selectedLanguages')) || ['fin', 'swe', 'eng'],
        dates: {}          // From dates.json
    };

    // --- DOM Elements ---
    const authorList = document.getElementById('author-list');
    const bookGrid = document.getElementById('book-grid');
    const langFilter = document.getElementById('lang-filters');

    // Add Author Controls
    const addAuthorBtn = document.getElementById('add-author-btn');
    const searchPanel = document.getElementById('author-search-panel');
    const searchInput = document.getElementById('author-search-input');
    const searchActionBtn = document.getElementById('search-action-btn');
    const searchResults = document.getElementById('search-results');

    // --- Initialization ---
    async function init() {
        // --- Aggressive Cache Cleanup ---
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('isbn_') || key.startsWith('cover_')) {
                const val = localStorage.getItem(key);
                if (val === '9789523765061') {
                    localStorage.removeItem(key);
                }
                if (key.includes('undefined') || val === 'undefined' || val === null) {
                    localStorage.removeItem(key);
                }
                // Force clear specific persisted keys for Sokeiden valtakunta to ensure new logic runs
                if (key.toLowerCase().includes('sokeiden')) {
                    localStorage.removeItem(key);
                }
            }
        });

        // Load Static Data for caching/bootstrapping
        let staticDefaults = [];
        if (typeof AUTHORS_DATA !== 'undefined') {
            state.staticAuthors = AUTHORS_DATA;
            // Index static books
            state.books = { ...BOOKS_DATA };
            staticDefaults = AUTHORS_DATA;
        }

        // Load Dates
        // 1. Try global variable (JS file approach for CORS/local support)
        if (typeof window.MANUAL_DATES !== 'undefined') {
            state.dates = window.MANUAL_DATES;
            console.log("Loaded manual dates from global:", state.dates);
        } else {
            // 2. Try Fetch (Server environment)
            try {
                const dateRes = await fetch('../dates.json');
                if (dateRes.ok) {
                    state.dates = await dateRes.json();
                    console.log("Loaded manual dates from JSON:", state.dates);
                }
            } catch (e) { console.warn("Could not load dates.json"); }
        }

        // 1. Initialize User Data (Bootstrap)
        const saved = localStorage.getItem('user_authors');
        if (saved) {
            state.userAuthors = JSON.parse(saved);

            // Cleanup bad data (e.g. "primary", "corporate") from previous bug
            const badNames = ["primary", "secondary", "corporate", "authors"];
            const initialLen = state.userAuthors.length;
            state.userAuthors = state.userAuthors.filter(a => !badNames.includes(a.name));
            if (state.userAuthors.length !== initialLen) {
                saveUserAuthors();
            }
        } else {
            // First time visit: Use static defaults as starting point
            // This makes them fully removable by the user
            state.userAuthors = [...staticDefaults];
            saveUserAuthors();
        }

        // 2. Initial Render
        renderAuthors();

        // 3. Fetch Live Data for User Authors
        if (state.userAuthors.length > 0) {
            await fetchBooksForUserAuthors();
        }

        renderBooks();
        setupEventListeners();
    }

    function saveUserAuthors() {
        localStorage.setItem('user_authors', JSON.stringify(state.userAuthors));
    }

    // --- Logic: Data Fetching ---

    async function fetchBooksForUserAuthors() {
        for (const author of state.userAuthors) {
            try {
                // Fetch ALL books (or at least a large history), not just recent ones.
                const books = await searchFinnaBooks(author.name, 1900);

                // --- 1. OPTIMIZATION: Propagate Images ---
                const imageMap = {};

                // Helper: Create a loose key
                const getTitleKey = (t) => {
                    if (!t) return "";
                    return t.toLowerCase()
                        .split(':')[0] // Ignore subtitles
                        .split('/')[0] // Ignore slashes
                        .replace(/[.,]/g, '') // Remove dots/commas
                        .trim();
                };

                // First pass: Find existing images
                books.forEach(b => {
                    if (b.image && b.title) {
                        const key = getTitleKey(b.title);
                        if (key && !imageMap[key]) imageMap[key] = b.image;
                    }
                });
                // Second pass: Apply to missing
                books.forEach(b => {
                    if (!b.image && b.title) {
                        const key = getTitleKey(b.title);
                        if (key && imageMap[key]) {
                            b.image = imageMap[key];
                        }
                    }
                });

                // --- 2. DEDUPLICATION & MERGING ---
                // Helper to get a deduplication key
                const getDedupKey = (b) => `${b.cleanTitle || b.title}|${b.author}`.toLowerCase();

                // Build a map of existing books for fast lookup
                const existingKeyMap = {};
                Object.values(state.books).forEach(eb => {
                    const k = getDedupKey(eb);
                    if (!existingKeyMap[k]) existingKeyMap[k] = [];
                    existingKeyMap[k].push(eb);
                });

                const filteredNewBooks = [];
                books.forEach(b => {
                    const key = getDedupKey(b);
                    const candidates = existingKeyMap[key] || [];

                    // Look for an existing match: same title/author and year within 2 years (to handle future/past discrepancies)
                    let match = candidates.find(c => {
                        const y1 = parseInt(c.year);
                        const y2 = parseInt(b.year);
                        return Math.abs(y1 - y2) <= 2;
                    });

                    if (!match) {
                        // No match found - add as new
                        state.books[b.id] = b;
                        if (!existingKeyMap[key]) existingKeyMap[key] = [];
                        existingKeyMap[key].push(b);
                        filteredNewBooks.push(b.id);
                    } else {
                        // Found a duplicate! Merge metadata into the existing record
                        console.log(`[Deduplicator] Merging duplicate: ${b.title} (${b.year} -> ${match.year})`);

                        // Merge important fields if missing in the "winner"
                        if (!match.image && b.image) match.image = b.image;
                        if (!match.originalTitle && b.originalTitle) match.originalTitle = b.originalTitle;
                        if (!match.isbn && b.isbn) match.isbn = b.isbn;
                        if (!match.manualDate && b.manualDate) match.manualDate = b.manualDate;
                        if (!match.description && b.description) match.description = b.description;
                        if (b.series && !match.series) match.series = b.series;

                        // Keep the Finna record if the original was static/scraper-only?
                        // For now, we keep the original ID in the list to avoid UI jumps
                        filteredNewBooks.push(match.id);
                    }
                });

                // Update author's book list (unique IDs)
                author.latest_books = [...new Set(filteredNewBooks)];

            } catch (e) {
                console.error(`Could not fetch for ${author.name}`, e);
            }
        }

        saveUserAuthors(); // Save updated book lists/counts
        renderAuthors();
        renderBooks();
    }

    async function searchFinnaBooks(authorName, minYear) {
        // limit: 100 is the max allowed. We want 300, so we fetch 3 pages.
        const BATCH_SIZE = 100;
        const TOTAL_WANTED = 300;
        const PAGES = Math.ceil(TOTAL_WANTED / BATCH_SIZE);

        const params = new URLSearchParams();
        params.append("lookfor", authorName);
        params.append("type", "Author");
        params.append("sort", "main_date_str desc");
        params.append("limit", BATCH_SIZE.toString());

        const fields = ["id", "title", "authors", "year", "images", "summary", "languages", "series", "uniformTitles", "formats", "isbn"];
        fields.forEach(f => params.append("field[]", f));

        // Ensure only books/docs, excluding videos
        params.append("filter[]", 'format:"0/Book/"');

        // Parallel Fetching for speed
        const fetchPromises = [];
        for (let page = 1; page <= PAGES; page++) {
            const pageParams = new URLSearchParams(params);
            pageParams.append("page", page.toString());
            const url = `${API_SEARCH}?${pageParams.toString()}`;
            // console.log("Fetching page " + page + ":", url);
            fetchPromises.push(
                fetch(url)
                    .then(res => res.json())
                    .then(data => data.records || [])
                    .catch(e => {
                        console.error(`Page ${page} failed for ${authorName}`, e);
                        return [];
                    })
            );
        }

        try {
            const results = await Promise.all(fetchPromises);
            const allRecords = results.flat();

            console.log(`Found ${allRecords.length} books for ${authorName} (batches: ${results.length})`);

            return allRecords
                .filter(book => {
                    const y = parseInt(book.year);
                    const yearOk = !isNaN(y) && y >= minYear;

                    // Ultra-Strict Author Check: The searched author should be a primary author
                    // AND we filter out massive compilations where they are just one of many.
                    let authorOk = false;
                    if (book.authors && book.authors.primary) {
                        const primaryNames = Object.keys(book.authors.primary);
                        const queryTokens = authorName.toLowerCase().split(/\s+/).filter(t => t.length > 2);

                        const matchIndex = primaryNames.findIndex(pName => {
                            const lowP = pName.toLowerCase();
                            return queryTokens.every(token => lowP.includes(token));
                        });

                        // Criteria:
                        // 1. Searched author must be in primary authors
                        // 2. If many authors, searched one must be the first (prominence)
                        // 3. Filter out corporate-heavy collections (like Kansalliskirjasto)
                        if (matchIndex !== -1) {
                            const isCorporateHeavy = book.authors.corporate &&
                                Object.keys(book.authors.corporate).some(c => c.includes("Kansalliskirjasto") || c.includes("Kirjastopalvelu"));

                            if (!isCorporateHeavy && (primaryNames.length <= 3 || matchIndex === 0)) {
                                authorOk = true;
                            }
                        }
                    }

                    return yearOk && authorOk;
                })
                .map(b => normalizeBookData(b, authorName));
        } catch (e) {
            console.error("Search failed for " + authorName, e);
            return [];
        }
    }

    function normalizeBookData(book, searchedAuthor = null) {
        const author = extractAuthorName(book.authors, searchedAuthor);
        let rawTitle = book.title || "";
        let cleanTitle = rawTitle;

        // 1. Strip Author prefix if present (e.g. "Kinsella, Sophie : Yllätä minut")
        if (cleanTitle.includes(':')) {
            const parts = cleanTitle.split(':');
            const prefix = parts[0].toLowerCase();
            const authLow = author.toLowerCase();
            // Check if prefix matches author or reversed author or starts with last name
            const lastName = authLow.split(',')[0].trim();
            if (authLow.includes(prefix.trim()) || prefix.includes(lastName) || prefix.includes(authLow.split(' ')[0])) {
                cleanTitle = parts.slice(1).join(':').trim();
            } else {
                // Not author? Still take first part as title if it has a colon (subtitle)
                cleanTitle = parts[0].trim();
            }
        }

        // 2. Strip standard clutter (Daisy, suomentanut, etc)
        cleanTitle = cleanTitle.split(/[\/\(;]/)[0]
            .replace(/\s+suomentanut.*$/i, '')
            .replace(/\s+toimittanut.*$/i, '')
            .replace(/[.,]$/, '')
            .trim();

        // 3. Fallback to raw if logic made it empty
        if (!cleanTitle) cleanTitle = rawTitle;

        let ot = book.uniformTitles ? book.uniformTitles[0] : null;
        if (ot) {
            // Aggressive Original Title cleaning
            ot = ot.replace(/^Alkuteos:\s*/i, "")
                .replace(/^Alkuperäisteos:\s*/i, "")
                .replace(/[\s./,]*suom(i|ennus).*$/i, "") // Strip ". Suomi", " suomennos", etc.
                .replace(/[\s./,]*engl(anti|ish).*$/i, "")
                .replace(/[\s./,]*svensk(a|t)?.*$/i, "")
                .trim();
        }

        // Parse Series
        let seriesInfo = null;
        if (book.series && book.series.length > 0) {
            const sRaw = book.series[0];
            let parts = sRaw.name ? [sRaw.name, sRaw.number] : sRaw.split(';'); // Handle if object or string
            seriesInfo = {
                name: parts[0]?.trim(),
                number: parts[1]?.trim()
            };
        }

        let isEbook = false;
        let isAudio = false;

        if (book.formats) {
            book.formats.forEach(f => {
                const val = (typeof f === 'string' ? f : f.value) || "";
                if (val.includes("eBook") || val.includes("EBook")) isEbook = true;
                if (val.includes("AudioBook") || val.includes("Sound")) isAudio = true;
            });
        }

        // Check for Manual Date (Scraper) & Manual ISBN
        let manualDate = null;
        let manualIsbn = null;

        // Manual overrides (ISBN only, Dates disabled per "poistetaan nyt kaikki päivämäärähaut")
        // NOTE: We also use this simple key to match manual ISBNs for deduplication later if needed
        if (state.dates && book.title) {
            const key = cleanTitle.toLowerCase();
            const entry = state.dates[key];
            if (entry) {
                /* Dates removed
                if (entry.dates) {
                     if (isAudio && entry.dates.audiobook) manualDate = entry.dates.audiobook;
                     else if (isEbook && entry.dates.ebook) manualDate = entry.dates.ebook;
                     else if (entry.dates.print) manualDate = entry.dates.print;
                     if (!manualDate) manualDate = entry.dates.audiobook || entry.dates.ebook || entry.dates.print;
                 }
                 */
                if (entry.isbn) manualIsbn = [entry.isbn];
            }
        }

        // Year Sanity Check
        // REVERTED: We keep the year for sorting (putting "Tulossa" items first).
        let finalYear = book.year;

        return {
            id: book.id,
            title: book.title,
            cleanTitle: cleanTitle,
            originalTitle: ot,
            author: author,
            year: finalYear,
            manualDate: manualDate,
            description: book.summary,
            image: book.images && book.images.length ? (book.images[0].startsWith('http') ? book.images[0] : `https://api.finna.fi${book.images[0]}`) : null,
            language: book.languages,
            series: seriesInfo,
            formats: { isEbook, isAudio },
            isbn: manualIsbn || book.isbn // Prefer manual
        };
    }

    function extractAuthorName(authorsObj, searchName = null) {
        if (!authorsObj) return "Unknown";

        const searchTokens = searchName ? searchName.toLowerCase().split(/\s+/).filter(t => t.length > 2) : [];
        const isMatch = (name) => {
            if (searchTokens.length === 0) return false;
            const lowN = name.toLowerCase();
            return searchTokens.every(token => lowN.includes(token));
        };

        // 1. Prioritize searched author in Primary
        if (authorsObj.primary) {
            const names = Object.keys(authorsObj.primary);
            const match = names.find(isMatch);
            if (match) return match;
            if (names.length > 0) return names[0];
        }

        // 2. Try Secondary (if searching)
        if (authorsObj.secondary) {
            const names = Object.keys(authorsObj.secondary);
            const match = names.find(isMatch);
            if (match) return match;
        }

        // 3. Fallback
        for (const role in authorsObj) {
            if (authorsObj[role]) {
                const names = Object.keys(authorsObj[role]);
                if (names.length > 0) return names[0];
            }
        }
        return "Unknown";
    }

    // --- Logic: User Authors ---

    async function searchAuthor(query) {
        searchResults.innerHTML = '<div class="search-result-item">Haetaan...</div>';
        const url = `${API_SEARCH}?lookfor=${encodeURIComponent(query)}&type=Author&limit=100&field[]=authors&filter[]=format:\"0/Book/\"`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            searchResults.innerHTML = '';

            if (!data.records || data.records.length === 0) {
                searchResults.innerHTML = '<div class="search-result-item">Ei tuloksia.</div>';
                return;
            }

            const foundAuthorsMap = new Map(); // key: lowercase, value: best display name

            // Helper to title case ALL CAPS
            const toTitleCase = (str) => {
                return str.toLowerCase().replace(/(^|[ ,-])(\w)/g, (c) => c.toUpperCase());
            };

            const isAllCaps = (str) => str === str.toUpperCase() && str !== str.toLowerCase();

            data.records.forEach(r => {
                if (r.authors) {
                    Object.values(r.authors).forEach(roleObj => {
                        if (roleObj) {
                            Object.keys(roleObj).forEach(name => {
                                const normalized = name.replace(/\s+/g, ' ').trim();
                                // FIX: specific fix for "LastName, FirstName Middle, 1900-" format
                                // We strip the year suffix to improve deduplication
                                const cleanedName = normalized.replace(/,\s*\d{4}.*$/, "").trim();

                                if (cleanedName) {
                                    const lowerN = cleanedName.toLowerCase();
                                    const blocklist = ["(yhtye)", "esittäjä", "esitt.", "elokuva", "ohjaaja", "näyttelijä", "säveltäjä", "tuottaja", "musiikki", "orkesteri", "kuoro", "yhtye", "band"];

                                    if (!blocklist.some(term => lowerN.includes(term))) {
                                        // Deduplication Logic (Enhanced for "King, Stephen" vs "King, Stephen Edwin")
                                        let matchedKey = null;

                                        // Check against existing keys for prefix/suffix match (word boundary aware)
                                        for (const existingKey of foundAuthorsMap.keys()) {
                                            // Check if existing is prefix of new (e.g. existing="king, stephen", new="king, stephen edwin")
                                            if (lowerN.startsWith(existingKey + ' ')) {
                                                matchedKey = existingKey; // Keep existing (shorter)
                                                break;
                                            }
                                            // Check if new is prefix of existing (e.g. new="king, stephen", existing="king, stephen edwin")
                                            if (existingKey.startsWith(lowerN + ' ')) {
                                                // We want to replace the longer existing key with the new shorter one
                                                // Remove old, set match to new (will be added below)
                                                foundAuthorsMap.delete(existingKey);
                                                matchedKey = null; // Treat as new insertion
                                                break;
                                            }
                                        }

                                        if (matchedKey) {
                                            // Already exists (or covered by a shorter prefix).
                                            // Update only if we want to improve the display name (e.g. casing),
                                            // but generally we keep the shorter/simpler one we decided on.
                                            const existing = foundAuthorsMap.get(matchedKey);
                                            // If current is Mixed Case and existing was ALL CAPS, update display even if key is same
                                            if (!isAllCaps(cleanedName) && !existing.isOriginalMixed) {
                                                foundAuthorsMap.set(matchedKey, { display: cleanedName, isOriginalMixed: true });
                                            }
                                        } else {
                                            // New (or replaced longer key). Insert/Add.
                                            if (!foundAuthorsMap.has(lowerN)) {
                                                let displayName = cleanedName;
                                                if (isAllCaps(cleanedName)) {
                                                    displayName = toTitleCase(cleanedName);
                                                }
                                                foundAuthorsMap.set(lowerN, { display: displayName, isOriginalMixed: !isAllCaps(cleanedName) });
                                            }
                                        }
                                    }
                                }
                            });
                        }
                    });
                }
            });

            // Flatten back to array
            const foundAuthors = new Set(Array.from(foundAuthorsMap.values()).map(v => v.display));

            const queryTokens = query.toLowerCase().trim().split(/\s+/);
            const filteredAuthors = Array.from(foundAuthors).filter(name => {
                const lowerName = name.toLowerCase();
                return queryTokens.every(token => lowerName.includes(token));
            });

            const sortedAuthors = filteredAuthors.sort((a, b) => {
                const lowerA = a.toLowerCase();
                const lowerB = b.toLowerCase();
                const qLower = query.toLowerCase().trim();
                const startsA = lowerA.startsWith(qLower);
                const startsB = lowerB.startsWith(qLower);
                if (startsA && !startsB) return -1;
                if (!startsA && startsB) return 1;
                return lowerA.localeCompare(lowerB);
            });

            if (sortedAuthors.length === 0) {
                const partialMatches = Array.from(foundAuthors).filter(name => {
                    const lowerName = name.toLowerCase();
                    return queryTokens.some(token => lowerName.includes(token));
                }).sort();

                if (partialMatches.length === 0) {
                    searchResults.innerHTML = '<div class="search-result-item">Ei kirjailijoita.</div>';
                    return;
                }
                renderSearchResults(partialMatches.slice(0, 50));
                return;
            }

            renderSearchResults(sortedAuthors.slice(0, 50));

        } catch (e) {
            console.error(e);
            searchResults.innerHTML = '<div class="search-result-item">Virhe haussa.</div>';
        }
    }

    function renderSearchResults(authors) {
        if (authors.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item">Ei kirjailijoita.</div>';
            return;
        }
        authors.forEach(authorName => {
            const el = document.createElement('div');
            el.className = 'search-result-item';
            el.textContent = `+ ${authorName}`;
            el.onclick = () => addUserAuthor(authorName);
            searchResults.appendChild(el);
        });
    }

    async function addUserAuthor(name) {
        if (state.userAuthors.find(a => a.name === name)) {
            alert("Kirjailija on jo listalla.");
            return;
        }

        const newAuthor = { name: name, latest_books: [] };
        state.userAuthors.push(newAuthor);
        saveUserAuthors();

        toggleSearch(false);
        searchInput.value = '';
        searchResults.innerHTML = '';
        renderAuthors();
        await fetchBooksForUserAuthors();
    }

    function removeUserAuthor(name) {
        if (!confirm(`Poistetaanko ${name} seurannasta?`)) return;
        state.userAuthors = state.userAuthors.filter(a => a.name !== name);
        saveUserAuthors();

        if (state.selectedAuthor === name) state.selectedAuthor = null;
        renderAuthors();
        renderBooks();
    }

    // --- Rendering ---

    function renderAuthors() {
        authorList.innerHTML = '';
        const selectedLangs = state.selectedLanguages;

        state.userAuthors.forEach(author => {
            const isActive = state.selectedAuthor === author.name;
            let count = 0;
            if (author.latest_books) {
                count = author.latest_books.filter(bookId => {
                    const book = state.books[bookId];
                    if (!book) return false;
                    if (selectedLangs.length > 0) {
                        if (!book.language) return false;
                        return book.language.some(langCode => selectedLangs.some(sel => langCode.includes(sel)));
                    }
                    return false;
                }).length;
            }

            const el = document.createElement('div');
            el.className = `author-chip ${isActive ? 'active' : ''}`;
            el.innerHTML = `
                ${author.name}
                ${count > 0 ? `<span class="count">${count}</span>` : ''}
                <span class="remove-author" title="Poista">×</span>
            `;

            el.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-author')) {
                    e.stopPropagation();
                    removeUserAuthor(author.name);
                } else {
                    state.selectedAuthor = isActive ? null : author.name;
                    renderAuthors();
                    renderBooks();
                }
            });

            authorList.appendChild(el);
        });
    }

    function renderBooks() {
        bookGrid.innerHTML = '';
        let booksToShow = [];
        const currentYear = new Date().getFullYear();

        if (state.selectedAuthor) {
            const authorObj = state.userAuthors.find(a => a.name === state.selectedAuthor);
            if (authorObj && authorObj.latest_books) {
                const authorBookIds = new Set(authorObj.latest_books);
                booksToShow = Object.values(state.books).filter(b => authorBookIds.has(b.id));
            } else {
                booksToShow = [];
            }
        } else {
            const allTrackedIds = new Set();
            state.userAuthors.forEach(a => {
                if (a.latest_books) a.latest_books.forEach(id => allTrackedIds.add(id));
            });
            booksToShow = Object.values(state.books).filter(b => allTrackedIds.has(b.id));
        }

        const selected = state.selectedLanguages;
        if (selected.length > 0) {
            booksToShow = booksToShow.filter(b => {
                if (!b.language) return false;
                return b.language.some(langCode => selected.some(sel => langCode.includes(sel)));
            });
        } else {
            booksToShow = [];
        }

        booksToShow.sort((a, b) => {
            const yearA = parseInt(a.year) || 0;
            const yearB = parseInt(b.year) || 0;
            const isFutureA = yearA > currentYear;
            const isFutureB = yearB > currentYear;

            if (isFutureA && !isFutureB) return -1;
            if (!isFutureA && isFutureB) return 1;

            const diff = yearB - yearA;
            if (diff !== 0) return diff;
            return a.title.localeCompare(b.title);
        });

        // --- DUPLICATE REMOVAL (Extra layer to be sure) ---
        // --- DUPLICATE REMOVAL (Advanced: Prefer Real Year) ---
        const uniqueBooksMap = new Map();
        booksToShow.forEach(b => {
            // Robust Title Cleaning:
            // 1. Lowercase & trim
            // 2. Remove subtitle after colon/slash
            // 3. Remove trailing dots/punctuation
            let t = (b.title || "").toLowerCase().trim();
            if (t.includes(':')) t = t.split(':')[0].trim();
            if (t.includes('/')) t = t.split('/')[0].trim();
            t = t.replace(/[.,;]+$/, "");

            // Normalize author for dedup: "King, Stephen Edwin" -> "king, stephen"
            let a = b.author.toLowerCase().trim();
            // Remove year suffix if present in author name (rare but possible in dirty data)
            a = a.replace(/\d{4}-?(\d{4})?/, "").trim();

            const parts = a.split(',').map(p => p.trim());
            if (parts.length >= 2) {
                // "Last, First Middle" -> "last, first"
                // Split first part by space to strip middle names
                const firstPart = parts[1].split(' ')[0];
                a = `${parts[0]}, ${firstPart}`;
            }
            // Also handle "First Last" format (though less common in this app's data flow)
            // But strict matching "last, first" is safer for now.

            const key = `${t}|${a}`;

            if (!uniqueBooksMap.has(key)) {
                uniqueBooksMap.set(key, b);
            } else {
                // Duplicate found: Decide which one to keep
                const existing = uniqueBooksMap.get(key);

                const yNow = new Date().getFullYear();
                const isPlaceholder = (y) => {
                    const val = parseInt(y);
                    return !isNaN(val) && val > yNow + 2;
                };

                const existingIsPlaceholder = isPlaceholder(existing.year);
                const currentIsPlaceholder = isPlaceholder(b.year);

                // If existing is placeholder (2099) and current is NOT (e.g. 2024), replace with current
                if (existingIsPlaceholder && !currentIsPlaceholder) {
                    uniqueBooksMap.set(key, b);
                }
                // If existing is real and current is placeholder, keep existing (do nothing)
                // If both are same category, keep first found (which is sorted by sort logic above)
            }
        });

        booksToShow = Array.from(uniqueBooksMap.values());

        // Re-sort to be safe (though map insertion order usually preserves it, 
        // replacing might affect order in some JS engines, so sort again is safer)
        booksToShow.sort((a, b) => {
            const yearA = parseInt(a.year) || 0;
            const yearB = parseInt(b.year) || 0;
            const isFutureA = yearA > currentYear;
            const isFutureB = yearB > currentYear;

            if (isFutureA && !isFutureB) return -1;
            if (!isFutureA && isFutureB) return 1;

            const diff = yearB - yearA;
            if (diff !== 0) return diff;
            return a.title.localeCompare(b.title);
        });

        if (booksToShow.length === 0) {
            bookGrid.innerHTML = '<p class="subtitle">Ei hakuehtoja vastaavia kirjoja.</p>';
            return;
        }

        booksToShow.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.style.cursor = 'pointer';
            card.onclick = () => {
                //CAPTURE TRANSITION IMAGE
                const img = card.querySelector('.book-cover-img, .cover-placeholder');
                if (img && img.src && !img.src.includes('pixel') && img.style.display !== 'none') {
                    sessionStorage.setItem('transition_image_' + book.id, img.src);
                }
                window.location.href = `book.html?id=${book.id}`;
            };



            let imgSrc = book.image || ''; // Already normalized in normalizeBookData or updated via Google

            // --- CACHE PRIORITY ---
            if (!imgSrc && book.id) {
                imgSrc = localStorage.getItem(`cover_fix_${book.id}`);
            }
            if (!imgSrc) {
                const cleanAuthorForCache = book.author.includes(',')
                    ? `${book.author.split(',')[1].trim()} ${book.author.split(',')[0].trim()}`
                    : book.author;
                const cacheKey = `cover_v5_${book.cleanTitle || book.title}_${cleanAuthorForCache}`;
                imgSrc = localStorage.getItem(cacheKey);
            }

            let imgHtml = '';

            if (imgSrc) {
                // IMPORTANT: Still use handleCoverError even for Finna/Cached images, in case they are broken
                imgHtml = `<img src="${imgSrc}" class="book-cover-img" data-isbn="${book.isbn ? (Array.isArray(book.isbn) ? book.isbn[0] : book.isbn) : ''}" data-title="${book.cleanTitle || book.title}" data-original-title="${book.originalTitle || ''}" data-author="${book.author}" data-id="${book.id}" alt="${book.title}" loading="lazy" onerror="handleCoverError(this)">`;
            } else if (book.isbn) {
                const isbn = Array.isArray(book.isbn) ? book.isbn[0] : book.isbn;
                imgHtml = `<img src="https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg" class="cover-placeholder" data-isbn="${isbn}" data-title="${book.cleanTitle || book.title}" data-original-title="${book.originalTitle || ''}" data-author="${book.author}" data-id="${book.id}" alt="${book.title}" loading="lazy" onerror="handleCoverError(this)">`;
            } else {
                imgHtml = `<img src="" class="cover-placeholder" data-title="${book.cleanTitle || book.title}" data-original-title="${book.originalTitle || ''}" data-author="${book.author}" data-id="${book.id}" alt="${book.title}" loading="lazy" onerror="handleCoverError(this)" style="display:none">`;
                setTimeout(() => fetchGoogleCover(null, book.cleanTitle || book.title, book.author, card.querySelector('.cover-placeholder'), book.id, book.originalTitle), 0);
            }

            let seriesBadgeHtml = '';
            if (book.series && book.series.number) {
                seriesBadgeHtml = `
                    <div class="series-badge" title="${book.series.name}">
                        ${book.series.number}
                    </div>
                    <div class="series-tooltip">
                        ${book.series.name} #${book.series.number}
                    </div>
                 `;
            }

            // Format Badges
            let dateDisplay = book.year;
            let dateStyle = parseInt(book.year) === currentYear ? ' current-year' : '';
            let dateTitle = 'Julkaisuvuosi';

            // Future/Placeholder Year Handling
            const yInt = parseInt(book.year);
            if (!isNaN(yInt) && yInt > currentYear + 2) {
                dateDisplay = "Ei tietoa";
                dateStyle = ' future-year'; // You can style this class in CSS if needed, e.g. blue/green
                dateTitle = "Julkaisuvuosi ei tiedossa (Finna: 2099)";
            }

            // Specific date logic removed as requested ("Julkaisuvuosi kaikkialla")
            // if (book.manualDate) { ... }

            let formatBadgeHtml = `
                ${dateDisplay ? `<span class="year-tag${dateStyle}" title="${dateTitle}">${dateDisplay}</span>` : ''}
                ${(book.formats && book.formats.isEbook) ? '<span class="year-tag" style="background:#eef; color:#44a;">E-kirja</span>' : ''}
                ${(book.formats && book.formats.isAudio) ? '<span class="year-tag" style="background:#efe; color:#064;">Äänikirja</span>' : ''}
                ${(!book.formats || (!book.formats.isEbook && !book.formats.isAudio)) ? '<span class="year-tag" style="background:#f0f0f0; color:#444;">Kirja</span>' : ''}
            `;

            card.innerHTML = `
                <div class="book-cover-container">
                    ${seriesBadgeHtml}
                    ${imgHtml}
                    <div class="no-cover-text" style="display:none; width:100%; height:100%; align-items:center; justify-content:center; text-align:center; color:#9fa6b2; font-size:0.85rem; padding:10px; background:#f6f8fa;">Ei kuvaa</div>
                </div>
                <div class="book-info">
                    <h3 class="book-title" title="${book.title}">${book.cleanTitle}</h3>
                    ${book.originalTitle ? `<div style="font-size:0.75rem; color:#666; font-style:italic; margin-bottom:4px;">Alkuteos: ${book.originalTitle}</div>` : ''}
                    <span class="author">${book.author}</span>
                    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:6px; align-items:center;">
                        ${formatBadgeHtml}
                        <div class="isbn-container" style="display:${book.isbn ? 'flex' : 'none'};">
                            ${book.isbn ? renderIsbnPill(Array.isArray(book.isbn) ? book.isbn[0] : book.isbn) : ''}
                        </div>
                    </div>
                </div>
            `;

            // Trigger background fetch if missing ISBN
            if (!book.isbn) {
                fetchMissingIsbn(book, card);
            }

            bookGrid.appendChild(card);
        });
    }

    window.handleCoverError = function (img) {
        const isbn = img.dataset.isbn;
        const title = img.dataset.title;
        const originalTitle = img.dataset.originalTitle;
        const author = img.dataset.author;
        const bookId = img.dataset.id;

        // --- CACHE CLEANUP ---
        // If an image that we THOUGHT was valid (from cache or Finna) fails, it might be an expired link.
        if (img.classList.contains('book-cover-img')) {
            console.log(`[Cover] ${title} failed from primary source. Clearing cache and trying fallbacks.`);
            if (bookId) localStorage.removeItem(`cover_fix_${bookId}`);
            const cleanAuthorForCache = author.includes(',')
                ? `${author.split(',')[1].trim()} ${author.split(',')[0].trim()}`
                : author;
            localStorage.removeItem(`cover_v5_${title}_${cleanAuthorForCache}`);
        }

        // --- PREVENT INFINITE LOOPS ---
        if (img.dataset.triedGoogle) {
            // Check for strict "panic button"
            if (img.dataset.finalFailure) {
                img.style.display = 'none';
                return;
            }

            // New logic: If we have an ISBN now but haven't tried with it, allow ONE more go.
            if (isbn && !img.dataset.triedWithIsbn) {
                img.dataset.triedWithIsbn = "true";
                // We'll reset triedGoogle for this one specific retry
                delete img.dataset.triedGoogle;
            } else {
                img.style.display = 'none';
                // Stop future attempts for this specific element
                img.dataset.finalFailure = "true";
                if (img.parentElement.querySelector('.no-cover-text')) {
                    img.parentElement.querySelector('.no-cover-text').style.display = 'flex';
                }
                return;
            }
        }

        // --- STRATEGY 1: SIBLING ENRICHMENT (Finna's own alternative records) ---
        // We only do this if it's a Finna ID and we haven't tried siblings yet
        if (bookId && !img.dataset.triedSiblings) {
            img.dataset.triedSiblings = "true";
            enrichFromSiblings(bookId, title, author, img);
            return;
        }

        // --- STRATEGY 2: GOOGLE BOOKS (Slow but powerful) ---
        // We skip OpenLibrary because it often returns valid placeholder images that break the fallback chain.
        img.dataset.triedGoogle = "true";
        fetchGoogleCover(isbn, title, author, img, bookId, originalTitle);
    };

    async function enrichFromSiblings(bookId, title, author, imgEl) {
        if (!title) return;
        console.log(`[Cover] Strategy 1 (Siblings) for: ${title}`);
        const params = new URLSearchParams({
            lookfor: `"${title}" ${author}`,
            type: 'AllFields',
            limit: 10,
            'field[]': ['images', 'id']
        });

        try {
            const res = await fetch(`https://api.finna.fi/v1/search?${params.toString()}`);
            const data = await res.json();
            if (data.records && data.records.length > 0) {
                const betterImageRecord = data.records.find(r => r.id !== bookId && r.images && r.images.length > 0);
                if (betterImageRecord) {
                    const imgSrc = `https://api.finna.fi${betterImageRecord.images[0]}`;
                    imgEl.src = imgSrc;
                    return;
                }
            }
        } catch (e) { }

        // If siblings fail, manually trigger next step
        handleCoverError(imgEl);
    }

    async function fetchGoogleCover(isbn, title, author, imgEl, bookId, originalTitle) {
        console.log(`[Cover] Starting Google Search for: ${title} (${isbn || 'No ISBN'})`);
        // Fallback to ISBN from element if not passed
        if (!isbn && imgEl.dataset.isbn) {
            isbn = imgEl.dataset.isbn;
        }

        // Clean Author Name (Penny, Louise -> Louise Penny)
        let cleanAuthor = author;
        if (cleanAuthor && cleanAuthor.includes(',')) {
            const parts = cleanAuthor.split(',');
            if (parts.length === 2) {
                cleanAuthor = `${parts[1].trim()} ${parts[0].trim()}`;
            }
        }

        const cacheKey = `cover_v5_${title}_${cleanAuthor}`; // bumped to v5 (revert strategy D)

        // 1. Check Specific ID Cache (Shared with book.html)
        if (bookId) {
            const idCache = localStorage.getItem(`cover_fix_${bookId}`);
            if (idCache) {
                imgEl.src = idCache;
                imgEl.style.display = 'block';
                if (imgEl.parentElement.querySelector('.no-cover-text')) {
                    imgEl.parentElement.querySelector('.no-cover-text').style.display = 'none';
                }
                return;
            }
        }

        const cachedUrl = localStorage.getItem(cacheKey);
        if (cachedUrl) {
            imgEl.src = cachedUrl;
            imgEl.style.display = 'block';
            if (imgEl.parentElement.querySelector('.no-cover-text')) {
                imgEl.parentElement.querySelector('.no-cover-text').style.display = 'none';
            }
            return;
        }

        const applyImage = (items) => {
            if (items && items.length > 0) {
                for (let item of items) {
                    if (item.volumeInfo && item.volumeInfo.imageLinks) {
                        const link = item.volumeInfo.imageLinks.thumbnail || item.volumeInfo.imageLinks.smallThumbnail;
                        if (link) {
                            // Upgrade to HTTPS to avoid Mixed Content issues
                            const safeLink = link.replace('http://', 'https://').replace('&edge=curl', '');
                            localStorage.setItem(cacheKey, safeLink);
                            localStorage.setItem(`cover_fix_${bookId}`, safeLink);

                            if (state.books[bookId]) state.books[bookId].image = safeLink;

                            imgEl.src = safeLink;
                            imgEl.style.display = 'block';
                            if (imgEl.parentElement.querySelector('.no-cover-text')) {
                                imgEl.parentElement.querySelector('.no-cover-text').style.display = 'none';
                            }

                            // Propagation
                            const allPlaceholders = document.querySelectorAll('.cover-placeholder, .book-cover-img');
                            const myKey = title.toLowerCase().split(':')[0].trim();
                            allPlaceholders.forEach(ph => {
                                if (ph === imgEl) return;
                                if (ph.dataset.title?.toLowerCase().includes(myKey)) {
                                    ph.src = safeLink;
                                    ph.style.display = 'block';
                                    if (ph.parentElement.querySelector('.no-cover-text')) {
                                        ph.parentElement.querySelector('.no-cover-text').style.display = 'none';
                                    }
                                }
                            });
                            return true;
                        }
                    }
                }
            }
            return false;
        };

        if (isbn) {
            try {
                console.log(`[Cover] Strategy A (ISBN): ${isbn}`);
                let res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`);
                let data = await res.json();
                if (applyImage(data.items)) return;
            } catch (e) { console.warn("[Cover] Strategy A failed", e); }
        }

        // --- SPECIFIC GUARD: Prevent fuzzy fallback for "Sokeiden valtakunta" ---
        // The user strictly forbids using the English cover if the Finnish one isn't found.
        if (title.toLowerCase().includes('sokeiden valtakunta')) {
            console.log(`[Cover] Skipping fuzzy search for "${title}" to prevent wrong language cover.`);
            handleCoverError(imgEl); // Ensure fallback text shows
            return;
        }
        // -----------------------------------------------------------------------

        try {
            // Enhanced fallback: Fetch 5 results and find one with an image
            let q = `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(cleanAuthor)}`;
            console.log(`[Cover] Strategy B: ${q}`);
            let res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5`);
            let data = await res.json();

            if (data.items && data.items.length > 0) {
                // Try to find exact title match first if possible, or just first with image
                // Simple iteration: first item that has an image
                for (let item of data.items) {
                    if (item.volumeInfo && item.volumeInfo.imageLinks) {
                        console.log(`[Cover] Found via Strategy B: ${item.volumeInfo?.title || 'Unknown'}`);
                        if (applyImage([item])) return;
                    }
                }
            } else {
                console.log(`[Cover] Strategy B found no results.`);
            }
        } catch (e) { console.warn("[Cover] Strategy B failed", e); }

        // Strategy C: Loose Search (Title + Author without intitle:)
        try {
            let qLoose = `${encodeURIComponent(title)}+${encodeURIComponent(cleanAuthor)}`;
            console.log(`[Cover] Strategy C: ${qLoose}`);
            let resLoose = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${qLoose}&maxResults=3`);
            let dataLoose = await resLoose.json();
            if (dataLoose.items && dataLoose.items.length > 0) {
                for (let item of dataLoose.items) {
                    if (item.volumeInfo && item.volumeInfo.imageLinks) {
                        console.log(`[Cover] Found via Strategy C: ${item.volumeInfo.title}`);
                        if (applyImage([item])) return;
                    }
                }
            } else {
                console.log(`[Cover] Strategy C found no results.`);
            }
        } catch (e) { console.warn("[Cover] Strategy C failed", e); }

        // Strategy D: Original Title Search
        // Strategy D: Original Title Search -- DISABLED to prevent foreign covers
        /*
        if (originalTitle && originalTitle !== title) {
            try {
                let q = `intitle:${encodeURIComponent(originalTitle)}+inauthor:${encodeURIComponent(cleanAuthor)}`;
                console.log(`[Cover] Strategy D (Original Title): ${q}`);
                let res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`);
                let data = await res.json();
                if (applyImage(data.items)) return;

                // Loose D
                let qLoose = `${encodeURIComponent(originalTitle)}+${encodeURIComponent(cleanAuthor)}`;
                let resLoose = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${qLoose}&maxResults=1`);
                let dataLoose = await resLoose.json();
                if (applyImage(dataLoose.items)) return;
            } catch (e) { }
        }
        */

        if (imgEl.parentElement && imgEl.parentElement.querySelector('.no-cover-text')) {
            imgEl.parentElement.querySelector('.no-cover-text').style.display = 'flex';
        }
    }

    // Helper to render the ISBN pill HTML
    function renderIsbnPill(isbn) {
        return `<button class="isbn-pill" title="${isbn}" onclick="event.stopPropagation(); copyIsbn('${isbn}', this)">ISBN</button>`;
    }

    async function fetchMissingIsbn(book, cardEl) {
        if (book.triedIsbnFetch) return;
        book.triedIsbnFetch = true;

        const oldCacheKey = `isbn_${book.id}`;
        const newCacheKey = `isbn_v2_${book.id}`;

        // Cleanup: If the old cache has the known BAD ISBN that doesn't belong to current author, purge it
        const oldVal = localStorage.getItem(oldCacheKey);
        if (oldVal === '9789523765061' && !book.author.toLowerCase().includes('penny')) {
            console.log(`[ISBN] Purging suspicious cached ISBN 9789523765061 for ${book.author}`);
            localStorage.removeItem(oldCacheKey);
        }

        const cached = localStorage.getItem(newCacheKey);
        if (cached) {
            console.log(`[ISBN] Cache hit (v2) for ${book.title}: ${cached}`);
            book.isbn = [cached];
            const container = cardEl.querySelector('.isbn-container');
            if (container) {
                container.innerHTML = renderIsbnPill(cached);
                container.style.display = 'flex';
            }
            // Trigger cover refresh if it was missing
            const imgEl = cardEl.querySelector('.cover-placeholder, .book-cover-img');
            if (imgEl && (imgEl.src === "" || imgEl.style.display === 'none')) {
                imgEl.dataset.isbn = cached;
                handleCoverError(imgEl); // Start the chain
            }
            return;
        }

        const updateUI = (isbn) => {
            console.log(`[ISBN] Updating UI for ${book.title}. ISBN: ${isbn}`);
            localStorage.setItem(newCacheKey, isbn); // Store in new cache
            book.isbn = [isbn];
            const container = cardEl.querySelector('.isbn-container');
            if (container) {
                container.innerHTML = renderIsbnPill(isbn);
                container.style.display = 'flex'; // Force display
            }
            // Trigger cover refresh if it was missing
            const imgEl = cardEl.querySelector('.cover-placeholder, .book-cover-img');
            if (imgEl && (imgEl.src === "" || imgEl.style.display === 'none')) {
                imgEl.dataset.isbn = isbn;
                handleCoverError(imgEl);
            }
        };

        // Helper to formatting author "Sager, Riley" -> "Riley Sager"
        let cleanAuthor = book.author || "";
        if (cleanAuthor && cleanAuthor.includes(',')) {
            const parts = cleanAuthor.split(',');
            if (parts.length === 2) {
                cleanAuthor = `${parts[1].trim()} ${parts[0].trim()}`;
            }
        }

        // Helper to find ISBN from items with strict verification
        const findIsbnFromItems = (items) => {
            if (!items) return null;
            const searchTitle = (book.cleanTitle || book.title || "").toLowerCase();
            const searchAuthorLow = (book.author || "").toLowerCase();

            for (const item of items) {
                const info = item.volumeInfo;
                if (!info) continue;

                // Strict Title Check: Start with same words or include the core title
                const foundTitle = (info.title || "").toLowerCase();
                const titleMatch = foundTitle.includes(searchTitle.split(':')[0].trim()) || searchTitle.includes(foundTitle.split(':')[0].trim());

                // Strict Author Check: search last name in found authors
                const lastName = searchAuthorLow.split(',')[0].trim();
                const authorMatch = info.authors && info.authors.some(a => a.toLowerCase().includes(lastName));

                if (titleMatch && authorMatch) {
                    const ids = info.industryIdentifiers || [];
                    const isbnObj = ids.find(i => i.type === "ISBN_13" || i.type === "ISBN_10");
                    const isbn = isbnObj ? isbnObj.identifier : null;

                    if (isbn === '9789523765061' && !searchAuthorLow.includes('penny')) {
                        console.warn(`[ISBN] Blacklisting Penny ISBN for ${searchAuthorLow}`);
                        continue;
                    }
                    if (isbn) return isbn;
                } else {
                    console.log(`[ISBN] Skipping mismatch: "${foundTitle}" by ${info.authors?.join(', ')} (Target: "${searchTitle}")`);
                }
            }
            return null;
        };

        // 1. Google Books (Title + Clean Author)
        try {
            const searchTitle = book.cleanTitle || book.title || "Unknown";
            console.log(`[ISBN] Searching Google for: ${searchTitle} | ${cleanAuthor}`);
            // Strategy A: Specific
            let q = `intitle:${encodeURIComponent(searchTitle)}+inauthor:${encodeURIComponent(cleanAuthor)}`;
            // Increase maxResults to find a paperback edition if the first result is an ebook without ISBN
            let res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5`);
            let data = await res.json();

            let foundIsbn = findIsbnFromItems(data.items);
            if (foundIsbn) {
                console.log(`[ISBN] Found via Strategy A: ${foundIsbn}`);
                updateUI(foundIsbn);
                return;
            }

            // Strategy B: Loose (just query words)
            console.log(`[ISBN] Retrying Strategy B (Loose)...`);
            q = `${encodeURIComponent(searchTitle)}+${encodeURIComponent(cleanAuthor)}`;
            res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5`);
            data = await res.json();

            foundIsbn = findIsbnFromItems(data.items);
            if (foundIsbn) {
                console.log(`[ISBN] Found via Strategy B: ${foundIsbn}`);
                updateUI(foundIsbn);
                return;
            }

            // Strategy C: Original Title + Clean Author (if available)
            // Strategy C: Original Title + Clean Author (if available) -- DISABLED
            /*
            if (book.originalTitle) {
                console.log(`[ISBN] Retrying Strategy C (Original Title): ${book.originalTitle}...`);
                q = `intitle:${encodeURIComponent(book.originalTitle)}+inauthor:${encodeURIComponent(cleanAuthor)}`;
                res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=5`);
                data = await res.json();

                foundIsbn = findIsbnFromItems(data.items);
                if (foundIsbn) {
                    console.log(`[ISBN] Found via Strategy C: ${foundIsbn}`);
                    updateUI(foundIsbn);
                    return;
                }
            }
            */

        } catch (e) { console.warn("[ISBN] Google fetch failed", e); }

        // 3. Fallback: Google Books (Title ONLY - if very long title or unique)
        if ((book.cleanTitle || book.title).length > 10) {
            try {
                const searchTitle = book.cleanTitle || book.title;
                const q = `intitle:${encodeURIComponent(searchTitle)}`;
                const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`);
                const data = await res.json();
                if (data.items && data.items.length > 0) {
                    const info = data.items[0].volumeInfo;
                    // Only accept if author fuzzy matches to avoid wrong book
                    if (info.authors && info.authors.some(a => book.author.toLowerCase().includes(a.toLowerCase().split(' ')[1] || "xyz"))) {
                        const id = (info.industryIdentifiers || []).find(i => i.type === "ISBN_13" || i.type === "ISBN_10");
                        if (id) {
                            updateUI(id.identifier);
                        }
                    }
                }
            } catch (e) { }
        }
    }

    window.copyIsbn = function (text, btn) {
        if (!text) return;

        const feedback = (success) => {
            const originalText = btn.textContent;
            btn.textContent = success ? "Kopioitu!" : "Virhe";
            btn.style.color = success ? "#1a7f37" : "#cf222e";
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.color = "";
            }, 2000);
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => feedback(true)).catch(() => feedback(false));
        } else {
            // Fallback
            try {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                feedback(true);
            } catch (err) {
                prompt("Kopioi ISBN:", text);
                feedback(true); // Assume they copied it manually
            }
        }
    };

    function setupEventListeners() {
        addAuthorBtn.addEventListener('click', () => toggleSearch());
        searchActionBtn.addEventListener('click', () => {
            const q = searchInput.value.trim();
            if (q) searchAuthor(q);
        });
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchActionBtn.click();
        });

        const langFilter = document.getElementById('lang-filters');
        if (!langFilter) return;

        const checkboxes = langFilter.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = state.selectedLanguages.includes(cb.value);
        });

        langFilter.addEventListener('change', () => {
            const checkboxes = langFilter.querySelectorAll('input[type="checkbox"]');
            const checked = Array.from(checkboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);

            state.selectedLanguages = checked;
            localStorage.setItem('selectedLanguages', JSON.stringify(checked));

            renderAuthors();
            renderBooks();
        });
    }

    function toggleSearch(force) {
        if (typeof force !== 'undefined') {
            if (force) searchPanel.classList.remove('hidden');
            else searchPanel.classList.add('hidden');
        } else {
            searchPanel.classList.toggle('hidden');
        }
        if (!searchPanel.classList.contains('hidden')) {
            searchInput.focus();
        }
    }

    init();
});
