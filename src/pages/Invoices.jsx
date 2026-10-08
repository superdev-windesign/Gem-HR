import ClientEditor from '../components/ClientEditor'
import InvoiceImport from '../components/InvoiceImport'
import { duplicateInvoice, clientForInvoice, fiscalYear, fyLabel, addDays, validateInvoice } from '../lib/invoicing'
import { useMemo, useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Receipt, Plus, Download, Trash2, Eye, Send, CheckCircle2, CreditCard, X, FileText, Copy, Users, Upload, Edit3,
} from 'lucide-react'
import { useStore, toINR } from '../store/StoreContext'
import { PageHeader, Card, StatCard, SearchInput, Select, Badge, Modal, Field, Input, Textarea, EmptyState, Tabs, useConfirm } from '../components/ui'
import { money, compactMoney, fmtDate, fmtDateTime, todayISO, uid } from '../lib/format'
import { CURRENCIES } from '../lib/format'
import { invoiceHTML, computeInvoiceTax } from '../lib/documents'
import { exportPDF, exportDOC, exportCSV } from '../lib/export'

const STATUSES = ['Draft', 'Sent', 'Viewed', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled']
const typeFor = (client) => ((client?.country || '').toLowerCase() === 'india' ? 'gst' : 'export')

function InvoiceEditor({ open, onClose, invoice, draft, initialClientId }) {
  const { clients, invoices, saveInvoice, nextInvoiceNumber, settings } = useStore()
  const blank = () => {
    const c = clients.find(c=>c.id===initialClientId) || clients[0]
    const type = typeFor(c)
    return {
      id: uid('inv'), type, number: nextInvoiceNumber(type), clientId: c?.id || '',
      date: todayISO(), dueDate: addDays(todayISO(), 15),
      currency: type === 'gst' ? 'INR' : c?.currency || 'USD',
      items: [{ id: uid('it'), description: '', note: '', qty: 1, rate: 0 }],
      discount: 0, taxRate: settings.defaults.gstRate || 18,
      reverseCharge: 'No', modeOfTransport: 'Digital',
      notes: '', status: 'Draft', amountPaid: 0, payments: [],
    }
  }
  const [form, setForm] = useState(invoice || draft || blank)
  const [error,setError]=useState('')
  const [clientEditor,setClientEditor]=useState({open:false,client:null})
  useEffect(() => { if(open){setForm(invoice || draft || blank());setError('')} }, [invoice, draft, open, initialClientId])
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))
  const setItem = (id, k, v) => set('items', form.items.map((it) => (it.id === id ? { ...it, [k]: v } : it)))
  const addItem = () => set('items', [...form.items, { id: uid('it'), description: '', note: '', qty: 1, rate: 0 }])
  const delItem = (id) => set('items', form.items.filter((it) => it.id !== id))

  const client = form.clientSnapshot || clients.find((c) => c.id === form.clientId)
  const isGST = form.type === 'gst'

  const onClientChange = (id, savedClient) => {
    const c = savedClient || clients.find((x) => x.id === id)
    const type = typeFor(c)
    setForm((f) => ({
      ...f, clientId: id, clientSnapshot:c ? {...c}:undefined, type, taxRate:type==='gst'?(f.type==='gst'?f.taxRate:settings.defaults.gstRate||18):0,
      currency: type === 'gst' ? 'INR' : c?.currency || f.currency || 'USD',
      number: invoice ? f.number : nextInvoiceNumber(type,f.date),
    }))
  }
  const onTypeChange = (type) => {
    setForm((f) => ({
      ...f, type, taxRate:type==='gst'?(f.type==='gst'?f.taxRate:settings.defaults.gstRate||18):0,
      currency: type === 'gst' ? 'INR' : f.currency === 'INR' ? 'USD' : f.currency,
      number: invoice ? f.number : nextInvoiceNumber(type,f.date),
    }))
  }

  // Historical taxes stay exact until a billing input is deliberately changed.
  const billingKeys=['type','items','discount','taxRate','clientId','clientSnapshot']
  const keepOriginalTaxes=!!invoice?.imported && billingKeys.every(k=>JSON.stringify(form[k])===JSON.stringify(invoice[k]))
  const t = computeInvoiceTax(
    keepOriginalTaxes ? form : { type: form.type, items: form.items, discount: form.discount, taxRate: form.taxRate },
    client,
    settings.company
  )

  const save = (status) => {
    const errs=validateInvoice(form,invoices,client,{historical:!!invoice?.imported && form.number===invoice.number && form.date===invoice.date && form.type===invoice.type})
    if(errs.length){setError(errs.join(' '));return}
    try { saveInvoice({
      ...form, clientSnapshot:{...client}, taxLines:keepOriginalTaxes?form.taxLines:undefined, subtotal: t.subtotal, discount: Number(form.discount || 0), taxRate: Number(form.taxRate),
      cgst: t.cgst, sgst: t.sgst, igst: t.igst, taxAmount: t.taxAmount, total: t.total,
      status: (status || form.status)==='Paid' && invoice && Number(form.amountPaid)<t.total ? 'Partially Paid' : status || form.status, amountPaid: !invoice && (status || form.status)==='Paid' ? t.total : Number(form.amountPaid || 0),
    })
    onClose()
    }catch(e){setError(e.message)}
  }

  const cur = form.currency

  return (
    <><Modal open={open} onClose={onClose} title={invoice ? `Edit ${invoice.number}` : draft ? `Duplicate ${draft.duplicateOf}` : 'Create Invoice'} size="xl"
      footer={<>
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-outline" onClick={() => save('Draft')}>Save Draft</button>
        <button className="btn-primary" onClick={() => save(invoice ? form.status : 'Sent')}><Send size={15} /> {invoice ? 'Save Changes' : 'Save & Mark Sent'}</button>
      </>}>
      {error&&<p role="alert" className="rounded-lg bg-rose-50 text-rose-700 p-3 mb-4">{error}</p>}
      {draft&&<p className="text-sm text-slate-500 mb-4">New number and dates; payments and status reset. Select any client to fill their current billing details.</p>}
      {/* Type toggle */}
      <div className="flex items-center gap-2 mb-4">
        <span className="label !mb-0">Invoice Type</span>
        <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          {[{ v: 'gst', l: '🇮🇳 Indian (GST)' }, { v: 'export', l: '🌍 Export (International)' }].map((o) => (
            <button key={o.v} onClick={() => onTypeChange(o.v)}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition ${form.type === o.v ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-500'}`}>{o.l}</button>
          ))}
        </div>
        {client && <span className="text-xs text-slate-400">Auto-set from {client.company || client.name} · {client.country}</span>}
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Invoice Number"><Input aria-label="Invoice Number" value={form.number} onChange={(e) => set('number', e.target.value)} /></Field>
        <Field label="Client"><Select aria-label="Invoice Client" value={form.clientId} onChange={(e) => onClientChange(e.target.value)}><option value="">Select client</option>{form.clientId&&!clients.some(c=>c.id===form.clientId)&&<option value={form.clientId}>{client?.company} (saved customer)</option>}{clients.map((c) => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}</Select></Field>
        <Field label="Currency"><Select value={form.currency} onChange={(e) => set('currency', e.target.value)} disabled={isGST}>{Object.keys(CURRENCIES).map((c) => <option key={c}>{c}</option>)}</Select></Field>
        <Field label="Invoice Date"><Input type="date" value={form.date} onChange={(e) => {const date=e.target.value;setForm(f=>({...f,date,dueDate:date?addDays(date,15):'',number:invoice||!date?f.number:nextInvoiceNumber(f.type,date)}))}} /></Field>
        <Field label="Due Date"><Input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} /></Field>
        <Field label="Status"><Select value={form.status} onChange={(e) => set('status', e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
        <Field label="Mode of Transport"><Input value={form.modeOfTransport} onChange={(e) => set('modeOfTransport', e.target.value)} /></Field>
        {isGST && <Field label="Reverse Charge"><Select value={form.reverseCharge} onChange={(e) => set('reverseCharge', e.target.value)}><option>No</option><option>Yes</option></Select></Field>}
        {isGST && <Field label="GST Rate (%)"><Input type="number" value={form.taxRate} onChange={(e) => set('taxRate', e.target.value)} /></Field>}
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold">Customer details</p><div className="flex gap-2"><button className="btn-ghost" onClick={()=>setClientEditor({open:true,client:null})}><Plus size={14}/> Add Client</button>{clients.some(c=>c.id===form.clientId)&&<button className="btn-ghost" onClick={()=>setClientEditor({open:true,client:clients.find(c=>c.id===form.clientId)})}><Edit3 size={14}/> Edit Client</button>}</div></div>
      {client?<div className="text-sm space-y-1"><p>{client.company||client.name}</p><p className="whitespace-pre-line">{client.address}</p><p>{client.country} · {client.gst||client.taxNumber||'No tax registration supplied'}</p><p>{client.email} {client.phone}</p><p className="text-xs text-slate-500">Saved on this invoice to preserve billing history.</p></div>:<p className="text-sm text-slate-500">Choose or add a client to fill their billing details.</p>}
      </div>
      <p className="label mt-5">Line Items / Services</p>
      <div className="space-y-2">
        <div className="hidden sm:grid grid-cols-12 gap-2 text-xs text-slate-400 px-1">
          <span className="col-span-5">Service name / sub-note</span><span className="col-span-3">Duration / Qty</span><span className="col-span-2">Rate</span><span className="col-span-2">Total</span>
        </div>
        {form.items.map((it) => (
          <div key={it.id} className="grid grid-cols-12 gap-2 items-start">
            <div className="col-span-5 space-y-1">
              <input className="input" placeholder="Service name" value={it.description} onChange={(e) => setItem(it.id, 'description', e.target.value)} />
              <input className="input !py-1.5 text-xs" placeholder="Sub-note (e.g. advance / final payment)" value={it.note || ''} onChange={(e) => setItem(it.id, 'note', e.target.value)} />
            </div>
            <input className="input col-span-3" placeholder="1 or 'Multiple Commissions'" value={it.qty} onChange={(e) => setItem(it.id, 'qty', e.target.value)} />
            <input className="input col-span-2" type="number" placeholder="Rate" value={it.rate} onChange={(e) => setItem(it.id, 'rate', e.target.value)} />
            <div className="col-span-2 flex items-center gap-1">
              <span className="text-sm font-semibold flex-1 truncate">{money(t.subtotal != null ? (Number(it.rate || 0) * (isNaN(Number(it.qty)) || it.qty === '' ? 1 : Number(it.qty))) : 0, cur, {decimals:2})}</span>
              <button className="btn-ghost !p-1.5 text-rose-500" onClick={() => delItem(it.id)} disabled={form.items.length === 1}><X size={15} /></button>
            </div>
          </div>
        ))}
      </div>
      <button className="btn-ghost mt-2 text-brand-600" onClick={addItem}><Plus size={15} /> Add line item</button>

      <div className="grid sm:grid-cols-2 gap-4 mt-4">
        <Field label="Notes"><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Optional note shown on the invoice" /></Field>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 h-fit">
          <div className="flex justify-between py-1.5 text-sm"><span className="text-slate-500">{isGST ? 'Taxable Value' : 'Subtotal'}</span><span className="font-semibold">{money(t.taxable, cur, { decimals: 2 })}</span></div>
          {Number(form.discount) > 0 && <div className="flex justify-between py-1.5 text-sm"><span className="text-slate-500">Discount</span><span className="font-semibold">− {money(form.discount, cur)}</span></div>}
          {isGST && !t.interState && <>
            <div className="flex justify-between py-1.5 text-sm"><span className="text-slate-500">CGST {t.rate / 2}%</span><span className="font-semibold">{money(t.cgst, cur, {decimals:2})}</span></div>
            <div className="flex justify-between py-1.5 text-sm"><span className="text-slate-500">SGST {t.rate / 2}%</span><span className="font-semibold">{money(t.sgst, cur, {decimals:2})}</span></div>
          </>}
          {isGST && t.interState && <div className="flex justify-between py-1.5 text-sm"><span className="text-slate-500">IGST {t.rate}%</span><span className="font-semibold">{money(t.igst, cur, {decimals:2})}</span></div>}
          <div className="flex justify-between py-2 mt-1 border-t border-slate-200 dark:border-slate-700 text-base"><span className="font-bold">Total</span><span className="font-bold text-brand-600">{money(t.total, cur, { decimals: 2 })}</span></div>
          {isGST && <p className="text-xs text-slate-400 mt-2">{t.interState ? 'Inter-state → IGST applied.' : 'Intra-state → CGST + SGST applied.'} Set the client's GST state code in the client profile to control this.</p>}
        </div>
      </div>
    </Modal><ClientEditor open={clientEditor.open} client={clientEditor.client} onClose={()=>setClientEditor({open:false,client:null})} onSaved={c=>onClientChange(c.id,c)}/></>
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

function DetailModal({ open, onClose, invoice, onPay, onEdit, onDuplicate }) {
  const { clients, settings, setInvoiceStatus } = useStore()
  if (!invoice) return null
  const client = clientForInvoice(invoice,clients)
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
      <button className="btn-outline mb-4" onClick={()=>{onDuplicate(invoice);onClose()}}><Copy size={15}/> Duplicate Invoice</button>
      {invoice.sourceFile&&<p className="text-xs text-slate-500 mb-3">Imported from {invoice.sourceFile}. Original number, date and printed taxes preserved.</p>}
      {invoice.importWarnings?.map(w=><p key={w} className="text-sm text-amber-700 mb-2">{w}</p>)}
      {invoice.paymentDateUnknown&&<p className="text-sm text-slate-500 mb-3">Marked paid on your instruction. Payment date not supplied.</p>}
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
          <p className="text-xs text-slate-400 mb-2 font-semibold uppercase">Payment Tracking</p>
          <div className="flex justify-between text-sm py-1"><span className="text-slate-500">Total</span><b>{money(invoice.total, invoice.currency, {decimals:2})}</b></div>
          <div className="flex justify-between text-sm py-1"><span className="text-slate-500">Paid</span><b className="text-emerald-600">{money(invoice.amountPaid, invoice.currency, {decimals:2})}</b></div>
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
  const { invoices, clients, deleteInvoice, settings } = useStore()
  const { confirm, node } = useConfirm()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('All')
  const [fy,setFy]=useState(String(fiscalYear(todayISO())))
  const [clientModal,setClientModal]=useState(false)
  const [importOpen,setImportOpen]=useState(false)
  const duplicate=inv=>setEditor({open:true,invoice:null,draft:duplicateInvoice(inv,invoices,clients,todayISO(),settings.invoice)})
  const [editor, setEditor] = useState({ open: false, invoice: null })
  const [pay, setPay] = useState({ open: false, invoice: null })
  const [detail, setDetail] = useState({ open: false, invoice: null })

  useEffect(() => {
    const clientId=params.get('client')
    if(clientId){setEditor({open:true,invoice:null,initialClientId:clientId});params.delete('client');setParams(params,{replace:true})}
    const focus = params.get('focus')
    if (focus) {
      const inv = invoices.find((i) => i.id === focus)
      if (inv) setDetail({ open: true, invoice: inv })
      params.delete('focus'); setParams(params, { replace: true })
    }
  }, []) // eslint-disable-line

  const clientName = (id,inv) => (inv&&clientForInvoice(inv,clients)?.company) || clients.find((c) => c.id === id)?.company || '—'
  const filtered = invoices.filter((i) => {
    if(fy!=='All' && String(fiscalYear(i.date))!==fy) return false
    if (status !== 'All' && i.status !== status) return false
    if (q && ![i.number, clientName(i.clientId,i)].join(' ').toLowerCase().includes(q.toLowerCase())) return false
    return true
  }).sort((a,b)=>b.date.localeCompare(a.date)||b.number.localeCompare(a.number))

  const totals = useMemo(() => {
    let billed = 0, collected = 0, outstanding = 0
    invoices.filter(i=>fy==='All'||String(fiscalYear(i.date))===fy).forEach((i) => {
      if (i.status !== 'Draft' && i.status !== 'Cancelled') billed += toINR(i.total, i.currency)
      collected += toINR(i.amountPaid, i.currency)
      if (['Sent', 'Viewed', 'Partially Paid', 'Overdue'].includes(i.status)) outstanding += toINR(i.total - i.amountPaid, i.currency)
    })
    return { billed, collected, outstanding }
  }, [invoices,fy])

  const currencyTotals = invoices.filter(i=>(fy==='All'||String(fiscalYear(i.date))===fy)&&!['Draft','Cancelled'].includes(i.status)).reduce((totals,i)=>({...totals,[i.currency]:(totals[i.currency]||0)+i.total}),{})

  const remove = async (inv) => {
    if (await confirm({ title: 'Delete invoice?', message: `${inv.number} will be permanently deleted.`, danger: true, confirmText: 'Delete' })) deleteInvoice(inv.id)
  }

  return (
    <div>
      {node}
      <PageHeader stackActions title="Invoice Management" subtitle="GST & international invoicing with payment tracking" icon={Receipt}
        actions={<>
          <Link className="btn-outline" to="/clients"><Users size={16}/> Clients</Link>
          <button className="btn-outline" onClick={()=>setClientModal(true)}><Plus size={16}/> Add Client</button>
          <button className="btn-outline" onClick={()=>setImportOpen(true)}><Upload size={16}/> Import PDFs</button>
          <button className="btn-outline" onClick={() => exportCSV(invoices, [{ key: 'number', label: 'Number' }, { key: 'client', label: 'Client', value: (i) => clientName(i.clientId,i) }, { key: 'date', label: 'Date' }, { key: 'total', label: 'Total' }, { key: 'currency', label: 'Currency' }, { key: 'status', label: 'Status' }], 'invoices.csv')}><Download size={16} /> Export</button>
          <button className="btn-primary" onClick={() => setEditor({ open: true, invoice: null })}><Plus size={16} /> Create Invoice</button>
        </>} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <StatCard label="Total Billed" value={compactMoney(totals.billed)} sub="Approx. INR · selected financial year" icon={Receipt} tone="brand" />
        <StatCard label="Collected" value={compactMoney(totals.collected)} sub="Payments received" icon={CheckCircle2} tone="green" />
        <StatCard label="Outstanding" value={compactMoney(totals.outstanding)} sub="Awaiting payment" icon={CreditCard} tone="amber" />
      </div>

      <p className="text-xs text-slate-500 mb-4">Billed in original currencies: {Object.entries(currencyTotals).map(([cur,total])=>`${cur} ${money(total,cur,{decimals:2})}`).join(' · ') || '—'}. INR summaries use the workspace’s indicative exchange rates.</p>
      <Card className="!p-4 mb-4">
        <div className="flex gap-3 items-center mb-3"><label htmlFor="invoice-fy" className="text-sm font-semibold">Financial year</label><Select id="invoice-fy" value={fy} onChange={e=>setFy(e.target.value)}><option value="All">All financial years</option>{[...new Set([fiscalYear(todayISO()),...invoices.map(i=>fiscalYear(i.date))])].sort((a,b)=>b-a).map(y=><option key={y} value={y}>{y}–{y+1}</option>)}</Select><span className="text-xs text-slate-500">April–March · {filtered.length} invoices</span></div>
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
                    <td className="td max-w-[240px] truncate" title={clientName(i.clientId,i)}>{clientName(i.clientId,i)}</td>
                    <td className="td text-slate-400 whitespace-nowrap">{fmtDate(i.date)}</td>
                    <td className="td text-right font-semibold">{money(i.total, i.currency, {decimals:2})}</td>
                    <td className="td text-right text-emerald-600">{money(i.amountPaid, i.currency, {decimals:2})}</td>
                    <td className="td"><Badge>{i.status}</Badge></td>
                    <td className="td text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        <button className="btn-ghost !p-1.5" title="View" onClick={() => setDetail({ open: true, invoice: i })}><Eye size={15} /></button><button className="btn-ghost !p-1.5" title="Duplicate invoice" aria-label={`Duplicate ${i.number}`} onClick={(e)=>{e.stopPropagation();duplicate(i)}}><Copy size={15}/></button>
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

      <ClientEditor open={clientModal} onClose={()=>setClientModal(false)}/>
      <InvoiceImport open={importOpen} onClose={()=>setImportOpen(false)}/>
      <InvoiceEditor open={editor.open} invoice={editor.invoice} draft={editor.draft} initialClientId={editor.initialClientId} onClose={() => setEditor({ open: false, invoice: null })} />
      <PaymentModal open={pay.open} invoice={pay.invoice} onClose={() => setPay({ open: false, invoice: null })} />
      <DetailModal open={detail.open} invoice={detail.invoice && (invoices.find(i=>i.id===detail.invoice.id)||detail.invoice)} onClose={() => setDetail({ open: false, invoice: null })}
        onPay={(inv) => setPay({ open: true, invoice: inv })} onDuplicate={duplicate} onEdit={(inv) => setEditor({ open: true, invoice: inv })} />
    </div>
  )
}
