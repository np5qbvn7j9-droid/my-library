// Firebase is optional: the app is fully functional offline (IndexedDB).
// When a config is saved in Settings, sign-in + sync are enabled.
import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut,
  onAuthStateChanged, type Auth, type User,
} from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

export const ALLOWED_EMAIL = 'gazzy155@gmail.com'
const CONFIG_KEY = 'maktabati-firebase-config'

// Built-in project config (personal single-user app; these identifiers are
// safe to embed — data is protected by Firestore rules locked to ALLOWED_EMAIL)
const DEFAULT_CONFIG = {
  apiKey: 'AIzaSyBBFbtQ4Kmd8wajVDern-Nfrk2c3r-oT8I',
  authDomain: 'maktabati-fe247.firebaseapp.com',
  projectId: 'maktabati-fe247',
  storageBucket: 'maktabati-fe247.firebasestorage.app',
  messagingSenderId: '981125551324',
  appId: '1:981125551324:web:6ac8af0e40314421565019',
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let firestore: Firestore | null = null

export function initFirebase(): boolean {
  if (app) return true
  // Old builds stored a pasted config; the built-in one is authoritative now
  localStorage.removeItem(CONFIG_KEY)
  app = initializeApp(DEFAULT_CONFIG)
  auth = getAuth(app)
  firestore = getFirestore(app)
  return true
}

export const getDb = () => firestore
export const getAuthUser = () => auth?.currentUser ?? null

export function watchAuth(cb: (user: User | null) => void): () => void {
  if (!auth) return () => {}
  return onAuthStateChanged(auth, (user) => {
    // Personal app: reject any Google account other than the owner's
    if (user && user.email !== ALLOWED_EMAIL) {
      fbSignOut(auth!)
      alert(`هذا التطبيق شخصي. يُسمح فقط بالحساب ${ALLOWED_EMAIL}`)
      cb(null)
      return
    }
    cb(user)
  })
}

export async function signIn() {
  if (!auth) throw new Error('Firebase غير مهيأ — أضف الإعدادات أولًا')
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ login_hint: ALLOWED_EMAIL })
  const result = await signInWithPopup(auth, provider)
  if (result.user.email !== ALLOWED_EMAIL) {
    await fbSignOut(auth)
    throw new Error(`يُسمح فقط بالحساب ${ALLOWED_EMAIL}`)
  }
  return result.user
}

export async function signOut() {
  if (auth) await fbSignOut(auth)
}
