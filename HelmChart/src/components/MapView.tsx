import React, { useRef, useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Alert } from 'react-native';
import RNMapView, { UrlTile, Marker, Polyline, Region, LongPressEvent, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useWaypointStore } from '../stores/waypointStore';
import { useRouteStore } from '../stores/routeStore';
import { useBoatStore } from '../stores/boatStore';
import { useTrackStore } from '../stores/trackStore';
import { colors, spacing, borderRadius, fontSize } from '../utils/theme';
import { formatCoordinate } from '../utils/navigation';
import { WaypointIcon } from '../types';

const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const SEAMARK_TILE_URL = 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png';

interface Props {
  onWaypointPress?: (waypointId: string) => void;
}

export default function NauticalMapView({ onWaypointPress }: Props) {
  const mapRef = useRef<RNMapView>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showSeamarks, setShowSeamarks] = useState(true);
  const [heading, setHeading] = useState(0);

  const waypoints = useWaypointStore((s) => s.waypoints);
  const addWaypoint = useWaypointStore((s) => s.add);
  const activeRoute = useRouteStore((s) => s.activeRoute);
  const addToRoute = useRouteStore((s) => s.addToRoute);
  const activePoints = useTrackStore((s) => s.activePoints);
  const tracks = useTrackStore((s) => s.tracks);

  const routeWaypoints = activeRoute
    .map((id) => waypoints.find((w) => w.id === id))
    .filter(Boolean) as typeof waypoints;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });

      Location.watchHeadingAsync((h) => setHeading(h.trueHeading));
    })();
  }, []);

  const centerOnUser = useCallback(() => {
    if (!userLocation || !mapRef.current) return;
    mapRef.current.animateToRegion({
      ...userLocation,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    });
  }, [userLocation]);

  const handleLongPress = useCallback(
    (e: LongPressEvent) => {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      Alert.alert(
        'Nouveau waypoint',
        `${formatCoordinate(latitude, 'lat')} ${formatCoordinate(longitude, 'lon')}`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Créer',
            onPress: () => {
              addWaypoint(`WP${waypoints.length + 1}`, { latitude, longitude });
            },
          },
        ]
      );
    },
    [addWaypoint, waypoints.length]
  );

  const initialRegion: Region = {
    latitude: userLocation?.latitude ?? 43.3,
    longitude: userLocation?.longitude ?? 5.37,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  };

  return (
    <View style={styles.container}>
      <RNMapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        mapType="none"
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        rotateEnabled
        onLongPress={handleLongPress}
      >
        <UrlTile urlTemplate={OSM_TILE_URL} maximumZ={19} tileSize={256} />
        {showSeamarks && (
          <UrlTile urlTemplate={SEAMARK_TILE_URL} maximumZ={18} tileSize={256} zIndex={1} />
        )}

        {waypoints.map((wp) => (
          <Marker
            key={wp.id}
            coordinate={wp.coordinates}
            title={wp.name}
            description={wp.notes || undefined}
            pinColor={wp.color}
            onPress={() => onWaypointPress?.(wp.id)}
            onCalloutPress={() => {
              Alert.alert(wp.name, 'Ajouter à la route ?', [
                { text: 'Non', style: 'cancel' },
                { text: 'Ajouter', onPress: () => addToRoute(wp.id) },
              ]);
            }}
          />
        ))}

        {routeWaypoints.length >= 2 && (
          <Polyline
            coordinates={routeWaypoints.map((wp) => wp.coordinates)}
            strokeColor={colors.accent}
            strokeWidth={3}
            lineDashPattern={[10, 5]}
          />
        )}

        {activePoints.length >= 2 && (
          <Polyline
            coordinates={activePoints.map((p) => ({ latitude: p.latitude, longitude: p.longitude }))}
            strokeColor={tracks.find((t) => t.isRecording)?.color ?? colors.danger}
            strokeWidth={3}
          />
        )}
      </RNMapView>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={centerOnUser}>
          <Ionicons name="navigate" size={22} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlBtn, showSeamarks && styles.controlBtnActive]}
          onPress={() => setShowSeamarks(!showSeamarks)}
        >
          <Ionicons name="boat" size={22} color={showSeamarks ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {userLocation && (
        <View style={styles.compass}>
          <Text style={styles.compassText}>{Math.round(heading)}°</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  controls: {
    position: 'absolute',
    right: spacing.md,
    top: 100,
    gap: spacing.sm,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface + 'EE',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  controlBtnActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceLight + 'EE',
  },
  compass: {
    position: 'absolute',
    top: 60,
    left: spacing.md,
    backgroundColor: colors.surface + 'DD',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  compassText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
