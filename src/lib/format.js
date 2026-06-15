// Formatting + small utility helpers shared across the app.

export const CURRENCIES = {
  INR: { symbol: '₹', code: 'INR', locale: 'en-IN' },
  USD: { symbol: '$', code: 'USD', locale: 'en-US' },
  EUR: { symbol: '€', code: 'EUR', locale: 'de-DE' },
  GBP: { symbol: '£', code: 'GBP', locale: 'en-GB' },
  AED: { symbol: 'AED ', code: 'AED', locale: 'en-AE' },
  SGD: { symbol: 'S$', code: 'SGD', locale: 'en-SG' },
}

export function money(value, currency = 'INR', opts = {}) {
  const n = Number(value || 0)
  const c = CURRENCIES[currency] || CURRENCIES.INR
  try {
    return new Intl.NumberFormat(c.locale, {
      style: 'currency',
      currency: c.code,
      maximumFractionDigits: opts.decimals ?? 0,
      minimumFractionDigits: opts.decimals ?? 0,
    }).format(n)
  } catch {
    return `${c.symbol}${n.toLocaleString()}`
  }
}

export function compactMoney(value, currency = 'INR') {
  const n = Number(value || 0)
  const c = CURRENCIES[currency] || CURRENCIES.INR
  const abs = Math.abs(n)
  let str
  if (abs >= 1e7) str = (n / 1e7).toFixed(2) + ' Cr'
  else if (abs >= 1e5) str = (n / 1e5).toFixed(2) + ' L'
  else if (abs >= 1e3) str = (n / 1e3).toFixed(1) + 'K'
  else str = n.toFixed(0)
  return c.symbol + str
}

export function num(value) {
  return Number(value || 0).toLocaleString('en-IN')
}

export function pct(value, digits = 1) {
  return `${Number(value || 0).toFixed(digits)}%`
}

export function fmtDate(d, opts = {}) {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date)) return '—'
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...opts,
  })
}

export function fmtDateTime(d) {
  if (!d) return '—'
  const date = new Date(d)
  if (isNaN(date)) return '—'
  return date.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function monthKey(d) {
  const date = new Date(d)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function monthLabel(key) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function relativeTime(d) {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  if (days < 30) return `${days}d ago`
  return fmtDate(d)
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('')
}

export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

// Deterministic-ish color from a string (for avatars / charts)
export function colorFromString(str = '') {
  const palette = ['#3366ff', '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6']
  let h = 0
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return palette[Math.abs(h) % palette.length]
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}
