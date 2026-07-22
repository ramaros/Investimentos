import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  addDoc, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy
} from "firebase/firestore";

// Read from config file contents or dynamic user-defined custom configuration
const defaultFirebaseConfig = {
  projectId: "analytical-falcon-sskkt",
  appId: "1:497656025148:web:172d7f13ae7fc1e686f339",
  apiKey: "AIzaSyAhmixqf1xtZbZ8haJHl2iLsxb26gfzBA0",
  authDomain: "analytical-falcon-sskkt.firebaseapp.com",
  storageBucket: "analytical-falcon-sskkt.firebasestorage.app",
  messagingSenderId: "497656025148"
};

let firebaseConfig = defaultFirebaseConfig;

try {
  const customConfigStr = localStorage.getItem("custom_firebase_config");
  if (customConfigStr) {
    const parsed = JSON.parse(customConfigStr);
    if (parsed && parsed.projectId && parsed.apiKey) {
      firebaseConfig = parsed;
      console.log("Firebase inicializado com projeto customizado:", firebaseConfig.projectId);
    }
  }
} catch (e) {
  console.error("Erro ao carregar configuração personalizada do Firebase:", e);
}

// Initialize Firebase safely
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Erro no login com Google:", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Erro ao fazer logout:", error);
    throw error;
  }
};

export { onAuthStateChanged };
export type { User };
