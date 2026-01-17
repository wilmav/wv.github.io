import xml.etree.ElementTree as ET
import re

def process_kotus():
    tree = ET.parse('data/kotus_sanalista.xml')
    root = tree.getroot()
    
    valid_words = set()
    
    # Iterate over <st> elements
    for st in root.findall('st'):
        s_tag = st.find('s')
        if s_tag is not None:
            word = s_tag.text
            if not word: continue
            
            # Filter Logic
            # 1. Length 2-13
            if not (2 <= len(word) <= 13):
                continue
                
            # 2. No hyphens or spaces (Keep simple words)
            if '-' in word or ' ' in word:
                continue
            
            # 3. Uppercase conversion
            word_upper = word.upper()
            
            # 4. Character check (Finish alphabet only)
            if not re.match(r'^[A-ZÅÄÖ]+$', word_upper):
                continue
            
            valid_words.add(word_upper)
            
    # Output to file
    with open('data/filtered_words.txt', 'w', encoding='utf-8') as f:
        for w in sorted(list(valid_words)):
            f.write(w + '\n')
            
    print(f"Processed {len(valid_words)} valid words.")

if __name__ == "__main__":
    process_kotus()
