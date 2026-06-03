import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, SafeAreaView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategories, getProducts, saveProducts } from '../storage/storage';
import { COLORS } from '../utils/theme';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const emptyPeriod = () => ({ id: uuidv4(), startDate: '', endDate: '' });

export default function ProductFormScreen({ navigation, route }) {
  const editing = route.params?.product || null;

  const [name, setName] = useState(editing?.name || '');
  const [categoryId, setCategoryId] = useState(editing?.categoryId || '');
  const [price, setPrice] = useState(editing?.price || '');
  const [notes, setNotes] = useState(editing?.notes || '');
  const [periods, setPeriods] = useState(
    editing?.periods?.length ? editing.periods : [emptyPeriod()]
  );
  const [categories, setCategories] = useState([]);
  const [catPickerOpen, setCatPickerOpen] = useState(false);
  const [datePicking, setDatePicking] = useState(null); // { periodId, field }
  const [dateInput, setDateInput] = useState('');

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const addPeriod = () => {
    if (periods.length >= 3) return Alert.alert('Max 3 periods');
    setPeriods([...periods, emptyPeriod()]);
  };

  const removePeriod = (id) => {
    if (periods.length === 1) return;
    setPeriods(periods.filter((p) => p.id !== id));
  };

  const updatePeriod = (id, field, value) => {
    setPeriods(periods.map((p) => p.id === id ? { ...p, [field]: value } : p));
  };

  const openDateInput = (periodId, field) => {
    const period = periods.find((p) => p.id === periodId);
    setDateInput(period?.[field] || '');
    setDatePicking({ periodId, field });
  };

  const confirmDate = () => {
    if (!dateInput) {
      updatePeriod(datePicking.periodId, datePicking.field, '');
      setDatePicking(null);
      return;
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return Alert.alert('Invalid date', 'Use format YYYY-MM-DD');
    updatePeriod(datePicking.periodId, datePicking.field, dateInput);
    setDatePicking(null);
  };

  const save = async () => {
    if (!name.trim()) return Alert.alert('Product name is required');
    const all = await getProducts();
    const product = {
      id: editing?.id || uuidv4(),
      name: name.trim(),
      categoryId,
      price: price ? parseFloat(price) : null,
      notes: notes.trim(),
      periods,
      createdAt: editing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    let updated;
    if (editing) {
      updated = all.map((p) => p.id === editing.id ? product : p);
    } else {
      updated = [...all, product];
    }
    await saveProducts(updated);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{editing ? 'Edit Product' : 'New Product'}</Text>
        <TouchableOpacity onPress={save} style={styles.saveHeaderBtn}>
          <Text style={styles.saveHeaderText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionLabel}>Product Name *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Dove Body Lotion"
          placeholderTextColor={COLORS.muted}
          value={name}
          onChangeText={setName}
        />

        <Text style={styles.sectionLabel}>Category</Text>
        <TouchableOpacity style={styles.picker} onPress={() => setCatPickerOpen(!catPickerOpen)}>
          <Text style={[styles.pickerText, !selectedCategory && { color: COLORS.muted }]}>
            {selectedCategory ? selectedCategory.name : 'Select a category'}
          </Text>
          <Ionicons name={catPickerOpen ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.muted} />
        </TouchableOpacity>
        {catPickerOpen && (
          <View style={styles.dropDown}>
            <TouchableOpacity style={styles.dropItem} onPress={() => { setCategoryId(''); setCatPickerOpen(false); }}>
              <Text style={styles.dropItemText}>None</Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity key={cat.id} style={styles.dropItem} onPress={() => { setCategoryId(cat.id); setCatPickerOpen(false); }}>
                <Ionicons name={cat.icon || 'basket'} size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                <Text style={styles.dropItemText}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.sectionLabel}>Price (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 8.99"
          placeholderTextColor={COLORS.muted}
          keyboardType="decimal-pad"
          value={price}
          onChangeText={setPrice}
        />

        <Text style={styles.sectionLabel}>Usage Periods (up to 3)</Text>
        <Text style={styles.hint}>Track when you opened and finished each unit to calculate how long it lasts.</Text>

        {periods.map((period, index) => (
          <View key={period.id} style={styles.periodCard}>
            <View style={styles.periodHeader}>
              <Text style={styles.periodTitle}>Period {index + 1}</Text>
              {periods.length > 1 && (
                <TouchableOpacity onPress={() => removePeriod(period.id)}>
                  <Ionicons name="close-circle" size={20} color={COLORS.danger} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>Start Date</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => openDateInput(period.id, 'startDate')}>
                  <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                  <Text style={[styles.dateBtnText, !period.startDate && { color: COLORS.muted }]}>
                    {period.startDate || 'YYYY-MM-DD'}
                  </Text>
                </TouchableOpacity>
              </View>
              <Ionicons name="arrow-forward" size={16} color={COLORS.muted} style={{ marginTop: 28 }} />
              <View style={styles.dateField}>
                <Text style={styles.dateLabel}>End Date</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => openDateInput(period.id, 'endDate')}>
                  <Ionicons name="calendar-outline" size={16} color={COLORS.primary} />
                  <Text style={[styles.dateBtnText, !period.endDate && { color: COLORS.muted }]}>
                    {period.endDate || 'YYYY-MM-DD'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {periods.length < 3 && (
          <TouchableOpacity style={styles.addPeriodBtn} onPress={addPeriod}>
            <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.addPeriodText}>Add Another Period</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.sectionLabel}>Notes (optional)</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Size, brand variant, etc."
          placeholderTextColor={COLORS.muted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        <View style={{ height: 40 }} />
      </ScrollView>

      {datePicking && (
        <View style={styles.dateOverlay}>
          <View style={styles.dateSheet}>
            <Text style={styles.dateSheetTitle}>
              Enter {datePicking.field === 'startDate' ? 'Start' : 'End'} Date
            </Text>
            <Text style={styles.dateSheetHint}>Format: YYYY-MM-DD (e.g. 2024-03-15)</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={COLORS.muted}
              value={dateInput}
              onChangeText={setDateInput}
              keyboardType="numbers-and-punctuation"
              autoFocus
            />
            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDatePicking(null)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={confirmDate}>
                <Text style={styles.saveText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, backgroundColor: COLORS.primary },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.white },
  saveHeaderBtn: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
  saveHeaderText: { color: COLORS.white, fontWeight: '700' },
  body: { padding: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginTop: 20 },
  hint: { fontSize: 13, color: COLORS.muted, marginBottom: 12, marginTop: -4 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, color: COLORS.text, fontSize: 16, backgroundColor: COLORS.white },
  notesInput: { height: 90, textAlignVertical: 'top' },
  picker: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, backgroundColor: COLORS.white },
  pickerText: { fontSize: 16, color: COLORS.text },
  dropDown: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, backgroundColor: COLORS.white, overflow: 'hidden', marginTop: 4 },
  dropItem: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dropItemText: { fontSize: 15, color: COLORS.text },
  periodCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  periodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  periodTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  dateRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  dateField: { flex: 1 },
  dateLabel: { fontSize: 12, color: COLORS.muted, marginBottom: 6 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, padding: 10, backgroundColor: COLORS.bg },
  dateBtnText: { fontSize: 14, color: COLORS.text },
  addPeriodBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderWidth: 1, borderColor: COLORS.primary, borderRadius: 12, borderStyle: 'dashed', justifyContent: 'center', marginBottom: 8 },
  addPeriodText: { color: COLORS.primary, fontWeight: '600' },
  dateOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  dateSheet: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  dateSheetTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  dateSheetHint: { fontSize: 13, color: COLORS.muted, marginBottom: 16 },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelText: { color: COLORS.muted, fontWeight: '600' },
  saveBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveText: { color: COLORS.white, fontWeight: '700' },
});
