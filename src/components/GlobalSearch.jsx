import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, FileText, Receipt, Building2, Wallet, CornerDownLeft } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { money } from '../lib/format'

export default function GlobalSearch({ open, onClose }) {
  const { employees, clients, invoices, expenses, documents } = useStore()
  const [q, setQ] = useState('')
  const nav = useNavigate()

  useEffect(() => {
    if (open) setQ('')
  }, [open])

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return []
    const out = []
    employees.forEach((e) => {
      if ([e.name, e.empId, e.designation, e.department, e.email].join(' ').toLowerCase().includes(term))
        out.push({ icon: Users, type: 'Employee', label: e.name, sub: `${e.empId} · ${e.designation}`, to: `/employees/${e.id}` })
    })
    clients.forEach((c) => {
      if ([c.name, c.company, c.email, c.country].join(' ').toLowerCase().includes(term))
        out.push({ icon: Building2, type: 'Client', label: c.company || c.name, sub: c.email, to: `/clients/${c.id}` })
    })
    invoices.forEach((i) => {
      if ([i.number, i.status].join(' ').toLowerCase().includes(term))
        out.push({ icon: Receipt, type: 'Invoice', label: i.number, sub: `${i.status} · ${money(i.total, i.currency)}`, to: `/invoices?focus=${i.id}` })
    })
    expenses.forEach((e) => {
      if ([e.name, e.category, e.vendor].join(' ').toLowerCase().includes(term))
        out.push({ icon: Wallet, type: 'Expense', label: e.name, sub: `${e.category} · ${money(e.amount)}`, to: `/expenses` })
    })
    documents.forEach((d) => {
      if ([d.type, d.name].join(' ').toLowerCase().includes(term))
        out.push({ icon: FileText, type: 'Document', label: d.name || d.type, sub: d.type, to: `/documents` })
    })
    return out.slice(0, 12)
  }, [q, employees, clients, invoices, expenses, documents])

  if (!open) return null
  const go = (r) => {
    nav(r.to)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl card !rounded-2xl !p-0 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
          <Search size={18} className="text-slate-400" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && results[0] && go(results[0])}
            placeholder="Search employees, clients, invoices, expenses, documents…"
            className="flex-1 bg-transparent outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
          <kbd className="hidden sm:block text-[10px] font-semibold text-slate-400 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <div className="max-h-[50vh] overflow-y-auto">
          {q && !results.length && <p className="p-6 text-center text-sm text-slate-500">No results for “{q}”.</p>}
          {!q && <p className="p-6 text-center text-sm text-slate-400">Type to search across the entire workspace.</p>}
          {results.map((r, i) => (
            <button key={i} onClick={() => go(r)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-left">
              <div className="grid place-items-center h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                <r.icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{r.label}</p>
                <p className="text-xs text-slate-500 truncate">{r.sub}</p>
              </div>
              <span className="chip bg-slate-100 dark:bg-slate-800 text-slate-500">{r.type}</span>
            </button>
          ))}
        </div>
        {results.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-1">
            <CornerDownLeft size={12} /> to open the top result
          </div>
        )}
      </div>
    </div>
  )
}
