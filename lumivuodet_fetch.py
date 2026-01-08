import requests
import json
import os
from datetime import datetime
import xml.etree.ElementTree as ET

# Configuration
# FMISID for stations:
# Helsinki Kaisaniemi: 100971
# Jyväskylä lentoasema: 101339
# Sodankylä Tähtelä: 101932
STATIONS = {
    "helsinki": 100971,
    "jyvaskyla": 101339,
    "sodankyla": 101932
}

# Fetch data from 2000 to current year
YEARS = list(range(2000, 2026))
DATA_DIR = "data"

def fetch_fmi_data(fmisid, year):
    """
    Fetch daily weather data from FMI for a specific year and station.
    We fetch the whole year Jan-Dec.
    """
    start_time = f"{year}-01-01T00:00:00Z"
    end_time = f"{year}-12-31T23:59:59Z"
    
    # query: fmi::observations::weather::daily::simple
    # params: snow_aws, tday, tmin, tmax
    url = "https://opendata.fmi.fi/wfs"
    params = {
        "service": "WFS",
        "version": "2.0.0",
        "request": "GetFeature",
        "storedquery_id": "fmi::observations::weather::daily::simple",
        "fmisid": fmisid,
        "starttime": start_time,
        "endtime": end_time,
        "parameters": "snow,tday,tmin,tmax,rrday"
    }

    print(f"Fetching data for {fmisid} year {year}...")
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        return parse_fmi_xml(response.content)
    except Exception as e:
        print(f"Error fetching data: {e}")
        return []

def parse_fmi_xml(xml_content):
    """
    Parse the WFS Simple Feature XML.
    Returns a list of daily objects: { date, snow, temp_avg, temp_min, temp_max }
    """
    # Namespaces usually present in FMI responses
    # But FMI Simple format is... simple. 
    # Let's inspect structure simply.
    
    # Structure is roughly:
    # <wfs:member>
    #   <BsWfs:BsWfsElement>
    #     <BsWfs:Time>...</BsWfs:Time>
    #     <BsWfs:ParameterName>...</BsWfs:ParameterName>
    #     <BsWfs:ParameterValue>...</BsWfs:ParameterValue>
    #   </BsWfs:BsWfsElement>
    # </wfs:member>
    
    root = ET.fromstring(xml_content)
    
    # We need to map namespaces or just ignore them by stripping
    # For simplicity in this script, we'll try to find elements by tag name suffix
    
    data_by_date = {} # date_str -> { snow: null, tday: null ... }
    
    for member in root.findall(".//{http://www.opengis.net/wfs/2.0}member"):
        element = member.find(".//{http://xml.fmi.fi/schema/wfs/2.0}BsWfsElement")
        if element is None:
            continue
            
        time_str = element.find(".//{http://xml.fmi.fi/schema/wfs/2.0}Time").text
        param_name = element.find(".//{http://xml.fmi.fi/schema/wfs/2.0}ParameterName").text
        param_value = element.find(".//{http://xml.fmi.fi/schema/wfs/2.0}ParameterValue").text
        
        # Clean date (YYYY-MM-DD)
        date_key = time_str.split('T')[0]
        
        if date_key not in data_by_date:
            data_by_date[date_key] = {"date": date_key}
            
        # Parse value (NaN is possible)
        val = None
        try:
            val = float(param_value)
        except (ValueError, TypeError):
            val = None
            
        if param_name == "snow" or param_name == "snow_aws":
            data_by_date[date_key]["snowDepth"] = val if val is not None and val >= 0 else 0
        elif param_name == "tday":
            data_by_date[date_key]["tempMean"] = val
        elif param_name == "tmin":
            data_by_date[date_key]["tempMin"] = val
        elif param_name == "tmax":
            data_by_date[date_key]["tempMax"] = val
        elif param_name == "rrday":
            data_by_date[date_key]["precipitation"] = val if val is not None and val >= 0 else 0

    # Convert to list sorted by date
    result = sorted(data_by_date.values(), key=lambda x: x['date'])
    return result

def ensure_dir(directory):
    if not os.path.exists(directory):
        os.makedirs(directory)

def main():
    ensure_dir(DATA_DIR)
    
    # Meta index
    stations_meta = []
    
    for station_name, fmisid in STATIONS.items():
        stations_meta.append({"id": station_name, "fmisid": fmisid})
        
        station_data = {}
        for year in YEARS:
            days = fetch_fmi_data(fmisid, year)
            if days:
                station_data[year] = days
        
        # Save per station JSON
        outfile = os.path.join(DATA_DIR, f"{station_name}.json")
        with open(outfile, 'w', encoding='utf-8') as f:
            json.dump(station_data, f, indent=2)
            print(f"Saved {outfile}")

    # Save stations meta
    with open(os.path.join(DATA_DIR, "stations.json"), 'w', encoding='utf-8') as f:
        json.dump(stations_meta, f, indent=2)

if __name__ == "__main__":
    main()
