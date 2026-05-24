import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize } from '../utils/theme';
import { downloadRegion, countTilesInRegion, getOfflineStorageSize, clearOfflineTiles } from '../utils/tiles';

const PRESET_REGIONS = [
  { name: 'Côte d\'Azur', bounds: { north: 43.8, south: 43.0, east: 7.5, west: 5.0 } },
  { name: 'Corse', bounds: { north: 43.1, south: 41.3, east: 9.7, west: 8.5 } },
  { name: 'Bretagne Sud', bounds: { north: 48.0, south: 47.0, east: -2.0, west: -4.5 } },
  { name: 'Golfe du Morbihan', bounds: { north: 47.7, south: 47.4, east: -2.5, west: -3.1 } },
  { name: 'Baléares', bounds: { north: 40.2, south: 38.5, east: 4.5, west: 1.0 } },
  { name: 'Sardaigne Nord', bounds: { north: 41.3, south: 40.5, east: 10.0, west: 8.0 } },
];

const MIN_ZOOM = 6;
const MAX_ZOOM = 14;

export default function OfflineScreen() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [storageSize, setStorageSize] = useState(0);

  useEffect(() => { getOfflineStorageSize().then(setStorageSize); }, [downloading]);

  const startDownload = async (regionName: string, bounds: typeof PRESET_REGIONS[0]['bounds']) => {
    const tileCount = countTilesInRegion(bounds, MIN_ZOOM, MAX_ZOOM);
    Alert.alert(
      `Télécharger ${regionName}`,
      `${tileCount} tuiles seront téléchargées (zoom ${MIN_ZOOM}-${MAX_ZOOM}).\n\nCela peut prendre plusieurs minutes.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Télécharger',
          onPress: async () => {
            setDownloading(regionName); setTotal(tileCount); setProgress(0);
            try {
              await downloadRegion(bounds, MIN_ZOOM, MAX_ZOOM, (d, t) => { setProgress(d); setTotal(t); });
              Alert.alert('Terminé', `${regionName} est disponible hors ligne.`);
            } catch { Alert.alert('Erreur', 'Erreur lors du téléchargement.'); }
            setDownloading(null);
            getOfflineStorageSize().then(setStorageSize);
          },
        },
      ]
    );
  };

  const handleClear = () => {
    Alert.alert('Supprimer les cartes', 'Supprimer toutes les cartes téléchargées ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await clearOfflineTiles(); setStorageSize(0); } },
    ]);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>Cartes hors ligne</Text>
      <Text style={styles.subtitle}>Téléchargez les cartes pour naviguer sans connexion</Text>

      <View style={styles.storageCard}>
        <Ionicons name="folder" size={20} color={colors.primary} />
        <Text style={styles.storageText}>Stockage utilisé : {formatSize(storageSize)}</Text>
        {storageSize > 0 && <TouchableOpacity onPress={handleClear}><Ionicons name="trash-outline" size={18} color={colors.danger} /></TouchableOpacity>}
      </View>

      {downloading && (
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>Téléchargement : {downloading}</Text>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${total > 0 ? (progress / total) * 100 : 0}%` }]} /></View>
          <Text style={styles.progressText}>{progress} / {total} tuiles ({total > 0 ? Math.round((progress / total) * 100) : 0}%)</Text>
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.sm }} />
        </View>
      )}

      <View style={styles.regionList}>
        {PRESET_REGIONS.map((region) => (
          <TouchableOpacity key={region.name} style={styles.regionCard} onPress={() => startDownload(region.name, region.bounds)} disabled={!!downloading}>
            <View style={styles.regionInfo}>
              <Text style={styles.regionName}>{region.name}</Text>
              <Text style={styles.regionDetail}>{countTilesInRegion(region.bounds, MIN_ZOOM, MAX_ZOOM)} tuiles · zoom {MIN_ZOOM}-{MAX_ZOOM}</Text>
            </View>
            <Ionicons name="cloud-download-outline" size={22} color={downloading ? colors.textMuted : colors.primary} />
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.footnote}>Cartes : OpenStreetMap + OpenSeaMap (licences libres).{"\n"}Les cartes téléchargées sont stockées localement.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.md },
  header: { color: colors.text, fontSize: fontSize.title, fontWeight: '800', marginTop: spacing.md },
  subtitle: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.lg },
  storageCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  storageText: { color: colors.text, fontSize: fontSize.md, flex: 1 },
  progressCard: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.primary },
  progressTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '600', marginBottom: spacing.sm },
  progressBar: { height: 6, backgroundColor: colors.card, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 3 },
  progressText: { color: colors.textSecondary, fontSize: fontSize.sm, marginTop: spacing.xs },
  regionList: { gap: spacing.sm },
  regionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  regionInfo: { flex: 1 },
  regionName: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  regionDetail: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  footnote: { color: colors.textMuted, fontSize: fontSize.xs, textAlign: 'center', marginTop: spacing.xl, lineHeight: 18 },
});
