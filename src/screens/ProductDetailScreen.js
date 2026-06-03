import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getProducts, getCategories } from '../storage/storage';
import { daysBetween, averageDays, formatDate, formatDuration, estimateMonthlyCost } from '../utils/dateUtils';
import { COLORS } from '../utils/theme';

export default function ProductDetailScreen({ navigation, route }) {
  const { productId } = route.params;
  const [product, setProduct] = useState(null);
  const [category, setCategory] = useState(null);

  useFocusEffect(
    useCallback(() => {
      Promise.all([getProducts(), getCategories()]).then(([prods, cats]) => {
        const p = prods.find((x) => x.id === productId);
        setProduct(p);
        if (p?.categoryId) setCategory(cats.find((c) => c.id === p.categoryId) || null);
      });
    }, [productId])
  );

  if (!product) return null;

  const avg = averageDays(product.periods);
  const monthly = estimateMonthlyCost(product.price, avg);
  const yearly = monthly ? (parseFloat(monthly) * 12).toFixed(2) : null;
  const completedPeriods = product.periods?.filter((p) => p.startDate && p.endDate) || [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ProductForm', { product })} style={styles.editBtn}>
          <Ionicons name="pencil" size={18} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryIconRow}>
            <View style={styles.bigIcon}>
              <Ionicons name={category?.icon || 'basket'} size={32} color={COLORS.primary} />
            </View>
            {category && <Text style={styles.catTag}>{category.name}</Text>}
          </View>
          <Text style={styles.productName}>{product.name}</Text>
          {product.notes ? <Text style={styles.notes}>{product.notes}</Text> : null}
        </View>

        {/* Budget Stats */}
        <Text style={styles.sectionTitle}>Budget Insights</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statBig}>{formatDuration(avg)}</Text>
            <Text style={styles.statLabel}>Avg Lifespan</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBig}>{product.price ? `$${product.price}` : '—'}</Text>
            <Text style={styles.statLabel}>Unit Price</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBig}>{monthly ? `$${monthly}` : '—'}</Text>
            <Text style={styles.statLabel}>Monthly Cost</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statBig}>{yearly ? `$${yearly}` : '—'}</Text>
            <Text style={styles.statLabel}>Yearly Cost</Text>
          </View>
        </View>

        {/* Usage Periods */}
        <Text style={styles.sectionTitle}>Usage Periods</Text>
        {product.periods?.map((period, index) => {
          const hasData = period.startDate || period.endDate;
          const days = period.startDate && period.endDate ? daysBetween(period.startDate, period.endDate) : null;
          return (
            <View key={period.id} style={[styles.periodCard, !hasData && styles.periodCardEmpty]}>
              <View style={styles.periodHeader}>
                <View style={[styles.periodBadge, !hasData && styles.periodBadgeEmpty]}>
                  <Text style={[styles.periodBadgeText, !hasData && styles.periodBadgeTextEmpty]}>
                    Period {index + 1}
                  </Text>
                </View>
                {days !== null && (
                  <View style={styles.daysBadge}>
                    <Text style={styles.daysBadgeText}>{days} days</Text>
                  </View>
                )}
              </View>
              {hasData ? (
                <View style={styles.dateRange}>
                  <View style={styles.dateItem}>
                    <Text style={styles.dateItemLabel}>Opened</Text>
                    <Text style={styles.dateItemValue}>{formatDate(period.startDate)}</Text>
                  </View>
                  <View style={styles.dateLine} />
                  <View style={styles.dateItem}>
                    <Text style={styles.dateItemLabel}>Finished</Text>
                    <Text style={styles.dateItemValue}>{formatDate(period.endDate)}</Text>
                  </View>
                </View>
              ) : (
                <Text style={styles.emptyPeriod}>No dates recorded</Text>
              )}
            </View>
          );
        })}

        {completedPeriods.length > 1 && (
          <View style={styles.avgCard}>
            <Ionicons name="stats-chart" size={20} color={COLORS.primary} />
            <Text style={styles.avgText}>
              Average across {completedPeriods.length} periods: <Text style={styles.avgBold}>{avg} days ({formatDuration(avg)})</Text>
            </Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: COLORS.primary, gap: 12 },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.white },
  editBtn: { padding: 4 },
  body: { padding: 16 },
  summaryCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, marginBottom: 20 },
  summaryIconRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  bigIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  catTag: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  productName: { fontSize: 24, fontWeight: '700', color: COLORS.text },
  notes: { fontSize: 14, color: COLORS.muted, marginTop: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statBox: { flex: 1, minWidth: '45%', backgroundColor: COLORS.white, borderRadius: 14, padding: 16, alignItems: 'center' },
  statBig: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 12, color: COLORS.muted, marginTop: 4 },
  periodCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  periodCardEmpty: { borderStyle: 'dashed', opacity: 0.6 },
  periodHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  periodBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  periodBadgeEmpty: { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border },
  periodBadgeText: { fontSize: 12, fontWeight: '700', color: COLORS.white },
  periodBadgeTextEmpty: { color: COLORS.muted },
  daysBadge: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  daysBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  dateRange: { flexDirection: 'row', alignItems: 'center' },
  dateItem: { flex: 1, alignItems: 'center' },
  dateItemLabel: { fontSize: 11, color: COLORS.muted, marginBottom: 4 },
  dateItemValue: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  dateLine: { width: 40, height: 1, backgroundColor: COLORS.border },
  emptyPeriod: { fontSize: 14, color: COLORS.muted, fontStyle: 'italic' },
  avgCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.primaryLight, borderRadius: 12, padding: 14, marginTop: 4 },
  avgText: { flex: 1, fontSize: 14, color: COLORS.text },
  avgBold: { fontWeight: '700', color: COLORS.primary },
});
