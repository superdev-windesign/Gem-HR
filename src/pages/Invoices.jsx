import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Receipt, Plus, Download, Trash2, Eye, Send, CheckCircle2, CreditCard, X, FileText,
} from 'lucide-react'
import { useStore, toINR } from '../store/StoreContext'
import { PageHeader, Card, StatCard, SearchInput, Select, Badge, Modal, Field, Input, Textarea, EmptyState, Tabs, useConfirm } from '../components/ui'
import { money, compactMoney, fmtDate, fmtDateTime, todayISO, uid } from '../lib/format'
import { CURRENCIES } from '../lib/format'
import { invoiceHTML } from '../lib/documents'
import { exportPDF, exportDOC, exportCSV } from '../lib/export'

const STATUSES = ['Draft', 'Sent', 'Viewed', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled']

function compute(items, discount, taxRate) {
  const subtotal = items.reduce((s, i) => s + Number(i.qty || 0) * Number(i.rate || 0), 0)
  const taxAmount = Math.round(((subtotal - Number(discount || 0)) * Number(taxRate || 0)) / 100)
  const total = subtotal - Number(discount || 0) + taxAmount
  return { subtotal, taxAmount, total }
}

function InvoiceEditor({ open, onClose, invoice }) {
  const { clients, saveInvoice, nextInvoiceNumber, settings } = useStore()
  const blank = () => ({
    id: uid('inv'), number: nextInvoiceNumber(), clientId: clients[0]?.id || '', date: todayISO(),
    dueDate: todayISO(), currency: settings.company.currency || 'INR',
    items: [{ id: uid('it'), description: '', qty: 1, rate: 0 }],
    discount: 0, taxRate: settings.defaults.taxRate || 18, notes: 'Thank you for your business.',
    terms: 'Payment due within 15 days of invoice date.', status: 'Draft', amountPaid: 0, payments: [],
  })
  const [form, setForm] = useState(invoice || blank)
  useEffect(() => { setForm(invoice || blank()) }, [invoice, open])
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const setItem = (id, k, v) => set('items', form.items.map((it) => (it.id === id ? { ...it, [k]: v } : it)))
  const addItem = () => set('items', [...form.items, { id: uid('it'), description: '', qty: 1, rate: 0 }])
  const delItem = (id) => set('items', form.items.filter((it) => it.id !== id))
  const { subtotal, taxAmount, total } = compute(form.items, form.discount, form.taxRate)

  const save = (status) => {
    const final = { ...form, subtotal, taxAmount, total, status: status || form.status }
    saveInvoice(final)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={invoice ? `Edit ${invoice.number}` : 'Create Invoice'} size="xl"
      footer={<>
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-outline" onClick={() => save('Draft')}>Save Draft</button>
        <button className="btn-primary" onClick={() => save('Sent')}><Send size={15} /> Save & Mark Sent</button>
      </>}>
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Invoice Number"><Input value={form.number} onChange={(e) => set('number', e.target.value)} /></Field>
        <Field label="Client"><Select value={form.clientId} onChange={(e) => set('clientId', e.target.value)}>{clients.map((c) => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}</Select></Field>
        <Field label="Currency"><Select value={form.currency} onChange={(e) => set('currency', e.target.value)}>{Object.keys(CURRENCIES).map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Invoice Date"><Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></Field>
        <Field label="Due Date"><Input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} /></Field>
        <Field label="Status"><Select value={form.status} onChange={(e) => set('status', e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
      </div>

      <p className="label mt-5">Line Items / Services</p>
      <div className="space-y-2">
        {form.items.map((it) => (
          <div key={it.id} className="grid grid-cols-12 gap-2 items-center">
            <input className="input col-span-6" placeholder="Service description" value={it.description} onChange={(e) => setItem(it.id, 'description', e.target.value)} />
            <input className="input col-span-2" type="number" placeholder="Qty" value={it.qty} onChange={(e) => setItem(it.id, 'qty', e.target.value)} />
            <input className="input col-span-3" type="number" placeholder="Rate" value={it.rate} onChange={(e) => setItem(it.id, 'rate', e.target.value)} />
            <button className="btn-ghost !p-2 col-span-1 text-rose-500" onClick={() => delItem(it.id)} disabled={form.items.length === 1}><X size={16} /></button>
          </div>
        ))}
      </div>
      <button className="btn-ghost mt-2 text-brand-600" onClick={addItem}><Plus size={15} /> Add line item</button>

      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <div className="space-y-3">
          <Field label="Discount"><Input type="number" value={form.discount} onChange={(e) => set('discount', e.target.value)} /></Field>
          <Field label="Tax Rate (%)"><Input type="number" value={form.taxRate} onChange={(e) => set('taxRate', e.target.value)} /></Field>
          <Field label="Notes"><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
          <Field label="Terms"><Textarea value={form.terms} onChange={(e) => set('terms', e.target.value)} /></Field>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 h-fit">
          <div className="flex justify-between py-1.5 text-sm"><span className="text-slate-500">Subtotal</span><span className="font-semibold">{money(subtotal, form.currency)}</span></div>
          <div className="flex justify-between py-1.5 text-sm"><span className="text-slate-500">Discount</span><span className="font-semibold">− {money(form.discount, form.currency)}</span></div>
          <div className="flex justify-between py-1.5 text-sm"><span className="text-slate-500">Tax ({form.taxRate}%)</span><span className="font-semibold">{money(taxAmount, form.currency)}</span></div>
          <div className="flex justify-between py-2 mt-1 border-t border-slate-200 dark:border-slate-700 text-base"><span className="font-bold">Total</span><span className="font-bold text-brand-600">{money(total, form.currency)}</span></div>
        </div>
      </div>
    </Modal>
  )
}

function PaymentModal({ open, onClose, invoice }) {
  const { recordPayment } = useStore()
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [method, setMethod] = useState('Bank Transfer')
  useEffect(() => { if (open && invoice) setAmount(String(invoice.total - invoice.amountPaid)) }, [open, invoice])
  if (!invoice) return null
  return (
    <Modal open={open} onClose={onClose} title={`Record Payment — ${invoice.number}`} size="sm"
      footer={<><button className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={() => { recordPayment(invoice.id, { amount: Number(amount), date, method }); onClose() }}>Record Payment</button></>}>
      <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 mb-4 text-sm flex justify-between">
        <span className="text-slate-500">Balance due</span><span className="font-bold">{money(invoice.total - invoice.amountPaid, invoice.currency)}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Amount"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      </div>
      <Field label="Method" className="mt-3"><Select value={method} onChange={(e) => setMethod(e.target.value)}>{['Bank Transfer', 'NEFT', 'UPI', 'Credit Card', 'Wire', 'Cash', 'Cheque'].map((m) => <option key={m}>{m}</option>)}</Select></Field>
    </Modal>
  )
}

function DetailModal({ open, onClose, invoice, onPay, onEdit }) {
  const { clients, settings, setInvoiceStatus } = useStore()
  if (!invoice) return null
  const client = clients.find((c) => c.id === invoice.clientId)
  const html = invoiceHTML(invoice, client, settings.company)
  return (
    <Modal open={open} onClose={onClose} title={invoice.number} size="lg"
      footer={<>
        <button className="btn-outline" onClick={() => exportDOC(html, `${invoice.number}.doc`)}>DOCX</button>
        <button className="btn-outline" onClick={() => exportPDF(html, invoice.number)}><Download size={15} /> PDF</button>
        {invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && <button className="btn-primary" onClick={() => { onPay(invoice); onClose() }}><CreditCard size={15} /> Record Payment</button>}
      </>}>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Badge>{invoice.status}</Badge>
        <span className="text-sm text-slate-400">·</span>
        <button className="btn-ghost !py-1 text-xs" onClick={() => setInvoiceStatus(invoice.id, 'Sent')}>Mark Sent</button>
        <button className="btn-ghost !py-1 text-xs" onClick={() => setInvoiceStatus(invoice.id, 'Viewed')}>Mark Viewed</button>
        <button className="btn-ghost !py-1 text-xs" onClick={() => setInvoiceStatus(invoice.id, 'Cancelled')}>Cancel</button>
        <button className="btn-ghost !py-1 text-xs" onClick={() => { onEdit(invoice); onClose() }}>Edit</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-xs text-slate-400 mb-2 font-semibold uppercase">Payment Tracking</p>
          <div className="flex justify-between text-sm py-1"><span className="text-slate-500">Total</span><b>{money(invoice.total, invoice.currency)}</b></div>
          <div className="flex justify-between text-sm py-1"><span className="text-slate-500">Paid</span><b className="text-emerald-600">{money(invoice.amountPaid, invoice.currency)}</b></div>
          <div className="flex justify-between text-sm py-1 border-t border-slate-100 dark:border-slate-800 mt-1 pt-2"><span className="text-slate-500">Pending</span><b className="text-amber-600">{money(invoice.total - invoice.amountPaid, invoice.currency)}</b></div>
          {(invoice.payments || []).map((p) => (
            <div key={p.id} className="flex justify-between text-xs text-slate-400 mt-1.5"><span>{fmtDate(p.date)} · {p.method}</span><span>{money(p.amount, invoice.currency)}</span></div>
          ))}
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-xs text-slate-400 mb-2 font-semibold uppercase">Invoice Timeline</p>
          <ol className="space-y-2">
            {(invoice.events || []).map((e, i) => (
              <li key={i} className="flex items-center gap-2 text-sm"><span className="h-2 w-2 rounded-full bg-brand-500" /><span className="font-medium">{e.type}</span><span className="text-xs text-slate-400 ml-auto">{fmtDateTime(e.date)}</span></li>
            ))}
          </ol>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden" dangerouslySetInnerHTML={{ __html: html }} />
    </Modal>
  )
}

export default function Invoices() {
  const { invoices, clients, deleteInvoice } = useStore()
  const { confirm, node } = useConfirm()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('All')
  const [editor, setEditor] = useState({ open: false, invoice: null })
  const [pay, setPay] = useState({ open: false, invoice: null })
  const [detail, setDetail] = useState({ open: false, invoice: null })

  useEffect(() => {
    const focus = params.get('focus')
    if (focus) {
      const inv = invoices.find((i) => i.id === focus)
      if (inv) setDetail({ open: true, invoice: inv })
      params.delete('focus'); setParams(params, { replace: true })
    }
  }, []) // eslint-disable-line

  const clientName = (id) => clients.find((c) => c.id === id)?.company || '—'
  const filtered = invoices.filter((i) => {
    if (status !== 'All' && i.status !== status) return false
    if (q && ![i.number, clientName(i.clientId)].join(' ').toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  const totals = useMemo(() => {
    let billed = 0, collected = 0, outstanding = 0
    invoices.forEach((i) => {
      if (i.status !== 'Draft' && i.status !== 'Cancelled') billed += toINR(i.total, i.currency)
      collected += toINR(i.amountPaid, i.currency)
      if (['Sent', 'Viewed', 'Partially Paid', 'Overdue'].includes(i.status)) outstanding += toINR(i.total - i.amountPaid, i.currency)
    })
    return { billed, collected, outstanding }
  }, [invoices])

  const remove = async (inv) => {
    if (await confirm({ title: 'Delete invoice?', message: `${inv.number} will be permanently deleted.`, danger: true, confirmText: 'Delete' })) deleteInvoice(inv.id)
  }

  return (
    <div>
      {node}
      <PageHeader title="Invoice Management" subtitle="GST & international invoicing with payment tracking" icon={Receipt}
        actions={<>
          <button className="btn-outline" onClick={() => exportCSV(invoices, [{ key: 'number', label: 'Number' }, { key: 'client', label: 'Client', value: (i) => clientName(i.clientId) }, { key: 'date', label: 'Date' }, { key: 'total', label: 'Total' }, { key: 'currency', label: 'Currency' }, { key: 'status', label: 'Status' }], 'invoices.csv')}><Download size={16} /> Export</button>
          <button className="btn-primary" onClick={() => setEditor({ open: true, invoice: null })}><Plus size={16} /> Create Invoice</button>
        </>} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <StatCard label="Total Billed" value={compactMoney(totals.billed)} sub="INR equivalent" icon={Receipt} tone="brand" />
        <StatCard label="Collected" value={compactMoney(totals.collected)} sub="Payments received" icon={CheckCircle2} tone="green" />
        <StatCard label="Outstanding" value={compactMoney(totals.outstanding)} sub="Awaiting payment" icon={CreditCard} tone="amber" />
      </div>

      <Card className="!p-4 mb-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2"><SearchInput value={q} onChange={setQ} placeholder="Search invoice number or client…" /></div>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={Receipt} title="No invoices found" action={<button className="btn-primary" onClick={() => setEditor({ open: true, invoice: null })}><Plus size={16} /> Create Invoice</button>} /></Card>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                <tr><th className="th">Invoice</th><th className="th">Client</th><th className="th">Date</th><th className="th text-right">Total</th><th className="th text-right">Paid</th><th className="th">Status</th><th className="th"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => setDetail({ open: true, invoice: i })}>
                    <td className="td font-semibold">{i.number}</td>
                    <td className="td">{clientName(i.clientId)}</td>
                    <td className="td text-slate-400">{fmtDate(i.date)}</td>
                    <td className="td text-right font-semibold">{money(i.total, i.currency)}</td>
                    <td className="td text-right text-emerald-600">{money(i.amountPaid, i.currency)}</td>
                    <td className="td"><Badge>{i.status}</Badge></td>
                    <td className="td text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost !p-1.5" title="View" onClick={() => setDetail({ open: true, invoice: i })}><Eye size={15} /></button>
                        <button className="btn-ghost !p-1.5 text-rose-500" title="Delete" onClick={() => remove(i)}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <InvoiceEditor open={editor.open} invoice={editor.invoice} onClose={() => setEditor({ open: false, invoice: null })} />
      <PaymentModal open={pay.open} invoice={pay.invoice} onClose={() => setPay({ open: false, invoice: null })} />
      <DetailModal open={detail.open} invoice={detail.invoice} onClose={() => setDetail({ open: false, invoice: null })}
        onPay={(inv) => setPay({ open: true, invoice: inv })} onEdit={(inv) => setEditor({ open: true, invoice: inv })} />
    </div>
  )
}
