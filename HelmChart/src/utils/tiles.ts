import * as FileSystem from 'expo-file-system';

const TILE_DIR = `${FileSystem.documentDirectory}tiles/`;

const TILE_SOURCES = {
  osm: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  seamark: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
} as const;

export type TileSource = keyof typeof TILE_SOURCES;

export function getTileUrl(source: TileSource, z: number, x: number, y: number): string {
  return TILE_SOURCES[source].replace('{z}', `${z}`).replace('{x}', `${x}`).replace('{y}', `${y}`);
}

function tilePath(source: TileSource, z: number, x: number, y: number): string {
  return `${TILE_DIR}${source}/${z}/${x}/${y}.png`;
}

export async function ensureTileDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(TILE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(TILE_DIR, { intermediates: true });
  }
}

export async function isTileCached(source: TileSource, z: number, x: number, y: number): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(tilePath(source, z, x, y));
  return info.exists;
}

export async function downloadTile(
  source: TileSource,
  z: number,
  x: number,
  y: number
): Promise<string> {
  const path = tilePath(source, z, x, y);
  const dir = path.substring(0, path.lastIndexOf('/'));

  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }

  const url = getTileUrl(source, z, x, y);
  const result = await FileSystem.downloadAsync(url, path);
  return result.uri;
}

export function tileCoordinates(
  bounds: { north: number; south: number; east: number; west: number },
  zoom: number
): { x: number; y: number }[] {
  const tiles: { x: number; y: number }[] = [];

  const xMin = lon2tile(bounds.west, zoom);
  const xMax = lon2tile(bounds.east, zoom);
  const yMin = lat2tile(bounds.north, zoom);
  const yMax = lat2tile(bounds.south, zoom);

  for (let x = xMin; x <= xMax; x++) {
    for (let y = yMin; y <= yMax; y++) {
      tiles.push({ x, y });
    }
  }

  return tiles;
}

export function countTilesInRegion(
  bounds: { north: number; south: number; east: number; west: number },
  minZoom: number,
  maxZoom: number
): number {
  let count = 0;
  for (let z = minZoom; z <= maxZoom; z++) {
    count += tileCoordinates(bounds, z).length;
  }
  return count * 2;
}

export async function downloadRegion(
  bounds: { north: number; south: number; east: number; west: number },
  minZoom: number,
  maxZoom: number,
  onProgress: (downloaded: number, total: number) => void
): Promise<void> {
  await ensureTileDir();

  let downloaded = 0;
  const total = countTilesInRegion(bounds, minZoom, maxZoom);

  for (let z = minZoom; z <= maxZoom; z++) {
    const coords = tileCoordinates(bounds, z);
    for (const { x, y } of coords) {
      for (const source of ['osm', 'seamark'] as TileSource[]) {
        const cached = await isTileCached(source, z, x, y);
        if (!cached) {
          try {
            await downloadTile(source, z, x, y);
          } catch {
          }
        }
        downloaded++;
        onProgress(downloaded, total);
      }
    }
  }
}

export async function getOfflineStorageSize(): Promise<number> {
  const info = await FileSystem.getInfoAsync(TILE_DIR);
  if (!info.exists) return 0;
  return info.size ?? 0;
}

export async function clearOfflineTiles(): Promise<void> {
  const info = await FileSystem.getInfoAsync(TILE_DIR);
  if (info.exists) {
    await FileSystem.deleteAsync(TILE_DIR, { idempotent: true });
  }
}

function lon2tile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * 2 ** zoom);
}

function lat2tile(lat: number, zoom: number): number {
  return Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      2 ** zoom
  );
}
