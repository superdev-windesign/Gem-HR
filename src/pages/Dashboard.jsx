import { Link } from 'react-router-dom'
import {
  TrendingUp, TrendingDown, Wallet, Receipt, Users, UserCheck, GraduationCap,
  ArrowUpRight, IndianRupee, CircleDollarSign, Clock, FileText, Award, Plus,
} from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { StatCard, Card, PageHeader, Avatar, Badge } from '../components/ui'
import { AreaTrend, BarTrend, LineTrend } from '../components/Charts'
import { money, compactMoney, fmtDate, relativeTime, monthLabel } from '../lib/format'

function Section({ title, to, children }) {
  return (
    <Card className="!p-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
        {to && <Link to={to} className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-0.5">View all <ArrowUpRight size={13} /></Link>}
      </div>
      <div>{children}</div>
    </Card>
  )
}

function ChartCard({ title, children, badge }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3>
        {badge}
      </div>
      {children}
    </Card>
  )
}

export default function Dashboard() {
  const { finance, employees, invoices, expenses, promotions, activity, clients } = useStore()
  const f = finance
  const e = f.empStats

  const recentInvoices = [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
  const recentExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5)
  const upcomingPayroll = employees.filter((x) => x.status === 'Active').slice(0, 5)
  const recentPromotions = [...promotions].sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate)).slice(0, 4)
  const clientName = (id) => clients.find((c) => c.id === id)?.company || '—'

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Your complete business at a glance"
        icon={TrendingUp}
        actions={
          <>
            <Link to="/invoices" className="btn-outline"><Plus size={16} /> Invoice</Link>
            <Link to="/employees" className="btn-primary"><Plus size={16} /> Employee</Link>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Revenue (This Month)" value={compactMoney(f.thisMonthRevenue)} sub="Booked invoices" icon={IndianRupee} tone="brand" />
        <StatCard label="Expenses (This Month)" value={compactMoney(f.thisMonthExpense)} sub="Operating spend" icon={CreditDown} tone="red" />
        <StatCard label="Net Profit (Month)" value={compactMoney(f.monthProfit)} sub="Revenue − Exp − Payroll" icon={f.monthProfit >= 0 ? TrendingUp : TrendingDown} tone={f.monthProfit >= 0 ? 'green' : 'red'} />
        <StatCard label="Collected (All-time)" value={compactMoney(f.collected)} sub="Cash received" icon={CircleDollarSign} tone="violet" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pending Invoices" value={f.pendingCount} sub={compactMoney(f.outstanding) + ' outstanding'} icon={Clock} tone="amber" />
        <StatCard label="Paid Invoices" value={f.paidCount} sub="Settled in full" icon={Receipt} tone="green" />
        <StatCard label="Total Employees" value={e.total} sub={`${e.active} active`} icon={Users} tone="brand" />
        <StatCard label="Interns" value={e.interns} sub={`${e.freelancers} freelancers · ${e.contractors} contractors`} icon={GraduationCap} tone="violet" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <ChartCard title="Revenue vs Expense">
          <BarTrend data={f.trend} keys={[{ key: 'revenue', label: 'Revenue', color: '#3366ff' }, { key: 'expense', label: 'Expense', color: '#ef4444' }]} />
        </ChartCard>
        <ChartCard title="Profit Trend">
          <AreaTrend data={f.trend} keys={[{ key: 'profit', label: 'Profit', color: '#10b981' }]} />
        </ChartCard>
      </div>
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <ChartCard title="Revenue Trend">
          <AreaTrend data={f.trend} keys={[{ key: 'revenue', label: 'Revenue' }]} height={200} />
        </ChartCard>
        <ChartCard title="Expense Trend">
          <AreaTrend data={f.trend} keys={[{ key: 'expense', label: 'Expense', color: '#ef4444' }]} height={200} />
        </ChartCard>
        <ChartCard title="Invoice Collection Trend">
          <LineTrend data={f.trend} keys={[{ key: 'collection', label: 'Collected', color: '#7c3aed' }]} height={200} />
        </ChartCard>
      </div>

      {/* Activity grid */}
      <div className="grid lg:grid-cols-2 gap-4 mb-4">
        <Section title="Recent Invoices" to="/invoices">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentInvoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{inv.number}</p>
                  <p className="text-xs text-slate-500 truncate">{clientName(inv.clientId)} · {fmtDate(inv.date)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{money(inv.total, inv.currency)}</p>
                  <Badge>{inv.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Recent Expenses" to="/expenses">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentExpenses.map((ex) => (
              <div key={ex.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{ex.name}</p>
                  <p className="text-xs text-slate-500 truncate">{ex.category} · {ex.vendor || '—'} · {fmtDate(ex.date)}</p>
                </div>
                <p className="font-semibold text-sm text-rose-600 dark:text-rose-400">− {money(ex.amount)}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Section title="Upcoming Salary Payments" to="/payroll">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {upcomingPayroll.map((emp) => (
              <div key={emp.id} className="flex items-center gap-3 px-5 py-3">
                <Avatar name={emp.name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{emp.name}</p>
                  <p className="text-xs text-slate-500">{emp.designation}</p>
                </div>
                <p className="font-semibold text-sm">{compactMoney((emp.compensation?.ctc || 0) / 12)}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Recent Promotions" to="/employees">
          {recentPromotions.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-slate-400">No promotions yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentPromotions.map((p) => {
                const emp = employees.find((x) => x.id === p.empId)
                return (
                  <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="grid place-items-center h-9 w-9 rounded-lg bg-amber-500/15 text-amber-600"><Award size={16} /></div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">{emp?.name}</p>
                      <p className="text-xs text-slate-500 truncate">→ {p.toDesignation} · {fmtDate(p.effectiveDate)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Section>

        <Section title="Recent Activity" to="/reports">
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activity.slice(0, 6).map((a) => (
              <div key={a.id} className="px-5 py-3">
                <p className="text-sm text-slate-700 dark:text-slate-200">{a.message}</p>
                <p className="text-xs text-slate-400 mt-0.5">{a.type} · {relativeTime(a.date)}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}

// small inline icon alias
function CreditDown(props) {
  return <TrendingDown {...props} />
}
