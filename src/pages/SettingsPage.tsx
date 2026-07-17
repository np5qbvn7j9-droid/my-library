import { useEffect, useRef, useState } from 'react'
import {
  Palette, Type, Cloud, DatabaseBackup, Info, LayoutGrid, List, StretchHorizontal,
  RotateCcw, Download, Upload, RefreshCw, LogOut, Eye, Sun, Moon, SunMoon,
} from 'lucide-react'
import { exportAll, importAll } from '../db/db'
import { initFirebase, signIn, signOut, watchAuth, ALLOWED_EMAIL } from '../lib/firebase'
import { startSync, stopSync, syncNow } from '../lib/sync'
import { download } from '../lib/utils'
import { toast } from '../lib/toast'
import { useSettings, FONTS, ACCENTS, ensureAllFonts } from '../lib/settings'

const PREVIEW_TEXT = 'العلم يبني بيوتًا لا عماد لها — أبجد هوز ١٢٣'
const HOME_LABELS: Record<string, string> = {
  stats: 'الإحصائيات', due: 'مراجعات اليوم', pinned: 'المثبتة',
  recent: 'آخر الملاحظات', inbox: 'صندوق القراءة', sections: 'الأقسام',
}

export default function SettingsPage({ user, setUser }: { user: any; setUser: (u: any) => void }) {
  const { settings, update, reset } = useSettings()
  const [msg, setMsg] = useState('')
  const [theme, setThemeLocal] = useState(() => localStorage.getItem('maktabati-theme') || 'auto')
  const setTheme = (t: string) => {
    setThemeLocal(t)
    window.dispatchEvent(new CustomEvent('mk-theme', { detail: t }))
  }
  const fileRef = useRef<HTMLInputElement>(null)

  // Load all font families once so the picker previews render correctly
  useEffect(() => { ensureAllFonts() }, [])

  async function connect() {
    try {
      if (!initFirebase()) throw new Error('فشل تهيئة Firebase')
      watchAuth((u) => {
        setUser(u)
        if (u) startSync()
      })
      const u = await signIn()
      setUser(u)
      startSync()
      toast('تم تسجيل الدخول — المزامنة تعمل الآن', 'success')
      setMsg('')
    } catch (e: any) {
      toast('تعذر تسجيل الدخول', 'error')
      setMsg('❌ ' + (e.message || 'حدث خطأ'))
    }
  }

  async function doExport() {
    download(`maktabati-backup-${new Date().toISOString().slice(0, 10)}.json`, await exportAll())
    toast('تم إكمال النسخ الاحتياطي', 'success')
  }

  async function doImport(file: File) {
    try {
      const n = await importAll(await file.text())
      toast(`تمت استعادة النسخة الاحتياطية — ${n} عنصر`, 'success')
      syncNow()
    } catch (e: any) {
      toast('فشل الاستيراد: ' + e.message, 'error')
    }
  }

  const Row = ({ label, children }: { label: string; children: any }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 13.5, color: 'var(--text-2)', minWidth: 110 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>{children}</div>
    </div>
  )

  return (
    <div>
      <h1 className="page-title">الإعدادات</h1>
      <p className="page-sub">المظهر، الخطوط، المزامنة والنسخ الاحتياطي</p>

      {/* ===== Fonts ===== */}
      <div className="section-h"><Type size={16} /> الخط</div>
      <div className="card">
        <div className="grid cols-3" style={{ marginBottom: 14 }}>
          {Object.keys(FONTS).map((f) => (
            <button
              key={f}
              className="card clickable"
              onClick={() => update({ fontFamily: f })}
              style={{
                textAlign: 'start', cursor: 'pointer', padding: 12,
                borderColor: settings.fontFamily === f ? 'var(--accent)' : 'var(--border)',
                borderWidth: settings.fontFamily === f ? 2 : 1, borderStyle: 'solid',
                background: settings.fontFamily === f ? 'var(--accent-soft)' : 'var(--surface)',
              }}
            >
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 4 }}>{f}</div>
              <div style={{ fontFamily: `'${f}', sans-serif`, fontSize: 16 }}>{PREVIEW_TEXT.slice(0, 26)}</div>
            </button>
          ))}
        </div>

        <Row label="حجم الخط">
          <input type="range" min={85} max={120} step={5} value={settings.fontSize}
            onChange={(e) => update({ fontSize: Number(e.target.value) })} style={{ flex: 1, maxWidth: 220, accentColor: 'var(--accent)' }} />
          <span className="chip">{settings.fontSize}%</span>
        </Row>
        <Row label="سماكة الخط">
          {[400, 500, 600].map((w) => (
            <button key={w} className={`chip ${settings.fontWeight === w ? 'on' : ''}`} onClick={() => update({ fontWeight: w })}>
              {w === 400 ? 'عادي' : w === 500 ? 'متوسط' : 'سميك'}
            </button>
          ))}
        </Row>
        <Row label="تباعد الأسطر">
          <input type="range" min={1.5} max={2.4} step={0.1} value={settings.lineHeight}
            onChange={(e) => update({ lineHeight: Number(e.target.value) })} style={{ flex: 1, maxWidth: 220, accentColor: 'var(--accent)' }} />
          <span className="chip">{settings.lineHeight.toFixed(1)}</span>
        </Row>
        <Row label="تباعد الحروف">
          <input type="range" min={-0.25} max={1} step={0.25} value={settings.letterSpacing}
            onChange={(e) => update({ letterSpacing: Number(e.target.value) })} style={{ flex: 1, maxWidth: 220, accentColor: 'var(--accent)' }} />
          <span className="chip">{settings.letterSpacing}px</span>
        </Row>

        <div className="card" style={{ background: 'var(--surface-2)', marginTop: 8 }}>
          <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Eye size={13} /> معاينة حية
          </div>
          <div style={{
            fontSize: `calc(15.5px * ${settings.fontSize / 100})`,
            fontWeight: settings.fontWeight,
            lineHeight: settings.lineHeight,
            letterSpacing: settings.letterSpacing + 'px',
          }}>
            {PREVIEW_TEXT}
            <br />العلم في الصغر كالنقش على الحجر، وطلب العلم فريضة على كل مسلم.
          </div>
        </div>
      </div>

      {/* ===== Personalization ===== */}
      <div className="section-h"><Palette size={16} /> التخصيص</div>
      <div className="card">
        <Row label="الوضع">
          <button className={`chip ${theme === 'light' ? 'on' : ''}`} onClick={() => setTheme('light')}><Sun size={13} /> فاتح</button>
          <button className={`chip ${theme === 'dark' ? 'on' : ''}`} onClick={() => setTheme('dark')}><Moon size={13} /> داكن</button>
          <button className={`chip ${theme === 'auto' ? 'on' : ''}`} onClick={() => setTheme('auto')}><SunMoon size={13} /> تلقائي (حسب الجهاز)</button>
        </Row>
        <Row label="لون الهوية">
          <button
            className={`chip ${!settings.accent ? 'on' : ''}`}
            onClick={() => update({ accent: '' })}
          >تلقائي</button>
          {ACCENTS.map((a) => (
            <button
              key={a.value} title={a.name}
              onClick={() => update({ accent: a.value })}
              style={{
                width: 28, height: 28, borderRadius: '50%', background: a.value, cursor: 'pointer',
                border: settings.accent === a.value ? '3px solid var(--text)' : '2px solid var(--border)',
              }}
            />
          ))}
        </Row>
        <Row label="شكل البطاقات">
          <button className={`chip ${settings.radius === 'rounded' ? 'on' : ''}`} onClick={() => update({ radius: 'rounded' })}>زوايا دائرية</button>
          <button className={`chip ${settings.radius === 'square' ? 'on' : ''}`} onClick={() => update({ radius: 'square' })}>زوايا حادة</button>
        </Row>
        <Row label="كثافة الواجهة">
          <button className={`chip ${settings.density === 'comfortable' ? 'on' : ''}`} onClick={() => update({ density: 'comfortable' })}>مريحة</button>
          <button className={`chip ${settings.density === 'compact' ? 'on' : ''}`} onClick={() => update({ density: 'compact' })}>مضغوطة</button>
        </Row>
        <Row label="عرض الملاحظات">
          <button className={`chip ${settings.noteView === 'cards' ? 'on' : ''}`} onClick={() => update({ noteView: 'cards' })}>
            <LayoutGrid size={13} /> بطاقات
          </button>
          <button className={`chip ${settings.noteView === 'grid' ? 'on' : ''}`} onClick={() => update({ noteView: 'grid' })}>
            <StretchHorizontal size={13} /> شبكة
          </button>
          <button className={`chip ${settings.noteView === 'list' ? 'on' : ''}`} onClick={() => update({ noteView: 'list' })}>
            <List size={13} /> قائمة
          </button>
        </Row>
        <Row label="عناصر الرئيسية">
          {Object.entries(HOME_LABELS).map(([key, label]) => (
            <button
              key={key}
              className={`chip ${settings.home[key as keyof typeof settings.home] ? 'on' : ''}`}
              onClick={() => update({ home: { ...settings.home, [key]: !settings.home[key as keyof typeof settings.home] } } as any)}
            >{label}</button>
          ))}
        </Row>
        <div style={{ marginTop: 10 }}>
          <button className="btn sm" onClick={reset}><RotateCcw size={14} /> إعادة الضبط الافتراضي</button>
        </div>
      </div>

      {/* ===== Sync ===== */}
      <div className="section-h"><Cloud size={16} /> المزامنة (Firebase)</div>
      <div className="card">
        {user ? (
          <>
            <p style={{ fontSize: 14 }}>✅ مسجل الدخول: <b>{user.email}</b> — المزامنة الفورية مفعّلة بين جميع أجهزتك.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" onClick={() => syncNow()}><RefreshCw size={15} /> مزامنة الآن</button>
              <button className="btn danger" onClick={async () => { await signOut(); stopSync(); setUser(null) }}>
                <LogOut size={15} /> تسجيل الخروج
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.8 }}>
              سجّل دخولك بحساب <b>{ALLOWED_EMAIL}</b> لتفعيل المزامنة الفورية بين جميع أجهزتك.
              إعدادات الاتصال مدمجة في التطبيق — لا تحتاج لصق أي شيء.
            </p>
            <button className="btn primary" onClick={connect}>تسجيل الدخول بحساب Google</button>
          </>
        )}
      </div>

      {/* ===== Backup ===== */}
      <div className="section-h"><DatabaseBackup size={16} /> النسخ الاحتياطي</div>
      <div className="card">
        <p style={{ fontSize: 13.5, color: 'var(--text-2)' }}>
          صدّر كامل بياناتك (ملاحظات، أقسام، اقتباسات، مراجع…) كملف JSON واحفظه في مكان آمن، أو استورد نسخة سابقة.
          الاستيراد يدمج البيانات ولا يحذف شيئًا (الأحدث يفوز).
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn primary" onClick={doExport}><Download size={15} /> تصدير كل البيانات</button>
          <button className="btn" onClick={() => fileRef.current?.click()}><Upload size={15} /> استيراد نسخة</button>
          <input ref={fileRef} type="file" accept=".json" hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) doImport(f); e.target.value = '' }} />
        </div>
      </div>

      {/* ===== About ===== */}
      <div className="section-h"><Info size={16} /> عن التطبيق</div>
      <div className="card" style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.9 }}>
        <b style={{ color: 'var(--text)' }}>مكتبتي</b> — نظام إدارة المعرفة الشخصي · الإصدار 1.1.0
        <br />بياناتك تُخزن محليًا على جهازك (IndexedDB) وتُزامَن مع حسابك الخاص في Firebase عند التفعيل.
        <br />التطبيق شخصي ومقفل على الحساب {ALLOWED_EMAIL}.
      </div>

      {msg && <div className="card" style={{ marginTop: 14, fontSize: 14 }}>{msg}</div>}
    </div>
  )
}
