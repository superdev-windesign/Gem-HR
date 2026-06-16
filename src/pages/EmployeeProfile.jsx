import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Mail, Phone, MapPin, Calendar, User, Briefcase, Wallet, FileText,
  Award, FileSignature, FilePlus, Receipt, Clock, Download, Edit3, Trash2, ChevronRight,
} from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { PageHeader, Card, Avatar, Badge, Tabs, Modal, Field, Input, Select, Textarea, useConfirm, EmptyState } from '../components/ui'
import { money, fmtDate, fmtDateTime } from '../lib/format'
import { offerLetterHTML, appointmentLetterHTML, promotionLetterHTML, payslipHTML } from '../lib/documents'
import { exportPDF, exportDOC } from '../lib/export'

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon size={16} className="text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200 break-words">{value || '—'}</p>
      </div>
    </div>
  )
}

function SalaryRow({ label, value, deduction, disabled }) {
  return (
    <div className="flex justify-between py-1.5 text-sm">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      {disabled ? (
        <span className="font-semibold text-slate-400">Disabled</span>
      ) : (
        <span className={`font-semibold ${deduction ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-200'}`}>{deduction ? '− ' : ''}{money(value)}</span>
      )}
    </div>
  )
}

// ---------- Offer Letter Modal ----------
function OfferModal({ emp, open, onClose }) {
  const { settings, addDocument } = useStore()
  const c = emp.compensation
  const [d, setD] = useState({
    candidateName: emp.name, role: emp.designation, department: emp.department,
    joiningDate: emp.joiningDate, location: emp.location, manager: emp.manager,
    probation: settings.defaults.probation, notice: settings.defaults.notice,
    basic: c.basic, hra: c.hra, special: c.special, other: c.other,
  })
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }))
  const monthly = Number(d.basic) + Number(d.hra) + Number(d.special) + Number(d.other)
  const annual = monthly * 12
  const build = () => offerLetterHTML(emp, { ...d, salary: { basic: +d.basic, hra: +d.hra, special: +d.special, other: +d.other }, monthly, annual }, settings.company)
  const finalize = (fn, ext) => {
    fn()
    addDocument({ type: 'Offer Letter', name: `${emp.name} — Offer Letter`, empId: emp.id, category: 'Employee', timelineType: 'Offer Letter Generated', format: ext, html: build() })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Generate Offer Letter" size="lg"
      footer={<>
        <button className="btn-outline" onClick={() => exportPDF(build(), 'Offer Letter')}><Download size={16} /> Preview / PDF</button>
        <button className="btn-outline" onClick={() => finalize(() => exportDOC(build(), `${emp.name}-Offer.doc`), 'DOCX')}>Save DOCX</button>
        <button className="btn-primary" onClick={() => finalize(() => exportPDF(build(), 'Offer Letter'), 'PDF')}>Generate & Store</button>
      </>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Candidate Name"><Input value={d.candidateName} onChange={(e) => set('candidateName', e.target.value)} /></Field>
        <Field label="Role"><Input value={d.role} onChange={(e) => set('role', e.target.value)} /></Field>
        <Field label="Department"><Input value={d.department} onChange={(e) => set('department', e.target.value)} /></Field>
        <Field label="Joining Date"><Input type="date" value={d.joiningDate} onChange={(e) => set('joiningDate', e.target.value)} /></Field>
        <Field label="Location"><Input value={d.location} onChange={(e) => set('location', e.target.value)} /></Field>
        <Field label="Manager"><Input value={d.manager} onChange={(e) => set('manager', e.target.value)} /></Field>
        <Field label="Probation"><Input value={d.probation} onChange={(e) => set('probation', e.target.value)} /></Field>
        <Field label="Notice Period"><Input value={d.notice} onChange={(e) => set('notice', e.target.value)} /></Field>
      </div>
      <p className="label mt-4">Salary Structure (Monthly)</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Field label="Basic"><Input type="number" value={d.basic} onChange={(e) => set('basic', e.target.value)} /></Field>
        <Field label="HRA"><Input type="number" value={d.hra} onChange={(e) => set('hra', e.target.value)} /></Field>
        <Field label="Special"><Input type="number" value={d.special} onChange={(e) => set('special', e.target.value)} /></Field>
        <Field label="Other"><Input type="number" value={d.other} onChange={(e) => set('other', e.target.value)} /></Field>
      </div>
      <div className="mt-4 flex gap-4 rounded-xl bg-brand-600/10 p-4">
        <div><p className="text-xs text-slate-500">Monthly Salary</p><p className="text-lg font-bold text-brand-600">{money(monthly)}</p></div>
        <div><p className="text-xs text-slate-500">Annual CTC</p><p className="text-lg font-bold text-brand-600">{money(annual)}</p></div>
      </div>
    </Modal>
  )
}

