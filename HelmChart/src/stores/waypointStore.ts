import { create } from 'zustand';
import * as SQLite from 'expo-sqlite';
import { Waypoint, WaypointIcon, Coordinates } from '../types';
import { v4 as uuid } from 'uuid';

interface WaypointState {
  waypoints: Waypoint[];
  loading: boolean;
  init: () => Promise<void>;
  add: (name: string, coordinates: Coordinates, icon?: WaypointIcon, color?: string, notes?: string) => Promise<Waypoint>;
  update: (id: string, data: Partial<Omit<Waypoint, 'id' | 'createdAt'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

let db: SQLite.SQLiteDatabase;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('helmchart.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS waypoints (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        icon TEXT NOT NULL DEFAULT 'marker',
        color TEXT NOT NULL DEFAULT '#FF5722',
        notes TEXT NOT NULL DEFAULT '',
        createdAt INTEGER NOT NULL
      );
    `);
  }
  return db;
}

export const useWaypointStore = create<WaypointState>((set, get) => ({
  waypoints: [],
  loading: true,

  init: async () => {
    const database = await getDb();
    const rows = await database.getAllAsync<Waypoint & { latitude: number; longitude: number }>(
      'SELECT * FROM waypoints ORDER BY createdAt DESC'
    );
    const waypoints: Waypoint[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      coordinates: { latitude: r.latitude, longitude: r.longitude },
      icon: r.icon as WaypointIcon,
      color: r.color,
      notes: r.notes,
      createdAt: r.createdAt,
    }));
    set({ waypoints, loading: false });
  },

  add: async (name, coordinates, icon = 'marker', color = '#FF5722', notes = '') => {
    const database = await getDb();
    const wp: Waypoint = {
      id: uuid(),
      name,
      coordinates,
      icon,
      color,
      notes,
      createdAt: Date.now(),
    };
    await database.runAsync(
      'INSERT INTO waypoints (id, name, latitude, longitude, icon, color, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [wp.id, wp.name, wp.coordinates.latitude, wp.coordinates.longitude, wp.icon, wp.color, wp.notes, wp.createdAt]
    );
    set({ waypoints: [wp, ...get().waypoints] });
    return wp;
  },

  update: async (id, data) => {
    const database = await getDb();
    const wp = get().waypoints.find((w) => w.id === id);
    if (!wp) return;

    const updated = { ...wp, ...data };
    if (data.coordinates) {
      updated.coordinates = data.coordinates;
    }
    await database.runAsync(
      'UPDATE waypoints SET name=?, latitude=?, longitude=?, icon=?, color=?, notes=? WHERE id=?',
      [updated.name, updated.coordinates.latitude, updated.coordinates.longitude, updated.icon, updated.color, updated.notes, id]
    );
    set({ waypoints: get().waypoints.map((w) => (w.id === id ? updated : w)) });
  },

  remove: async (id) => {
    const database = await getDb();
    await database.runAsync('DELETE FROM waypoints WHERE id=?', [id]);
    set({ waypoints: get().waypoints.filter((w) => w.id !== id) });
  },
}));
