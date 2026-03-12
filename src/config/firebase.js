import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hardcoded for EAS build — Constants.expoConfig not available in build env
const firebaseConfig = {
  apiKey: "AIzaSyBJTwHJwWgoWJp5M_0uf6UdRTeaXX-SwsE",
  authDomain: "smartbudgetmanager-4b49d.firebaseapp.com",
  projectId: "smartbudgetmanager-4b49d",
  storageBucket: "smartbudgetmanager-4b49d.firebasestorage.app",
  messagingSenderId: "377907920842",
  appId: "1:377907920842:android:9a5456349a1d3ec7a9d933",
};

let app;
let auth;
let db;

try {
  app = getApps().length === 0
    ? initializeApp(firebaseConfig)
    : getApps()[0];

  try {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (e) {
    auth = getAuth(app);
  }

  db = getFirestore(app);
} catch (e) {
  console.log('Firebase init error:', e.message);
}

export { auth, db };