// ---------- Appointment Letter Modal ----------
function AppointmentModal({ emp, open, onClose }) {
  const { settings, addDocument } = useStore()
  const [d, setD] = useState({ role: emp.designation, department: emp.department, joiningDate: emp.joiningDate, location: emp.location, manager: emp.manager })
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }))
  const build = () => appointmentLetterHTML(emp, d, settings.company)
  const finalize = (fn, ext) => { fn(); addDocument({ type: 'Appointment Letter', name: `${emp.name} — Appointment Letter`, empId: emp.id, category: 'Employee', timelineType: 'Appointment Letter Generated', format: ext, html: build() }); onClose() }
  return (
    <Modal open={open} onClose={onClose} title="Generate Appointment Letter" size="lg"
      footer={<>
        <button className="btn-outline" onClick={() => exportPDF(build(), 'Appointment Letter')}><Download size={16} /> Preview / PDF</button>
        <button className="btn-outline" onClick={() => finalize(() => exportDOC(build(), `${emp.name}-Appointment.doc`), 'DOCX')}>Save DOCX</button>
        <button className="btn-primary" onClick={() => finalize(() => exportPDF(build(), 'Appointment Letter'), 'PDF')}>Generate & Store</button>
      </>}>
      <p className="text-sm text-slate-500 mb-4">Details are auto-pulled from the profile. Edit before generation if needed.</p>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Role"><Input value={d.role} onChange={(e) => set('role', e.target.value)} /></Field>
        <Field label="Department"><Input value={d.department} onChange={(e) => set('department', e.target.value)} /></Field>
        <Field label="Joining Date"><Input type="date" value={d.joiningDate} onChange={(e) => set('joiningDate', e.target.value)} /></Field>
        <Field label="Manager"><Input value={d.manager} onChange={(e) => set('manager', e.target.value)} /></Field>
        <Field label="Location"><Input value={d.location} onChange={(e) => set('location', e.target.value)} /></Field>
      </div>
    </Modal>
  )
}

