import {useState} from 'react'
import {useStore} from '../store/StoreContext'
import {Modal,Select} from './ui'
import {fyLabel} from '../lib/invoicing'
import {money} from '../lib/format'
export default function InvoiceImport({open,onClose}) {
 const {importInvoices,invoices}=useStore()
 const [entries,setEntries]=useState([]),[errors,setErrors]=useState([]),[busy,setBusy]=useState(false),[paid,setPaid]=useState(false),[result,setResult]=useState(null),[reviewed,setReviewed]=useState(false)
 const read=async files=>{
  setBusy(true);setEntries([]);setErrors([]);setResult(null);setReviewed(false)
  const good=[],bad=[]
  try {
   const {readInvoicePdf}=await import('../lib/readInvoicePdf')
   for(const file of files){try{good.push(await readInvoicePdf(file))}catch(e){bad.push(`${file.name}: ${e.message}`)}}
  } catch(e){bad.push(e.message)}
  setEntries(good);setErrors(bad);setBusy(false)
 }
 const submit=()=>{try{setResult(importInvoices(entries,paid));setEntries([])}catch(e){setErrors([e.message])}}
 return <Modal open={open} onClose={onClose} title="Import existing invoices" size="xl" footer={<><button className="btn-outline" onClick={onClose}>Close</button><button className="btn-primary" disabled={busy||!entries.length||!reviewed} onClick={submit}>Import {entries.length} invoices</button></>}>
 <div className="rounded-xl border-2 border-dashed border-slate-300 p-6 text-center" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();if(!busy)read([...e.dataTransfer.files])}}>
 <p className="font-semibold mb-2">Drop invoice PDFs here</p><p className="text-sm text-slate-500 mb-3">Reads the supplied one-page Windesign / Figma layout, including customer details, services and taxes. Scanned or other layouts need manual entry.</p>
 <input aria-label="Invoice PDF files" type="file" accept="application/pdf,.pdf" multiple disabled={busy} onChange={e=>read([...e.target.files])}/>
 </div>
 {busy&&<p role="status" className="mt-3">Reading PDFs…</p>}
 {errors.map((e,i)=><p key={i} role="alert" className="text-rose-600 mt-2">{e}</p>)}
 {result&&<div role="status" className="my-4 rounded-xl bg-emerald-50 text-emerald-800 p-4">Imported {result.added.length} invoices and {result.clientsAdded} clients. {result.skipped.length} identical files skipped.{result.conflicts.length>0&&<p>Conflicts left unchanged: {result.conflicts.join(', ')}. Review these existing invoices separately.</p>}<p>Use All financial years to see older invoices.</p></div>}
 {entries.length>0&&<>
 <div className="flex flex-wrap gap-3 items-center my-4"><label htmlFor="import-paid">Payment status</label><Select id="import-paid" value={paid?'paid':'unpaid'} onChange={e=>setPaid(e.target.value==='paid')}><option value="unpaid">Unpaid / Sent</option><option value="paid">All paid</option></Select></div>
 {paid&&<p className="text-sm text-slate-500 mb-3">Paid amounts will match invoice totals. Payment dates remain unknown; no receipt dates are invented.</p>}
 <div className="space-y-2">{entries.map((e,i)=><details key={i} className="border rounded-xl p-3 dark:border-slate-700"><summary className="cursor-pointer font-semibold">{e.invoice.number} · {e.client.company} · {money(e.invoice.total,e.invoice.currency)} <span className="font-normal text-slate-500">· FY {fyLabel(e.invoice.date)}</span></summary>
 <div className="text-sm mt-3 space-y-2"><p>{e.invoice.date} · due {e.invoice.dueDate} · {e.invoice.currency}</p><p>{e.client.address} · {e.client.country}</p><p>{e.client.gst||e.client.taxNumber}</p>{e.invoice.items.map((it,j)=><p key={j}>{it.description} · {it.qty} × {money(it.rate,e.invoice.currency)}</p>)}{e.invoice.taxLines.map((t,j)=><p key={j}>{t.label}: {money(t.amount,e.invoice.currency)}</p>)}</div>
 {e.invoice.importWarnings.map(w=><p key={w} className="text-sm text-amber-700 mt-2">{w}</p>)}
 {invoices.some(x=>x.number===e.invoice.number)&&<p className="text-sm text-amber-700 mt-2">This number already exists: identical source files are skipped; differing records are left unchanged.</p>}
 </details>)}</div>
 <label className="flex gap-2 mt-4 text-sm"><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/>I have reviewed customer details, invoice dates, amounts and any warnings.</label>
 </>}
 </Modal>
}
