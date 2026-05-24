import React, { useState } from 'react';
import {
  StyleSheet, View, Text, FlatList, TouchableOpacity,
  Alert, TextInput, Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBoatStore } from '../stores/boatStore';
import { colors, spacing, borderRadius, fontSize } from '../utils/theme';
import { Boat, BoatType, EngineType } from '../types';

const BOAT_TYPES: { value: BoatType; label: string; icon: string }[] = [
  { value: 'motorboat', label: 'Moteur', icon: 'boat' },
  { value: 'sailboat', label: 'Voilier', icon: 'boat-outline' },
  { value: 'catamaran', label: 'Catamaran', icon: 'boat' },
  { value: 'rib', label: 'Semi-rigide', icon: 'boat' },
  { value: 'fishing', label: 'Pêche', icon: 'fish' },
  { value: 'trawler', label: 'Chalutier', icon: 'boat' },
  { value: 'jetski', label: 'Jet-ski', icon: 'water' },
];

const ENGINE_TYPES: { value: EngineType; label: string }[] = [
  { value: 'outboard', label: 'Hors-bord' },
  { value: 'inboard', label: 'In-bord' },
  { value: 'sail', label: 'Voile' },
  { value: 'electric', label: 'Électrique' },
];

const emptyBoat = {
  name: '',
  type: 'motorboat' as BoatType,
  lengthMeters: 0,
  beamMeters: 0,
  draftMeters: 0,
  engineType: 'outboard' as EngineType,
  enginePowerHp: 0,
  fuelTankLiters: 0,
  cruisingSpeedKnots: 0,
  maxSpeedKnots: 0,
  consumptionLitersPerHour: 0,
};

