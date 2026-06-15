import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { useTheme } from '../store/ThemeContext'
import { monthLabel, compactMoney } from '../lib/format'

const PALETTE = ['#3366ff', '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#64748b']

function useAxis() {
  const { theme } = useTheme()
  const grid = theme === 'dark' ? '#1e293b' : '#e2e8f0'
  const tick = theme === 'dark' ? '#94a3b8' : '#64748b'
  return { grid, tick }
}

function Box({ children }) {
  const { theme } = useTheme()
  return (
    <ResponsiveContainer width="100%" height="100%">
      {children}
    </ResponsiveContainer>
  )
}

const tooltipStyle = (theme) => ({
  contentStyle: {
    background: theme === 'dark' ? '#0f172a' : '#fff',
    border: `1px solid ${theme === 'dark' ? '#1e293b' : '#e2e8f0'}`,
    borderRadius: 12,
    fontSize: 12,
    color: theme === 'dark' ? '#e2e8f0' : '#1e293b',
  },
  labelStyle: { color: theme === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600 },
})

export function AreaTrend({ data, keys, height = 240 }) {
  const { grid, tick } = useAxis()
  const { theme } = useTheme()
  return (
    <div style={{ height }}>
      <Box>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <defs>
            {keys.map((k, i) => (
              <linearGradient key={k.key} id={`g-${k.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={k.color || PALETTE[i]} stopOpacity={0.35} />
                <stop offset="100%" stopColor={k.color || PALETTE[i]} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
          <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => compactMoney(v)} tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} width={56} />
          <Tooltip {...tooltipStyle(theme)} formatter={(v) => compactMoney(v)} labelFormatter={monthLabel} />
          {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {keys.map((k, i) => (
            <Area key={k.key} type="monotone" dataKey={k.key} name={k.label} stroke={k.color || PALETTE[i]} strokeWidth={2.5} fill={`url(#g-${k.key})`} />
          ))}
        </AreaChart>
      </Box>
    </div>
  )
}

export function BarTrend({ data, keys, height = 240, xKey = 'month', xFmt = monthLabel }) {
  const { grid, tick } = useAxis()
  const { theme } = useTheme()
  return (
    <div style={{ height }}>
      <Box>
        <BarChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
          <XAxis dataKey={xKey} tickFormatter={xFmt} tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => compactMoney(v)} tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} width={56} />
          <Tooltip {...tooltipStyle(theme)} formatter={(v) => compactMoney(v)} labelFormatter={xFmt} cursor={{ fill: theme === 'dark' ? '#1e293b80' : '#f1f5f980' }} />
          {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {keys.map((k, i) => (
            <Bar key={k.key} dataKey={k.key} name={k.label} fill={k.color || PALETTE[i]} radius={[6, 6, 0, 0]} maxBarSize={38} />
          ))}
        </BarChart>
      </Box>
    </div>
  )
}

export function LineTrend({ data, keys, height = 240 }) {
  const { grid, tick } = useAxis()
  const { theme } = useTheme()
  return (
    <div style={{ height }}>
      <Box>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
          <XAxis dataKey="month" tickFormatter={monthLabel} tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={(v) => compactMoney(v)} tick={{ fontSize: 11, fill: tick }} axisLine={false} tickLine={false} width={56} />
          <Tooltip {...tooltipStyle(theme)} formatter={(v) => compactMoney(v)} labelFormatter={monthLabel} />
          {keys.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
          {keys.map((k, i) => (
            <Line key={k.key} type="monotone" dataKey={k.key} name={k.label} stroke={k.color || PALETTE[i]} strokeWidth={2.5} dot={false} />
          ))}
        </LineChart>
      </Box>
    </div>
  )
}

export function Donut({ data, height = 240 }) {
  const { theme } = useTheme()
  return (
    <div style={{ height }}>
      <Box>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="85%" paddingAngle={2}>
            {data.map((d, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle(theme)} formatter={(v) => compactMoney(v)} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </Box>
    </div>
  )
}

export { PALETTE }
