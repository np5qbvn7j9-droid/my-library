import { useRef, useState } from 'react'
import { exportAll, importAll } from '../db/db'
import { getSavedConfig, saveConfig, clearConfig, initFirebase, signIn, signOut, watchAuth, ALLOWED_EMAIL } from '../lib/firebase'
import { startSync, stopSync, syncNow } from '../lib/sync'
import { download } from '../lib/utils'

export default function SettingsPage({ user, setUser }: { user: any; setUser: (u: any) => void }) {
  const [cfgText, setCfgText] = useState(() => {
    const c = getSavedConfig()
    return c ? JSON.stringify(c, null, 2) : ''
  })
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function connect() {
    try {
      saveConfig(cfgText)
      if (!initFirebase()) throw new Error('فشل تهيئة Firebase')
      watchAuth((u) => {
        setUser(u)
        if (u) startSync()
      })
      const u = await signIn()
      setUser(u)
      startSync()
      setMsg('✅ تم الاتصال وتسجيل الدخول بنجاح — المزامنة تعمل الآن')
    } catch (e: any) {
      setMsg('❌ ' + (e.message || 'حدث خطأ'))
    }
  }

  async function doExport() {
    download(`maktabati-backup-${new Date().toISOString().slice(0, 10)}.json`, await exportAll())
  }

  async function doImport(file: File) {
    try {
      const n = await importAll(await file.text())
      setMsg(`✅ تم استيراد ${n} عنصر`)
      syncNow()
    } catch (e: any) {
      setMsg('❌ ' + e.message)
    }
  }

  return (
    <div>
      <h1 className="page-title">الإعدادات</h1>
      <p className="page-sub">المزامنة والنسخ الاحتياطي</p>

      <div className="section-h">☁️ المزامنة (Firebase)</div>
      <div className="card">
        {user ? (
          <>
            <p style={{ fontSize: 14 }}>✅ مسجل الدخول: <b>{user.email}</b> — المزامنة الفورية مفعّلة بين جميع أجهزتك.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" onClick={() => syncNow()}>🔄 مزامنة الآن</button>
              <button className="btn danger" onClick={async () => { await signOut(); stopSync(); setUser(null) }}>تسجيل الخروج</button>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.8 }}>
              التطبيق يعمل الآن محليًا على هذا الجهاز. لتفعيل المزامنة بين أجهزتك:
              أنشئ مشروعًا في <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer">Firebase Console</a> بحساب
              {' '}<b>{ALLOWED_EMAIL}</b>، فعّل Firestore وGoogle Sign-in، ثم الصق إعدادات المشروع (firebaseConfig) هنا.
              التفاصيل خطوة بخطوة في ملف README داخل المشروع.
            </p>
            <textarea
              className="input" dir="ltr" rows={8} style={{ fontFamily: 'monospace', fontSize: 12 }}
              placeholder={'{\n  "apiKey": "...",\n  "authDomain": "...",\n  "projectId": "...",\n  "storageBucket": "...",\n  "messagingSenderId": "...",\n  "appId": "..."\n}'}
              value={cfgText} onChange={(e) => setCfgText(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button className="btn primary" onClick={connect} disabled={!cfgText.trim()}>حفظ وتسجيل الدخول</button>
              {getSavedConfig() && (
                <button className="btn danger" onClick={() => { clearConfig(); setCfgText(''); setMsg('تم حذف الإعدادات — أعد تحميل الصفحة') }}>حذف الإعدادات</button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="section-h">💾 النسخ الاحتياطي</div>
      <div className="card">
        <p style={{ fontSize: 13.5, color: 'var(--text-2)' }}>
          صدّر كامل بياناتك (ملاحظات، أقسام، اقتباسات، مراجع…) كملف JSON واحفظه في مكان آمن، أو استورد نسخة سابقة.
          الاستيراد يدمج البيانات ولا يحذف شيئًا (الأحدث يفوز).
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn primary" onClick={doExport}>⬇️ تصدير كل البيانات</button>
          <button className="btn" onClick={() => fileRef.current?.click()}>⬆️ استيراد نسخة</button>
          <input ref={fileRef} type="file" accept=".json" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) doImport(f); e.target.value = '' }} />
        </div>
      </div>

      <div className="section-h">ℹ️ عن التطبيق</div>
      <div className="card" style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.9 }}>
        <b style={{ color: 'var(--text)' }}>مكتبتي</b> — نظام إدارة المعرفة الشخصي · الإصدار 1.0.0
        <br />بياناتك تُخزن محليًا على جهازك (IndexedDB) وتُزامَن مع حسابك الخاص في Firebase عند التفعيل.
        <br />التطبيق شخصي ومقفل على الحساب {ALLOWED_EMAIL}.
      </div>

      {msg && <div className="card" style={{ marginTop: 14, fontSize: 14 }}>{msg}</div>}
    </div>
  )
}
