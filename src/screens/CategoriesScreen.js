import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, Modal, SafeAreaView, StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getCategories, saveCategories, getProducts } from '../storage/storage';
import { COLORS } from '../utils/theme';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

const ICON_OPTIONS = ['basket', 'shirt', 'medkit', 'leaf', 'home', 'car', 'paw', 'fitness', 'restaurant', 'sparkles'];

export default function CategoriesScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(ICON_OPTIONS[0]);

  useFocusEffect(
    useCallback(() => {
      getCategories().then(setCategories);
    }, [])
  );

  const openAdd = () => {
    setEditTarget(null);
    setName('');
    setSelectedIcon(ICON_OPTIONS[0]);
    setModalVisible(true);
  };

  const openEdit = (cat) => {
    setEditTarget(cat);
    setName(cat.name);
    setSelectedIcon(cat.icon || ICON_OPTIONS[0]);
    setModalVisible(true);
  };

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) return Alert.alert('Name required');
    let updated;
    if (editTarget) {
      updated = categories.map((c) => c.id === editTarget.id ? { ...c, name: trimmed, icon: selectedIcon } : c);
    } else {
      updated = [...categories, { id: uuidv4(), name: trimmed, icon: selectedIcon }];
    }
    await saveCategories(updated);
    setCategories(updated);
    setModalVisible(false);
  };

  const confirmDelete = (cat) => {
    Alert.alert('Delete Category', `Delete "${cat.name}"? Products in this category will be uncategorized.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updated = categories.filter((c) => c.id !== cat.id);
          await saveCategories(updated);
          const products = await getProducts();
          // keep products but remove category link
          setCategories(updated);
        }
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
        <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No categories yet. Tap + to add one.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.iconBubble}>
                <Ionicons name={item.icon || 'basket'} size={22} color={COLORS.primary} />
              </View>
              <Text style={styles.cardName}>{item.name}</Text>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}>
                <Ionicons name="pencil" size={18} color={COLORS.muted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(item)} style={styles.actionBtn}>
                <Ionicons name="trash" size={18} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{editTarget ? 'Edit Category' : 'New Category'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Category name"
              placeholderTextColor={COLORS.muted}
              value={name}
              onChangeText={setName}
            />
            <Text style={styles.label}>Icon</Text>
            <View style={styles.iconGrid}>
              {ICON_OPTIONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  onPress={() => setSelectedIcon(icon)}
                  style={[styles.iconOption, selectedIcon === icon && styles.iconOptionSelected]}
                >
                  <Ionicons name={icon} size={24} color={selectedIcon === icon ? COLORS.white : COLORS.primary} />
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={save}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: COLORS.primary },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  addBtn: { padding: 4 },
  list: { padding: 16, gap: 10 },
  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 60, fontSize: 15 },
  card: { backgroundColor: COLORS.card, borderRadius: 14, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBubble: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  cardName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 6 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: COLORS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 20 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 14, color: COLORS.text, fontSize: 16, marginBottom: 16 },
  label: { fontSize: 14, color: COLORS.muted, marginBottom: 10 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  iconOption: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  iconOptionSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sheetActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelText: { color: COLORS.muted, fontWeight: '600' },
  saveBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center' },
  saveText: { color: COLORS.white, fontWeight: '700' },
});