// ---------- Promotion Modal ----------
function PromoteModal({ emp, open, onClose }) {
  const { promoteEmployee, settings, addDocument } = useStore()
  const [d, setD] = useState({
    fromDesignation: emp.designation, toDesignation: '', fromSalary: emp.compensation.ctc, toSalary: emp.compensation.ctc,
    effectiveDate: new Date().toISOString().slice(0, 10), newDepartment: '', newManager: '', notes: '',
  })
  const set = (k, v) => setD((p) => ({ ...p, [k]: v }))
  const submit = (alsoLetter) => {
    if (!d.toDesignation.trim()) return
    const promo = { ...d, fromSalary: +d.fromSalary, toSalary: +d.toSalary }
    promoteEmployee(emp.id, promo)
    if (alsoLetter) {
      const html = promotionLetterHTML(emp, promo, settings.company)
      exportPDF(html, 'Promotion Letter')
      addDocument({ type: 'Promotion Letter', name: `${emp.name} — Promotion Letter`, empId: emp.id, category: 'Employee', format: 'PDF', html })
    }
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={`Promote ${emp.name}`} size="lg"
      footer={<><button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-outline" onClick={() => submit(false)}>Promote Only</button>
        <button className="btn-primary" onClick={() => submit(true)}>Promote & Generate Letter</button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Current Designation"><Input value={d.fromDesignation} disabled /></Field>
        <Field label="New Designation *"><Input value={d.toDesignation} onChange={(e) => set('toDesignation', e.target.value)} placeholder="Senior Product Designer" /></Field>
        <Field label="Current Salary (CTC)"><Input type="number" value={d.fromSalary} disabled /></Field>
        <Field label="Revised Salary (CTC)"><Input type="number" value={d.toSalary} onChange={(e) => set('toSalary', e.target.value)} /></Field>
        <Field label="Effective Date"><Input type="date" value={d.effectiveDate} onChange={(e) => set('effectiveDate', e.target.value)} /></Field>
        <Field label="Department Change"><Input value={d.newDepartment} onChange={(e) => set('newDepartment', e.target.value)} placeholder="Leave blank to keep" /></Field>
        <Field label="Manager Change"><Input value={d.newManager} onChange={(e) => set('newManager', e.target.value)} placeholder="Leave blank to keep" /></Field>
      </div>
      <Field label="Promotion Notes" className="mt-4"><Textarea value={d.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
    </Modal>
  )
}

// ---------- Payslip Modal ----------
function PayslipModal({ emp, open, onClose }) {
  const { generatePayslip, settings } = useStore()
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))
  const run = (fn) => {
    const slip = generatePayslip(emp.id, month, payDate)
    if (slip && fn) fn(slip)
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={`Generate Payslip — ${emp.name}`} size="sm"
      footer={<>
        <button className="btn-outline" onClick={() => run((s) => exportDOC(payslipHTML(emp, s, settings.company), `${emp.name}-Payslip.doc`))}>Save DOCX</button>
        <button className="btn-primary" onClick={() => run((s) => exportPDF(payslipHTML(emp, s, settings.company), 'Payslip'))}>Generate PDF</button>
      </>}>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Pay Month"><Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></Field>
        <Field label="Pay Date"><Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} /></Field>
      </div>
      <p className="text-xs text-slate-400 mt-4">Components are computed from the saved salary structure. The payslip is stored in the employee profile and timeline.</p>
    </Modal>
  )
}

// ---------- Edit Employee Modal (Personal / Professional / Compensation) ----------
const DEPTS = ['Leadership', 'Design', 'Engineering', 'Marketing', 'People', 'Finance', 'Operations']
const ETYPES = ['Full Time', 'Intern', 'Freelancer', 'Contractor']

function Toggle({ on, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!on)}
      className={`flex items-center gap-2 text-sm font-medium ${on ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400'}`}>
      <span className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${on ? 'bg-brand-600' : 'bg-slate-300 dark:bg-slate-600'}`}>
        <span className={`inline-block h-4 w-4 rounded-full bg-white transition ${on ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </span>
      {label}
    </button>
  )
}

