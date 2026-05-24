import { Coordinates } from '../types';

const EARTH_RADIUS_KM = 6371;
const KM_TO_NM = 0.539957;
const NM_TO_KM = 1.852;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

export function haversineDistanceKm(a: Coordinates, b: Coordinates): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function haversineDistanceNm(a: Coordinates, b: Coordinates): number {
  return haversineDistanceKm(a, b) * KM_TO_NM;
}

export function kmToNm(km: number): number {
  return km * KM_TO_NM;
}

export function nmToKm(nm: number): number {
  return nm * NM_TO_KM;
}

export function bearing(from: Coordinates, to: Coordinates): number {
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);
  const dLon = toRadians(to.longitude - from.longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

export function estimateFuel(
  distanceNm: number,
  speedKnots: number,
  consumptionLph: number
): { timeHours: number; fuelLiters: number } {
  const timeHours = distanceNm / speedKnots;
  const fuelLiters = timeHours * consumptionLph;
  return { timeHours, fuelLiters };
}

export function formatCoordinate(
  value: number,
  type: 'lat' | 'lon'
): string {
  const abs = Math.abs(value);
  const degrees = Math.floor(abs);
  const minutesDecimal = (abs - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = ((minutesDecimal - minutes) * 60).toFixed(1);

  const dir =
    type === 'lat'
      ? value >= 0
        ? 'N'
        : 'S'
      : value >= 0
        ? 'E'
        : 'W';

  return `${degrees}°${minutes}'${seconds}"${dir}`;
}

export function formatDistance(nm: number): string {
  if (nm < 0.1) return `${Math.round(nm * 1852)}m`;
  if (nm < 10) return `${nm.toFixed(1)} NM`;
  return `${Math.round(nm)} NM`;
}

export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

export function formatBearing(degrees: number): string {
  return `${Math.round(degrees).toString().padStart(3, '0')}°`;
}
