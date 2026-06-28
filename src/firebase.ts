import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import firebaseAppletConfig from "../firebase-applet-config.json";

const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey || "AIzaSyDuZiVoJP37dUDyVfVAm-byhSIEQawvdv4",
  authDomain: firebaseAppletConfig.authDomain || "vast-summit-scf5x.firebaseapp.com",
  projectId: firebaseAppletConfig.projectId || "vast-summit-scf5x",
  storageBucket: firebaseAppletConfig.storageBucket || "vast-summit-scf5x.firebasestorage.app",
  messagingSenderId: firebaseAppletConfig.messagingSenderId || "762855733058",
  appId: firebaseAppletConfig.appId || "1:762855733058:web:01372b69009583b384badb"
};

const databaseId = firebaseAppletConfig.firestoreDatabaseId || "ai-studio-scbcare-0ebf1055-3711-4c8d-8f1b-9caa30cfce7e";

// Guard initialization to avoid crashing if Firebase services fail or are blocked in sandbox
let app;
let auth: any = null;
let db: any = null;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app, databaseId);
} catch (error) {
  console.error("Firebase failed to initialize:", error);
}

const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider, databaseId };

