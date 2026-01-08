document.addEventListener('DOMContentLoaded', async () => {

    // --- Configuration ---
    const API_SEARCH = "https://api.finna.fi/v1/search";

    // --- State ---
    const state = {
        staticAuthors: [], // From authors.js
        userAuthors: [],   // From localStorage
        books: {},         // Combined static + fetched books
        selectedAuthor: null,
        selectedLanguages: JSON.parse(localStorage.getItem('selectedLanguages')) || ['fin', 'swe', 'eng']
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
        // Load Static Data for caching/bootstrapping
        let staticDefaults = [];
        if (typeof AUTHORS_DATA !== 'undefined') {
            state.staticAuthors = AUTHORS_DATA;
            // Index static books
            state.books = { ...BOOKS_DATA };
            staticDefaults = AUTHORS_DATA;
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
        const currentYear = new Date().getFullYear();

        for (const author of state.userAuthors) {
            try {
                // Fetch ALL books (or at least a large history), not just recent ones.
                // Finna "sort: main_date_str desc" will give us the newest first.
                // We ask for e.g. 100 items to cover the bibliography reasonably well.
                const books = await searchFinnaBooks(author.name, 1900);

                // Merge into state
                books.forEach(b => {
                    state.books[b.id] = b;
                });

                // Update author's book list
                author.latest_books = books.map(b => b.id);

            } catch (e) {
                console.error(`Could not fetch for ${author.name}`, e);
            }
        }

        saveUserAuthors(); // Save updated book lists/counts
        renderAuthors();
        renderBooks();
    }

    async function searchFinnaBooks(authorName, minYear) {
        // Did not swap "Penny, Louise" -> "Louise Penny" because type=Author expects "Last, First" often.
        const searchName = authorName;

        // Use "author" search field explicitly.
        // limit: 100 to get a good coverage of "all" books as requested.
        // limit: 100 to get a good coverage of "all" books as requested.
        const params = new URLSearchParams();
        params.append("lookfor", searchName);
        params.append("type", "Author");
        params.append("sort", "main_date_str desc");
        params.append("limit", "100");

        const fields = ["id", "title", "authors", "year", "images", "summary", "languages", "series", "uniformTitles", "formats"];
        fields.forEach(f => params.append("field[]", f));

        // Finna API handling
        const url = `${API_SEARCH}?${params.toString()}`;
        console.log("Fetching books with URL:", url);

        try {
            const res = await fetch(url);
            const data = await res.json();
            const records = data.records || [];
            console.log(`Found ${records.length} books for ${searchName}`);

            return records
                .filter(book => {
                    const y = parseInt(book.year);
                    return !isNaN(y) && y >= minYear;
                })
                .map(normalizeBookData);
        } catch (e) {
            console.error("Search failed for " + searchName, e);
            return [];
        }
    }

    function normalizeBookData(book) {
        // Parse Series
        let seriesInfo = null;
        if (book.series && book.series.length > 0) {
            const sRaw = book.series[0];
            // Simple parse attempt "Name ; No"
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

        return {
            id: book.id,
            title: book.title,
            originalTitle: book.uniformTitles ? book.uniformTitles[0] : null,
            author: extractAuthorName(book.authors),
            year: book.year,
            description: book.summary,
            image: book.images && book.images.length ? `https://api.finna.fi${book.images[0]}` : null,
            language: book.languages,
            series: seriesInfo,
            formats: { isEbook, isAudio }
        };
    }

    function extractAuthorName(authorsObj) {
        if (!authorsObj) return "Unknown";
        // API returns { "primary": { "Name": ... }, "secondary": ... }
        if (authorsObj.primary) {
            const names = Object.keys(authorsObj.primary);
            if (names.length > 0) return names[0];
        }
        // Fallback to any other role
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

        // Use "Author" type + limit 100 to cast a wide enough net for "Penny" -> "Penny, Louise"
        // even if many other "Penny" surnames exist.
        const url = `${API_SEARCH}?lookfor=${encodeURIComponent(query)}&type=Author&limit=100&field[]=authors`;

        try {
            const res = await fetch(url);
            const data = await res.json();

            searchResults.innerHTML = '';

            if (!data.records || data.records.length === 0) {
                searchResults.innerHTML = '<div class="search-result-item">Ei tuloksia.</div>';
                return;
            }

            // Extract all authors from book results
            const foundAuthors = new Set();
            data.records.forEach(r => {
                if (r.authors) {
                    Object.values(r.authors).forEach(roleObj => {
                        if (roleObj) {
                            Object.keys(roleObj).forEach(name => {
                                // Normalize: trim and collapse multiple spaces (e.g. "Penny,  Louise" -> "Penny, Louise")
                                const normalized = name.replace(/\s+/g, ' ').trim();
                                if (normalized) foundAuthors.add(normalized);
                            });
                        }
                    });
                }
            });

            // FILTER: Strict token matching
            const queryTokens = query.toLowerCase().trim().split(/\s+/);

            const filteredAuthors = Array.from(foundAuthors).filter(name => {
                const lowerName = name.toLowerCase();
                return queryTokens.every(token => lowerName.includes(token));
            });

            // Sort and log
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

            console.log("Found authors (Set):", [...foundAuthors]);
            console.log("Sorted authors:", sortedAuthors);

            if (sortedAuthors.length === 0) {
                // Fallback to partial matches
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

        // Reset UI
        toggleSearch(false);
        // Clear search
        searchInput.value = '';
        searchResults.innerHTML = '';

        renderAuthors();

        // Fetch their books
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

        // ONLY render userAuthors (which now includes bootstrapped defaults)
        state.userAuthors.forEach(author => {
            const isActive = state.selectedAuthor === author.name;

            // Calculate filtered count
            let count = 0;
            if (author.latest_books) {
                count = author.latest_books.filter(bookId => {
                    const book = state.books[bookId];
                    if (!book) return false;
                    // Apply Language Filter
                    if (selectedLangs.length > 0) {
                        if (!book.language) return false;
                        return book.language.some(langCode => selectedLangs.some(sel => langCode.includes(sel)));
                    }
                    return false; // If no language selected, show 0? Or maybe all? Logic says 0 if selected.length > 0 is false check.
                    // Actually if selected.length == 0, renderBooks shows 0. So count should be 0.
                }).length;
            }

            const el = document.createElement('div');
            el.className = `author-chip ${isActive ? 'active' : ''}`;
            el.innerHTML = `
                ${author.name}
                ${count > 0 ? `<span class="count">${count}</span>` : ''}
                <span class="remove-author" title="Poista">×</span>
            `;

            // Click to select
            el.addEventListener('click', (e) => {
                if (e.target.classList.contains('remove-author')) {
                    e.stopPropagation(); // Stop selection when removing
                    removeUserAuthor(author.name);
                } else {
                    state.selectedAuthor = isActive ? null : author.name;
                    renderAuthors(); // re-render to update active state
                    renderBooks();
                }
            });

            authorList.appendChild(el);
        });
    }

    function renderBooks() {
        bookGrid.innerHTML = '';

        let booksToShow = [];

        // 1. Filter by Author
        // 1. Filter by Author using IDs (Strict Match)
        if (state.selectedAuthor) {
            const authorObj = state.userAuthors.find(a => a.name === state.selectedAuthor);
            if (authorObj && authorObj.latest_books) {
                // Filter state.books based on the IDs tied to this author
                // This prevents "Penny, Louise" books from being hidden if name string doesn't match perfectly
                const authorBookIds = new Set(authorObj.latest_books);
                booksToShow = Object.values(state.books).filter(b => authorBookIds.has(b.id));
            } else {
                booksToShow = [];
            }
        } else {
            // Show all from tracked authors
            const allTrackedIds = new Set();
            state.userAuthors.forEach(a => {
                if (a.latest_books) a.latest_books.forEach(id => allTrackedIds.add(id));
            });
            booksToShow = Object.values(state.books).filter(b => allTrackedIds.has(b.id));
        }

        // 2. Filter by Language
        // Strict limit: only show books that have one of the SELECTED languages.
        // This also handles the "never show other languages" rule because we only check against available checkboxes.
        const selected = state.selectedLanguages;
        if (selected.length > 0) {
            booksToShow = booksToShow.filter(b => {
                if (!b.language) return false;
                // b.language is array of codes (e.g. ['fin']). Check intersection.
                return b.language.some(langCode => selected.some(sel => langCode.includes(sel)));
            });
        } else {
            // If nothing selected, show nothing (or all? usually nothing implies user unchecked all)
            booksToShow = [];
        }

        // Sort by year desc.
        // If years are equal, use title for stability
        // Sort: Future > Newest > Title
        const currentYear = new Date().getFullYear();
        booksToShow.sort((a, b) => {
            const yearA = parseInt(a.year) || 0;
            const yearB = parseInt(b.year) || 0;

            // Prioritize future releases
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
            // Make clickable
            card.style.cursor = 'pointer';
            card.onclick = () => {
                window.location.href = `book.html?id=${book.id}`;
            };

            let imageHtml = `<div class="no-cover">Ei kuvaa</div>`;
            if (book.image) {
                imageHtml = `<img src="${book.image}" alt="${book.title}" loading="lazy">`;
            }

            // Series Badge logic
            let badgeHtml = '';
            if (book.series && book.series.number) {
                badgeHtml = `
                    <div class="series-badge" title="${book.series.name}">
                        ${book.series.number}
                    </div>
                    <div class="series-tooltip">
                        ${book.series.name} #${book.series.number}
                    </div>
                 `;
            }

            card.innerHTML = `
                <div class="book-cover-container">
                    ${badgeHtml}
                    ${imageHtml}
                </div>
                <div class="book-info">
                    <h3 class="book-title" title="${book.title}">${book.cleanTitle || book.title}</h3>
                    ${book.originalTitle ? `<div style="font-size:0.75rem; color:#666; font-style:italic; margin-bottom:4px;">Alkuteos: ${book.originalTitle}</div>` : ''}
                    <span class="author">${book.author}</span>
                    <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
                        <span class="year-tag">${book.year}</span>
                        ${book.formats.isEbook ? '<span class="year-tag" style="background:#eef; color:#44a;">E-kirja</span>' : ''}
                        ${book.formats.isAudio ? '<span class="year-tag" style="background:#efe; color:#064;">Äänikirja</span>' : ''}
                        ${!book.formats.isEbook && !book.formats.isAudio ? '<span class="year-tag" style="background:#f0f0f0; color:#444;">Kirja</span>' : ''}
                    </div>
                </div>
            `;
            bookGrid.appendChild(card);
        });
    }

    // --- UI Interactions ---

    function setupEventListeners() {
        // Toggle Search
        addAuthorBtn.addEventListener('click', () => toggleSearch());

        // Search Action
        searchActionBtn.addEventListener('click', () => {
            const q = searchInput.value.trim();
            if (q) searchAuthor(q);
        });

        // Search on Enter
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchActionBtn.click();
        });

        initLangFilter();
    }

    function initLangFilter() {
        const langFilter = document.getElementById('lang-filters');
        if (!langFilter) return;

        // Sync checkboxes with current state (loaded from LS at start)
        const checkboxes = langFilter.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = state.selectedLanguages.includes(cb.value);
        });

        // Filter Change
        langFilter.addEventListener('change', () => {
            const checkboxes = langFilter.querySelectorAll('input[type="checkbox"]');
            const checked = Array.from(checkboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.value);

            state.selectedLanguages = checked;
            localStorage.setItem('selectedLanguages', JSON.stringify(checked)); // Save state

            // Re-calc counts since they depend on language now
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

    // Run
    init();

});
