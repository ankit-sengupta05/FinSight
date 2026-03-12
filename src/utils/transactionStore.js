import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COL = 'transactions';

export async function saveTransaction(userId, tx) {
  try {
    const payload = {
      amount: tx.amount,
      merchant: tx.merchant || 'Unknown',
      category: tx.category || 'Others',
      date: tx.date || new Date().toISOString(),
      rawSMS: tx.rawSMS || '',
      id: tx.id || `tx_${Date.now()}`,
      userId: userId,
      createdAt: new Date().toISOString(),
    };
    console.log('Saving payload:', JSON.stringify(payload));
    const ref = await addDoc(collection(db, COL), payload);
    console.log('Saved! Doc ID:', ref.id);
    return ref;
  } catch (e) {
    console.log('SAVE ERROR:', e.message);
    throw e;
  }
}

export async function getTransactions(userId) {
  try {
    console.log('Fetching for userId:', userId);
    // Simple query — no orderBy, no composite index needed
    const q = query(
      collection(db, COL),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    console.log('Total docs fetched:', snap.size);
    const txs = snap.docs.map(d => {
      const data = d.data();
      console.log('Doc data:', JSON.stringify(data));
      return { docId: d.id, ...data };
    });
    // Sort locally by date descending
    return txs.sort((a, b) => {
      return new Date(b.date || 0) - new Date(a.date || 0);
    });
  } catch (e) {
    console.log('FETCH ERROR:', e.message);
    return [];
  }
}

export async function deleteTransaction(docId) {
  return deleteDoc(doc(db, COL, docId));
}

export function summarizeByCategory(transactions) {
  const summary = {};
  transactions.forEach(tx => {
    if (tx.category && tx.amount) {
      summary[tx.category] = (summary[tx.category] || 0) + Number(tx.amount);
    }
  });
  return Object.entries(summary)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
}
