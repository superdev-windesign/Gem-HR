import { useMemo, useState } from 'react'
import { CreditCard, Plus, Download, Trash2, Repeat, TrendingDown, Tag } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { PageHeader, Card, StatCard, SearchInput, Select, Modal, Field, Input, Textarea, Badge, EmptyState, Tabs, useConfirm } from '../components/ui'
import { BarTrend, Donut } from '../components/Charts'
import { money, compactMoney, fmtDate, todayISO, monthKey, monthLabel, uid } from '../lib/format'
import { exportCSV, exportExcel } from '../lib/export'

const CATEGORIES = {
  Office: ['Rent', 'Electricity', 'Water', 'Broadband', 'Internet', 'Maintenance'],
  'Software & SaaS': ['Framer', 'Figma', 'Cursor', 'Claude', 'ChatGPT', 'Hosting', 'Domain', 'Cloud Services'],
  Employee: ['Salary', 'Stipend', 'Bonus', 'Training', 'Recruitment'],
  Travel: ['Petrol', 'Fuel', 'Cab', 'Flight', 'Hotel', 'Food'],
  Marketing: ['Ads', 'Events', 'Sponsorship', 'Influencer Marketing'],
  'Legal & Accounting': ['CA', 'Lawyer', 'Compliance'],
  Equipment: ['Laptop', 'Monitor', 'Furniture', 'Accessories'],
  Miscellaneous: ['Custom'],
}
const PAYMENT_METHODS = ['Bank Transfer', 'NEFT', 'UPI', 'Credit Card', 'Cash', 'Cheque']
const RECURRING = ['None', 'Monthly', 'Quarterly', 'Yearly']

function ExpenseModal({ open, onClose, expense }) {
  const { saveExpense } = useStore()
  const blank = { id: uid('exp'), date: todayISO(), category: 'Office', name: '', vendor: '', amount: '', paymentMethod: 'Bank Transfer', notes: '', recurring: 'None' }
  const [form, setForm] = useState(expense || blank)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const submit = () => { if (!form.name || !form.amount) return; saveExpense({ ...form, amount: Number(form.amount) }); onClose() }
  return (
    <Modal open={open} onClose={onClose} title={expense ? 'Edit Expense' : 'Add Expense'} size="lg"
      footer={<><button className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit}>Save Expense</button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Expense Date"><Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></Field>
        <Field label="Category"><Select value={form.category} onChange={(e) => set('category', e.target.value)}>{Object.keys(CATEGORIES).map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Expense Name *"><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Figma Organization" list="exp-suggestions" />
          <datalist id="exp-suggestions">{(CATEGORIES[form.category] || []).map((s) => <option key={s} value={s} />)}</datalist>
        </Field>
        <Field label="Vendor"><Input value={form.vendor} onChange={(e) => set('vendor', e.target.value)} /></Field>
        <Field label="Amount (₹) *"><Input type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} /></Field>
        <Field label="Payment Method"><Select value={form.paymentMethod} onChange={(e) => set('paymentMethod', e.target.value)}>{PAYMENT_METHODS.map((m) => <option key={m}>{m}</option>)}</Select></Field>
        <Field label="Recurring"><Select value={form.recurring} onChange={(e) => set('recurring', e.target.value)}>{RECURRING.map((r) => <option key={r}>{r}</option>)}</Select></Field>
      </div>
      <Field label="Notes" className="mt-4"><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
    </Modal>
  )
}

