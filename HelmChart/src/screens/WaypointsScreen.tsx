import React, { useState } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity,
  Alert, TextInput, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useWaypointStore } from '../stores/waypointStore';
import { useRouteStore } from '../stores/routeStore';
import { colors, spacing, borderRadius, fontSize } from '../utils/theme';
import { formatCoordinate } from '../utils/navigation';
import { Waypoint, WaypointIcon } from '../types';

const ICONS: { icon: WaypointIcon; label: string; ionicon: string }[] = [
  { icon: 'anchor', label: 'Mouillage', ionicon: 'boat' },
  { icon: 'fish', label: 'Pêche', ionicon: 'fish' },
  { icon: 'flag', label: 'Drapeau', ionicon: 'flag' },
  { icon: 'marker', label: 'Point', ionicon: 'location' },
  { icon: 'harbor', label: 'Port', ionicon: 'home' },
  { icon: 'danger', label: 'Danger', ionicon: 'warning' },
  { icon: 'fuel', label: 'Carburant', ionicon: 'car' },
  { icon: 'restaurant', label: 'Restaurant', ionicon: 'restaurant' },
  { icon: 'dive', label: 'Plongée', ionicon: 'water' },
];

const COLORS = ['#FF5722', '#E91E63', '#9C27B0', '#2196F3', '#4CAF50', '#FFC107', '#795548', '#607D8B'];

export default function WaypointsScreen() {
  const waypoints = useWaypointStore((s) => s.waypoints);
  const removeWaypoint = useWaypointStore((s) => s.remove);
  const updateWaypoint = useWaypointStore((s) => s.update);
  const addToRoute = useRouteStore((s) => s.addToRoute);
  const activeRoute = useRouteStore((s) => s.activeRoute);

  const [editingWp, setEditingWp] = useState<Waypoint | null>(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editIcon, setEditIcon] = useState<WaypointIcon>('marker');
  const [editColor, setEditColor] = useState('#FF5722');

  const openEdit = (wp: Waypoint) => {
    setEditingWp(wp);
    setEditName(wp.name);
    setEditNotes(wp.notes);
    setEditIcon(wp.icon);
    setEditColor(wp.color);
  };

  const saveEdit = () => {
    if (!editingWp) return;
    updateWaypoint(editingWp.id, { name: editName, notes: editNotes, icon: editIcon, color: editColor });
    setEditingWp(null);
  };

  const confirmDelete = (wp: Waypoint) => {
    Alert.alert('Supprimer', `Supprimer "${wp.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeWaypoint(wp.id) },
    ]);
  };

  const isInRoute = (id: string) => activeRoute.includes(id);

  const renderItem = ({ item }: { item: Waypoint }) => {
    const iconDef = ICONS.find((i) => i.icon === item.icon) ?? ICONS[3];
    return (
      <TouchableOpacity style={styles.card} onPress={() => openEdit(item)} activeOpacity={0.7}>
        <View style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={iconDef.ionicon as any} size={20} color={item.color} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardCoords}>
            {formatCoordinate(item.coordinates.latitude, 'lat')}{' '}
            {formatCoordinate(item.coordinates.longitude, 'lon')}
          </Text>
          {item.notes ? <Text style={styles.cardNotes} numberOfLines={1}>{item.notes}</Text> : null}
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={[styles.actionBtn, isInRoute(item.id) && styles.actionBtnActive]}
            onPress={() => addToRoute(item.id)}
          >
            <Ionicons name="navigate" size={16} color={isInRoute(item.id) ? colors.primary : colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => confirmDelete(item)}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>Waypoints</Text>
      <Text style={styles.subtitle}>
        {waypoints.length} point{waypoints.length !== 1 ? 's' : ''} · Appui long sur la carte pour en créer
      </Text>

      <FlatList
        data={waypoints}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="location-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Aucun waypoint</Text>
            <Text style={styles.emptyHint}>Maintenez appuyé sur la carte pour créer un point</Text>
          </View>
        }
      />

      <Modal visible={!!editingWp} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Modifier le waypoint</Text>

            <Text style={styles.inputLabel}>Nom</Text>
            <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholderTextColor={colors.textMuted} />

            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput style={[styles.input, styles.inputMulti]} value={editNotes} onChangeText={setEditNotes} multiline placeholderTextColor={colors.textMuted} />

            <Text style={styles.inputLabel}>Icône</Text>
            <View style={styles.iconGrid}>
              {ICONS.map((ic) => (
                <TouchableOpacity
                  key={ic.icon}
                  style={[styles.iconOption, editIcon === ic.icon && styles.iconOptionActive]}
                  onPress={() => setEditIcon(ic.icon)}
                >
                  <Ionicons name={ic.ionicon as any} size={20} color={editIcon === ic.icon ? colors.primary : colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Couleur</Text>
            <View style={styles.colorGrid}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorOption, { backgroundColor: c }, editColor === c && styles.colorOptionActive]}
                  onPress={() => setEditColor(c)}
                />
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtn} onPress={() => setEditingWp(null)}>
                <Text style={styles.modalBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={saveEdit}>
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { color: colors.text, fontSize: fontSize.title, fontWeight: '800', paddingHorizontal: spacing.md, paddingTop: spacing.md },
  subtitle: { color: colors.textSecondary, fontSize: fontSize.sm, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  list: { paddingHorizontal: spacing.md, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm },
  cardContent: { flex: 1 },
  cardTitle: { color: colors.text, fontSize: fontSize.lg, fontWeight: '600' },
  cardCoords: { color: colors.textSecondary, fontSize: fontSize.xs, marginTop: 2 },
  cardNotes: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: spacing.xs },
  actionBtn: { padding: spacing.sm },
  actionBtnActive: { opacity: 1 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.lg, marginTop: spacing.md },
  emptyHint: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg },
  modalTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700', marginBottom: spacing.md },
  inputLabel: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: { backgroundColor: colors.card, color: colors.text, borderRadius: borderRadius.sm, padding: spacing.sm, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  iconOption: { width: 40, height: 40, borderRadius: borderRadius.sm, backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center' },
  iconOptionActive: { borderWidth: 2, borderColor: colors.primary },
  colorGrid: { flexDirection: 'row', gap: spacing.sm },
  colorOption: { width: 32, height: 32, borderRadius: 16 },
  colorOptionActive: { borderWidth: 3, borderColor: colors.text },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg },
  modalBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: borderRadius.sm },
  modalBtnPrimary: { backgroundColor: colors.primary },
  modalBtnText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '600' },
});
