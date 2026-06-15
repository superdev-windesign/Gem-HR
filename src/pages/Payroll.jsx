import { useMemo, useState } from 'react'
import { Wallet, Play, Download, Receipt, TrendingUp } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { PageHeader, Card, StatCard, Modal, Field, Input, Avatar, Badge, EmptyState, Tabs } from '../components/ui'
import { BarTrend } from '../components/Charts'
import { money, compactMoney, fmtDate, monthLabel } from '../lib/format'
import { exportPDF } from '../lib/export'
import { payslipHTML } from '../lib/documents'

export default function Payroll() {
  const { employees, payslips, runPayroll, generatePayslip, settings, finance } = useStore()
  const [tab, setTab] = useState('overview')
  const [runOpen, setRunOpen] = useState(false)
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7))
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10))

  const active = employees.filter((e) => e.status === 'Active')
  const monthlyCost = active.reduce((s, e) => s + (e.compensation?.ctc || 0) / 12, 0)
  const netMonthly = active.reduce((s, e) => {
    const c = e.compensation
    return s + (c.basic + c.hra + c.special + c.other + c.bonus - c.pf - c.esic - c.tax)
  }, 0)

  // Payroll trend = monthly payroll constant across the finance trend
  const payrollTrend = finance.trend.map((t) => ({ month: t.month, payroll: t.payroll }))

  const ledger = useMemo(() => {
    const byMonth = {}
    payslips.forEach((p) => {
      byMonth[p.month] = byMonth[p.month] || { month: p.month, label: p.monthLabel, count: 0, gross: 0, deductions: 0, net: 0 }
      byMonth[p.month].count++
      byMonth[p.month].gross += p.gross
      byMonth[p.month].deductions += p.totalDeductions
      byMonth[p.month].net += p.net
    })
    return Object.values(byMonth).sort((a, b) => b.month.localeCompare(a.month))
  }, [payslips])

  const doRun = () => { runPayroll(month, payDate); setRunOpen(false); setTab('history') }

  return (
    <div>
      <PageHeader title="Payroll Management" subtitle="Run payroll, generate payslips & track salary spend" icon={Wallet}
        actions={<button className="btn-primary" onClick={() => setRunOpen(true)}><Play size={16} /> Run Monthly Payroll</button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Monthly Payroll" value={compactMoney(monthlyCost)} sub="Gross CTC basis" icon={Wallet} tone="brand" />
        <StatCard label="Net Disbursed / mo" value={compactMoney(netMonthly)} sub="After deductions" icon={TrendingUp} tone="green" />
        <StatCard label="Active Headcount" value={active.length} sub={`${employees.length} total`} icon={Receipt} tone="violet" />
        <StatCard label="Payslips Generated" value={payslips.length} sub={`${ledger.length} pay cycles`} icon={Receipt} tone="amber" />
      </div>

      <div className="mb-4"><Tabs active={tab} onChange={setTab} tabs={[
        { value: 'overview', label: 'Salary Register' }, { value: 'history', label: 'Salary Ledger' }, { value: 'trend', label: 'Payroll Trend' },
      ]} /></div>

      {tab === 'overview' && (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                <tr><th className="th">Employee</th><th className="th text-right">Basic</th><th className="th text-right">HRA</th><th className="th text-right">Allowances</th><th className="th text-right">Deductions</th><th className="th text-right">Net / mo</th><th className="th"></th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {active.map((e) => {
                  const c = e.compensation
                  const allow = c.special + c.other + c.bonus
                  const ded = c.pf + c.esic + c.tax
                  const net = c.basic + c.hra + allow - ded
                  return (
                    <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="td"><div className="flex items-center gap-3"><Avatar name={e.name} size={34} /><div><p className="font-semibold">{e.name}</p><p className="text-xs text-slate-400">{e.designation}</p></div></div></td>
                      <td className="td text-right">{money(c.basic)}</td>
                      <td className="td text-right">{money(c.hra)}</td>
                      <td className="td text-right">{money(allow)}</td>
                      <td className="td text-right text-rose-600">− {money(ded)}</td>
                      <td className="td text-right font-bold">{money(net)}</td>
                      <td className="td text-right"><button className="btn-ghost !p-1.5" title="Generate payslip" onClick={() => { const s = generatePayslip(e.id, month, payDate); if (s) exportPDF(payslipHTML(e, s, settings.company), 'Payslip') }}><Download size={16} /></button></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'history' && (
        ledger.length === 0 ? <Card><EmptyState icon={Receipt} title="No payroll runs yet" hint="Run monthly payroll to populate the salary ledger." action={<button className="btn-primary" onClick={() => setRunOpen(true)}>Run Payroll</button>} /></Card> : (
          <div className="space-y-4">
            {ledger.map((m) => (
              <Card key={m.month} className="!p-0 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
                  <p className="font-bold">{m.label}</p>
                  <div className="flex gap-5 text-sm"><span className="text-slate-400">{m.count} slips</span><span>Gross <b>{money(m.gross)}</b></span><span>Net <b className="text-emerald-600">{money(m.net)}</b></span></div>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {payslips.filter((p) => p.month === m.month).map((p) => {
                    const emp = employees.find((e) => e.id === p.empId)
                    return (
                      <div key={p.id} className="flex items-center justify-between px-5 py-2.5">
                        <div className="flex items-center gap-3"><Avatar name={emp?.name || '?'} size={30} /><span className="text-sm font-medium">{emp?.name}</span></div>
                        <div className="flex items-center gap-4"><span className="text-sm font-semibold">{money(p.net)}</span>
                          <button className="btn-ghost !p-1.5" onClick={() => emp && exportPDF(payslipHTML(emp, p, settings.company), 'Payslip')}><Download size={15} /></button></div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {tab === 'trend' && (
        <Card>
          <h3 className="font-semibold mb-3">Payroll Cost — last 12 months</h3>
          <BarTrend data={payrollTrend} keys={[{ key: 'payroll', label: 'Payroll', color: '#7c3aed' }]} height={300} />
        </Card>
      )}

      <Modal open={runOpen} onClose={() => setRunOpen(false)} title="Run Monthly Payroll" size="sm"
        footer={<><button className="btn-outline" onClick={() => setRunOpen(false)}>Cancel</button><button className="btn-primary" onClick={doRun}><Play size={16} /> Generate {active.length} payslips</button></>}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Pay Month"><Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} /></Field>
          <Field label="Pay Date"><Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} /></Field>
        </div>
        <p className="text-sm text-slate-500 mt-4">This generates payslips for all <b>{active.length} active employees</b> and records them in the ledger, each employee's profile, and the activity log.</p>
      </Modal>
    </div>
  )
}
