// Calendar pickers that stand in for <input type="date"> and <input type="month">.
//
// Drop-in: same `value` strings (YYYY-MM-DD / YYYY-MM) and the same
// onChange({ target: { value } }) shape, so every existing form handler keeps
// working untouched. The popover is portalled to <body> and positioned fixed,
// because Modal's scrolling content area would otherwise clip it.
//
// Date maths is done on year/month/day integers, never through Date parsing of
// ISO strings — that path is UTC and shifts a day in negative-offset zones.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3))
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] // Monday-first

const pad = (n) => String(n).padStart(2, '0')
const toISO = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`
const toYM = (y, m) => `${y}-${pad(m)}`
const parseISO = (v) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v || '')
  return m ? { y: +m[1], m: +m[2], d: +m[3] } : null
}
const parseYM = (v) => {
  const m = /^(\d{4})-(\d{2})/.exec(v || '')
  return m ? { y: +m[1], m: +m[2] } : null
}
const daysInMonth = (y, m) => new Date(y, m, 0).getDate()
const todayISO = () => {
  const t = new Date()
  return toISO(t.getFullYear(), t.getMonth() + 1, t.getDate())
}
// Zero-padded ISO strings compare correctly as plain strings.
const inRange = (iso, min, max) => (!min || iso >= min) && (!max || iso <= max)

export const formatDate = (iso) => {
  const p = parseISO(iso)
  return p ? `${pad(p.d)} ${MONTHS_SHORT[p.m - 1]} ${p.y}` : ''
}
export const formatMonth = (ym) => {
  const p = parseYM(ym)
  return p ? `${MONTHS[p.m - 1]} ${p.y}` : ''
}

// ---------------------------------------------------------------------------
// Popover: portal + fixed positioning + flip + dismiss
// ---------------------------------------------------------------------------
function Popover({ open, anchorRef, onClose, children, width = 296 }) {
  const ref = useRef(null)
  const [pos, setPos] = useState(null)

  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const a = anchorRef.current?.getBoundingClientRect()
      if (!a) return
      const ph = ref.current?.offsetHeight || 340
      const vw = window.innerWidth
      const vh = window.innerHeight
      const fitsBelow = a.bottom + 6 + ph <= vh - 8
      const fitsAbove = a.top - 6 - ph >= 8
      const top = fitsBelow || !fitsAbove ? a.bottom + 6 : a.top - 6 - ph
      const left = Math.max(8, Math.min(a.left, vw - 8 - width))
      setPos({ top, left })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, anchorRef, width])

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current?.contains(e.target) || anchorRef.current?.contains(e.target)) return
      onClose()
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation() // don't let the Modal's Escape handler close the whole dialog too
        onClose()
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open, onClose, anchorRef])

  if (!open) return null
  return createPortal(
    <div
      ref={ref}
      role="dialog"
      style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999, width, zIndex: 100 }}
      className="card !rounded-2xl shadow-soft p-3 dp-in select-none"
    >
      {children}
    </div>,
    document.body
  )
}

// ---------------------------------------------------------------------------
// Shared trigger: looks like .input, shows the formatted value, clears
// ---------------------------------------------------------------------------
function Trigger({ anchorRef, open, onToggle, display, placeholder, disabled, required, name, value, onClear, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        ref={anchorRef}
        disabled={disabled}
        onClick={onToggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={`input flex items-center gap-2 text-left ${value ? 'pr-9' : ''} ${open ? 'ring-2 ring-brand-500/40 border-brand-500' : ''} disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        <CalendarIcon size={16} className="shrink-0 text-slate-400" />
        <span className={`flex-1 truncate ${value ? '' : 'text-slate-400'}`}>{value ? display : placeholder}</span>
      </button>
      {value && !required && !disabled && (
        <button
          type="button"
          aria-label="Clear"
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center h-6 w-6 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X size={14} />
        </button>
      )}
      {/* Keeps native form validation (required) working for the field. */}
      <input tabIndex={-1} aria-hidden className="sr-only" name={name} value={value || ''} onChange={() => {}} required={required} />
    </div>
  )
}

const NavBtn = ({ onClick, label, children }) => (
  <button type="button" onClick={onClick} aria-label={label} className="grid place-items-center h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white transition">
    {children}
  </button>
)

