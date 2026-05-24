export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Waypoint {
  id: string;
  name: string;
  coordinates: Coordinates;
  icon: WaypointIcon;
  color: string;
  notes: string;
  createdAt: number;
}

export type WaypointIcon =
  | 'anchor'
  | 'fish'
  | 'flag'
  | 'marker'
  | 'harbor'
  | 'danger'
  | 'buoy'
  | 'fuel'
  | 'restaurant'
  | 'dive';

export interface Boat {
  id: string;
  name: string;
  type: BoatType;
  lengthMeters: number;
  beamMeters: number;
  draftMeters: number;
  engineType: EngineType;
  enginePowerHp: number;
  fuelTankLiters: number;
  cruisingSpeedKnots: number;
  maxSpeedKnots: number;
  consumptionLitersPerHour: number;
  photo?: string;
  isDefault: boolean;
}

export type BoatType =
  | 'sailboat'
  | 'motorboat'
  | 'catamaran'
  | 'rib'
  | 'jetski'
  | 'trawler'
  | 'fishing';

export type EngineType = 'outboard' | 'inboard' | 'sail' | 'electric';

export interface Route {
  id: string;
  name: string;
  waypoints: string[];
  boatId: string;
  createdAt: number;
}

export interface RouteEstimation {
  totalDistanceNm: number;
  totalDistanceKm: number;
  estimatedTimeHours: number;
  fuelConsumptionLiters: number;
  fuelCostPercent: number;
  legs: RouteLeg[];
}

export interface RouteLeg {
  from: Waypoint;
  to: Waypoint;
  distanceNm: number;
  bearing: number;
  estimatedTimeHours: number;
  fuelLiters: number;
}

export interface TileRegion {
  id: string;
  name: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  minZoom: number;
  maxZoom: number;
  tileCount: number;
  downloadedTiles: number;
  sizeMb: number;
  status: 'pending' | 'downloading' | 'complete' | 'error';
  createdAt: number;
}

export interface MapLayer {
  id: string;
  name: string;
  urlTemplate: string;
  enabled: boolean;
  opacity: number;
}
