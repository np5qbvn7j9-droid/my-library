// Local-first sync engine.
// Writes always land in IndexedDB first (dirty=1); this engine pushes dirty rows
// to Firestore and pulls remote changes newer than the last pull cursor.
// Conflict resolution: last-write-wins on updatedAt.
import {
  collection, doc, getDocs, limit, orderBy, query, where, writeBatch,
} from 'firebase/firestore'
import { db, SYNC_TABLES, getMeta, setMeta, onLocalWrite, type SyncTable } from '../db/db'
import { getDb, getAuthUser } from './firebase'

export type SyncStatus = 'off' | 'idle' | 'syncing' | 'error'
let status: SyncStatus = 'off'
let lastSyncAt = 0
const listeners: Array<(s: SyncStatus, t: number) => void> = []

export const onSyncStatus = (fn: (s: SyncStatus, t: number) => void) => {
  listeners.push(fn)
  fn(status, lastSyncAt)
}
const setStatus = (s: SyncStatus) => {
  status = s
  listeners.forEach((f) => f(s, lastSyncAt))
}

let pushTimer: any = null
let pullTimer: any = null
let running = false

function colRef(table: SyncTable) {
  const fs = getDb()
  const user = getAuthUser()
  if (!fs || !user) return null
  return collection(fs, 'users', user.uid, table)
}

async function pushTable(table: SyncTable) {
  const ref = colRef(table)
  if (!ref) return
  const dirty = await (db as any)[table].where('dirty').equals(1).limit(400).toArray()
  if (!dirty.length) return
  const fs = getDb()!
  // Firestore batches max 500 writes
  for (let i = 0; i < dirty.length; i += 400) {
    const batch = writeBatch(fs)
    const chunk = dirty.slice(i, i + 400)
    for (const row of chunk) {
      const { dirty: _d, ...clean } = row
      batch.set(doc(ref, row.id), clean)
    }
    await batch.commit()
    for (const row of chunk) await (db as any)[table].update(row.id, { dirty: 0 })
  }
}

async function pullTable(table: SyncTable) {
  const ref = colRef(table)
  if (!ref) return
  const cursorKey = `pull-${table}`
  let last: number = (await getMeta(cursorKey)) || 0
  while (true) {
    const snap = await getDocs(query(ref, where('updatedAt', '>', last), orderBy('updatedAt'), limit(300)))
    if (snap.empty) break
    for (const d of snap.docs) {
      const remote: any = d.data()
      remote.id = d.id
      const local = await (db as any)[table].get(d.id)
      // Skip if our local copy is newer or has unpushed edits that are newer
      if (!local || (remote.updatedAt || 0) > (local.updatedAt || 0)) {
        await (db as any)[table].put({ ...remote, dirty: 0 })
      }
      last = Math.max(last, remote.updatedAt || 0)
    }
    await setMeta(cursorKey, last)
    if (snap.size < 300) break
  }
}

export async function syncNow() {
  if (running) return
  if (!getDb() || !getAuthUser()) {
    setStatus('off')
    return
  }
  running = true
  setStatus('syncing')
  try {
    for (const t of SYNC_TABLES) await pushTable(t)
    for (const t of SYNC_TABLES) await pullTable(t)
    lastSyncAt = Date.now()
    setStatus('idle')
  } catch (e) {
    console.error('sync failed', e)
    setStatus('error')
  } finally {
    running = false
  }
}

const schedulePush = () => {
  clearTimeout(pushTimer)
  pushTimer = setTimeout(syncNow, 2500) // debounce rapid edits
}

export function startSync() {
  onLocalWrite(schedulePush)
  syncNow()
  clearInterval(pullTimer)
  pullTimer = setInterval(syncNow, 60_000)
  window.addEventListener('online', syncNow)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncNow()
  })
}

export function stopSync() {
  clearInterval(pullTimer)
  clearTimeout(pushTimer)
  setStatus('off')
}
