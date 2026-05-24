import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import NauticalMapView from '../components/MapView';
import { useRouteStore } from '../stores/routeStore';
import { useWaypointStore } from '../stores/waypointStore';
import { useBoatStore } from '../stores/boatStore';
import { colors, spacing, borderRadius, fontSize } from '../utils/theme';
import { formatDistance, formatDuration, formatBearing } from '../utils/navigation';
import { Ionicons } from '@expo/vector-icons';

export default function ChartScreen() {
  const activeRoute = useRouteStore((s) => s.activeRoute);
  const clearRoute = useRouteStore((s) => s.clearRoute);
  const estimate = useRouteStore((s) => s.estimate);
  const waypoints = useWaypointStore((s) => s.waypoints);
  const selectedBoat = useBoatStore((s) => s.selectedBoat);

  const routeWaypoints = activeRoute
    .map((id) => waypoints.find((w) => w.id === id))
    .filter(Boolean) as typeof waypoints;

  const estimation = selectedBoat && routeWaypoints.length >= 2
    ? estimate(routeWaypoints, selectedBoat)
    : null;

  return (
    <View style={styles.container}>
      <NauticalMapView />

      {estimation && (
        <View style={styles.routePanel}>
          <View style={styles.routeHeader}>
            <Text style={styles.routeTitle}>
              Route ({routeWaypoints.length} pts)
            </Text>
            <TouchableOpacity onPress={clearRoute}>
              <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="resize" size={16} color={colors.primary} />
              <Text style={styles.statValue}>{formatDistance(estimation.totalDistanceNm)}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="time" size={16} color={colors.accent} />
              <Text style={styles.statValue}>{formatDuration(estimation.estimatedTimeHours)}</Text>
              <Text style={styles.statLabel}>Durée</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="speedometer" size={16} color={colors.warning} />
              <Text style={styles.statValue}>{selectedBoat.cruisingSpeedKnots} kn</Text>
              <Text style={styles.statLabel}>Vitesse</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="water" size={16} color={colors.danger} />
              <Text style={styles.statValue}>{estimation.fuelConsumptionLiters.toFixed(1)} L</Text>
              <Text style={styles.statLabel}>Carburant</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="battery-half" size={16} color={
                estimation.fuelCostPercent > 80 ? colors.danger :
                estimation.fuelCostPercent > 50 ? colors.warning : colors.success
              } />
              <Text style={styles.statValue}>{estimation.fuelCostPercent.toFixed(0)}%</Text>
              <Text style={styles.statLabel}>Réservoir</Text>
            </View>
          </ScrollView>

          {estimation.legs.map((leg, i) => (
            <View key={i} style={styles.legRow}>
              <Text style={styles.legIndex}>{i + 1}</Text>
              <Text style={styles.legText} numberOfLines={1}>
                {leg.from.name} → {leg.to.name}
              </Text>
              <Text style={styles.legDetail}>
                {formatDistance(leg.distanceNm)} · {formatBearing(leg.bearing)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  routePanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface + 'F5',
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.md,
    maxHeight: '40%',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  routeTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  statsRow: {
    marginBottom: spacing.sm,
  },
  statCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginRight: spacing.sm,
    alignItems: 'center',
    minWidth: 80,
  },
  statValue: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
    marginTop: 2,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  legRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legIndex: {
    color: colors.primary,
    fontWeight: '700',
    width: 20,
    fontSize: fontSize.sm,
  },
  legText: {
    color: colors.text,
    flex: 1,
    fontSize: fontSize.sm,
  },
  legDetail: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
  },
});
