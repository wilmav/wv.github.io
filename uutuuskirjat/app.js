document.addEventListener('DOMContentLoaded', async () => {

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
        // Load Static Data for caching/bootstrapping
        let staticDefaults = [];
        if (typeof AUTHORS_DATA !== 'undefined') {
            state.staticAuthors = AUTHORS_DATA;
            // Index static books
            state.books = { ...BOOKS_DATA };
            staticDefaults = AUTHORS_DATA;
        }

        // Load Dates (Prototype)
        try {
            const dateRes = await fetch('../dates.json');
            if (dateRes.ok) {
                state.dates = await dateRes.json();
                console.log("Loaded manual dates:", state.dates);
            }
        } catch (e) { console.warn("Could not load dates.json"); }

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
        // limit: 100 to get a good coverage of "all" books as requested.
        const params = new URLSearchParams();
        params.append("lookfor", authorName);
        params.append("type", "Author");
        params.append("sort", "main_date_str desc");
        params.append("limit", "100");

        const fields = ["id", "title", "authors", "year", "images", "summary", "languages", "series", "uniformTitles", "formats", "isbn"];
        fields.forEach(f => params.append("field[]", f));

        // Finna API handling
        const url = `${API_SEARCH}?${params.toString()}`;
        console.log("Fetching books with URL:", url);

        try {
            const res = await fetch(url);
            const data = await res.json();
            const records = data.records || [];
            console.log(`Found ${records.length} books for ${authorName}`);

            return records
                .filter(book => {
                    const y = parseInt(book.year);
                    return !isNaN(y) && y >= minYear;
                })
                .map(normalizeBookData);
        } catch (e) {
            console.error("Search failed for " + authorName, e);
            return [];
        }
    }

    function normalizeBookData(book) {
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

        // Check for Manual Date (Scraper)
        let manualDate = null;
        if (state.dates && book.title) {
            const key = book.title.toLowerCase().trim();
            const entry = state.dates[key];
            if (entry && entry.dates) {
                if (isAudio && entry.dates.audiobook) manualDate = entry.dates.audiobook;
                else if (isEbook && entry.dates.ebook) manualDate = entry.dates.ebook;
                else if (entry.dates.print) manualDate = entry.dates.print;
                // Fallback: any date is better than just year
                if (!manualDate) manualDate = entry.dates.audiobook || entry.dates.ebook || entry.dates.print;
            }
        }

        return {
            id: book.id,
            title: book.title,
            originalTitle: book.uniformTitles ? book.uniformTitles[0] : null,
            author: extractAuthorName(book.authors),
            year: book.year,
            manualDate: manualDate,
            description: book.summary,
            image: book.images && book.images.length ? `https://api.finna.fi${book.images[0]}` : null,
            language: book.languages,
            series: seriesInfo,
            formats: { isEbook, isAudio },
            isbn: book.isbn
        };
    }

    function extractAuthorName(authorsObj) {
        if (!authorsObj) return "Unknown";
        if (authorsObj.primary) {
            const names = Object.keys(authorsObj.primary);
            if (names.length > 0) return names[0];
        }
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
        const url = `${API_SEARCH}?lookfor=${encodeURIComponent(query)}&type=Author&limit=100&field[]=authors`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            searchResults.innerHTML = '';

            if (!data.records || data.records.length === 0) {
                searchResults.innerHTML = '<div class="search-result-item">Ei tuloksia.</div>';
                return;
            }

            const foundAuthors = new Set();
            data.records.forEach(r => {
                if (r.authors) {
                    Object.values(r.authors).forEach(roleObj => {
                        if (roleObj) {
                            Object.keys(roleObj).forEach(name => {
                                const normalized = name.replace(/\s+/g, ' ').trim();
                                if (normalized) foundAuthors.add(normalized);
                            });
                        }
                    });
                }
            });

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

        if (booksToShow.length === 0) {
            bookGrid.innerHTML = '<p class="subtitle">Ei hakuehtoja vastaavia kirjoja.</p>';
            return;
        }

        booksToShow.forEach(book => {
            const card = document.createElement('div');
            card.className = 'book-card';
            card.style.cursor = 'pointer';
            card.onclick = () => {
                window.location.href = `book.html?id=${book.id}`;
            };

            let displayOriginalTitle = book.originalTitle || "";
            if (displayOriginalTitle) {
                displayOriginalTitle = displayOriginalTitle.replace(/^Alkuteos:\s*/i, "").replace(/^Alkuperäisteos:\s*/i, "").replace(/\.\s*Suomi$/i, "").trim();
            }

            let imgSrc = book.image ? `https://api.finna.fi${book.image}` : '';
            let imgHtml = '';

            if (imgSrc) {
                imgHtml = `<img src="${imgSrc}" alt="${book.title}" loading="lazy" onerror="this.style.display='none'">`;
            } else if (book.isbn) {
                const isbn = Array.isArray(book.isbn) ? book.isbn[0] : book.isbn;
                imgHtml = `<img src="https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg" class="cover-placeholder" data-isbn="${isbn}" data-title="${book.title}" data-author="${book.author}" alt="${book.title}" loading="lazy" onerror="handleCoverError(this)">`;
            } else {
                imgHtml = `<img src="" class="cover-placeholder" data-title="${book.title}" data-author="${book.author}" alt="${book.title}" loading="lazy" onerror="handleCoverError(this)" style="display:none">`;
                setTimeout(() => fetchGoogleCover(null, book.title, book.author, card.querySelector('.cover-placeholder')), 0);
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

            let dateDisplay = book.year;
            let dateStyle = parseInt(book.year) === currentYear ? ' current-year' : '';

            if (book.manualDate) {
                dateDisplay = book.manualDate;
                dateStyle = ' current-year';
            }

            let formatBadgeHtml = `
                <span class="year-tag${dateStyle}" title="${book.manualDate ? 'Julkaisupäivä: ' + book.manualDate : 'Julkaisuvuosi'}">${dateDisplay}</span>
                ${book.formats.isEbook ? '<span class="year-tag" style="background:#eef; color:#44a;">E-kirja</span>' : ''}
                ${book.formats.isAudio ? '<span class="year-tag" style="background:#efe; color:#064;">Äänikirja</span>' : ''}
                ${!book.formats.isEbook && !book.formats.isAudio ? '<span class="year-tag" style="background:#f0f0f0; color:#444;">Kirja</span>' : ''}
            `;

            card.innerHTML = `
                <div class="book-cover-container">
                    ${seriesBadgeHtml}
                    ${imgHtml}
                    <div class="no-cover-text" style="display:none; width:100%; height:100%; align-items:center; justify-content:center; text-align:center; color:#9fa6b2; font-size:0.85rem; padding:10px; background:#f6f8fa;">Ei kuvaa</div>
                </div>
                <div class="book-info">
                    <h3 class="book-title" title="${book.title}">${book.cleanTitle || book.title}</h3>
                    ${displayOriginalTitle ? `<div style="font-size:0.75rem; color:#666; font-style:italic; margin-bottom:4px;">Alkuteos: ${displayOriginalTitle}</div>` : ''}
                    <span class="author">${book.author}</span>
                    <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
                        ${formatBadgeHtml}
                    </div>
                </div>
            `;
            bookGrid.appendChild(card);
        });
    }

    window.handleCoverError = function (img) {
        const isbn = img.dataset.isbn;
        const title = img.dataset.title;
        const author = img.dataset.author;

        if (img.dataset.triedGoogle) {
            img.style.display = 'none';
            if (img.parentElement.querySelector('.no-cover-text')) {
                img.parentElement.querySelector('.no-cover-text').style.display = 'flex';
            }
            return;
        }

        img.dataset.triedGoogle = "true";
        fetchGoogleCover(isbn, title, author, img);
    };

    async function fetchGoogleCover(isbn, title, author, imgEl) {

        const applyImage = (items) => {
            if (items && items.length > 0 && items[0].volumeInfo.imageLinks) {
                const link = items[0].volumeInfo.imageLinks.thumbnail || items[0].volumeInfo.imageLinks.smallThumbnail;
                if (link) {
                    const safeLink = link.replace('&edge=curl', '');
                    imgEl.src = safeLink;
                    imgEl.style.display = 'block';
                    if (imgEl.parentElement.querySelector('.no-cover-text')) {
                        imgEl.parentElement.querySelector('.no-cover-text').style.display = 'none';
                    }

                    // LIVE PROPAGATION
                    if (title) {
                        const allPlaceholders = document.querySelectorAll('.cover-placeholder');
                        const myKey = title.toLowerCase().split(':')[0].trim();

                        allPlaceholders.forEach(ph => {
                            if (ph === imgEl) return;
                            const otherTitle = ph.dataset.title || "";
                            const otherKey = otherTitle.toLowerCase().split(':')[0].trim();

                            if (otherKey && otherKey === myKey) {
                                if (ph.style.display === 'none' || ph.getAttribute('src') === '') {
                                    ph.src = safeLink;
                                    ph.style.display = 'block';
                                    if (ph.parentElement.querySelector('.no-cover-text')) {
                                        ph.parentElement.querySelector('.no-cover-text').style.display = 'none';
                                    }
                                    ph.dataset.triedGoogle = "true";
                                }
                            }
                        });
                    }
                    return true;
                }
            }
            return false;
        };

        if (isbn) {
            try {
                let res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`);
                let data = await res.json();
                if (applyImage(data.items)) return;
            } catch (e) { }
        }

        try {
            let q = `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(author)}`;
            let res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`);
            let data = await res.json();
            if (applyImage(data.items)) return;
        } catch (e) { }

        imgEl.style.display = 'none';
        if (imgEl.parentElement && imgEl.parentElement.querySelector('.no-cover-text')) {
            imgEl.parentElement.querySelector('.no-cover-text').style.display = 'flex';
        }
    }

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
