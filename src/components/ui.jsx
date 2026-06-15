import { useEffect, useRef, useState } from 'react'
import { X, ChevronDown, Search as SearchIcon, Inbox } from 'lucide-react'
import { initials, colorFromString } from '../lib/format'

export function Card({ className = '', children, ...rest }) {
  return (
    <div className={`card p-5 ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions, icon: Icon }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="grid place-items-center h-11 w-11 rounded-xl bg-brand-600/10 text-brand-600 dark:text-brand-400">
            <Icon size={22} />
          </div>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  )
}

export function StatCard({ label, value, sub, icon: Icon, tone = 'brand', trend }) {
  const tones = {
    brand: 'bg-brand-600/10 text-brand-600 dark:text-brand-400',
    green: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    red: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  }
  return (
    <Card className="flex items-start justify-between !p-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white truncate">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
      </div>
      {Icon && (
        <div className={`grid place-items-center h-10 w-10 rounded-xl shrink-0 ${tones[tone]}`}>
          <Icon size={20} />
        </div>
      )}
    </Card>
  )
}

const statusTones = {
  Active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Inactive: 'bg-slate-400/20 text-slate-600 dark:text-slate-300',
  Resigned: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  Paid: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  Sent: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  Viewed: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
  Draft: 'bg-slate-400/20 text-slate-600 dark:text-slate-300',
  'Partially Paid': 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  Overdue: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  Cancelled: 'bg-slate-400/20 text-slate-500 line-through',
  'Full Time': 'bg-brand-500/15 text-brand-700 dark:text-brand-300',
  Intern: 'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  Freelancer: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  Contractor: 'bg-teal-500/15 text-teal-700 dark:text-teal-300',
}

export function Badge({ children, tone }) {
  const cls = statusTones[children] || statusTones[tone] || 'bg-slate-400/20 text-slate-600 dark:text-slate-300'
  return <span className={`chip ${cls}`}>{children}</span>
}

export function Avatar({ name, src, size = 40 }) {
  const s = { width: size, height: size, fontSize: size * 0.38 }
  if (src) return <img src={src} alt={name} style={s} className="rounded-full object-cover" />
  return (
    <div
      style={{ ...s, background: colorFromString(name) }}
      className="rounded-full grid place-items-center font-bold text-white shrink-0"
    >
      {initials(name)}
    </div>
  )
}

export function Modal({ open, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
  if (!open) return null
  const sizes = { sm: 'max-w-md', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' }
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} my-8 card !rounded-2xl !p-0 animate-[fadeIn_.15s_ease]`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="btn-ghost !p-1.5 rounded-lg">
            <X size={18} />
          </button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200 dark:border-slate-800">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({ label, children, className = '' }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {children}
    </div>
  )
}

export function Input(props) {
  return <input className="input" {...props} />
}
export function Textarea(props) {
  return <textarea className="input" rows={3} {...props} />
}
export function Select({ children, ...props }) {
  return (
    <div className="relative">
      <select className="input appearance-none pr-9" {...props}>
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search…' }) {
  return (
    <div className="relative">
      <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        className="input pl-9"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

export function EmptyState({ icon: Icon = Inbox, title, hint, action }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="grid place-items-center h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mb-4">
        <Icon size={30} />
      </div>
      <p className="font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      {hint && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Table({ columns, rows, renderRow, empty }) {
  if (!rows.length && empty) return empty
  return (
    <div className="card !p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
            <tr>
              {columns.map((c) => (
                <th key={c.key || c.label} className={`th ${c.right ? 'text-right' : ''}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">{rows.map(renderRow)}</tbody>
        </table>
      </div>
    </div>
  )
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/70 overflow-x-auto">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
            active === t.value ? 'bg-white dark:bg-slate-700 text-brand-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

// Confirm dialog hook
export function useConfirm() {
  const [state, setState] = useState(null)
  const confirm = (opts) => new Promise((resolve) => setState({ ...opts, resolve }))
  const node = state ? (
    <Modal
      open
      onClose={() => {
        state.resolve(false)
        setState(null)
      }}
      title={state.title || 'Confirm'}
      size="sm"
      footer={
        <>
          <button className="btn-outline" onClick={() => { state.resolve(false); setState(null) }}>Cancel</button>
          <button className={state.danger ? 'btn-danger' : 'btn-primary'} onClick={() => { state.resolve(true); setState(null) }}>
            {state.confirmText || 'Confirm'}
          </button>
        </>
      }
    >
      <p className="text-sm text-slate-600 dark:text-slate-300">{state.message}</p>
    </Modal>
  ) : null
  return { confirm, node }
}