export default function Expenses() {
  const { expenses, saveExpense, deleteExpense } = useStore()
  const { confirm, node } = useConfirm()
  const [tab, setTab] = useState('ledger')
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('All')
  const [range, setRange] = useState('all')
  const [modal, setModal] = useState({ open: false, expense: null })

  const filtered = useMemo(() => {
    const now = new Date()
    return expenses
      .filter((e) => {
        if (cat !== 'All' && e.category !== cat) return false
        if (q && ![e.name, e.category, e.vendor].join(' ').toLowerCase().includes(q.toLowerCase())) return false
        if (range !== 'all') {
          const days = range === '30' ? 30 : range === '90' ? 90 : 365
          if (new Date(e.date) < new Date(now.getTime() - days * 864e5)) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [expenses, q, cat, range])

  const total = filtered.reduce((s, e) => s + Number(e.amount), 0)
  const thisMonth = expenses.filter((e) => monthKey(e.date) === monthKey(new Date())).reduce((s, e) => s + Number(e.amount), 0)
  const recurringTotal = expenses.filter((e) => e.recurring && e.recurring !== 'None').reduce((s, e) => s + Number(e.amount), 0)

  const byMonth = useMemo(() => {
    const m = {}
    expenses.forEach((e) => { m[monthKey(e.date)] = (m[monthKey(e.date)] || 0) + Number(e.amount) })
    const out = []
    for (let i = 11; i >= 0; i--) { const d = new Date(); d.setMonth(d.getMonth() - i); const k = monthKey(d); out.push({ month: k, expense: Math.round(m[k] || 0) }) }
    return out
  }, [expenses])

  const byCategory = useMemo(() => {
    const m = {}
    expenses.forEach((e) => { m[e.category] = (m[e.category] || 0) + Number(e.amount) })
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [expenses])

  const byVendor = useMemo(() => {
    const m = {}
    expenses.forEach((e) => { if (e.vendor) m[e.vendor] = (m[e.vendor] || 0) + Number(e.amount) })
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8)
  }, [expenses])

  const recurring = expenses.filter((e) => e.recurring && e.recurring !== 'None')
  const cols = [{ key: 'date', label: 'Date' }, { key: 'name', label: 'Name' }, { key: 'category', label: 'Category' }, { key: 'vendor', label: 'Vendor' }, { key: 'amount', label: 'Amount' }, { key: 'paymentMethod', label: 'Method' }]

  const remove = async (e) => { if (await confirm({ title: 'Delete expense?', message: e.name, danger: true, confirmText: 'Delete' })) deleteExpense(e.id) }

  return (
    <div>
      {node}
      <PageHeader title="Expense Management" subtitle="Track spend, recurring costs & analytics" icon={CreditCard}
        actions={<>
          <button className="btn-outline" onClick={() => exportExcel(filtered, cols, 'expenses.xls', 'Expenses')}><Download size={16} /> Excel</button>
          <button className="btn-primary" onClick={() => setModal({ open: true, expense: null })}><Plus size={16} /> Add Expense</button>
        </>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total (Filtered)" value={compactMoney(total)} sub={`${filtered.length} entries`} icon={TrendingDown} tone="red" />
        <StatCard label="This Month" value={compactMoney(thisMonth)} icon={CreditCard} tone="amber" />
        <StatCard label="Recurring / cycle" value={compactMoney(recurringTotal)} sub={`${recurring.length} subscriptions`} icon={Repeat} tone="violet" />
        <StatCard label="Categories" value={byCategory.length} icon={Tag} tone="brand" />
      </div>

      <div className="mb-4"><Tabs active={tab} onChange={setTab} tabs={[
        { value: 'ledger', label: 'Expense Ledger' }, { value: 'recurring', label: `Recurring (${recurring.length})` }, { value: 'analytics', label: 'Analytics' },
      ]} /></div>

      {tab === 'ledger' && (
        <>
          <Card className="!p-4 mb-4">
            <div className="grid sm:grid-cols-4 gap-3">
              <SearchInput value={q} onChange={setQ} placeholder="Search expenses…" />
              <Select value={cat} onChange={(e) => setCat(e.target.value)}><option value="All">All Categories</option>{Object.keys(CATEGORIES).map((c) => <option key={c}>{c}</option>)}</Select>
              <Select value={range} onChange={(e) => setRange(e.target.value)}><option value="all">All Time</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last year</option></Select>
              <button className="btn-outline" onClick={() => exportCSV(filtered, cols, 'expenses.csv')}><Download size={16} /> CSV</button>
            </div>
          </Card>
          {filtered.length === 0 ? <Card><EmptyState icon={CreditCard} title="No expenses found" action={<button className="btn-primary" onClick={() => setModal({ open: true, expense: null })}><Plus size={16} /> Add Expense</button>} /></Card> : (
            <div className="card !p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                    <tr><th className="th">Date</th><th className="th">Expense</th><th className="th">Category</th><th className="th">Vendor</th><th className="th">Method</th><th className="th text-right">Amount</th><th className="th"></th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filtered.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="td text-slate-400 whitespace-nowrap">{fmtDate(e.date)}</td>
                        <td className="td"><span className="font-semibold">{e.name}</span>{e.recurring !== 'None' && <Repeat size={12} className="inline ml-1.5 text-violet-500" />}</td>
                        <td className="td"><Badge tone="Draft">{e.category}</Badge></td>
                        <td className="td">{e.vendor || '—'}</td>
                        <td className="td text-slate-400">{e.paymentMethod}</td>
                        <td className="td text-right font-semibold text-rose-600">− {money(e.amount)}</td>
                        <td className="td text-right"><div className="flex justify-end gap-1"><button className="btn-ghost !p-1.5" onClick={() => setModal({ open: true, expense: e })}><Tag size={14} /></button><button className="btn-ghost !p-1.5 text-rose-500" onClick={() => remove(e)}><Trash2 size={14} /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'recurring' && (
        recurring.length === 0 ? <Card><EmptyState icon={Repeat} title="No recurring expenses" hint="Mark an expense as Monthly, Quarterly or Yearly to track subscriptions." /></Card> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recurring.map((e) => (
              <Card key={e.id}>
                <div className="flex items-start justify-between">
                  <div><p className="font-bold">{e.name}</p><p className="text-xs text-slate-400">{e.vendor} · {e.category}</p></div>
                  <Badge tone="Intern">{e.recurring}</Badge>
                </div>
                <p className="text-2xl font-bold mt-3 text-slate-800 dark:text-white">{money(e.amount)}</p>
                <p className="text-xs text-slate-400">per {e.recurring.toLowerCase().replace('ly', '')} · next {fmtDate(new Date(Date.now() + 30 * 864e5))}</p>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === 'analytics' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card className="lg:col-span-2"><h3 className="font-semibold mb-3">Monthly Expense Trend</h3><BarTrend data={byMonth} keys={[{ key: 'expense', label: 'Expense', color: '#ef4444' }]} height={260} /></Card>
          <Card><h3 className="font-semibold mb-3">Category-wise Expenses</h3><Donut data={byCategory} height={280} /></Card>
          <Card>
            <h3 className="font-semibold mb-3">Top Vendors</h3>
            <div className="space-y-2">
              {byVendor.map((v, i) => {
                const max = byVendor[0].value
                return (
                  <div key={v.name}>
                    <div className="flex justify-between text-sm mb-1"><span className="font-medium">{v.name}</span><span className="text-slate-500">{money(v.value)}</span></div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"><div className="h-full bg-brand-500 rounded-full" style={{ width: `${(v.value / max) * 100}%` }} /></div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      <ExpenseModal open={modal.open} expense={modal.expense} onClose={() => setModal({ open: false, expense: null })} />
    </div>
  )
}
