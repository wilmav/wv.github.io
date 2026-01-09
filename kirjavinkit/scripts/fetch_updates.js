const fs = require('fs');
const path = require('path');
const https = require('https');

// --- Configuration ---
const AUTHORS = [
    "Stephen King",
    "Colleen Hoover",
    "Neil Gaiman",
    "Sofi Oksanen",
    "Jo Nesbø"
];

const API_BASE = "https://api.finna.fi/v1/search";

// Helper to make HTTPS requests (Node.js native, no dependencies needed)
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function fetchAuthorBooks(authorName) {
    console.log(`Fetching books for: ${authorName}...`);

    // Construct query:
    // lookfor: author name
    // type: Author
    // filter[]: format:"0/Book/" (Books only)
    // sort: main_date_str desc (Newest first)
    // field[]: id,title,authors,year,summary,images,formats

    const query = new URLSearchParams({
        "lookfor": `author: "${authorName}"`,
        "type": "AllFields",
        "filter[]": 'format:"0/Book/"',
        "sort": "main_date_str desc",
        "limit": 20,
        "field[]": ["id", "title", "authors", "year", "images", "summary", "languages"]
    });

    const url = `${API_BASE}?${query.toString()}`;

    try {
        const response = await fetchJson(url);
        return response.records || [];
    } catch (err) {
        console.error(`Error fetching ${authorName}:`, err.message);
        return [];
    }
}

async function main() {
    const authorsData = [];
    const booksData = {};
    const currentYear = new Date().getFullYear();

    for (const author of AUTHORS) {
        const records = await fetchAuthorBooks(author);

        // Filter for "New" releases (Current year or last year)
        // Note: Finna 'year' field is a string, sometimes ranges. Simple check:
        const newBooks = records.filter(book => {
            const y = parseInt(book.year);
            return !isNaN(y) && y >= (currentYear - 2); // Widen window slightly (-2) for demo
        });

        const latestBookIds = newBooks.map(b => b.id);

        // Add to Authors list
        authorsData.push({
            name: author,
            latest_books: latestBookIds,
            // Use the first book's image as author placeholder if needed, or find specific author image later
            sample_cover: newBooks.length > 0 ? `https://api.finna.fi${newBooks[0].images[0]}` : null
        });

        // Add to Books cache
        newBooks.forEach(book => {
            booksData[book.id] = {
                id: book.id,
                title: book.title,
                author: book.authors ? Object.keys(book.authors)[0] : author,
                year: book.year,
                description: book.summary,
                image: book.images && book.images.length > 0 ? `https://api.finna.fi${book.images[0]}` : null,
                language: book.languages
            };
        });
    }

    // Write output
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

    fs.writeFileSync(path.join(dataDir, 'authors.json'), JSON.stringify(authorsData, null, 2));
    fs.writeFileSync(path.join(dataDir, 'books.json'), JSON.stringify(booksData, null, 2));

    console.log("✅ Data update complete!");
    console.log(`Authors: ${authorsData.length}`);
    console.log(`New Books Found: ${Object.keys(booksData).length}`);
}

main();
