import { useRef, useState } from 'react'
import {
  Settings as SettingsIcon, Building2, Download, Upload, RotateCcw, Save, Database,
  ShieldCheck, Palette, Trash2, FileJson,
} from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { PageHeader, Card, Field, Input, Select, Textarea, Tabs, Badge, useConfirm } from '../components/ui'
import { useTheme } from '../store/ThemeContext'
import { exportJSON } from '../lib/export'
import { CURRENCIES } from '../lib/format'

const ROLES = [
  { role: 'Admin', perms: 'Full access to all modules, settings, backups & user management.' },
  { role: 'HR', perms: 'Employees, payroll, documents & promotions.' },
  { role: 'Finance', perms: 'Invoices, expenses, payroll & finance dashboard.' },
  { role: 'Manager', perms: 'View team, approve expenses, read reports.' },
  { role: 'Employee', perms: 'View own profile, payslips & documents.' },
]

export default function SettingsPage() {
  const { db, settings, updateSettings, restore, resetAll } = useStore()
  const { theme, toggle } = useTheme()
  const { confirm, node } = useConfirm()
  const [tab, setTab] = useState('company')
  const [company, setCompany] = useState(settings.company)
  const [defaults, setDefaults] = useState(settings.defaults)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef()

  const setC = (k, v) => setCompany((c) => ({ ...c, [k]: v }))
  const save = () => { updateSettings({ company, defaults }); setSaved(true); setTimeout(() => setSaved(false), 1800) }

  const onLogo = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setC('logo', reader.result)
    reader.readAsDataURL(file)
  }

  const backup = () => exportJSON({ ...db, _exportedAt: new Date().toISOString(), _app: 'Windesign OS' }, `windesign-backup-${new Date().toISOString().slice(0, 10)}.json`)

  const onRestore = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    try {
      const data = JSON.parse(text)
      if (!data.employees || !data.settings) throw new Error('Invalid backup file')
      if (await confirm({ title: 'Restore backup?', message: 'This replaces ALL current data with the backup contents. This cannot be undone.', danger: true, confirmText: 'Restore' })) {
        const { _exportedAt, _app, ...clean } = data
        restore(clean)
      }
    } catch (err) {
      alert('Could not restore: ' + err.message)
    }
    e.target.value = ''
  }

  const reset = async () => {
    if (await confirm({ title: 'Reset all data?', message: 'Everything will be wiped and replaced with fresh demo data.', danger: true, confirmText: 'Reset' })) resetAll()
  }

  return (
    <div>
      {node}
      <PageHeader title="Settings" subtitle="Configure your workspace" icon={SettingsIcon}
        actions={<button className="btn-primary" onClick={save}><Save size={16} /> {saved ? 'Saved!' : 'Save Changes'}</button>} />

      <div className="mb-4"><Tabs active={tab} onChange={setTab} tabs={[
        { value: 'company', label: 'Company' }, { value: 'defaults', label: 'Defaults & Tax' },
        { value: 'data', label: 'Backup & Data' }, { value: 'roles', label: 'Roles & Access' }, { value: 'appearance', label: 'Appearance' },
      ]} /></div>

      {tab === 'company' && (
        <Card>
          <h3 className="font-bold mb-4 flex items-center gap-2"><Building2 size={18} className="text-brand-600" /> Company Information</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="h-20 w-20 rounded-xl border border-slate-200 dark:border-slate-700 grid place-items-center overflow-hidden bg-slate-50 dark:bg-slate-800">
              {company.logo ? <img src={company.logo} alt="logo" className="h-full w-full object-contain" /> : <span className="text-2xl font-extrabold text-brand-600">{(company.name || 'W')[0]}</span>}
            </div>
            <label className="btn-outline cursor-pointer"><Upload size={16} /> Upload Logo<input type="file" accept="image/*" className="hidden" onChange={onLogo} /></label>
            {company.logo && <button className="btn-ghost text-rose-500" onClick={() => setC('logo', '')}><Trash2 size={15} /></button>}
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Company Name"><Input value={company.name} onChange={(e) => setC('name', e.target.value)} /></Field>
            <Field label="Email"><Input value={company.email} onChange={(e) => setC('email', e.target.value)} /></Field>
            <Field label="Phone"><Input value={company.phone} onChange={(e) => setC('phone', e.target.value)} /></Field>
            <Field label="Website"><Input value={company.website} onChange={(e) => setC('website', e.target.value)} /></Field>
            <Field label="GST / Tax Number"><Input value={company.gst} onChange={(e) => setC('gst', e.target.value)} /></Field>
            <Field label="Default Currency"><Select value={company.currency} onChange={(e) => setC('currency', e.target.value)}>{Object.keys(CURRENCIES).map((c) => <option key={c}>{c}</option>)}</Select></Field>
          </div>
          <Field label="Address" className="mt-4"><Textarea value={company.address} onChange={(e) => setC('address', e.target.value)} /></Field>
          <Field label="Bank Details (shown on invoices)" className="mt-4"><Textarea value={company.bank} onChange={(e) => setC('bank', e.target.value)} /></Field>
        </Card>
      )}

      {tab === 'defaults' && (
        <Card>
          <h3 className="font-bold mb-4">Defaults & Tax Settings</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Default Probation"><Input value={defaults.probation} onChange={(e) => setDefaults((d) => ({ ...d, probation: e.target.value }))} /></Field>
            <Field label="Default Notice Period"><Input value={defaults.notice} onChange={(e) => setDefaults((d) => ({ ...d, notice: e.target.value }))} /></Field>
            <Field label="Default Invoice Tax Rate (%)"><Input type="number" value={defaults.taxRate} onChange={(e) => setDefaults((d) => ({ ...d, taxRate: Number(e.target.value) }))} /></Field>
            <Field label="Invoice Number Prefix"><Input value={settings.invoicePrefix} onChange={(e) => updateSettings({ invoicePrefix: e.target.value })} /></Field>
          </div>
          <h3 className="font-bold mt-6 mb-3">Salary Structure Defaults</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Basic (% of CTC)"><Input type="number" value={defaults.salaryStructure?.basicPct} onChange={(e) => setDefaults((d) => ({ ...d, salaryStructure: { ...d.salaryStructure, basicPct: Number(e.target.value) } }))} /></Field>
            <Field label="HRA (% of Basic)"><Input type="number" value={defaults.salaryStructure?.hraPct} onChange={(e) => setDefaults((d) => ({ ...d, salaryStructure: { ...d.salaryStructure, hraPct: Number(e.target.value) } }))} /></Field>
          </div>
          <h3 className="font-bold mt-6 mb-3">Expense Categories</h3>
          <div className="flex flex-wrap gap-2">{settings.expenseCategories.map((c) => <Badge key={c} tone="Draft">{c}</Badge>)}</div>
        </Card>
      )}

      {tab === 'data' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <div className="grid place-items-center h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 mb-3"><Download size={22} /></div>
            <h3 className="font-bold">Full System Backup</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">Download a complete JSON snapshot of all employees, invoices, expenses, payroll and settings.</p>
            <button className="btn-primary w-full" onClick={backup}><FileJson size={16} /> Download Backup (JSON)</button>
          </Card>
          <Card>
            <div className="grid place-items-center h-12 w-12 rounded-xl bg-brand-600/10 text-brand-600 mb-3"><Upload size={22} /></div>
            <h3 className="font-bold">Restore From Backup</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">Upload a previously exported JSON backup. This replaces all current data.</p>
            <button className="btn-outline w-full" onClick={() => fileRef.current?.click()}><Upload size={16} /> Choose Backup File</button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onRestore} />
          </Card>
          <Card className="sm:col-span-2 border-rose-200 dark:border-rose-900/50">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div><h3 className="font-bold flex items-center gap-2"><RotateCcw size={18} className="text-rose-500" /> Reset Workspace</h3><p className="text-sm text-slate-500 mt-1">Wipe everything and reload fresh demo data.</p></div>
              <button className="btn-danger" onClick={reset}><Trash2 size={16} /> Reset All Data</button>
            </div>
          </Card>
          <Card className="sm:col-span-2">
            <h3 className="font-bold flex items-center gap-2 mb-2"><Database size={18} className="text-brand-600" /> Data Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[['Employees', db.employees.length], ['Invoices', db.invoices.length], ['Expenses', db.expenses.length], ['Payslips', db.payslips.length], ['Clients', db.clients.length], ['Documents', db.documents.length], ['Promotions', db.promotions.length], ['Activity', db.activity.length]].map(([l, n]) => (
                <div key={l} className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3"><p className="text-xl font-bold">{n}</p><p className="text-xs text-slate-400">{l}</p></div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'roles' && (
        <Card className="!p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 font-bold flex items-center gap-2"><ShieldCheck size={18} className="text-brand-600" /> Role Based Access Control</div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {ROLES.map((r) => (
              <div key={r.role} className="flex items-start gap-4 px-5 py-4">
                <Badge tone={r.role === 'Admin' ? 'Full Time' : 'Draft'}>{r.role}</Badge>
                <p className="text-sm text-slate-600 dark:text-slate-300 flex-1">{r.perms}</p>
              </div>
            ))}
          </div>
          <p className="px-5 py-3 text-xs text-slate-400 border-t border-slate-200 dark:border-slate-800">You are signed in as <b>Admin</b>. Role enforcement is illustrative in this build.</p>
        </Card>
      )}

      {tab === 'appearance' && (
        <Card>
          <h3 className="font-bold mb-4 flex items-center gap-2"><Palette size={18} className="text-brand-600" /> Appearance</h3>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <div><p className="font-semibold">Theme</p><p className="text-sm text-slate-500">Currently using {theme} mode</p></div>
            <button className="btn-outline" onClick={toggle}>Switch to {theme === 'dark' ? 'Light' : 'Dark'}</button>
          </div>
        </Card>
      )}
    </div>
  )
}
