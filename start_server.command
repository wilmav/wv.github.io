#!/bin/bash
cd "$(dirname "$0")"
echo "Starting local server for Lumivuodet..."
echo "Opening http://localhost:8000/lumivuodet.html"
open "http://localhost:8000/lumivuodet.html"
python3 -m http.server 8000
