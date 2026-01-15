const https = require('https');

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', (err) => reject(err));
    });
}

async function test() {
    const author = "Sophie Kinsella";
    // Increase limit to see if English books are just further down
    const url = `https://api.finna.fi/v1/search?lookfor=${encodeURIComponent(author)}&type=Author&limit=100&field[]=title&field[]=languages&field[]=year&filter[]=format:"0/Book/"`;

    console.log(`Fetching ${url}...`);
    try {
        const data = await fetchUrl(url);
        if (data.records) {
            console.log(`Found ${data.records.length} records.`);
            const languages = {};
            data.records.forEach(r => {
                const langs = r.languages || [];
                langs.forEach(l => languages[l] = (languages[l] || 0) + 1);
                // Log English books specifically or all
                if (langs.includes('eng')) {
                    console.log(`[ENG] ${r.year} - ${r.title}`);
                }
            });
            console.log("Language distribution:", languages);
        } else {
            console.log("No records found.");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