export default function BoatsScreen() {
  const boats = useBoatStore((s) => s.boats);
  const selectedBoat = useBoatStore((s) => s.selectedBoat);
  const addBoat = useBoatStore((s) => s.add);
  const updateBoat = useBoatStore((s) => s.update);
  const removeBoat = useBoatStore((s) => s.remove);
  const setDefault = useBoatStore((s) => s.setDefault);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyBoat);

  const openAdd = () => { setEditId(null); setForm(emptyBoat); setShowModal(true); };

  const openEdit = (boat: Boat) => {
    setEditId(boat.id);
    setForm({
      name: boat.name, type: boat.type, lengthMeters: boat.lengthMeters,
      beamMeters: boat.beamMeters, draftMeters: boat.draftMeters,
      engineType: boat.engineType, enginePowerHp: boat.enginePowerHp,
      fuelTankLiters: boat.fuelTankLiters, cruisingSpeedKnots: boat.cruisingSpeedKnots,
      maxSpeedKnots: boat.maxSpeedKnots, consumptionLitersPerHour: boat.consumptionLitersPerHour,
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.name.trim()) { Alert.alert('Erreur', 'Le nom est requis'); return; }
    if (editId) { await updateBoat(editId, form); } else { await addBoat(form); }
    setShowModal(false);
  };

  const confirmDelete = (boat: Boat) => {
    Alert.alert('Supprimer', `Supprimer "${boat.name}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeBoat(boat.id) },
    ]);
  };

  const numField = (label: string, key: keyof typeof form, unit: string) => (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldInput}>
        <TextInput
          style={styles.numInput}
          value={form[key] ? String(form[key]) : ''}
          onChangeText={(v) => setForm({ ...form, [key]: parseFloat(v) || 0 })}
          keyboardType="decimal-pad"
          placeholderTextColor={colors.textMuted}
        />
        <Text style={styles.unitText}>{unit}</Text>
      </View>
    </View>
  );

  const renderBoat = ({ item }: { item: Boat }) => {
    const isSelected = selectedBoat?.id === item.id;
    const typeDef = BOAT_TYPES.find((t) => t.value === item.type);
    return (
      <TouchableOpacity style={[styles.card, isSelected && styles.cardSelected]} onPress={() => openEdit(item)} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <Ionicons name={(typeDef?.icon ?? 'boat') as any} size={24} color={isSelected ? colors.primary : colors.textSecondary} />
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardType}>{typeDef?.label} · {item.lengthMeters}m</Text>
          </View>
          {isSelected && <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>Actif</Text></View>}
        </View>
        <View style={styles.specsRow}>
          <View style={styles.spec}><Text style={styles.specValue}>{item.cruisingSpeedKnots}</Text><Text style={styles.specLabel}>kn crois.</Text></View>
          <View style={styles.spec}><Text style={styles.specValue}>{item.consumptionLitersPerHour}</Text><Text style={styles.specLabel}>L/h</Text></View>
          <View style={styles.spec}><Text style={styles.specValue}>{item.fuelTankLiters}</Text><Text style={styles.specLabel}>L réserv.</Text></View>
          <View style={styles.spec}><Text style={styles.specValue}>{item.enginePowerHp}</Text><Text style={styles.specLabel}>CV</Text></View>
        </View>
        <View style={styles.cardActions}>
          {!isSelected && <TouchableOpacity style={styles.selectBtn} onPress={() => setDefault(item.id)}><Text style={styles.selectBtnText}>Sélectionner</Text></TouchableOpacity>}
          <TouchableOpacity onPress={() => confirmDelete(item)}><Ionicons name="trash-outline" size={18} color={colors.danger} /></TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerRow}>
        <View><Text style={styles.header}>Bateaux</Text><Text style={styles.subtitle}>{boats.length} bateau{boats.length !== 1 ? 'x' : ''}</Text></View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>
      <FlatList data={boats} keyExtractor={(item) => item.id} renderItem={renderBoat} contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="boat-outline" size={48} color={colors.textMuted} /><Text style={styles.emptyText}>Aucun bateau</Text><Text style={styles.emptyHint}>Ajoutez votre premier bateau pour estimer la consommation</Text></View>}
      />
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modal}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{editId ? 'Modifier' : 'Nouveau bateau'}</Text>
              <Text style={styles.inputLabel}>Nom</Text>
              <TextInput style={styles.textInput} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} placeholder="Mon bateau" placeholderTextColor={colors.textMuted} />
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeGrid}>{BOAT_TYPES.map((t) => (<TouchableOpacity key={t.value} style={[styles.typeOption, form.type === t.value && styles.typeOptionActive]} onPress={() => setForm({ ...form, type: t.value })}><Ionicons name={t.icon as any} size={16} color={form.type === t.value ? colors.primary : colors.textSecondary} /><Text style={[styles.typeLabel, form.type === t.value && { color: colors.primary }]}>{t.label}</Text></TouchableOpacity>))}</View>
              <Text style={styles.inputLabel}>Motorisation</Text>
              <View style={styles.typeGrid}>{ENGINE_TYPES.map((e) => (<TouchableOpacity key={e.value} style={[styles.typeOption, form.engineType === e.value && styles.typeOptionActive]} onPress={() => setForm({ ...form, engineType: e.value })}><Text style={[styles.typeLabel, form.engineType === e.value && { color: colors.primary }]}>{e.label}</Text></TouchableOpacity>))}</View>
              <Text style={styles.sectionTitle}>Dimensions</Text>
              {numField('Longueur', 'lengthMeters', 'm')}
              {numField('Largeur', 'beamMeters', 'm')}
              {numField('Tirant d\'eau', 'draftMeters', 'm')}
              <Text style={styles.sectionTitle}>Performance</Text>
              {numField('Puissance', 'enginePowerHp', 'CV')}
              {numField('Vitesse croisière', 'cruisingSpeedKnots', 'kn')}
              {numField('Vitesse max', 'maxSpeedKnots', 'kn')}
              <Text style={styles.sectionTitle}>Carburant</Text>
              {numField('Réservoir', 'fuelTankLiters', 'L')}
              {numField('Consommation', 'consumptionLitersPerHour', 'L/h')}
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBtn} onPress={() => setShowModal(false)}><Text style={styles.modalBtnText}>Annuler</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={save}><Text style={[styles.modalBtnText, { color: '#fff' }]}>Enregistrer</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.md },
  header: { color: colors.text, fontSize: fontSize.title, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: fontSize.sm },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  list: { padding: spacing.md, paddingBottom: 100 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  cardSelected: { borderColor: colors.primary },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  cardInfo: { flex: 1, marginLeft: spacing.sm },
  cardName: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  cardType: { color: colors.textSecondary, fontSize: fontSize.sm },
  defaultBadge: { backgroundColor: colors.primary + '30', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: borderRadius.round },
  defaultBadgeText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '600' },
  specsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: spacing.sm },
  spec: { alignItems: 'center' },
  specValue: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  specLabel: { color: colors.textMuted, fontSize: fontSize.xs },
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing.md },
  selectBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.primary },
  selectBtnText: { color: colors.primary, fontSize: fontSize.sm },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: colors.textSecondary, fontSize: fontSize.lg, marginTop: spacing.md },
  emptyHint: { color: colors.textMuted, fontSize: fontSize.sm, marginTop: spacing.xs, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.surface, borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl, padding: spacing.lg, maxHeight: '90%' },
  modalTitle: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700', marginBottom: spacing.md },
  inputLabel: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.xs, marginTop: spacing.sm },
  textInput: { backgroundColor: colors.card, color: colors.text, borderRadius: borderRadius.sm, padding: spacing.sm, fontSize: fontSize.md, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { color: colors.text, fontSize: fontSize.md, fontWeight: '700', marginTop: spacing.lg, marginBottom: spacing.xs },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeOption: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', gap: 4 },
  typeOptionActive: { borderWidth: 1, borderColor: colors.primary },
  typeLabel: { color: colors.textSecondary, fontSize: fontSize.sm },
  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  fieldLabel: { color: colors.textSecondary, fontSize: fontSize.sm, flex: 1 },
  fieldInput: { flexDirection: 'row', alignItems: 'center' },
  numInput: { backgroundColor: colors.card, color: colors.text, borderRadius: borderRadius.sm, padding: spacing.xs, fontSize: fontSize.md, width: 80, textAlign: 'right', borderWidth: 1, borderColor: colors.border },
  unitText: { color: colors.textMuted, fontSize: fontSize.sm, marginLeft: spacing.xs, width: 30 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg, marginBottom: spacing.xl },
  modalBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: borderRadius.sm },
  modalBtnPrimary: { backgroundColor: colors.primary },
  modalBtnText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: '600' },
});
