import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('bodyvibe.db');

export const initDatabase = () => {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS measurements (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      weight REAL NOT NULL,
      muscleMass REAL,
      bodyFatMass REAL,
      bodyFatPercent REAL,
      visceralFat INTEGER,
      bmi REAL,
      bmr REAL,
      totalBodyWater REAL,
      proteins REAL,
      minerals REAL,
      waistHipRatio REAL,
      rawImageUri TEXT
    );
    CREATE TABLE IF NOT EXISTS weight_entries (
      id TEXT PRIMARY KEY NOT NULL,
      date TEXT NOT NULL,
      weight REAL NOT NULL,
      note TEXT
    );
  `);
};

export const dbInstance = db;
