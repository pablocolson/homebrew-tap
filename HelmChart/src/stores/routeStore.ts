import { create } from 'zustand';
import { Route, RouteEstimation, RouteLeg, Waypoint, Boat } from '../types';
import { haversineDistanceNm, bearing, estimateFuel } from '../utils/navigation';

interface RouteState {
  activeRoute: string[];
  setActiveRoute: (waypointIds: string[]) => void;
  addToRoute: (waypointId: string) => void;
  removeFromRoute: (waypointId: string) => void;
  clearRoute: () => void;
  reorderRoute: (fromIndex: number, toIndex: number) => void;
  estimate: (waypoints: Waypoint[], boat: Boat) => RouteEstimation | null;
}

export const useRouteStore = create<RouteState>((set, get) => ({
  activeRoute: [],

  setActiveRoute: (waypointIds) => set({ activeRoute: waypointIds }),

  addToRoute: (waypointId) =>
    set({ activeRoute: [...get().activeRoute, waypointId] }),

  removeFromRoute: (waypointId) =>
    set({ activeRoute: get().activeRoute.filter((id) => id !== waypointId) }),

  clearRoute: () => set({ activeRoute: [] }),

  reorderRoute: (fromIndex, toIndex) => {
    const route = [...get().activeRoute];
    const [item] = route.splice(fromIndex, 1);
    route.splice(toIndex, 0, item);
    set({ activeRoute: route });
  },

  estimate: (waypoints, boat) => {
    if (waypoints.length < 2) return null;

    const legs: RouteLeg[] = [];
    let totalDistanceNm = 0;
    let totalTimeHours = 0;
    let totalFuelLiters = 0;

    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = waypoints[i];
      const to = waypoints[i + 1];
      const distanceNm = haversineDistanceNm(from.coordinates, to.coordinates);
      const brg = bearing(from.coordinates, to.coordinates);
      const { timeHours, fuelLiters } = estimateFuel(
        distanceNm,
        boat.cruisingSpeedKnots,
        boat.consumptionLitersPerHour
      );

      legs.push({ from, to, distanceNm, bearing: brg, estimatedTimeHours: timeHours, fuelLiters });
      totalDistanceNm += distanceNm;
      totalTimeHours += timeHours;
      totalFuelLiters += fuelLiters;
    }

    return {
      totalDistanceNm,
      totalDistanceKm: totalDistanceNm * 1.852,
      estimatedTimeHours: totalTimeHours,
      fuelConsumptionLiters: totalFuelLiters,
      fuelCostPercent: (totalFuelLiters / boat.fuelTankLiters) * 100,
      legs,
    };
  },
}));
