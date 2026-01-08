import xml.etree.ElementTree as ET
import datetime

def analyze():
    tree = ET.parse('temp_2025.xml')
    root = tree.getroot()
    
    data_by_date = {}
    
    # Parse generic WFS Simple
    # Namespace map might be needed, or ignore namespaces
    for member in root.findall(".//{http://www.opengis.net/wfs/2.0}member"):
        element = member.find(".//{http://xml.fmi.fi/schema/wfs/2.0}BsWfsElement")
        if element is None: continue
        
        time_str = element.find(".//{http://xml.fmi.fi/schema/wfs/2.0}Time").text
        param = element.find(".//{http://xml.fmi.fi/schema/wfs/2.0}ParameterName").text
        value_str = element.find(".//{http://xml.fmi.fi/schema/wfs/2.0}ParameterValue").text
        
        date = time_str.split('T')[0]
        if date not in data_by_date: data_by_date[date] = {'date': date}
        
        try:
            val = float(value_str)
        except:
            val = None
            
        if param == 'snow' or param == 'snow_aws': data_by_date[date]['snow'] = val
        elif param == 'tmin': data_by_date[date]['tmin'] = val
        elif param == 'tmax': data_by_date[date]['tmax'] = val
        elif param == 'rrday': data_by_date[date]['rain'] = val

    days = sorted(data_by_date.values(), key=lambda x: x['date'])
    
    # Stats
    first_snow = None
    min_temp = 100
    min_temp_date = ""
    max_temp = -100
    max_temp_date = ""
    
    max_dry = 0
    current_dry = 0
    
    for floor_day in days:
        d = floor_day.get('date')
        s = floor_day.get('snow')
        tmin = floor_day.get('tmin')
        tmax = floor_day.get('tmax')
        r = floor_day.get('rain')
        
        # First snow (assume after summer? or just first of year?)
        # User defined year starts Jan 1. So first snow is literally first snow of year?
        # A winter year usually spans two periods. But visualization is linear Jan-Dec?
        # Let's assume user means "First snow in the autumn" or just first recorded snow > 0?
        # Usually "Ensilumi" implies the autumn snow. First snow of 2025 Jan is continuation of 2024 winter.
        # So we look for snow > 0 AFTER summer (say, after Aug 1).
        month = int(d.split('-')[1])
        if s is not None and s > 0:
            if month >= 9 and first_snow is None:
                first_snow = d
        
        # Min Temp
        if tmin is not None and tmin < min_temp:
            min_temp = tmin
            min_temp_date = d
            
        # Max Temp
        if tmax is not None and tmax > max_temp:
            max_temp = tmax
            max_temp_date = d
            
        # Dry spell (rain < 0.1) - FMI uses -1 for no rain? or 0? 
        # Usually < 0.1mm is dry. NaN means missing.
        # Let's check typical FMI data. 
        is_dry = False
        if r is not None and r < 0.1: is_dry = True
        elif r is None: pass # Gap
        
        if is_dry:
            current_dry += 1
        else:
            if current_dry > max_dry: max_dry = current_dry
            current_dry = 0
            
    if current_dry > max_dry: max_dry = current_dry
    
    print(f"Vuosi: 2025")
    print(f"Ensilumi (Syksy): {first_snow if first_snow else 'Ei vielä/Tiedossa'}")
    print(f"Alin lämpötila: {min_temp} ({min_temp_date})")
    print(f"Ylin lämpötila: {max_temp} ({max_temp_date})")
    print(f"Pisin sateeton jakso: {max_dry} päivää")

analyze()
