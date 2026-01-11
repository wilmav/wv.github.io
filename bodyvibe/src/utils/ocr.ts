import Tesseract from 'tesseract.js';

export const recognizeText = async (imageUri: string) => {
    try {
        // Safe check for Worker
        let hasWorker = false;
        try {
            hasWorker = typeof Worker !== 'undefined' && !!Worker;
        } catch (e) {
            // Ignore access errors
        }

        if (!hasWorker) {
            throw new Error('Tekstintunnistus ei onnistu (Worker puuttuu). Syötä tiedot käsin.');
        }

        const result = await Tesseract.recognize(imageUri, 'fin+eng', {
            // Disable logger to avoid console spam
        });
        return result.data.text;
    } catch (error: any) {
        // Do NOT log with console.error to avoid RedBox in Expo Go
        throw new Error(error.message || 'Kuvan luku epäonnistui');
    }
};

export const parseInBodyData = (text: string) => {
    // Simple regex patterns for common InBody fields
    // Note: These need to be refined based on actual InBody sheet layouts
    const patterns = {
        weight: /(?:Paino|Weight|Body Weight)\s*[:=]?\s*(\d+[.,]\d+)/i,
        muscleMass: /(?:Lihasmassa|Skeletal Muscle Mass|SMM)\s*[:=]?\s*(\d+[.,]\d+)/i,
        bodyFatMass: /(?:Rasvamassa|Body Fat Mass|BFM)\s*[:=]?\s*(\d+[.,]\d+)/i,
        bodyFatPercent: /(?:Rasvaprosentti|Percent Body Fat|PBF)\s*[:=]?\s*(\d+[.,]\d+)/i,
        visceralFat: /(?:Viskeraalirasva|Visceral Fat Level|VFL)\s*[:=]?\s*(\d+)/i,
        bmi: /(?:Painoindeksi|BMI)\s*[:=]?\s*(\d+[.,]\d+)/i,
        bmr: /(?:Perusaineenvaihdunta|Basal Metabolic Rate|BMR)\s*[:=]?\s*(\d+)/i,
        totalBodyWater: /(?:Nestemäärä|Total Body Water|TBW)\s*[:=]?\s*(\d+[.,]\d+)/i,
        proteins: /(?:Proteiinit|Proteins)\s*[:=]?\s*(\d+[.,]\d+)/i,
        minerals: /(?:Mineraalit|Minerals)\s*[:=]?\s*(\d+[.,]\d+)/i,
        waistHipRatio: /(?:Vyötärö-lantiosuhde|Waist-Hip Ratio|WHR)\s*[:=]?\s*(\d+[.,]\d+)/i,
    };

    const data: any = {};
    for (const [key, pattern] of Object.entries(patterns)) {
        const match = text.match(pattern);
        if (match) {
            data[key] = parseFloat(match[1].replace(',', '.'));
        }
    }

    return data;
};
