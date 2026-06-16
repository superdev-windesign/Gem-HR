import { useMemo, useState } from 'react'
import { FileText, Download, FileSignature, Award, Receipt, FileCheck, ScrollText, Eye } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { PageHeader, Card, SearchInput, Select, Badge, EmptyState, Modal } from '../components/ui'
import { fmtDateTime } from '../lib/format'
import { invoiceHTML, payslipHTML } from '../lib/documents'
import { exportPDF, exportDOC } from '../lib/export'

const TYPE_ICON = {
  'Offer Letter': FileSignature, 'Appointment Letter': FileCheck, 'Promotion Letter': Award,
  Payslip: Receipt, Invoice: Receipt, Contract: ScrollText, Certificate: FileText,
}
const TYPES = ['All', 'Offer Letter', 'Appointment Letter', 'Promotion Letter', 'Payslip', 'Invoice', 'Contract', 'Certificate']

export default function Documents() {
  const { documents, employees, invoices, payslips, clients, settings } = useStore()
  const [q, setQ] = useState('')
  const [type, setType] = useState('All')
  const [preview, setPreview] = useState(null) // { name, html }

  const company = settings.company

  // Aggregate every document-like record into one repository, each with its renderable HTML.
  const all = useMemo(() => {
    const emp = (id) => employees.find((e) => e.id === id)
    const list = []

    documents.forEach((d) =>
      list.push({ id: d.id, type: d.type, name: d.name || d.type, owner: emp(d.empId)?.name || '—', date: d.date, format: d.format || 'PDF', html: d.html || null })
    )
    invoices.forEach((i) => {
      const cl = clients.find((c) => c.id === i.clientId)
      list.push({ id: 'inv-' + i.id, type: 'Invoice', name: i.number, owner: cl?.company || '—', date: i.date, format: 'PDF', html: invoiceHTML(i, cl, company) })
    })
    payslips.forEach((p) => {
      const e = emp(p.empId)
      list.push({ id: 'ps-' + p.id, type: 'Payslip', name: `${e?.name || 'Payslip'} — ${p.monthLabel}`, owner: e?.name || '—', date: p.payDate, format: 'PDF', html: e ? payslipHTML(e, p, company) : null })
    })
    return list.sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [documents, invoices, payslips, employees, clients, company])

  const filtered = all.filter((d) => {
    if (type !== 'All' && d.type !== type) return false
    if (q && ![d.name, d.type, d.owner].join(' ').toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  const counts = TYPES.slice(1).map((t) => ({ type: t, n: all.filter((d) => d.type === t).length }))
  const fileBase = (name) => name.replace(/[^a-z0-9]+/gi, '-')

  return (
    <div>
      <PageHeader title="Document Center" subtitle={`${all.length} documents across the company`} icon={FileText} />

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
        {counts.map((c) => {
          const Icon = TYPE_ICON[c.type] || FileText
          return (
            <button key={c.type} onClick={() => setType(type === c.type ? 'All' : c.type)} className={`card !p-3 text-left transition ${type === c.type ? 'ring-2 ring-brand-500' : ''}`}>
              <Icon size={18} className="text-brand-600 mb-2" />
              <p className="text-lg font-bold">{c.n}</p>
              <p className="text-xs text-slate-400 truncate">{c.type}</p>
            </button>
          )
        })}
      </div>

      <Card className="!p-4 mb-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2"><SearchInput value={q} onChange={setQ} placeholder="Search by name, owner, type…" /></div>
          <Select value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={FileText} title="No documents found" hint="Generate offer letters, payslips and invoices — they all land here automatically." /></Card>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                <tr><th className="th">Document</th><th className="th">Type</th><th className="th">Owner</th><th className="th">Format</th><th className="th">Date</th><th className="th text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((d) => {
                  const Icon = TYPE_ICON[d.type] || FileText
                  return (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="td"><div className="flex items-center gap-3"><div className="grid place-items-center h-9 w-9 rounded-lg bg-brand-600/10 text-brand-600"><Icon size={16} /></div><span className="font-semibold">{d.name}</span></div></td>
                      <td className="td"><Badge tone="Draft">{d.type}</Badge></td>
                      <td className="td">{d.owner}</td>
                      <td className="td text-slate-400">{d.format}</td>
                      <td className="td text-slate-400">{fmtDateTime(d.date)}</td>
                      <td className="td text-right">
                        {d.html ? (
                          <div className="flex justify-end gap-1">
                            <button className="btn-ghost !p-1.5" title="View" onClick={() => setPreview({ name: d.name, html: d.html })}><Eye size={16} /></button>
                            <button className="btn-ghost !p-1.5" title="Download PDF" onClick={() => exportPDF(d.html, d.name)}><Download size={16} /></button>
                            <button className="btn-ghost !p-1.5 text-xs font-bold" title="Save DOCX" onClick={() => exportDOC(d.html, fileBase(d.name) + '.doc')}>DOC</button>
                          </div>
                        ) : <span className="text-xs text-slate-400">no preview</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.name || 'Document'} size="lg"
        footer={preview && <>
          <button className="btn-outline" onClick={() => exportDOC(preview.html, fileBase(preview.name) + '.doc')}>Save DOCX</button>
          <button className="btn-primary" onClick={() => exportPDF(preview.html, preview.name)}><Download size={15} /> Download PDF</button>
        </>}>
        {preview && <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white p-4 overflow-x-auto" dangerouslySetInnerHTML={{ __html: preview.html }} />}
      </Modal>
    </div>
  )
}
