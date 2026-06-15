import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, Globe, MapPin, Building2, Edit3, Trash2, Receipt, FileText } from 'lucide-react'
import { useStore, toINR } from '../store/StoreContext'
import { PageHeader, Card, Avatar, Badge, StatCard, EmptyState, useConfirm, Modal, Field, Input, Select, Textarea } from '../components/ui'
import { money, compactMoney, fmtDate } from '../lib/format'
import { CURRENCIES } from '../lib/format'

function EditModal({ open, onClose, client }) {
  const { saveClient } = useStore()
  const [form, setForm] = useState(client)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  return (
    <Modal open={open} onClose={onClose} title="Edit Client" size="lg"
      footer={<><button className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={() => { saveClient(form); onClose() }}>Save</button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Company"><Input value={form.company} onChange={(e) => set('company', e.target.value)} /></Field>
        <Field label="Contact"><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Email"><Input value={form.email} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Phone"><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label="Country"><Input value={form.country} onChange={(e) => set('country', e.target.value)} /></Field>
        <Field label="Currency"><Select value={form.currency} onChange={(e) => set('currency', e.target.value)}>{Object.keys(CURRENCIES).map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="GST"><Input value={form.gst} onChange={(e) => set('gst', e.target.value)} /></Field>
        <Field label="Website"><Input value={form.website} onChange={(e) => set('website', e.target.value)} /></Field>
      </div>
      <Field label="Address" className="mt-4"><Input value={form.address} onChange={(e) => set('address', e.target.value)} /></Field>
      <Field label="Notes" className="mt-4"><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
    </Modal>
  )
}

export default function ClientProfile() {
  const { id } = useParams()
  const nav = useNavigate()
  const { clients, invoices, deleteClient } = useStore()
  const { confirm, node } = useConfirm()
  const [edit, setEdit] = useState(false)
  const client = clients.find((c) => c.id === id)
  if (!client) return <Card><EmptyState title="Client not found" action={<Link to="/clients" className="btn-primary">Back</Link>} /></Card>

  const clientInvoices = invoices.filter((i) => i.clientId === id).sort((a, b) => new Date(b.date) - new Date(a.date))
  const revenue = clientInvoices.reduce((s, i) => s + toINR(i.amountPaid, i.currency), 0)
  const pending = clientInvoices.filter((i) => ['Sent', 'Viewed', 'Partially Paid', 'Overdue'].includes(i.status)).reduce((s, i) => s + toINR(i.total - i.amountPaid, i.currency), 0)

  const remove = async () => {
    if (await confirm({ title: 'Delete client?', message: `${client.company} will be removed. Invoices remain but lose their link.`, danger: true, confirmText: 'Delete' })) {
      deleteClient(id); nav('/clients')
    }
  }

  return (
    <div>
      {node}
      <button onClick={() => nav('/clients')} className="btn-ghost mb-3 -ml-2"><ArrowLeft size={16} /> Back to Clients</button>

      <Card className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar name={client.company || client.name} size={64} />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{client.company || client.name}</h1>
            <p className="text-slate-500 dark:text-slate-400">{client.name} · {client.country} · {client.currency}</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-outline" onClick={() => setEdit(true)}><Edit3 size={16} /> Edit</button>
            <Link to="/invoices" className="btn-primary"><Receipt size={16} /> New Invoice</Link>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <StatCard label="Total Revenue" value={compactMoney(revenue)} sub="Collected (INR equiv.)" icon={Receipt} tone="green" />
        <StatCard label="Pending Payments" value={compactMoney(pending)} sub="Outstanding" icon={FileText} tone="amber" />
        <StatCard label="Total Invoices" value={clientInvoices.length} icon={Receipt} tone="brand" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <h3 className="font-bold mb-3">Client Information</h3>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Mail size={14} className="text-slate-400" /> {client.email || '—'}</p>
            <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Phone size={14} className="text-slate-400" /> {client.phone || '—'}</p>
            <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Globe size={14} className="text-slate-400" /> {client.website || '—'}</p>
            <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><MapPin size={14} className="text-slate-400" /> {client.address || '—'}</p>
            <p className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Building2 size={14} className="text-slate-400" /> {client.gst || client.taxNumber || '—'}</p>
          </div>
          {client.notes && <p className="mt-4 text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3">{client.notes}</p>}
          <button className="btn-ghost text-rose-600 mt-4 -ml-2" onClick={remove}><Trash2 size={15} /> Delete client</button>
        </Card>

        <Card className="lg:col-span-2 !p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 font-bold">Invoice History & Payment Timeline</div>
          {clientInvoices.length === 0 ? <div className="p-5"><EmptyState icon={Receipt} title="No invoices yet" /></div> : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {clientInvoices.map((i) => (
                <Link to="/invoices" key={i.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div><p className="font-semibold text-sm">{i.number}</p><p className="text-xs text-slate-400">{fmtDate(i.date)} · due {fmtDate(i.dueDate)}</p></div>
                  <div className="text-right"><p className="font-semibold text-sm">{money(i.total, i.currency)}</p><Badge>{i.status}</Badge></div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      <EditModal open={edit} onClose={() => setEdit(false)} client={client} />
    </div>
  )
}
