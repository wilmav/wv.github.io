import { create } from 'zustand';
import { dbInstance } from './database';
import { InBodyMeasurement, WeightEntry } from '../types';

interface BodyVibeState {
    measurements: InBodyMeasurement[];
    weightEntries: WeightEntry[];
    isLoading: boolean;
    loadData: () => void;
    addMeasurement: (measurement: InBodyMeasurement) => void;
    addWeightEntry: (entry: WeightEntry) => void;
    deleteMeasurement: (id: string) => void;
}

export const useStore = create<BodyVibeState>((set) => ({
    measurements: [],
    weightEntries: [],
    isLoading: false,

    loadData: () => {
        set({ isLoading: true });
        try {
            const measurements = dbInstance.getAllSync<InBodyMeasurement>(
                'SELECT * FROM measurements ORDER BY date DESC'
            );
            const weightEntries = dbInstance.getAllSync<WeightEntry>(
                'SELECT * FROM weight_entries ORDER BY date DESC'
            );
            set({ measurements, weightEntries, isLoading: false });
        } catch (error) {
            console.error('Failed to load data:', error);
            set({ isLoading: false });
        }
    },

    addMeasurement: (measurement) => {
        try {
            dbInstance.runSync(
                'INSERT INTO measurements (id, date, weight, muscleMass, bodyFatMass, bodyFatPercent, visceralFat, bmi, bmr, totalBodyWater, proteins, minerals, waistHipRatio, rawImageUri) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    measurement.id,
                    measurement.date,
                    measurement.weight,
                    measurement.muscleMass,
                    measurement.bodyFatMass || null,
                    measurement.bodyFatPercent,
                    measurement.visceralFat,
                    measurement.bmi || null,
                    measurement.bmr || null,
                    measurement.totalBodyWater || null,
                    measurement.proteins || null,
                    measurement.minerals || null,
                    measurement.waistHipRatio || null,
                    measurement.rawImageUri || null
                ]
            );
            set((state) => ({
                measurements: [measurement, ...state.measurements].sort((a, b) => b.date.localeCompare(a.date))
            }));
        } catch (error) {
            console.error('Failed to add measurement:', error);
        }
    },

    addWeightEntry: (entry) => {
        try {
            dbInstance.runSync(
                'INSERT INTO weight_entries (id, date, weight, note) VALUES (?, ?, ?, ?)',
                [entry.id, entry.date, entry.weight, entry.note || null]
            );
            set((state) => ({
                weightEntries: [entry, ...state.weightEntries].sort((a, b) => b.date.localeCompare(a.date))
            }));
        } catch (error) {
            console.error('Failed to add weight entry:', error);
        }
    },

    deleteMeasurement: (id) => {
        try {
            dbInstance.runSync('DELETE FROM measurements WHERE id = ?', [id]);
            set((state) => ({
                measurements: state.measurements.filter((m) => m.id !== id)
            }));
        } catch (error) {
            console.error('Failed to delete measurement:', error);
        }
    },
}));
