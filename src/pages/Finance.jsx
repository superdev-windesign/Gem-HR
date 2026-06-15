import { TrendingUp, TrendingDown, Wallet, Receipt, CircleDollarSign, Banknote, Download } from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { PageHeader, Card, StatCard } from '../components/ui'
import { AreaTrend, BarTrend, Donut } from '../components/Charts'
import { money, compactMoney, monthLabel } from '../lib/format'
import { exportCSV } from '../lib/export'

function Row({ label, value, tone }) {
  const tones = { green: 'text-emerald-600', red: 'text-rose-600', brand: 'text-brand-600' }
  return (
    <div className="flex justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`text-sm font-bold ${tones[tone] || 'text-slate-800 dark:text-white'}`}>{value}</span>
    </div>
  )
}

export default function Finance() {
  const { finance } = useStore()
  const f = finance

  const cashflow = f.trend.map((t) => ({ ...t, label: monthLabel(t.month) }))
  const catData = Object.entries(f.expByCategory).map(([name, value]) => ({ name, value }))
  const annualPayroll = f.monthlyPayroll * 12

  return (
    <div>
      <PageHeader title="Finance Dashboard" subtitle="Unified view of revenue, expenses & payroll" icon={TrendingUp}
        actions={<button className="btn-outline" onClick={() => exportCSV(cashflow, [{ key: 'label', label: 'Month' }, { key: 'revenue', label: 'Revenue' }, { key: 'expense', label: 'Expense' }, { key: 'payroll', label: 'Payroll' }, { key: 'profit', label: 'Profit' }], 'cashflow.csv')}><Download size={16} /> Cash Flow CSV</button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total Revenue (Booked)" value={compactMoney(f.revenueBooked)} icon={CircleDollarSign} tone="brand" />
        <StatCard label="Total Expenses" value={compactMoney(f.expenseTotal)} icon={TrendingDown} tone="red" />
        <StatCard label="Payroll (Annual)" value={compactMoney(annualPayroll)} sub={compactMoney(f.monthlyPayroll) + '/mo'} icon={Wallet} tone="violet" />
        <StatCard label="Net Profit" value={compactMoney(f.netProfit)} sub="Revenue − Expenses" icon={f.netProfit >= 0 ? TrendingUp : TrendingDown} tone={f.netProfit >= 0 ? 'green' : 'red'} />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Collected Revenue" value={compactMoney(f.collected)} sub="Cash in bank" icon={Banknote} tone="green" />
        <StatCard label="Outstanding Invoices" value={compactMoney(f.outstanding)} sub={`${f.pendingCount} pending`} icon={Receipt} tone="amber" />
        <StatCard label="Pending Payments" value={f.pendingCount} icon={Receipt} tone="amber" />
        <StatCard label="Profit Margin" value={f.revenueBooked ? Math.round((f.netProfit / f.revenueBooked) * 100) + '%' : '—'} icon={TrendingUp} tone="brand" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <Card className="lg:col-span-2">
          <h3 className="font-semibold mb-3">Revenue vs Expense vs Payroll</h3>
          <BarTrend data={f.trend} keys={[{ key: 'revenue', label: 'Revenue', color: '#3366ff' }, { key: 'expense', label: 'Expense', color: '#ef4444' }]} height={280} />
        </Card>
        <Card>
          <h3 className="font-semibold mb-3">Expense Breakdown</h3>
          <Donut data={catData} height={280} />
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <h3 className="font-semibold mb-3">Profit Trend</h3>
          <AreaTrend data={f.trend} keys={[{ key: 'profit', label: 'Net Profit', color: '#10b981' }]} height={260} />
        </Card>
        <Card>
          <h3 className="font-bold mb-2">Profit & Loss Summary</h3>
          <Row label="Revenue (booked)" value={money(f.revenueBooked)} tone="brand" />
          <Row label="Operating Expenses" value={'− ' + money(f.expenseTotal)} tone="red" />
          <Row label="Payroll (annual)" value={'− ' + money(annualPayroll)} tone="red" />
          <div className="mt-2 pt-2 border-t-2 border-slate-200 dark:border-slate-700">
            <Row label="Net Profit" value={money(f.netProfit - annualPayroll)} tone={f.netProfit - annualPayroll >= 0 ? 'green' : 'red'} />
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3">
            <p className="text-xs text-slate-400">Cash Position (collected − expenses)</p>
            <p className="text-2xl font-bold mt-1">{money(f.collected - f.expenseTotal)}</p>
          </div>
        </Card>
      </div>

      <Card className="mt-4 !p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 font-bold">Cash Flow Report (Monthly)</div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/60"><tr><th className="th">Month</th><th className="th text-right">Revenue</th><th className="th text-right">Expense</th><th className="th text-right">Payroll</th><th className="th text-right">Profit</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {cashflow.map((m) => (
                <tr key={m.month}>
                  <td className="td font-medium">{m.label}</td>
                  <td className="td text-right text-brand-600">{money(m.revenue)}</td>
                  <td className="td text-right text-rose-600">{money(m.expense - m.payroll)}</td>
                  <td className="td text-right text-violet-600">{money(m.payroll)}</td>
                  <td className={`td text-right font-bold ${m.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{money(m.profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