// ---------------------------------------------------------------------------
// Year grid (12 years around a focus year)
// ---------------------------------------------------------------------------
function YearGrid({ year, onPick, minY, maxY }) {
  const [start, setStart] = useState(Math.floor(year / 12) * 12)
  const years = Array.from({ length: 12 }, (_, i) => start + i)
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <NavBtn onClick={() => setStart(start - 12)} label="Previous years"><ChevronLeft size={18} /></NavBtn>
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{start} – {start + 11}</span>
        <NavBtn onClick={() => setStart(start + 12)} label="Next years"><ChevronRight size={18} /></NavBtn>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {years.map((y) => {
          const off = (minY && y < minY) || (maxY && y > maxY)
          return (
            <button
              key={y}
              type="button"
              disabled={off}
              onClick={() => onPick(y)}
              className={`h-10 rounded-lg text-sm font-medium transition ${
                y === year ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {y}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Month grid for one year
// ---------------------------------------------------------------------------
function MonthGrid({ year, month, onPick, onYear, onPrevYear, onNextYear, min, max, current }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <NavBtn onClick={onPrevYear} label="Previous year"><ChevronLeft size={18} /></NavBtn>
        <button type="button" onClick={onYear} className="px-2 py-1 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800">
          {year}
        </button>
        <NavBtn onClick={onNextYear} label="Next year"><ChevronRight size={18} /></NavBtn>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {MONTHS_SHORT.map((label, i) => {
          const ym = toYM(year, i + 1)
          const off = !inRange(ym, min && min.slice(0, 7), max && max.slice(0, 7))
          const sel = month === i + 1
          const now = current === ym
          return (
            <button
              key={label}
              type="button"
              disabled={off}
              onClick={() => onPick(i + 1)}
              className={`h-10 rounded-lg text-sm font-medium transition ${
                sel ? 'bg-brand-600 text-white shadow-sm' : now ? 'text-brand-600 dark:text-brand-400 ring-1 ring-brand-500/50 hover:bg-brand-50 dark:hover:bg-brand-500/10' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// DatePicker  (value: YYYY-MM-DD)
// ---------------------------------------------------------------------------
export function DatePicker({ value, onChange, min, max, placeholder = 'Pick a date', disabled, required, name, className, ...rest }) {
  const anchorRef = useRef(null)
  const gridRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('days')
  const sel = parseISO(value)
  const today = todayISO()
  const t = parseISO(today)
  const [view, setView] = useState({ y: (sel || t).y, m: (sel || t).m })
  const [focus, setFocus] = useState(value || today)

  const emit = (iso) => onChange?.({ target: { value: iso, name } })

  const openAt = () => {
    const p = parseISO(value) || t
    setView({ y: p.y, m: p.m })
    setFocus(value || today)
    setMode('days')
    setOpen(true)
  }
  const close = () => setOpen(false)

  // Roving focus: once the grid renders, move keyboard focus to the focused day.
  useEffect(() => {
    if (!open || mode !== 'days') return
    const el = gridRef.current?.querySelector(`[data-iso="${focus}"]`)
    el?.focus({ preventScroll: true })
  }, [open, mode, focus, view])

  const shift = (months) => {
    let m = view.m + months
    let y = view.y
    while (m < 1) { m += 12; y-- }
    while (m > 12) { m -= 12; y++ }
    setView({ y, m })
  }

  const cells = useMemo(() => {
    const { y, m } = view
    const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7 // Monday-first offset
    const dim = daysInMonth(y, m)
    const prevDim = daysInMonth(m === 1 ? y - 1 : y, m === 1 ? 12 : m - 1)
    const out = []
    for (let i = 0; i < 42; i++) {
      const n = i - lead + 1
      if (n < 1) {
        const pm = m === 1 ? 12 : m - 1, py = m === 1 ? y - 1 : y
        out.push({ iso: toISO(py, pm, prevDim + n), d: prevDim + n, muted: true })
      } else if (n > dim) {
        const nm = m === 12 ? 1 : m + 1, ny = m === 12 ? y + 1 : y
        out.push({ iso: toISO(ny, nm, n - dim), d: n - dim, muted: true })
      } else out.push({ iso: toISO(y, m, n), d: n, muted: false })
    }
    return out
  }, [view])

  const moveFocus = (deltaDays) => {
    const p = parseISO(focus) || t
    const d = new Date(p.y, p.m - 1, p.d + deltaDays)
    const iso = toISO(d.getFullYear(), d.getMonth() + 1, d.getDate())
    setFocus(iso)
    if (d.getMonth() + 1 !== view.m || d.getFullYear() !== view.y) setView({ y: d.getFullYear(), m: d.getMonth() + 1 })
  }

  const onKey = (e) => {
    const map = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    if (map[e.key] !== undefined) { e.preventDefault(); moveFocus(map[e.key]); return }
    if (e.key === 'PageUp') { e.preventDefault(); shift(-1); return }
    if (e.key === 'PageDown') { e.preventDefault(); shift(1); return }
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      const p = parseISO(focus) || t
      const dow = (new Date(p.y, p.m - 1, p.d).getDay() + 6) % 7
      moveFocus(e.key === 'Home' ? -dow : 6 - dow)
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (inRange(focus, min, max)) { emit(focus); close() }
    }
  }

  const pick = (iso) => { emit(iso); close() }

  return (
    <>
      <Trigger
        anchorRef={anchorRef}
        open={open}
        onToggle={() => (open ? close() : openAt())}
        display={formatDate(value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        name={name}
        value={value}
        onClear={() => emit('')}
        className={className}
        {...rest}
      />
      <Popover open={open} anchorRef={anchorRef} onClose={close}>
        {mode === 'years' ? (
          <YearGrid year={view.y} minY={min && +min.slice(0, 4)} maxY={max && +max.slice(0, 4)} onPick={(y) => { setView({ ...view, y }); setMode('months') }} />
        ) : mode === 'months' ? (
          <MonthGrid
            year={view.y}
            month={view.m}
            min={min}
            max={max}
            current={toYM(t.y, t.m)}
            onYear={() => setMode('years')}
            onPrevYear={() => setView({ ...view, y: view.y - 1 })}
            onNextYear={() => setView({ ...view, y: view.y + 1 })}
            onPick={(m) => { setView({ ...view, m }); setMode('days') }}
          />
        ) : (
          <div>
            <div className="flex items-center justify-between mb-2">
              <NavBtn onClick={() => shift(-1)} label="Previous month"><ChevronLeft size={18} /></NavBtn>
              <button type="button" onClick={() => setMode('months')} className="px-2 py-1 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800">
                {MONTHS[view.m - 1]} {view.y}
              </button>
              <NavBtn onClick={() => shift(1)} label="Next month"><ChevronRight size={18} /></NavBtn>
            </div>
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((w) => (
                <div key={w} className="h-8 grid place-items-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">{w}</div>
              ))}
            </div>
            <div ref={gridRef} role="grid" onKeyDown={onKey} className="grid grid-cols-7 gap-y-0.5">
              {cells.map((c) => {
                const off = !inRange(c.iso, min, max)
                const isSel = c.iso === value
                const isToday = c.iso === today
                return (
                  <button
                    key={c.iso}
                    type="button"
                    data-iso={c.iso}
                    tabIndex={c.iso === focus ? 0 : -1}
                    disabled={off}
                    onClick={() => pick(c.iso)}
                    onFocus={() => setFocus(c.iso)}
                    aria-selected={isSel}
                    aria-label={formatDate(c.iso)}
                    className={`mx-auto h-9 w-9 rounded-lg text-sm grid place-items-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 ${
                      isSel
                        ? 'bg-brand-600 text-white font-semibold shadow-sm'
                        : isToday
                        ? 'text-brand-600 dark:text-brand-400 font-semibold ring-1 ring-brand-500/50 hover:bg-brand-50 dark:hover:bg-brand-500/10'
                        : c.muted
                        ? 'text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    } disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
                  >
                    {c.d}
                  </button>
                )
              })}
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button type="button" disabled={!inRange(today, min, max)} onClick={() => pick(today)} className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-40 disabled:no-underline">
            Today
          </button>
          <button type="button" onClick={() => { emit(''); close() }} className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
            Clear
          </button>
        </div>
      </Popover>
    </>
  )
}

// ---------------------------------------------------------------------------
// MonthPicker  (value: YYYY-MM)
// ---------------------------------------------------------------------------
export function MonthPicker({ value, onChange, min, max, placeholder = 'Pick a month', disabled, required, name, className, ...rest }) {
  const anchorRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('months')
  const now = new Date()
  const cur = toYM(now.getFullYear(), now.getMonth() + 1)
  const sel = parseYM(value)
  const [year, setYear] = useState((sel || parseYM(cur)).y)

  const emit = (ym) => onChange?.({ target: { value: ym, name } })
  const openAt = () => { setYear((parseYM(value) || parseYM(cur)).y); setMode('months'); setOpen(true) }
  const close = () => setOpen(false)

  return (
    <>
      <Trigger
        anchorRef={anchorRef}
        open={open}
        onToggle={() => (open ? close() : openAt())}
        display={formatMonth(value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        name={name}
        value={value}
        onClear={() => emit('')}
        className={className}
        {...rest}
      />
      <Popover open={open} anchorRef={anchorRef} onClose={close} width={280}>
        {mode === 'years' ? (
          <YearGrid year={year} minY={min && +min.slice(0, 4)} maxY={max && +max.slice(0, 4)} onPick={(y) => { setYear(y); setMode('months') }} />
        ) : (
          <MonthGrid
            year={year}
            month={sel && sel.y === year ? sel.m : null}
            min={min}
            max={max}
            current={cur}
            onYear={() => setMode('years')}
            onPrevYear={() => setYear(year - 1)}
            onNextYear={() => setYear(year + 1)}
            onPick={(m) => { emit(toYM(year, m)); close() }}
          />
        )}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button type="button" disabled={!inRange(cur, min && min.slice(0, 7), max && max.slice(0, 7))} onClick={() => { emit(cur); close() }} className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-40">
            This month
          </button>
          <button type="button" onClick={() => { emit(''); close() }} className="text-sm font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
            Clear
          </button>
        </div>
      </Popover>
    </>
  )
}
