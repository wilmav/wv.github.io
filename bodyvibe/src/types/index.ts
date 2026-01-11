export interface InBodyMeasurement {
    id: string;
    date: string;
    weight: number;
    muscleMass: number;
    bodyFatMass?: number;
    bodyFatPercent: number;
    visceralFat: number;
    bmi?: number;
    bmr?: number;
    totalBodyWater?: number;
    proteins?: number;
    minerals?: number;
    waistHipRatio?: number;
    rawImageUri?: string;
}

export interface WeightEntry {
    id: string;
    date: string;
    weight: number;
    note?: string;
}
