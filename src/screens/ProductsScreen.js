import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, SafeAreaView, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getProducts, saveProducts, getCategories } from '../storage/storage';
import { averageDays, formatDuration, estimateMonthlyCost } from '../utils/dateUtils';
import { COLORS } from '../utils/theme';

export default function ProductsScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCatId, setFilterCatId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getProducts(), getCategories()]).then(([prods, cats]) => {
        setProducts(prods);
        setCategories(cats);
      });
    }, [])
  );

  const confirmDelete = (product) => {
    Alert.alert('Delete Product', `Delete "${product.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const all = await getProducts();
          const updated = all.filter((p) => p.id !== product.id);
          await saveProducts(updated);
          setProducts(updated);
        }
      },
    ]);
  };

  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCatId ? p.categoryId === filterCatId : true;
    return matchesSearch && matchesCat;
  });

  const getCategoryName = (id) => categories.find((c) => c.id === id)?.name || '';
  const getCategoryIcon = (id) => categories.find((c) => c.id === id)?.icon || 'basket';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Products</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ProductForm')} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={COLORS.muted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={COLORS.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {categories.length > 0 && (
        <View style={styles.filterRow}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ id: null, name: 'All', icon: 'apps' }, ...categories]}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterChip, filterCatId === item.id && styles.filterChipActive]}
                onPress={() => setFilterCatId(item.id)}
              >
                <Ionicons
                  name={item.icon}
                  size={14}
                  color={filterCatId === item.id ? COLORS.white : COLORS.primary}
                />
                <Text style={[styles.filterChipText, filterCatId === item.id && styles.filterChipTextActive]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No products yet. Tap + to add one.</Text>}
        renderItem={({ item }) => {
          const avg = averageDays(item.periods);
          const monthly = estimateMonthlyCost(item.price, avg);
          const completedPeriods = item.periods?.filter((p) => p.startDate && p.endDate).length || 0;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            >
              <View style={styles.cardTop}>
                <View style={styles.cardIconWrap}>
                  <Ionicons name={getCategoryIcon(item.categoryId)} size={20} color={COLORS.primary} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  {item.categoryId ? (
                    <Text style={styles.cardCat}>{getCategoryName(item.categoryId)}</Text>
                  ) : null}
                </View>
                <View style={styles.cardRight}>
                  <TouchableOpacity onPress={() => navigation.navigate('ProductForm', { product: item })} style={styles.iconBtn}>
                    <Ionicons name="pencil" size={16} color={COLORS.muted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDelete(item)} style={styles.iconBtn}>
                    <Ionicons name="trash" size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{formatDuration(avg)}</Text>
                  <Text style={styles.statLabel}>Avg Duration</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{completedPeriods}/3</Text>
                  <Text style={styles.statLabel}>Periods</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{item.price ? `$${item.price}` : '—'}</Text>
                  <Text style={styles.statLabel}>Price</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statValue}>{monthly ? `$${monthly}` : '—'}</Text>
                  <Text style={styles.statLabel}>Monthly</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: COLORS.primary },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.white },
  addBtn: { padding: 4 },
  searchRow: { paddingHorizontal: 16, paddingVertical: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 12, gap: 8, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, padding: 10, color: COLORS.text, fontSize: 15 },
  filterRow: { marginBottom: 4 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterChipText: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },
  filterChipTextActive: { color: COLORS.white },
  list: { padding: 16, gap: 12 },
  empty: { textAlign: 'center', color: COLORS.muted, marginTop: 60, fontSize: 15 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardIconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  cardCat: { fontSize: 13, color: COLORS.muted, marginTop: 2 },
  cardRight: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 6 },
  statsRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg, borderRadius: 10, padding: 12 },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  statLabel: { fontSize: 11, color: COLORS.muted, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: COLORS.border },
});
