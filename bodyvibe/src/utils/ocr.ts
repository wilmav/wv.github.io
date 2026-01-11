import TextRecognition from '@react-native-ml-kit/text-recognition';

export const recognizeText = async (imageUri: string) => {
    try {
        const result = await TextRecognition.recognize(imageUri);
        return result.text;
    } catch (error) {
        console.error('OCR Error:', error);
        throw new Error('Tekstintunnistus epäonnistui. Tarkista kuva ja yritä uudelleen.');
    }
};

export const parseInBodyData = (text: string) => {
    const data: any = {};

    // 1. "Body Composition Analysis" Block Strategy
    // The top section often lists 4 values with ranges in a specific order:
    // Water -> Protein -> Minerals -> Fat Mass
    // Pattern: Value (e.g. 37,6) followed optionally by Range (e.g. (32,0-39,2))

    // Regex finds a number, optionally followed by newlines/spaces, then a parenthesized range
    const compositionItemRegex = /(\d+[.,]\d{1,2})(?:\s*\n?\s*\(\d+[.,]\d+\s*-\s*\d+[.,]\d+\))?/gm;

    // We look for a sequence of 4 of these matches after "Kehon koostumuksen" or "Body Composition"
    // Since we ignore the header for the global match, we just find all such patterns.
    // If we find a cluster of 4 close to the start or after "Arvot", it's likely our data.

    const matches = Array.from(text.matchAll(compositionItemRegex));
    const values = matches.map(m => parseFloat(m[1].replace(',', '.')));

    // Heuristic: If we find 4 values close together at the start (often indices 0-3), assume they are the main 4.
    // However, text might contain ID/Height/Age numbers first.
    // Usually these 4 values are physically close.

    // Let's try standard Label search first.

    const findValue = (labels: string[], requireDecimal: boolean = true) => {
        // Create a pattern that allows for hyphens and newlines within the label
        // e.g. "Luustolihas" -> "Luustolihas(?:-?\s*\n?\s*)?massa" if we wanted to be specific,
        // but easier to just match the start of the word if it's unique enough.
        // Or we can join the label parts in the regex.

        const labelPatterns = labels.map(label => {
            // Escape special regex chars except we want to allow modification for known splits
            if (label === 'Luustolihasmassa') {
                return 'Luustolihas(?:-|\\s)*massa';
            }
            return label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        });

        const labelPattern = labelPatterns.join('|');
        const numberPattern = requireDecimal ? '\\d+[.,]\\d{1,2}' : '\\d+';

        const regex = new RegExp(`(?:${labelPattern})[\\s\\S]{0,300}?\\b(${numberPattern})\\b`, 'i');
        const match = text.match(regex);
        return match ? parseFloat(match[1].replace(',', '.')) : undefined;
    };

    // Most body composition metrics have decimals
    data.weight = findValue(['Paino', 'Weight', 'Body Weight'], true);
    // Add "Luustolihas" as a standalone fallback too, in case "massa" is too far
    data.muscleMass = findValue(['Luustolihasmassa', 'Lihasmassa', 'Skeletal Muscle Mass', 'SMM', 'Lihastolihasmassa', 'Luustolihas'], true);
    data.bodyFatMass = findValue(['Rasvamassa', 'Body Fat Mass', 'BFM'], true);
    data.bodyFatPercent = findValue(['Rasvaprosentti', 'Percent Body Fat', 'PBF'], true);
    data.bmi = findValue(['Painoindeksi', 'BMI'], true);
    data.totalBodyWater = findValue(['Nestemäärä', 'Total Body Water', 'TBW', 'Kehon vesi'], true);
    data.proteins = findValue(['Proteiinit', 'Proteins', 'Proteiini'], true);
    data.minerals = findValue(['Mineraalit', 'Minerals'], true);
    data.waistHipRatio = findValue(['Vyötärö-lantiosuhde', 'Waist-Hip Ratio', 'WHR'], true);
    data.visceralFat = findValue(['Viskeraalirasva', 'Visceral Fat Level', 'VFL'], false);
    data.bmr = findValue(['Perusaineenvaihdunta', 'Basal Metabolic Rate', 'BMR'], false);

    // 4. POWER STRATEGY: Look for "Value (Min-Max)" pattern.
    // InBody sheets almost ALWAYS have this format for the 4 main components.
    // We allow spaces inside the number: "37, 6"
    // Regex: Capture (Digits, dots, commas, spaces) -> Space/Newline -> (Range)
    const rangeRegex = /([0-9]+[.,][0-9\s]+)\s*[\r\n]*\s*\(\s*\d+[.,]\d+\s*-\s*\d+[.,]\d+\s*\)/gm;
    const rangeMatches = Array.from(text.matchAll(rangeRegex));
    const rangeValues = rangeMatches.map(m => {
        // Remove spaces and replace comma
        const clean = m[1].replace(/\s/g, '').replace(',', '.');
        return parseFloat(clean);
    });

    console.log('Range matches found:', rangeValues);

    // If we found at least 4 values with ranges, they are almost certainly:
    // 1. Total Body Water  (approx 20-60)
    // 2. Protein           (approx 6-15)
    // 3. Minerals          (approx 2-6)
    // 4. Body Fat Mass     (approx 5-60)

    if (rangeValues.length >= 4) {
        // Filter by sane ranges to be sure
        const [v1, v2, v3, v4] = rangeValues;

        if (v1 > 20 && v1 < 80 &&  // Water
            v2 > 5 && v2 < 30 &&   // Protein
            v3 > 1 && v3 < 10 &&   // Minerals
            v4 > 2 && v4 < 100) {  // Fat Mass

            console.log('Successfully identified components via Range Pattern!');
            if (!data.totalBodyWater) data.totalBodyWater = v1;
            if (!data.proteins) data.proteins = v2;
            if (!data.minerals) data.minerals = v3;
            if (!data.bodyFatMass) data.bodyFatMass = v4;

            // Calculate Weight if missing
            if (!data.weight) {
                const calcWeight = v1 + v2 + v3 + v4;
                data.weight = Math.round(calcWeight * 10) / 10;
                console.log('Calculated Weight from Range Pattern:', data.weight);
            }
        }
    }

    // Recalculate Fat % if we have Weight and Fat Mass now
    if (!data.bodyFatPercent && data.weight && data.bodyFatMass) {
        const calculatedFatPercent = (data.bodyFatMass / data.weight) * 100;
        data.bodyFatPercent = Math.round(calculatedFatPercent * 10) / 10;
    }

    // Try to find SMM again using the same logic if possible?
    // SMM usually sits alone without a range in some charts, OR it has a range.
    // If it has a range, it would be the SECOND one in "Muscle-Fat Analysis" usually.
    // But "Body Composition Analysis" (the top block) is where we got the 4 values above.
    // "Muscle-Fat Analysis" has: Weight, SMM, Fat Mass.
    // If Muscle Mass is missing, Soft Lean Mass = Water + Protein.
    // Skeletal Muscle Mass is lower, approx 50-60% of weight?
    // But often Soft Lean Mass (Lihasmassa in some contexts) is distinct from SMM (Luustolihasmassa).
    // User wants "some data". If SMM is totally missing, SLM is a decent proxy for "Lean Mass".

    if (!data.muscleMass && data.softLeanMass) {
        console.log('Using Soft Lean Mass as fallback for Muscle Mass');
        data.muscleMass = data.softLeanMass;
    }
    if (rangeValues.length >= 6) {
        // Tentatively look for SMM in later matches
        // It should be roughly 20-50kg
        for (let i = 4; i < rangeValues.length; i++) {
            const val = rangeValues[i];
            if (val > 15 && val < 60 && !data.muscleMass) {
                // If it's NOT the same as Fat Mass (v4) or Weight
                // It's a good candidate for SMM
                if (Math.abs(val - (data.bodyFatMass || 0)) > 1 && Math.abs(val - (data.weight || 0)) > 1) {
                    data.muscleMass = val;
                    console.log('Inferred Muscle Mass from ranges:', val);
                    break;
                }
            }
        }
    }

    // 5. DIRTY FALLBACK (The "At least try something" strategy)
    if (!data.weight || !data.muscleMass || !data.bodyFatMass) {
        console.log('Using Dirty Fallback Strategy');

        // Find ALL numbers that look like decimals, allowing for spaces (e.g. "25, 5")
        // Match 1-3 digits, then a separator, then optional space, then 1-2 digits
        const anyNumberRegex = /\b\d{1,3}[.,][\s]*\d{1,2}\b/g;

        const allNumbers = Array.from(text.matchAll(anyNumberRegex))
            .map(m => parseFloat(m[0].replace(',', '.').replace(/\s/g, '')));

        // Also just look for integers if we are desperate? 
        // No, weight/muscle usually have decimals.
        // But maybe "25" is found as integer.

        console.log('Dirty Fallback found numbers:', allNumbers);

        // Filter for unique values to avoid duplicates
        const uniqueNumbers = [...new Set(allNumbers)];

        // Simple Heuristics based on typical human ranges:

        // Weight: 40 - 150 kg
        if (!data.weight) {
            const weights = uniqueNumbers.filter(n => n > 40 && n < 150);
            // Pick the largest one? Or the one that appears first?
            // Usually Weight is a prominent number. Let's pick the one distinct from others.
            // If we have "Target Weight" it might be there too. 
            // Let's just pick the first reasonable one found.
            if (weights.length > 0) data.weight = weights[0];
        }

        // Muscle Mass: 20 - 60 kg (usually roughly 40-70% of weight)
        if (!data.muscleMass) {
            const muscles = uniqueNumbers.filter(n => n > 20 && n < 60);
            // Filter out the weight we just found
            const candidates = muscles.filter(n => Math.abs(n - (data.weight || 0)) > 2);
            if (candidates.length > 0) data.muscleMass = candidates[0];
        }

        // Fat Mass: 4 - 60 kg
        if (!data.bodyFatMass) {
            const fats = uniqueNumbers.filter(n => n > 4 && n < 60);
            // Filter out weight and muscle
            const candidates = fats.filter(n =>
                Math.abs(n - (data.weight || 0)) > 2 &&
                Math.abs(n - (data.muscleMass || 0)) > 1
            );
            if (candidates.length > 0) data.bodyFatMass = candidates[0];
        }

        // Fat Percent: 5 - 50 %
        if (!data.bodyFatPercent) {
            const percents = uniqueNumbers.filter(n => n > 5 && n < 55);
            // Verify it matches Weight/FatMass calculation if possible?
            // Or just pick one that looks like a percentage (often has % sign nearby in text, but here we just have numbers)
            // If we found Fat Mass and Weight, calculate it instead.
            if (data.weight && data.bodyFatMass) {
                data.bodyFatPercent = Math.round((data.bodyFatMass / data.weight) * 1000) / 10;
            } else if (percents.length > 0) {
                // Risky, but better than nothing?
                // data.bodyFatPercent = percents[0];
            }
        }
    }

    console.log('Final Parsed Data:', data);
    return data;
};
