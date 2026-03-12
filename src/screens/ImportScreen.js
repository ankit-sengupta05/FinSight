import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  TextInput, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { parseSMS } from '../utils/smsParser';
import { saveTransaction } from '../utils/transactionStore';

const SAMPLE_SMS = [
  "Dear Customer, Rs.1,250.00 debited from your A/c XX1234 at ZOMATO on 10-03-2026. Avl Bal: Rs.45,230.00",
  "Your HDFC Bank A/c XX5678 has been debited Rs.499.00 for Netflix subscription on 09-03-2026",
  "UPI: Rs.850.00 paid to Uber Technologies. Ref No 123456789. -ICICI Bank",
  "Alert: INR 3,200.00 debited from SBI A/c XX9012 at Amazon on 08-03-2026. Bal: Rs.12,450.00",
  "Rs.650 debited from your Kotak A/c for Apollo Pharmacy on 07-03-2026",
];

export default function ImportScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [smsText, setSmsText] = useState('');
  const [parsed, setParsed] = useState(null);
  const [saving, setSaving] = useState(false);

  function handleParse() {
    if (!smsText.trim()) return;
    const result = parseSMS(smsText);
    if (!result) {
      Alert.alert(
        'Not Recognized',
        "Doesn't look like a bank debit SMS. Try a sample below."
      );
      return;
    }
    setParsed(result);
  }

  async function handleSave() {
    if (!parsed) return;
    setSaving(true);
    try {
      await saveTransaction(user.uid, parsed);
      setSmsText('');
      setParsed(null);
      // ✅ Navigate to Dashboard immediately after save
      Alert.alert(
        'Saved!',
        'Transaction added successfully.',
        [
          {
            text: 'View Dashboard',
            onPress: () => navigation.navigate('Dashboard'),
          },
          { text: 'Add More', style: 'cancel' },
        ]
      );
    } catch (e) {
      Alert.alert('Error saving', e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.header}>Import SMS</Text>
      <Text style={styles.sub}>Paste a bank SMS to auto-detect the transaction</Text>

      <TextInput
        style={styles.input}
        placeholder="Paste bank SMS here..."
        placeholderTextColor="#444"
        value={smsText}
        onChangeText={t => { setSmsText(t); setParsed(null); }}
        multiline
        numberOfLines={5}
      />

      <TouchableOpacity
        style={[styles.btn, !smsText.trim() && styles.btnDisabled]}
        onPress={handleParse}
        disabled={!smsText.trim()}
      >
        <Text style={styles.btnText}>🔍 Parse SMS</Text>
      </TouchableOpacity>

      {parsed && (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>Transaction Detected</Text>
          <Row label="Amount" value={`₹${parsed.amount.toLocaleString('en-IN')}`} accent="#43e97b" />
          <Row label="Merchant" value={parsed.merchant} />
          <Row label="Category" value={parsed.category} />
          <Row label="Date" value={new Date(parsed.date).toLocaleDateString('en-IN')} />

          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#43e97b', marginTop: 16 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#000" />
              : <Text style={[styles.btnText, { color: '#000' }]}>
                  💾 Save Transaction
                </Text>
            }
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sampleTitle}>Try a Sample SMS</Text>
      {SAMPLE_SMS.map((s, i) => (
        <TouchableOpacity
          key={i}
          style={styles.sampleChip}
          onPress={() => { setSmsText(s); setParsed(null); }}
        >
          <Text style={styles.sampleText} numberOfLines={2}>{s}</Text>
        </TouchableOpacity>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function Row({ label, value, accent }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, accent && { color: accent }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f', padding: 16 },
  header: {
    fontSize: 28, fontWeight: '800', color: '#fff',
    marginTop: 52, marginBottom: 4,
  },
  sub: { color: '#555', fontSize: 14, marginBottom: 20 },
  input: {
    backgroundColor: '#141420', color: '#fff', borderRadius: 14,
    padding: 16, fontSize: 13, borderWidth: 1, borderColor: '#2a2a4a',
    minHeight: 110, textAlignVertical: 'top', marginBottom: 14,
  },
  btn: {
    backgroundColor: '#6c63ff', borderRadius: 14,
    padding: 16, alignItems: 'center', marginBottom: 8,
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  result: {
    backgroundColor: '#141420', borderRadius: 16, padding: 18,
    marginTop: 8, borderWidth: 1, borderColor: '#2a2a4a',
  },
  resultTitle: { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  rowLabel: { color: '#666', fontSize: 14 },
  rowValue: {
    color: '#fff', fontWeight: '600', fontSize: 14,
    maxWidth: '60%', textAlign: 'right',
  },
  sampleTitle: { color: '#444', fontSize: 13, marginTop: 28, marginBottom: 10 },
  sampleChip: {
    backgroundColor: '#141420', borderRadius: 10, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: '#1e1e30',
  },
  sampleText: { color: '#666', fontSize: 12 },
});
