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

let app: FirebaseApp | null = null
let auth: Auth | null = null
let firestore: Firestore | null = null

export function getSavedConfig(): any | null {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveConfig(json: string) {
  const cfg = JSON.parse(json)
  if (!cfg.apiKey || !cfg.projectId) throw new Error('الإعداد ناقص: يجب أن يحتوي على apiKey و projectId')
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg))
}

export function clearConfig() {
  localStorage.removeItem(CONFIG_KEY)
}

export function initFirebase(): boolean {
  if (app) return true
  const cfg = getSavedConfig()
  if (!cfg) return false
  app = initializeApp(cfg)
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