function EditEmployeeModal({ emp, open, onClose }) {
  const { updateEmployee } = useStore()
  const [f, setF] = useState(emp)
  useEffect(() => { setF(emp) }, [emp, open])
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const c = f.compensation || {}
  const setC = (k, v) => setF((p) => ({ ...p, compensation: { ...p.compensation, [k]: v } }))
  const enabled = (k) => c[k] !== false

  const save = () => {
    const comp = { ...c, ctc: +c.ctc, basic: +c.basic, hra: +c.hra, special: +c.special, other: +c.other, bonus: +c.bonus, pf: +c.pf, esic: +c.esic, tax: +c.tax }
    updateEmployee(emp.id, {
      name: f.name, email: f.email, mobile: f.mobile, address: f.address, dob: f.dob, emergencyContact: f.emergencyContact,
      designation: f.designation, department: f.department, joiningDate: f.joiningDate, manager: f.manager,
      location: f.location, type: f.type, status: f.status, compensation: comp,
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={`Edit — ${emp.name}`} size="lg"
      footer={<><button className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={save}>Save Changes</button></>}>
      <h4 className="font-bold text-sm uppercase tracking-wide text-slate-500 mb-3">Personal</h4>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full Name"><Input value={f.name || ''} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Email"><Input value={f.email || ''} onChange={(e) => set('email', e.target.value)} /></Field>
        <Field label="Mobile"><Input value={f.mobile || ''} onChange={(e) => set('mobile', e.target.value)} /></Field>
        <Field label="Date of Birth"><Input type="date" value={f.dob || ''} onChange={(e) => set('dob', e.target.value)} /></Field>
        <Field label="Address"><Input value={f.address || ''} onChange={(e) => set('address', e.target.value)} /></Field>
        <Field label="Emergency Contact"><Input value={f.emergencyContact || ''} onChange={(e) => set('emergencyContact', e.target.value)} /></Field>
      </div>

      <h4 className="font-bold text-sm uppercase tracking-wide text-slate-500 mt-6 mb-3">Professional</h4>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Designation"><Input value={f.designation || ''} onChange={(e) => set('designation', e.target.value)} /></Field>
        <Field label="Department"><Select value={f.department} onChange={(e) => set('department', e.target.value)}>{DEPTS.map((d) => <option key={d}>{d}</option>)}</Select></Field>
        <Field label="Joining Date"><Input type="date" value={f.joiningDate || ''} onChange={(e) => set('joiningDate', e.target.value)} /></Field>
        <Field label="Reporting Manager"><Input value={f.manager || ''} onChange={(e) => set('manager', e.target.value)} /></Field>
        <Field label="Work Location"><Input value={f.location || ''} onChange={(e) => set('location', e.target.value)} /></Field>
        <Field label="Employment Type"><Select value={f.type} onChange={(e) => set('type', e.target.value)}>{ETYPES.map((t) => <option key={t}>{t}</option>)}</Select></Field>
        <Field label="Status"><Select value={f.status} onChange={(e) => set('status', e.target.value)}><option>Active</option><option>Resigned</option><option>Inactive</option></Select></Field>
      </div>

      <h4 className="font-bold text-sm uppercase tracking-wide text-slate-500 mt-6 mb-3">Compensation</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Field label="Annual CTC"><Input type="number" value={c.ctc} onChange={(e) => setC('ctc', e.target.value)} /></Field>
        <Field label="Basic"><Input type="number" value={c.basic} onChange={(e) => setC('basic', e.target.value)} /></Field>
        <Field label="HRA"><Input type="number" value={c.hra} onChange={(e) => setC('hra', e.target.value)} /></Field>
        <Field label="Special Allowance"><Input type="number" value={c.special} onChange={(e) => setC('special', e.target.value)} /></Field>
        <Field label="Other Allowances"><Input type="number" value={c.other} onChange={(e) => setC('other', e.target.value)} /></Field>
        <Field label="Bonus"><Input type="number" value={c.bonus} onChange={(e) => setC('bonus', e.target.value)} /></Field>
      </div>
      <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
        <p className="label">Statutory Deductions — enable / disable</p>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-2"><Toggle on={enabled('pfEnabled')} onChange={(v) => setC('pfEnabled', v)} label="PF" /><Input type="number" value={c.pf} disabled={!enabled('pfEnabled')} onChange={(e) => setC('pf', e.target.value)} /></div>
          <div className="space-y-2"><Toggle on={enabled('esicEnabled')} onChange={(v) => setC('esicEnabled', v)} label="ESIC" /><Input type="number" value={c.esic} disabled={!enabled('esicEnabled')} onChange={(e) => setC('esic', e.target.value)} /></div>
          <div className="space-y-2"><Toggle on={enabled('taxEnabled')} onChange={(v) => setC('taxEnabled', v)} label="Tax (TDS)" /><Input type="number" value={c.tax} disabled={!enabled('taxEnabled')} onChange={(e) => setC('tax', e.target.value)} /></div>
        </div>
        <p className="text-xs text-slate-400 mt-3">Disabled deductions are excluded from payslips (shown as ₹0).</p>
      </div>
    </Modal>
  )
}

const TL_ICON = {
  'Employee Created': User, 'Offer Letter Generated': FileSignature, 'Offer Accepted': FileText,
  'Appointment Letter Generated': FilePlus, 'Salary Revision': Wallet, Promotion: Award,
  'Department Change': Briefcase, 'Manager Change': User, Resignation: ArrowLeft, Exit: ArrowLeft,
  'Payslip Generated': Receipt, 'Document Generated': FileText,
}

export default function EmployeeProfile() {
  const { id } = useParams()
  const nav = useNavigate()
  const { employees, timeline, documents, payslips, promotions, settings, deleteEmployee, updateEmployee } = useStore()
  const { confirm, node } = useConfirm()
  const emp = employees.find((e) => e.id === id)
  const [tab, setTab] = useState('overview')
  const [modal, setModal] = useState(null)

  if (!emp) return <Card><EmptyState title="Employee not found" action={<Link to="/employees" className="btn-primary">Back to directory</Link>} /></Card>

  const empTimeline = timeline.filter((t) => t.empId === id).sort((a, b) => new Date(b.date) - new Date(a.date))
  const empDocs = documents.filter((d) => d.empId === id)
  const empSlips = payslips.filter((p) => p.empId === id)
  const c = emp.compensation

  const remove = async () => {
    if (await confirm({ title: 'Delete employee?', message: `${emp.name} and their timeline will be permanently removed.`, danger: true, confirmText: 'Delete' })) {
      deleteEmployee(id)
      nav('/employees')
    }
  }

  return (
    <div>
      {node}
      <button onClick={() => nav('/employees')} className="btn-ghost mb-3 -ml-2"><ArrowLeft size={16} /> Back to Employees</button>

      <Card className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Avatar name={emp.name} src={emp.photo} size={72} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{emp.name}</h1>
              <Badge>{emp.type}</Badge><Badge>{emp.status}</Badge>
            </div>
            <p className="text-slate-500 dark:text-slate-400">{emp.designation} · {emp.department} · {emp.empId}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-outline" onClick={() => setModal('edit')}><Edit3 size={16} /> Edit</button>
            <button className="btn-outline" onClick={() => setModal('offer')}><FileSignature size={16} /> Offer Letter</button>
            <button className="btn-outline" onClick={() => setModal('appointment')}><FilePlus size={16} /> Appointment</button>
            <button className="btn-outline" onClick={() => setModal('promote')}><Award size={16} /> Promote</button>
            <button className="btn-primary" onClick={() => setModal('payslip')}><Receipt size={16} /> Payslip</button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
          <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-1">Every action is independent — generate documents in any order.</span>
        </div>
      </Card>

      <div className="mb-4"><Tabs active={tab} onChange={setTab} tabs={[
        { value: 'overview', label: 'Overview' }, { value: 'timeline', label: `Timeline (${empTimeline.length})` },
        { value: 'documents', label: `Documents (${empDocs.length})` }, { value: 'payslips', label: `Payslips (${empSlips.length})` },
      ]} /></div>

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-4">
          <Card>
            <h3 className="font-bold mb-2 flex items-center gap-2"><User size={16} className="text-brand-600" /> Personal</h3>
            <InfoRow icon={Mail} label="Email" value={emp.email} />
            <InfoRow icon={Phone} label="Mobile" value={emp.mobile} />
            <InfoRow icon={MapPin} label="Address" value={emp.address} />
            <InfoRow icon={Calendar} label="Date of Birth" value={emp.dob && fmtDate(emp.dob)} />
            <InfoRow icon={Phone} label="Emergency Contact" value={emp.emergencyContact} />
          </Card>
          <Card>
            <h3 className="font-bold mb-2 flex items-center gap-2"><Briefcase size={16} className="text-brand-600" /> Professional</h3>
            <InfoRow icon={Briefcase} label="Designation" value={emp.designation} />
            <InfoRow icon={Briefcase} label="Department" value={emp.department} />
            <InfoRow icon={Calendar} label="Joining Date" value={fmtDate(emp.joiningDate)} />
            <InfoRow icon={User} label="Reporting Manager" value={emp.manager} />
            <InfoRow icon={MapPin} label="Work Location" value={emp.location} />
          </Card>
          <Card>
            <h3 className="font-bold mb-3 flex items-center gap-2"><Wallet size={16} className="text-brand-600" /> Compensation</h3>
            <SalaryRow label="Annual CTC" value={c.ctc} />
            <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
            <SalaryRow label="Basic" value={c.basic} />
            <SalaryRow label="HRA" value={c.hra} />
            <SalaryRow label="Special Allowance" value={c.special} />
            <SalaryRow label="Other Allowances" value={c.other} />
            <SalaryRow label="Bonus" value={c.bonus} />
            <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
            <SalaryRow label="PF" value={c.pf} deduction disabled={c.pfEnabled === false} />
            <SalaryRow label="ESIC" value={c.esic} deduction disabled={c.esicEnabled === false} />
            <SalaryRow label="Tax (TDS)" value={c.tax} deduction disabled={c.taxEnabled === false} />
          </Card>
        </div>
      )}

      {tab === 'timeline' && (
        <Card>
          {empTimeline.length === 0 ? <EmptyState icon={Clock} title="No timeline events yet" /> : (
            <ol className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-5">
              {empTimeline.map((t) => {
                const Icon = TL_ICON[t.type] || FileText
                return (
                  <li key={t.id} className="ml-6">
                    <span className="absolute -left-[13px] grid place-items-center h-6 w-6 rounded-full bg-brand-600 text-white"><Icon size={12} /></span>
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{t.type}</p>
                      <time className="text-xs text-slate-400">{fmtDateTime(t.date)}</time>
                    </div>
                    {t.note && <p className="text-sm text-slate-500 dark:text-slate-400">{t.note}</p>}
                  </li>
                )
              })}
            </ol>
          )}
        </Card>
      )}

      {tab === 'documents' && (
        <Card className="!p-0 overflow-hidden">
          {empDocs.length === 0 ? <div className="p-5"><EmptyState icon={FileText} title="No documents generated" hint="Use the action buttons above to generate offer letters, payslips and more." /></div> : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {empDocs.map((d) => (
                <div key={d.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="grid place-items-center h-9 w-9 rounded-lg bg-brand-600/10 text-brand-600"><FileText size={16} /></div>
                  <div className="flex-1 min-w-0"><p className="font-semibold text-sm">{d.type}</p><p className="text-xs text-slate-400">{d.format || 'PDF'} · {fmtDateTime(d.date)}</p></div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'payslips' && (
        <Card className="!p-0 overflow-hidden">
          {empSlips.length === 0 ? <div className="p-5"><EmptyState icon={Receipt} title="No payslips generated" action={<button className="btn-primary" onClick={() => setModal('payslip')}>Generate Payslip</button>} /></div> : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {empSlips.map((s) => (
                <div key={s.id} className="flex items-center justify-between px-5 py-3">
                  <div><p className="font-semibold text-sm">{s.monthLabel}</p><p className="text-xs text-slate-400">Gross {money(s.gross)} · Deductions {money(s.totalDeductions)}</p></div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-emerald-600">{money(s.net)}</p>
                    <button className="btn-ghost !p-1.5" onClick={() => exportPDF(payslipHTML(emp, s, settings.company), 'Payslip')}><Download size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="mt-6">
        <button className="btn-ghost text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20" onClick={remove}><Trash2 size={16} /> Delete Employee</button>
      </div>

      <EditEmployeeModal emp={emp} open={modal === 'edit'} onClose={() => setModal(null)} />
      <OfferModal emp={emp} open={modal === 'offer'} onClose={() => setModal(null)} />
      <AppointmentModal emp={emp} open={modal === 'appointment'} onClose={() => setModal(null)} />
      <PromoteModal emp={emp} open={modal === 'promote'} onClose={() => setModal(null)} />
      <PayslipModal emp={emp} open={modal === 'payslip'} onClose={() => setModal(null)} />
    </div>
  )
}
