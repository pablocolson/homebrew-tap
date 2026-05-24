import { create } from 'zustand';
import * as SQLite from 'expo-sqlite';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Coordinates } from '../types';
import { v4 as uuid } from 'uuid';

const LOCATION_TASK = 'helmchart-track-location';

export interface TrackPoint {
  latitude: number;
  longitude: number;
  timestamp: number;
  speed: number | null;
  heading: number | null;
}

export interface Track {
  id: string;
  name: string;
  color: string;
  startedAt: number;
  endedAt: number | null;
  pointCount: number;
  distanceNm: number;
  isRecording: boolean;
}

interface TrackState {
  tracks: Track[];
  activeTrackId: string | null;
  activePoints: TrackPoint[];
  loading: boolean;
  init: () => Promise<void>;
  startRecording: (name?: string) => Promise<void>;
  stopRecording: () => Promise<void>;
  addPoint: (point: TrackPoint) => Promise<void>;
  deleteTrack: (id: string) => Promise<void>;
  renameTrack: (id: string, name: string) => Promise<void>;
  getTrackPoints: (id: string) => Promise<TrackPoint[]>;
}

let db: SQLite.SQLiteDatabase;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('helmchart.db');
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS tracks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#FF6B35',
        startedAt INTEGER NOT NULL,
        endedAt INTEGER,
        pointCount INTEGER NOT NULL DEFAULT 0,
        distanceNm REAL NOT NULL DEFAULT 0,
        isRecording INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS track_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trackId TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        speed REAL,
        heading REAL,
        FOREIGN KEY (trackId) REFERENCES tracks(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_track_points_trackId ON track_points(trackId);
    `);
  }
  return db;
}

const TRACK_COLORS = ['#FF6B35', '#E91E63', '#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#00BCD4', '#FF5722'];

function haversineNm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const R = 3440.065;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export const useTrackStore = create<TrackState>((set, get) => ({
  tracks: [],
  activeTrackId: null,
  activePoints: [],
  loading: true,

  init: async () => {
    const database = await getDb();
    const rows = await database.getAllAsync<Track>('SELECT * FROM tracks ORDER BY startedAt DESC');
    const tracks = rows.map((r) => ({ ...r, isRecording: Boolean(r.isRecording) }));
    const activeTrack = tracks.find((t) => t.isRecording);

    let activePoints: TrackPoint[] = [];
    if (activeTrack) {
      activePoints = await database.getAllAsync<TrackPoint>(
        'SELECT latitude, longitude, timestamp, speed, heading FROM track_points WHERE trackId = ? ORDER BY timestamp',
        [activeTrack.id]
      );
    }

    set({ tracks, activeTrackId: activeTrack?.id ?? null, activePoints, loading: false });
  },

  startRecording: async (name) => {
    const database = await getDb();
    const id = uuid();
    const now = Date.now();
    const color = TRACK_COLORS[get().tracks.length % TRACK_COLORS.length];
    const trackName = name || `Trace ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;

    const track: Track = {
      id,
      name: trackName,
      color,
      startedAt: now,
      endedAt: null,
      pointCount: 0,
      distanceNm: 0,
      isRecording: true,
    };

    await database.runAsync(
      'INSERT INTO tracks (id, name, color, startedAt, endedAt, pointCount, distanceNm, isRecording) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [track.id, track.name, track.color, track.startedAt, null, 0, 0, 1]
    );

    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status === 'granted') {
      await Location.startLocationUpdatesAsync(LOCATION_TASK, {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 10,
        timeInterval: 5000,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'HelmChart - Enregistrement',
          notificationBody: `Trace en cours : ${trackName}`,
        },
      });
    }

    set({ activeTrackId: id, activePoints: [], tracks: [track, ...get().tracks] });
  },

  stopRecording: async () => {
    const { activeTrackId } = get();
    if (!activeTrackId) return;

    const database = await getDb();
    const now = Date.now();

    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    } catch {}

    await database.runAsync(
      'UPDATE tracks SET endedAt = ?, isRecording = 0 WHERE id = ?',
      [now, activeTrackId]
    );

    const tracks = get().tracks.map((t) =>
      t.id === activeTrackId ? { ...t, endedAt: now, isRecording: false } : t
    );

    set({ activeTrackId: null, tracks });
  },

  addPoint: async (point) => {
    const { activeTrackId, activePoints } = get();
    if (!activeTrackId) return;

    const database = await getDb();
    await database.runAsync(
      'INSERT INTO track_points (trackId, latitude, longitude, timestamp, speed, heading) VALUES (?, ?, ?, ?, ?, ?)',
      [activeTrackId, point.latitude, point.longitude, point.timestamp, point.speed, point.heading]
    );

    let addedDistance = 0;
    if (activePoints.length > 0) {
      const lastPoint = activePoints[activePoints.length - 1];
      addedDistance = haversineNm(lastPoint, point);
    }

    const newPoints = [...activePoints, point];
    const track = get().tracks.find((t) => t.id === activeTrackId);
    if (track) {
      const newDistance = track.distanceNm + addedDistance;
      const newCount = track.pointCount + 1;
      await database.runAsync(
        'UPDATE tracks SET pointCount = ?, distanceNm = ? WHERE id = ?',
        [newCount, newDistance, activeTrackId]
      );

      const tracks = get().tracks.map((t) =>
        t.id === activeTrackId ? { ...t, pointCount: newCount, distanceNm: newDistance } : t
      );
      set({ activePoints: newPoints, tracks });
    } else {
      set({ activePoints: newPoints });
    }
  },

  deleteTrack: async (id) => {
    const database = await getDb();
    await database.runAsync('DELETE FROM track_points WHERE trackId = ?', [id]);
    await database.runAsync('DELETE FROM tracks WHERE id = ?', [id]);
    set({ tracks: get().tracks.filter((t) => t.id !== id) });
  },

  renameTrack: async (id, name) => {
    const database = await getDb();
    await database.runAsync('UPDATE tracks SET name = ? WHERE id = ?', [name, id]);
    set({ tracks: get().tracks.map((t) => (t.id === id ? { ...t, name } : t)) });
  },

  getTrackPoints: async (id) => {
    const database = await getDb();
    return database.getAllAsync<TrackPoint>(
      'SELECT latitude, longitude, timestamp, speed, heading FROM track_points WHERE trackId = ? ORDER BY timestamp',
      [id]
    );
  },
}));

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }: any) => {
  if (error) return;
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const store = useTrackStore.getState();
    for (const loc of locations) {
      await store.addPoint({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        timestamp: loc.timestamp,
        speed: loc.coords.speed,
        heading: loc.coords.heading,
      });
    }
  }
});
