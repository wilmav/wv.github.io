import urllib.request
import urllib.parse
import json

def fetch_json(url):
    try:
        with urllib.request.urlopen(url) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return {}

def clean_author_name(author):
    if author and ',' in author:
        parts = author.split(',')
        if len(parts) == 2:
            return f"{parts[1].strip()} {parts[0].strip()}"
    return author

def test_book(title, raw_author):
    print(f"\n--- TESTING: {title} ---")
    print(f"Raw Author: {raw_author}")
    clean = clean_author_name(raw_author)
    print(f"Clean Author: {clean}")

    # 1. Google Cover Search (Strategy B logic)
    q = f"intitle:{urllib.parse.quote(title)}+inauthor:{urllib.parse.quote(clean)}"
    url = f"https://www.googleapis.com/books/v1/volumes?q={q}&maxResults=1"
    
    print("Fetching Google Cover (Strategy B)...")
    data = fetch_json(url)
    
    if data.get('items'):
        info = data['items'][0].get('volumeInfo', {})
        print("[SUCCESS] Found Google Book!")
        print(f"  Title: {info.get('title')}")
        print(f"  Authors: {', '.join(info.get('authors', []))}")
        print(f"  ImageLinks: {'YES' if info.get('imageLinks') else 'NO'}")
        print(f"  ISBN: {json.dumps(info.get('industryIdentifiers', []))}")
    else:
        print("[FAILURE] No results found from Google with clean author.")
        
        # Try loose
        print("Retrying Loose Search...")
        q_loose = f"{urllib.parse.quote(title)}+{urllib.parse.quote(clean)}"
        url_loose = f"https://www.googleapis.com/books/v1/volumes?q={q_loose}&maxResults=1"
        data_loose = fetch_json(url_loose)
        if data_loose.get('items'):
             print("[SUCCESS] Found via Loose Search!")
             print(f"  Title: {data_loose['items'][0]['volumeInfo'].get('title')}")
        else:
             print("[FAILURE] Loose search also failed.")

def run():
    test_book("Talonvahti", "Sager, Riley")
    test_book("Sokeiden valtakunta", "Penny, Louise")
    test_book("Mestaritontun seikkailut", "Kunnas, Mauri")

if __name__ == "__main__":
    run()
