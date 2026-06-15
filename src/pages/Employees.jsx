import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, Download, Filter, Upload } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { PageHeader, SearchInput, Select, Modal, Field, Input, Avatar, Badge, EmptyState, Card } from '../components/ui'
import { exportCSV, exportExcel } from '../lib/export'
import { money, compactMoney } from '../lib/format'

const TYPES = ['Full Time', 'Intern', 'Freelancer', 'Contractor']
const DEPTS = ['Leadership', 'Design', 'Engineering', 'Marketing', 'People', 'Finance', 'Operations']

function CreateEmployeeModal({ open, onClose }) {
  const { createEmployee, nextEmpId } = useStore()
  const blank = () => ({
    empId: nextEmpId(), name: '', email: '', mobile: '', designation: '', department: 'Design',
    type: 'Full Time', joiningDate: new Date().toISOString().slice(0, 10), manager: '', location: 'Bengaluru', ctc: 1200000,
  })
  const [form, setForm] = useState(blank)
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }))

  const submit = () => {
    if (!form.name.trim()) return
    const ctc = Number(form.ctc) || 0
    const basic = Math.round((ctc * 0.4) / 12)
    const hra = Math.round(basic * 0.5)
    createEmployee({
      ...form,
      ctc,
      compensation: {
        ctc, basic, hra,
        special: Math.max(Math.round(ctc / 12 - basic - hra - 2000), 0),
        other: 2000, bonus: Math.round((ctc * 0.05) / 12),
        pf: Math.round(basic * 0.12), esic: ctc < 252000 ? Math.round((ctc / 12) * 0.0075) : 0,
        tax: Math.round((ctc / 12) * 0.08),
      },
    })
    setForm(blank())
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Employee" size="lg"
      footer={<><button className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit}>Create Employee</button></>}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Employee ID"><Input value={form.empId} onChange={(e) => set('empId', e.target.value)} /></Field>
        <Field label="Full Name *"><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Jane Doe" /></Field>
        <Field label="Email"><Input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="jane@company.com" /></Field>
        <Field label="Mobile"><Input value={form.mobile} onChange={(e) => set('mobile', e.target.value)} /></Field>
        <Field label="Designation"><Input value={form.designation} onChange={(e) => set('designation', e.target.value)} placeholder="Product Designer" /></Field>
        <Field label="Department">
          <Select value={form.department} onChange={(e) => set('department', e.target.value)}>{DEPTS.map((d) => <option key={d}>{d}</option>)}</Select>
        </Field>
        <Field label="Employment Type">
          <Select value={form.type} onChange={(e) => set('type', e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</Select>
        </Field>
        <Field label="Joining Date"><Input type="date" value={form.joiningDate} onChange={(e) => set('joiningDate', e.target.value)} /></Field>
        <Field label="Reporting Manager"><Input value={form.manager} onChange={(e) => set('manager', e.target.value)} /></Field>
        <Field label="Work Location"><Input value={form.location} onChange={(e) => set('location', e.target.value)} /></Field>
        <Field label="Annual CTC (₹)"><Input type="number" value={form.ctc} onChange={(e) => set('ctc', e.target.value)} /></Field>
      </div>
      <p className="text-xs text-slate-400 mt-4">Salary components (Basic/HRA/allowances/PF/Tax) are auto-calculated from CTC and editable later in the profile.</p>
    </Modal>
  )
}

export default function Employees() {
  const { employees } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [type, setType] = useState('All')
  const [dept, setDept] = useState('All')
  const [status, setStatus] = useState('All')
  const [createOpen, setCreateOpen] = useState(false)

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    return employees.filter((e) => {
      if (term && ![e.name, e.empId, e.designation, e.department, e.email].join(' ').toLowerCase().includes(term)) return false
      if (type !== 'All' && e.type !== type) return false
      if (dept !== 'All' && e.department !== dept) return false
      if (status !== 'All' && e.status !== status) return false
      return true
    })
  }, [employees, q, type, dept, status])

  const columns = [
    { key: 'empId', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'designation', label: 'Designation' },
    { key: 'department', label: 'Department' }, { key: 'type', label: 'Type' },
    { key: 'ctc', label: 'CTC', value: (e) => e.compensation?.ctc }, { key: 'status', label: 'Status' },
  ]

  return (
    <div>
      <PageHeader title="Employee Management" subtitle={`${employees.length} people in your organization`} icon={Users}
        actions={
          <>
            <button className="btn-outline" onClick={() => exportCSV(filtered, columns, 'employees.csv')}><Download size={16} /> CSV</button>
            <button className="btn-outline" onClick={() => exportExcel(filtered, columns, 'employees.xls', 'Employees')}><Download size={16} /> Excel</button>
            <button className="btn-primary" onClick={() => setCreateOpen(true)}><Plus size={16} /> Create Employee</button>
          </>
        }
      />

      <Card className="!p-4 mb-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SearchInput value={q} onChange={setQ} placeholder="Search by name, ID, role…" />
          <Select value={type} onChange={(e) => setType(e.target.value)}><option>All</option>{TYPES.map((t) => <option key={t}>{t}</option>)}</Select>
          <Select value={dept} onChange={(e) => setDept(e.target.value)}><option value="All">All Departments</option>{DEPTS.map((d) => <option key={d}>{d}</option>)}</Select>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option><option>Active</option><option>Resigned</option><option>Inactive</option></Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={Users} title="No employees found" hint="Try adjusting filters, or create your first employee." action={<button className="btn-primary" onClick={() => setCreateOpen(true)}><Plus size={16} /> Create Employee</button>} /></Card>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                <tr><th className="th">Employee</th><th className="th">Designation</th><th className="th">Department</th><th className="th">Type</th><th className="th text-right">CTC</th><th className="th">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => nav(`/employees/${e.id}`)}>
                    <td className="td">
                      <div className="flex items-center gap-3">
                        <Avatar name={e.name} src={e.photo} size={38} />
                        <div><p className="font-semibold text-slate-800 dark:text-slate-100">{e.name}</p><p className="text-xs text-slate-400">{e.empId} · {e.email}</p></div>
                      </div>
                    </td>
                    <td className="td">{e.designation}</td>
                    <td className="td">{e.department}</td>
                    <td className="td"><Badge>{e.type}</Badge></td>
                    <td className="td text-right font-semibold">{compactMoney(e.compensation?.ctc)}</td>
                    <td className="td"><Badge>{e.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateEmployeeModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
