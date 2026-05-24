import React from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTrackStore, Track } from '../stores/trackStore';
import { colors, spacing, borderRadius, fontSize } from '../utils/theme';
import { formatDistance, formatDuration } from '../utils/navigation';

export default function TracksScreen() {
  const tracks = useTrackStore((s) => s.tracks);
  const activeTrackId = useTrackStore((s) => s.activeTrackId);
  const startRecording = useTrackStore((s) => s.startRecording);
  const stopRecording = useTrackStore((s) => s.stopRecording);
  const deleteTrack = useTrackStore((s) => s.deleteTrack);
  const renameTrack = useTrackStore((s) => s.renameTrack);

  const isRecording = activeTrackId !== null;

  const toggleRecording = () => {
    if (isRecording) {
      Alert.alert('Arrêter', 'Arrêter l\'enregistrement de la trace ?', [
        { text: 'Continuer', style: 'cancel' },
        { text: 'Arrêter', style: 'destructive', onPress: stopRecording },
      ]);
    } else {
      startRecording();
    }
  };

  const confirmDelete = (track: Track) => {
    Alert.alert('Supprimer', `Supprimer la trace "${track.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => deleteTrack(track.id) },
    ]);
  };

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const trackDuration = (track: Track) => {
    const end = track.endedAt ?? Date.now();
    return (end - track.startedAt) / 3600000;
  };

  const renderTrack = ({ item }: { item: Track }) => {
    const duration = trackDuration(item);
    const isActive = item.id === activeTrackId;

    return (
      <TouchableOpacity style={[styles.card, isActive && styles.cardActive]} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
          <View style={styles.cardInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
              {isActive && (
                <View style={styles.recordingBadge}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>REC</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardDate}>
              {formatDate(item.startedAt)} · {formatTime(item.startedAt)}
              {item.endedAt ? ` → ${formatTime(item.endedAt)}` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="resize" size={14} color={colors.primary} />
            <Text style={styles.statValue}>{formatDistance(item.distanceNm)}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="time" size={14} color={colors.accent} />
            <Text style={styles.statValue}>{formatDuration(duration)}</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="location" size={14} color={colors.success} />
            <Text style={styles.statValue}>{item.pointCount} pts</Text>
          </View>
          {duration > 0 && item.distanceNm > 0 && (
            <View style={styles.stat}>
              <Ionicons name="speedometer" size={14} color={colors.warning} />
              <Text style={styles.statValue}>{(item.distanceNm / duration).toFixed(1)} kn</Text>
            </View>
          )}
        </View>

        {!isActive && (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(item)}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.header}>Traces</Text>
          <Text style={styles.subtitle}>
            {tracks.length} trace{tracks.length !== 1 ? 's' : ''}
            {isRecording ? ' · Enregistrement en cours' : ''}
          </Text>
        </View>
        <TouchableOpacity style={[styles.recBtn, isRecording && styles.recBtnActive]} onPress={toggleRecording}>
          <Ionicons name={isRecording ? 'stop' : 'radio-button-on'} size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList data={tracks} keyExtractor={(item) => item.id} renderItem={renderTrack} contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="trail-sign-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aucune trace</Text>
            <Text style={styles.emptyHint}>Appuyez sur le bouton pour commencer à enregistrer votre trajet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.md },
  header: { color: colors.text, fontSize: fontSize.title, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: fontSize.sm },
  recBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.danger, justifyContent: 'center', alignItems: 'center', shadowColor: colors.danger, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
  recBtnActive: { backgroundColor: colors.danger, borderWidth: 3, borderColor: '#fff' },
  list: { padding: spacing.md, paddingBottom: 100 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  cardActive: { borderColor: colors.danger },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: spacing.sm },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardName: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600', flex: 1 },
  cardDate: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  recordingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.danger + '30', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.round },
  recordingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.danger },
  recordingText: { color: colors.danger, fontSize: fontSize.xs, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { color: colors.textSecondary, fontSize: fontSize.sm },
  deleteBtn: { position: 'absolute', top: spacing.md, right: spacing.md },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.lg, marginTop: spacing.md },
  emptyHint: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs, textAlign: 'center', paddingHorizontal: spacing.xl },
});
