import urllib.request
import json
import re
import sys
import datetime

# Configuration
YEAR_TO_SCAN = 2026
OUTPUT_FILE = "dates.json"

# Headers to mimic a browser
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

def fetch_url(url):
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req) as response:
            return response.read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def parse_wsoy():
    print("Scanning WSOY...")
    # Example WSOY URL structure (approximate)
    # They often have /kirjat page. We will scan a 'coming soon' type page if it exists, 
    # or just the generic book search for the year.
    # Since we can't deeprawl, we'll try a search query logic if possible or just main catalog.
    
    # For this prototype, let's assume we search for specific known authors or listed books.
    # But to make it "generic", we'd need to crawl the "kevät 2026" catalog.
    
    # Placeholder Logic:
    # 1. Fetch catalog page
    # 2. Extract books with dates
    
    url = "https://www.wsoy.fi/kirjat?published_at=2026" # This is hypothetical query
    html = fetch_url(url)
    if not html: return []

    results = []
    
    # Very simple regex to find date patterns like "15.1.2026"
    # and try to associate with nearby Title.
    # This is fragile without a proper DOM parser (BeautifulSoup).
    
    # Regex for "d.m.2026" or "dd.mm.2026"
    date_pattern = r"(\d{1,2}\.\d{1,2}\." + str(YEAR_TO_SCAN) + r")"
    
    # Simple heuristic: Split by block/article and scan matches
    # This is illustrative. Real scraper needs bs4.
    
    return results

def parse_bookbeat_mock(author_name="Sager, Riley"):
    print(f"Scanning BookBeat for {author_name}...")
    # BookBeat uses client-side rendering heavily. 
    # Direct HTML fetching might only get a skeleton.
    # We would likely need to hit their API if it's public, or use Selenium.
    
    # However, for this PROTOTYPE, we will simulate the structure 
    # to show how the data SHOULD be formatted for the app.
    
    # In a real scenario, you'd use:
    # url = f"https://www.bookbeat.fi/haku?q={urllib.parse.quote(author_name)}"
    
    matches = []
    
    # Mock Data to demonstrate functionality
    if "Sager" in author_name:
        matches.append({
            "title": "Talonvahti",
            "author": "Riley Sager",
            "dates": {
                "audiobook": "20.1.2026",
                "ebook": "20.1.2026",
                "print": None # BookBeat usually doesn't show print dates
            }
        })
    elif "Penny" in author_name:
        matches.append({
            "title": "Sokeiden valtakunta",
            "author": "Louise Penny",
            "dates": {
                "audiobook": "15.1.2026",
                "ebook": "15.1.2026"
            }
        })
        
    return matches

def main():
    print(f"Starting date fetch for {YEAR_TO_SCAN}...")
    
    all_dates = {}
    
    authors_to_check = ["Riley Sager", "Louise Penny"]
    
    for author in authors_to_check:
        books = parse_bookbeat_mock(author)
        for b in books:
            # Create a simple key (Title)
            key = b['title'].lower().strip()
            all_dates[key] = b
            print(f"Found: {b['title']} -> {b['dates']}")

    # Save to JSON
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_dates, f, indent=4, ensure_ascii=False)
    
    print(f"\nDone. Saved to {OUTPUT_FILE}")
    print("You can now update your app.js to fetch this JSON and merge it with Finna results.")

if __name__ == "__main__":
    main()
