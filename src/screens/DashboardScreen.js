import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getProducts, getCategories } from '../storage/storage';
import { averageDays, formatDuration, estimateMonthlyCost } from '../utils/dateUtils';
import { COLORS } from '../utils/theme';

export default function DashboardScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getProducts(), getCategories()]).then(([prods, cats]) => {
        setProducts(prods);
        setCategories(cats);
      });
    }, [])
  );

  const totalMonthly = products.reduce((sum, p) => {
    const avg = averageDays(p.periods);
    const m = estimateMonthlyCost(p.price, avg);
    return sum + (m ? parseFloat(m) : 0);
  }, 0);

  const productsWithData = products.filter((p) => averageDays(p.periods) !== null);
  const categorySpend = categories.map((cat) => {
    const catProducts = products.filter((p) => p.categoryId === cat.id);
    const monthly = catProducts.reduce((sum, p) => {
      const avg = averageDays(p.periods);
      const m = estimateMonthlyCost(p.price, avg);
      return sum + (m ? parseFloat(m) : 0);
    }, 0);
    return { ...cat, monthly, count: catProducts.length };
  }).filter((c) => c.monthly > 0).sort((a, b) => b.monthly - a.monthly);

  const recentProducts = [...products]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>Welcome to</Text>
          <Text style={styles.headerTitle}>The Golden Compass</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Products', { screen: 'ProductForm' })} style={styles.addBtn}>
          <Ionicons name="add-circle" size={32} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Monthly spend hero */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Estimated Monthly Spend</Text>
          <Text style={styles.heroAmount}>${totalMonthly.toFixed(2)}</Text>
          <Text style={styles.heroSub}>${(totalMonthly * 12).toFixed(2)} / year · {productsWithData.length} tracked products</Text>
        </View>

        {/* Quick stats */}
        <View style={styles.quickStats}>
          <View style={styles.quickStat}>
            <Ionicons name="cube-outline" size={22} color={COLORS.primary} />
            <Text style={styles.quickStatValue}>{products.length}</Text>
            <Text style={styles.quickStatLabel}>Products</Text>
          </View>
          <View style={styles.quickStat}>
            <Ionicons name="folder-outline" size={22} color={COLORS.primary} />
            <Text style={styles.quickStatValue}>{categories.length}</Text>
            <Text style={styles.quickStatLabel}>Categories</Text>
          </View>
          <View style={styles.quickStat}>
            <Ionicons name="checkmark-circle-outline" size={22} color={COLORS.success} />
            <Text style={styles.quickStatValue}>{productsWithData.length}</Text>
            <Text style={styles.quickStatLabel}>With Averages</Text>
          </View>
        </View>

        {/* Category breakdown */}
        {categorySpend.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Spend by Category</Text>
            {categorySpend.map((cat) => (
              <View key={cat.id} style={styles.catRow}>
                <View style={styles.catIcon}>
                  <Ionicons name={cat.icon || 'basket'} size={18} color={COLORS.primary} />
                </View>
                <View style={styles.catInfo}>
                  <Text style={styles.catName}>{cat.name}</Text>
                  <Text style={styles.catCount}>{cat.count} product{cat.count !== 1 ? 's' : ''}</Text>
                </View>
                <Text style={styles.catMonthly}>${cat.monthly.toFixed(2)}/mo</Text>
              </View>
            ))}
          </>
        )}

        {/* Recent products */}
        {recentProducts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recently Updated</Text>
            {recentProducts.map((p) => {
              const avg = averageDays(p.periods);
              const cat = categories.find((c) => c.id === p.categoryId);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={styles.recentCard}
                  onPress={() => navigation.navigate('Products', { screen: 'ProductDetail', params: { productId: p.id } })}
                >
                  <View style={styles.recentIcon}>
                    <Ionicons name={cat?.icon || 'basket'} size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.recentInfo}>
                    <Text style={styles.recentName}>{p.name}</Text>
                    <Text style={styles.recentCat}>{cat?.name || 'Uncategorized'}</Text>
                  </View>
                  <View style={styles.recentRight}>
                    <Text style={styles.recentDuration}>{formatDuration(avg)}</Text>
                    <Text style={styles.recentDurationLabel}>avg life</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {products.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="flask-outline" size={60} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>Nothing tracked yet</Text>
            <Text style={styles.emptyText}>Add your first product to start tracking how long it lasts and what it costs per month.</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('Products')}
            >
              <Text style={styles.emptyBtnText}>Add a Product</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 24, backgroundColor: COLORS.primary },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.white },
  addBtn: { padding: 4 },
  body: { padding: 16 },
  heroCard: { backgroundColor: COLORS.primary, borderRadius: 20, padding: 24, marginBottom: 16, alignItems: 'center' },
  heroLabel: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 6 },
  heroAmount: { fontSize: 48, fontWeight: '900', color: COLORS.white },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 6 },
  quickStats: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  quickStat: { flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 16, alignItems: 'center', gap: 4 },
  quickStatValue: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  quickStatLabel: { fontSize: 11, color: COLORS.muted },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  catRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 8, gap: 12 },
  catIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  catInfo: { flex: 1 },
  catName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  catCount: { fontSize: 12, color: COLORS.muted },
  catMonthly: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  recentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 12, padding: 14, marginBottom: 8, gap: 12 },
  recentIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  recentInfo: { flex: 1 },
  recentName: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  recentCat: { fontSize: 12, color: COLORS.muted },
  recentRight: { alignItems: 'center' },
  recentDuration: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  recentDurationLabel: { fontSize: 11, color: COLORS.muted },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.muted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20, marginBottom: 24 },
  emptyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  emptyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});
