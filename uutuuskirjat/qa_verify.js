
const https = require('https');

// Utils
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(body));
                } catch (e) { resolve({}); }
            });
        }).on('error', reject);
    });
}

const CLEAN_AUTHOR = (author) => {
    if (author && author.includes(',')) {
        const parts = author.split(',');
        if (parts.length === 2) {
            return `${parts[1].trim()} ${parts[0].trim()}`;
        }
    }
    return author;
};

async function testBook(title, rawAuthor) {
    console.log(`\n--- TESTING: ${title} ---`);
    console.log(`Raw Author: ${rawAuthor}`);
    const clean = CLEAN_AUTHOR(rawAuthor);
    console.log(`Clean Author: ${clean}`);

    // 1. Google Cover Search (Strategy B logic)
    const q = `intitle:${encodeURIComponent(title)}+inauthor:${encodeURIComponent(clean)}`;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`;

    console.log(`Fetching Google Cover (Strategy B)...`);
    const data = await fetchJson(url);

    if (data.items && data.items.length > 0) {
        const info = data.items[0].volumeInfo;
        console.log(`[SUCCESS] Found Google Book!`);
        console.log(`  Title: ${info.title}`);
        console.log(`  Authors: ${info.authors ? info.authors.join(', ') : '?'}`);
        console.log(`  ImageLinks: ${info.imageLinks ? 'YES' : 'NO'}`);
        console.log(`  ISBN: ${info.industryIdentifiers ? JSON.stringify(info.industryIdentifiers) : 'None'}`);
    } else {
        console.log(`[FAILURE] No results found from Google with clean author.`);

        // Try loose
        console.log(`Retrying Loose Search...`);
        const qLoose = `${encodeURIComponent(title)}+${encodeURIComponent(clean)}`;
        const urlLoose = `https://www.googleapis.com/books/v1/volumes?q=${qLoose}&maxResults=1`;
        const dataLoose = await fetchJson(urlLoose);
        if (dataLoose.items && dataLoose.items.length > 0) {
            console.log(`[SUCCESS] Found via Loose Search!`);
            console.log(`  Title: ${dataLoose.items[0].volumeInfo.title}`);
        } else {
            console.log(`[FAILURE] Loose search also failed.`);
        }
    }
}

async function run() {
    await testBook("Talonvahti", "Sager, Riley");
    await testBook("Sokeiden valtakunta", "Penny, Louise");
    await testBook("Mestaritontun seikkailut", "Kunnas, Mauri"); // Control
}

run();
