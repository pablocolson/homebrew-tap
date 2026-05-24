import { create } from 'zustand';
import * as SQLite from 'expo-sqlite';
import { Boat, BoatType, EngineType } from '../types';
import { v4 as uuid } from 'uuid';

interface BoatState {
  boats: Boat[];
  selectedBoat: Boat | null;
  loading: boolean;
  init: () => Promise<void>;
  add: (data: Omit<Boat, 'id' | 'isDefault'>) => Promise<Boat>;
  update: (id: string, data: Partial<Omit<Boat, 'id'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setDefault: (id: string) => Promise<void>;
}

let db: SQLite.SQLiteDatabase;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('helmchart.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS boats (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        lengthMeters REAL NOT NULL,
        beamMeters REAL NOT NULL DEFAULT 0,
        draftMeters REAL NOT NULL DEFAULT 0,
        engineType TEXT NOT NULL,
        enginePowerHp REAL NOT NULL DEFAULT 0,
        fuelTankLiters REAL NOT NULL,
        cruisingSpeedKnots REAL NOT NULL,
        maxSpeedKnots REAL NOT NULL DEFAULT 0,
        consumptionLitersPerHour REAL NOT NULL,
        photo TEXT,
        isDefault INTEGER NOT NULL DEFAULT 0
      );
    `);
  }
  return db;
}

export const useBoatStore = create<BoatState>((set, get) => ({
  boats: [],
  selectedBoat: null,
  loading: true,

  init: async () => {
    const database = await getDb();
    const rows = await database.getAllAsync<Boat>('SELECT * FROM boats ORDER BY name');
    const boats = rows.map((r) => ({ ...r, isDefault: Boolean(r.isDefault) }));
    const selectedBoat = boats.find((b) => b.isDefault) ?? boats[0] ?? null;
    set({ boats, selectedBoat, loading: false });
  },

  add: async (data) => {
    const database = await getDb();
    const boat: Boat = { ...data, id: uuid(), isDefault: false };
    const isFirst = get().boats.length === 0;
    if (isFirst) boat.isDefault = true;

    await database.runAsync(
      `INSERT INTO boats (id, name, type, lengthMeters, beamMeters, draftMeters, engineType, enginePowerHp, fuelTankLiters, cruisingSpeedKnots, maxSpeedKnots, consumptionLitersPerHour, photo, isDefault)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [boat.id, boat.name, boat.type, boat.lengthMeters, boat.beamMeters, boat.draftMeters, boat.engineType, boat.enginePowerHp, boat.fuelTankLiters, boat.cruisingSpeedKnots, boat.maxSpeedKnots, boat.consumptionLitersPerHour, boat.photo ?? null, boat.isDefault ? 1 : 0]
    );
    const boats = [...get().boats, boat];
    set({ boats, selectedBoat: boat.isDefault ? boat : get().selectedBoat });
    return boat;
  },

  update: async (id, data) => {
    const database = await getDb();
    const boat = get().boats.find((b) => b.id === id);
    if (!boat) return;

    const updated = { ...boat, ...data };
    await database.runAsync(
      `UPDATE boats SET name=?, type=?, lengthMeters=?, beamMeters=?, draftMeters=?, engineType=?, enginePowerHp=?, fuelTankLiters=?, cruisingSpeedKnots=?, maxSpeedKnots=?, consumptionLitersPerHour=?, photo=?, isDefault=? WHERE id=?`,
      [updated.name, updated.type, updated.lengthMeters, updated.beamMeters, updated.draftMeters, updated.engineType, updated.enginePowerHp, updated.fuelTankLiters, updated.cruisingSpeedKnots, updated.maxSpeedKnots, updated.consumptionLitersPerHour, updated.photo ?? null, updated.isDefault ? 1 : 0, id]
    );
    const boats = get().boats.map((b) => (b.id === id ? updated : b));
    set({ boats, selectedBoat: updated.isDefault ? updated : get().selectedBoat });
  },

  remove: async (id) => {
    const database = await getDb();
    await database.runAsync('DELETE FROM boats WHERE id=?', [id]);
    const boats = get().boats.filter((b) => b.id !== id);
    const selectedBoat = get().selectedBoat?.id === id
      ? boats.find((b) => b.isDefault) ?? boats[0] ?? null
      : get().selectedBoat;
    set({ boats, selectedBoat });
  },

  setDefault: async (id) => {
    const database = await getDb();
    await database.execAsync('UPDATE boats SET isDefault = 0');
    await database.runAsync('UPDATE boats SET isDefault = 1 WHERE id = ?', [id]);
    const boats = get().boats.map((b) => ({ ...b, isDefault: b.id === id }));
    const selectedBoat = boats.find((b) => b.id === id) ?? null;
    set({ boats, selectedBoat });
  },
}));
