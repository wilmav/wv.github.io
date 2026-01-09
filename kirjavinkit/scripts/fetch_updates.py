import json
import urllib.request
import urllib.parse
import os
import datetime
from datetime import date

# --- Configuration ---
AUTHORS = [
    "Stephen King",
    "Sofi Oksanen"
]

API_BASE = "https://api.finna.fi/v1/search"

import ssl

def fetch_json(url):
    try:
        # Create unverified context to bypass local SSL certificate issues
        context = ssl._create_unverified_context()
        with urllib.request.urlopen(url, context=context) as response:
            if response.status == 200:
                return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching URL {url}: {e}")
    return None

def fetch_author_books(author_name):
    print(f"Fetching books for: {author_name}...")
    
    # Construct query parameters manually to handle arrays correctly for Finna
    params = urllib.parse.urlencode({
        "lookfor": f'author: "{author_name}"',
        "type": "AllFields",
        "sort": "main_date_str desc",
        "limit": 20
    })
    
    # Add repeated parameters
    params += '&filter[]=format:"0/Book/"'
    params += '&field[]=id&field[]=title&field[]=authors&field[]=year&field[]=summary&field[]=images&field[]=languages&field[]=series'

    url = f"{API_BASE}?{params}"
    
    data = fetch_json(url)
    if data and 'records' in data:
        return data['records']
    return []

def main():
    authors_data = []
    books_data = {}
    current_year = date.today().year
    
    # Data directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(script_dir, '../data')
    
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)

    for author in AUTHORS:
        records = fetch_author_books(author)
        
        # Filter for "New" releases (Current year or last 2 years)
        new_books = []
        for book in records:
            try:
                # Year can be "2024" or "[2024]" or "2024." etc.
                y_str = ''.join(filter(str.isdigit, str(book.get('year', '0'))))
                if not y_str: continue
                
                # Take first 4 digits if multiple
                if len(y_str) > 4: y_str = y_str[:4]
                
                y = int(y_str)
                if y >= (current_year - 2):
                    new_books.append(book)
            except ValueError:
                continue

        latest_book_ids = [b['id'] for b in new_books]
        
        # Use first book's image as sample if available
        sample_cover = None
        if new_books and 'images' in new_books[0] and new_books[0]['images']:
             sample_cover = f"https://api.finna.fi{new_books[0]['images'][0]}"

        authors_data.append({
            "name": author,
            "latest_books": latest_book_ids,
            "sample_cover": sample_cover
        })

        for book in new_books:
            b_id = book['id']
            # Get primary author key
            # API structure: authors -> primary -> { "Name": {role...} }
            author_key = author # Fallback
            authors_obj = book.get('authors', {})
            if 'primary' in authors_obj:
                 primary_authors = list(authors_obj['primary'].keys())
                 if primary_authors:
                     author_key = primary_authors[0]
            
            # Series handling
            series_info = None
            if book.get('series'):
                # Finna series can be complex.
                # Sometimes it is a string "Name ; Number", sometimes a dict within the list.
                try:
                    s_raw = book.get('series')[0] 
                    if isinstance(s_raw, str):
                        parts = s_raw.split(';')
                        series_name = parts[0].strip()
                        series_num = parts[1].strip() if len(parts) > 1 else None
                        series_info = {"name": series_name, "number": series_num}
                    elif isinstance(s_raw, dict):
                        # Handle dict structure if needed (e.g. {'name': '...'})
                        series_name = s_raw.get('name', 'Unknown')
                        series_num = s_raw.get('number', None)
                        series_info = {"name": series_name, "number": series_num}
                except Exception as e:
                    print(f"Warning: Could not parse series for {b_id}: {e}")

            books_data[b_id] = {
                "id": b_id,
                "title": book.get('title'),
                "author": author_key,
                "year": book.get('year'),
                "description": book.get('summary'),
                "image": f"https://api.finna.fi{book['images'][0]}" if book.get('images') else None,
                "language": book.get('languages'),
                "series": series_info
            }

    # Write files as JS for local file:// compatibility (CORS fix)
    with open(os.path.join(data_dir, 'authors.js'), 'w', encoding='utf-8') as f:
        json_str = json.dumps(authors_data, ensure_ascii=False, indent=2)
        f.write(f"const AUTHORS_DATA = {json_str};")
        
    with open(os.path.join(data_dir, 'books.js'), 'w', encoding='utf-8') as f:
        json_str = json.dumps(books_data, ensure_ascii=False, indent=2)
        f.write(f"const BOOKS_DATA = {json_str};")

    print("✅ Data update complete!")
    print(f"Authors processed: {len(authors_data)}")
    print(f"New Books Found: {len(books_data)}")

if __name__ == "__main__":
    main()
