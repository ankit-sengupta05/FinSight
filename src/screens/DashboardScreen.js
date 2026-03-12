import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getTransactions, summarizeByCategory } from '../utils/transactionStore';

const COLORS = [
  '#6c63ff', '#ff6584', '#43e97b', '#f7971e',
  '#4facfe', '#f093fb', '#a8edea', '#ffecd2',
];
const W = Dimensions.get('window').width;

export default function DashboardScreen() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      console.log('Loading transactions for user:', user.uid);
      const txs = await getTransactions(user.uid);
      console.log('Transactions fetched:', txs.length);
      setTransactions(txs);
    } catch (e) {
      console.log('Dashboard load error:', e.message);
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  // Reload every time tab is focused
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const summary = summarizeByCategory(transactions);

  const totalSpent = transactions.reduce(
    (s, t) => s + Number(t.amount || 0), 0
  );

  const now = new Date();
  const monthSpent = transactions
    .filter(t => {
      const d = new Date(t.date);
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  const pieData = summary.slice(0, 6).map((item, i) => ({
    name: item.name,
    population: Math.round(item.total),
    color: COLORS[i % COLORS.length],
    legendFontColor: '#aaa',
    legendFontSize: 11,
  }));

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#6c63ff" size="large" />
        <Text style={styles.loadingText}>Loading transactions...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor="#6c63ff"
          colors={['#6c63ff']}
        />
      }
    >
      <Text style={styles.header}>Overview</Text>

      {/* Summary Cards */}
      <View style={styles.cards}>
        <View style={[styles.card, { backgroundColor: '#1a1a3e' }]}>
          <Text style={styles.cardLabel}>💰 Total Spent</Text>
          <Text style={styles.cardValue}>
            ₹{totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
          <Text style={styles.cardSub}>{transactions.length} transactions</Text>
        </View>
        <View style={[styles.card, { backgroundColor: '#1a2e1a' }]}>
          <Text style={styles.cardLabel}>📅 This Month</Text>
          <Text style={[styles.cardValue, { color: '#43e97b' }]}>
            ₹{monthSpent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </Text>
          <Text style={styles.cardSub}>
            {transactions.filter(t => {
              const d = new Date(t.date);
              return (
                d.getMonth() === now.getMonth() &&
                d.getFullYear() === now.getFullYear()
              );
            }).length} this month
          </Text>
        </View>
      </View>

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Spending by Category</Text>
          <View style={styles.chartBox}>
            <PieChart
              data={pieData}
              width={W - 64}
              height={200}
              chartConfig={{
                color: (opacity = 1) => `rgba(255,255,255,${opacity})`,
                backgroundColor: 'transparent',
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="10"
              absolute
            />
          </View>
        </View>
      )}

      {/* Category Breakdown */}
      {summary.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏷️ By Category</Text>
          {summary.map((item, i) => {
            const pct = totalSpent > 0
              ? Math.round((item.total / totalSpent) * 100)
              : 0;
            return (
              <View key={item.name} style={styles.catRow}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: COLORS[i % COLORS.length] },
                  ]}
                />
                <Text style={styles.catName}>{item.name}</Text>
                <View style={styles.catRight}>
                  <Text style={styles.catPct}>{pct}%</Text>
                  <Text style={styles.catAmount}>
                    ₹{item.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Recent Transactions */}
      <View style={[styles.section, { marginBottom: 40 }]}>
        <Text style={styles.sectionTitle}>
          🕐 Recent Transactions ({transactions.length})
        </Text>

        {transactions.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.empty}>No transactions yet</Text>
            <Text style={styles.emptySub}>
              Go to Import tab and paste a bank SMS to get started!
            </Text>
          </View>
        ) : (
          transactions.slice(0, 20).map((tx, i) => (
            <View key={tx.docId || tx.id || i} style={styles.txRow}>
              <View style={styles.txIconBox}>
                <Text style={styles.txIcon}>
                  {getCategoryIcon(tx.category)}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.txMerchant} numberOfLines={1}>
                  {tx.merchant}
                </Text>
                <Text style={styles.txMeta}>
                  {tx.category} •{' '}
                  {new Date(tx.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              <Text style={styles.txAmount}>
                -₹{Number(tx.amount || 0).toLocaleString('en-IN')}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function getCategoryIcon(category) {
  const icons = {
    Food: '🍕',
    Transport: '🚗',
    Shopping: '🛍️',
    Entertainment: '🎬',
    Health: '🏥',
    Utilities: '⚡',
    Finance: '💰',
    Groceries: '🛒',
    Others: '💳',
  };
  return icons[category] || '💳';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#555', marginTop: 12, fontSize: 14 },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginTop: 52,
    marginBottom: 20,
  },
  cards: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  card: { flex: 1, borderRadius: 16, padding: 16 },
  cardLabel: { color: '#888', fontSize: 11, marginBottom: 6 },
  cardValue: { color: '#fff', fontSize: 18, fontWeight: '800' },
  cardSub: { color: '#555', fontSize: 11, marginTop: 4 },
  section: { marginTop: 24 },
  sectionTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 14,
  },
  chartBox: {
    backgroundColor: '#141420',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e1e30',
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141420',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e1e30',
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  catName: { flex: 1, color: '#ccc', fontSize: 14 },
  catRight: { alignItems: 'flex-end' },
  catPct: { color: '#555', fontSize: 11 },
  catAmount: { color: '#fff', fontWeight: '700', fontSize: 13 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141420',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e1e30',
    gap: 12,
  },
  txIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1e1e38',
    justifyContent: 'center',
    alignItems: 'center',
  },
  txIcon: { fontSize: 20 },
  txMerchant: { color: '#fff', fontWeight: '600', fontSize: 14 },
  txMeta: { color: '#555', fontSize: 12, marginTop: 2 },
  txAmount: { color: '#ff6584', fontWeight: '700', fontSize: 14 },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  empty: { color: '#555', fontSize: 16, fontWeight: '600' },
  emptySub: {
    color: '#444',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
