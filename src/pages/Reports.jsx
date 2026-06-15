import { useState } from 'react'
import { BarChart3, Download, FileText, Users, Receipt, CreditCard, Building2, Award, TrendingUp, Activity } from 'lucide-react'
import { useStore, toINR } from '../store/StoreContext'
import { PageHeader, Card, Tabs, Badge } from '../components/ui'
import { exportCSV, exportExcel, exportJSON } from '../lib/export'
import { money, compactMoney, fmtDate, fmtDateTime, relativeTime } from '../lib/format'

const REPORTS = [
  { value: 'employees', label: 'Employees', icon: Users },
  { value: 'payroll', label: 'Payroll', icon: CreditCard },
  { value: 'promotions', label: 'Promotions', icon: Award },
  { value: 'invoices', label: 'Invoices', icon: Receipt },
  { value: 'revenue', label: 'Revenue', icon: TrendingUp },
  { value: 'expenses', label: 'Expenses', icon: CreditCard },
  { value: 'clients', label: 'Clients', icon: Building2 },
  { value: 'cashflow', label: 'Cash Flow', icon: TrendingUp },
  { value: 'activity', label: 'Activity Log', icon: Activity },
]

export default function Reports() {
  const store = useStore()
  const { employees, payslips, promotions, invoices, clients, expenses, activity, finance } = store
  const [report, setReport] = useState('employees')

  const clientName = (id) => clients.find((c) => c.id === id)?.company || '—'
  const empName = (id) => employees.find((e) => e.id === id)?.name || '—'

  const data = {
    employees: { rows: employees, cols: [{ key: 'empId', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'designation', label: 'Designation' }, { key: 'department', label: 'Department' }, { key: 'type', label: 'Type' }, { key: 'ctc', label: 'CTC', value: (e) => e.compensation?.ctc }, { key: 'status', label: 'Status' }] },
    payroll: { rows: payslips, cols: [{ key: 'monthLabel', label: 'Month' }, { key: 'emp', label: 'Employee', value: (p) => empName(p.empId) }, { key: 'gross', label: 'Gross' }, { key: 'totalDeductions', label: 'Deductions' }, { key: 'net', label: 'Net' }] },
    promotions: { rows: promotions, cols: [{ key: 'emp', label: 'Employee', value: (p) => empName(p.empId) }, { key: 'fromDesignation', label: 'From' }, { key: 'toDesignation', label: 'To' }, { key: 'fromSalary', label: 'Old CTC' }, { key: 'toSalary', label: 'New CTC' }, { key: 'effectiveDate', label: 'Effective', value: (p) => fmtDate(p.effectiveDate) }] },
    invoices: { rows: invoices, cols: [{ key: 'number', label: 'Number' }, { key: 'client', label: 'Client', value: (i) => clientName(i.clientId) }, { key: 'date', label: 'Date', value: (i) => fmtDate(i.date) }, { key: 'total', label: 'Total' }, { key: 'amountPaid', label: 'Paid' }, { key: 'currency', label: 'Currency' }, { key: 'status', label: 'Status' }] },
    revenue: { rows: invoices.filter((i) => i.amountPaid > 0), cols: [{ key: 'number', label: 'Number' }, { key: 'client', label: 'Client', value: (i) => clientName(i.clientId) }, { key: 'amountPaid', label: 'Collected' }, { key: 'inr', label: 'INR Equiv', value: (i) => Math.round(toINR(i.amountPaid, i.currency)) }, { key: 'currency', label: 'Currency' }] },
    expenses: { rows: expenses, cols: [{ key: 'date', label: 'Date', value: (e) => fmtDate(e.date) }, { key: 'name', label: 'Name' }, { key: 'category', label: 'Category' }, { key: 'vendor', label: 'Vendor' }, { key: 'amount', label: 'Amount' }, { key: 'paymentMethod', label: 'Method' }] },
    clients: { rows: clients, cols: [{ key: 'company', label: 'Company' }, { key: 'name', label: 'Contact' }, { key: 'email', label: 'Email' }, { key: 'country', label: 'Country' }, { key: 'currency', label: 'Currency' }] },
    cashflow: { rows: finance.trend, cols: [{ key: 'month', label: 'Month' }, { key: 'revenue', label: 'Revenue' }, { key: 'expense', label: 'Expense' }, { key: 'payroll', label: 'Payroll' }, { key: 'profit', label: 'Profit' }] },
    activity: { rows: activity, cols: [{ key: 'date', label: 'Date', value: (a) => fmtDateTime(a.date) }, { key: 'type', label: 'Type' }, { key: 'message', label: 'Detail' }] },
  }

  const current = data[report]
  const meta = REPORTS.find((r) => r.value === report)

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Generate and export reports across every module" icon={BarChart3}
        actions={<>
          <button className="btn-outline" onClick={() => exportCSV(current.rows, current.cols, `${report}-report.csv`)}><Download size={16} /> CSV</button>
          <button className="btn-outline" onClick={() => exportExcel(current.rows, current.cols, `${report}-report.xls`, meta.label + ' Report')}><Download size={16} /> Excel</button>
          <button className="btn-outline" onClick={() => exportJSON(current.rows, `${report}-report.json`)}><Download size={16} /> JSON</button>
          <button className="btn-primary" onClick={() => window.print()}><FileText size={16} /> Print / PDF</button>
        </>} />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {REPORTS.map((r) => (
          <button key={r.value} onClick={() => setReport(r.value)} className={`card !p-3 flex items-center gap-2.5 text-left transition ${report === r.value ? 'ring-2 ring-brand-500' : ''}`}>
            <div className="grid place-items-center h-9 w-9 rounded-lg bg-brand-600/10 text-brand-600 shrink-0"><r.icon size={16} /></div>
            <div className="min-w-0"><p className="text-sm font-semibold truncate">{r.label}</p><p className="text-xs text-slate-400">{data[r.value].rows.length} rows</p></div>
          </button>
        ))}
      </div>

      <div id="print-area" className="card !p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold flex items-center gap-2"><meta.icon size={18} className="text-brand-600" /> {meta.label} Report</h3>
          <span className="text-xs text-slate-400">{current.rows.length} records · generated {fmtDate(new Date())}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
              <tr>{current.cols.map((c) => <th key={c.key} className="th">{c.label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {current.rows.length === 0 ? (
                <tr><td className="td text-center text-slate-400 py-10" colSpan={current.cols.length}>No data for this report yet.</td></tr>
              ) : current.rows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  {current.cols.map((c) => {
                    const v = typeof c.value === 'function' ? c.value(row) : row[c.key]
                    const isMoney = ['ctc', 'gross', 'net', 'totalDeductions', 'total', 'amountPaid', 'amount', 'fromSalary', 'toSalary', 'revenue', 'expense', 'payroll', 'profit', 'inr', 'Collected'].includes(c.key)
                    return <td key={c.key} className="td">{c.key === 'status' || c.key === 'type' ? <Badge tone="Draft">{v}</Badge> : isMoney ? money(v) : v}</td>
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
