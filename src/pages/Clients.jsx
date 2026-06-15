import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Plus, Download, Globe } from 'lucide-react'
import { useStore, toINR } from '../store/StoreContext'
import { PageHeader, Card, SearchInput, Modal, Field, Input, Select, Textarea, Avatar, EmptyState } from '../components/ui'
import { exportCSV } from '../lib/export'
import { money, compactMoney } from '../lib/format'
import { CURRENCIES } from '../lib/format'
import { uid } from '../lib/format'

function ClientModal({ open, onClose, client }) {
  const { saveClient } = useStore()
  const blank = { id: uid('cl'), name: '', company: '', email: '', phone: '', country: 'India', currency: 'INR', gst: '', taxNumber: '', address: '', website: '', notes: '' }
  const [form, setForm] = useState(client || blank)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const submit = () => { if (!form.company && !form.name) return; saveClient(form); onClose() }
  return (
    <Modal open={open} onClose={onClose} title={client ? 'Edit Client' : 'Add Client'} size="lg"
      footer={<><button className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit}>Save Client</button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Company Name"><Input value={form.company} onChange={(e) => set('company', e.target.value)} /></Field>
        <Field label="Contact Name"><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Email"><Input value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label="Country"><Input value={form.country} onChange={(e) => set('country', e.target.value)} /></Field>
        <Field label="Currency"><Select value={form.currency} onChange={(e) => set('currency', e.target.value)}>{Object.keys(CURRENCIES).map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="GST Number"><Input value={form.gst} onChange={(e) => set('gst', e.target.value)} /></Field>
        <Field label="Tax Number"><Input value={form.taxNumber} onChange={(e) => set('taxNumber', e.target.value)} /></Field>
        <Field label="Website"><Input value={form.website} onChange={(e) => set('website', e.target.value)} /></Field>
        <Field label="Address"><Input value={form.address} onChange={(e) => set('address', e.target.value)} /></Field>
      </div>
      <Field label="Notes" className="mt-4"><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
    </Modal>
  )
}

export default function Clients() {
  const { clients, invoices } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)

  const stats = useMemo(() => {
    const m = {}
    clients.forEach((c) => (m[c.id] = { revenue: 0, pending: 0, count: 0 }))
    invoices.forEach((i) => {
      if (!m[i.clientId]) return
      m[i.clientId].count++
      m[i.clientId].revenue += toINR(i.amountPaid, i.currency)
      if (['Sent', 'Viewed', 'Partially Paid', 'Overdue'].includes(i.status)) m[i.clientId].pending += toINR(i.total - i.amountPaid, i.currency)
    })
    return m
  }, [clients, invoices])

  const filtered = clients.filter((c) => !q || [c.company, c.name, c.email, c.country].join(' ').toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      <PageHeader title="Client Management" subtitle={`${clients.length} clients`} icon={Building2}
        actions={<>
          <button className="btn-outline" onClick={() => exportCSV(clients, [{ key: 'company', label: 'Company' }, { key: 'name', label: 'Contact' }, { key: 'email', label: 'Email' }, { key: 'country', label: 'Country' }, { key: 'currency', label: 'Currency' }], 'clients.csv')}><Download size={16} /> Export</button>
          <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add Client</button>
        </>} />

      <Card className="!p-4 mb-4"><SearchInput value={q} onChange={setQ} placeholder="Search clients…" /></Card>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={Building2} title="No clients yet" action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Add Client</button>} /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const s = stats[c.id] || { revenue: 0, pending: 0, count: 0 }
            return (
              <Card key={c.id} className="cursor-pointer hover:shadow-soft transition" onClick={() => nav(`/clients/${c.id}`)}>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={c.company || c.name} size={44} />
                  <div className="min-w-0"><p className="font-bold truncate">{c.company || c.name}</p><p className="text-xs text-slate-400 truncate flex items-center gap-1"><Globe size={11} /> {c.country} · {c.currency}</p></div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2"><p className="text-xs text-slate-400">Invoices</p><p className="font-bold">{s.count}</p></div>
                  <div className="rounded-lg bg-emerald-500/10 p-2"><p className="text-xs text-slate-400">Revenue</p><p className="font-bold text-emerald-600 text-sm">{compactMoney(s.revenue)}</p></div>
                  <div className="rounded-lg bg-amber-500/10 p-2"><p className="text-xs text-slate-400">Pending</p><p className="font-bold text-amber-600 text-sm">{compactMoney(s.pending)}</p></div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <ClientModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
