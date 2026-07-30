import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { buildSeed, buildEmpty } from '../lib/seed'
import { uid, monthKey } from '../lib/format'
import { fetchState, saveState } from '../lib/api'

const KEY = 'windesign-os-data-v1'
const StoreCtx = createContext(null)

// Instant first paint from the local cache; the server (Turso) is the source of truth.
// Falls back to an EMPTY workspace (never demo data) so a stale cache can never
// repopulate the database before the server load resolves.
function loadCache() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return buildEmpty()
}

export function StoreProvider({ children }) {
  const [db, setDb] = useState(loadCache)
  const [status, setStatus] = useState('connecting') // connecting | online | offline
  // Persistence is gated until the first server load resolves, and a save only
  // fires when the content actually differs from what was last loaded/saved.
  // Together these prevent the local cache from being pushed back over Turso.
  const readyToSave = useRef(false)
  const lastSynced = useRef(null)

  // On mount, pull authoritative state from Turso (falls back to local cache).
  useEffect(() => {
    let cancelled = false
    fetchState()
      .then((state) => {
        if (cancelled) return
        if (state) {
          lastSynced.current = JSON.stringify(state)
          setDb(state)
        }
        setStatus('online')
      })
      .catch(() => { if (!cancelled) setStatus('offline') })
      .finally(() => { if (!cancelled) readyToSave.current = true })
    return () => { cancelled = true }
  }, [])

  // Persist: always cache locally; debounce-push to Turso only for real changes.
  useEffect(() => {
    const serialized = JSON.stringify(db)
    try { localStorage.setItem(KEY, serialized) } catch {}
    if (!readyToSave.current) return
    if (serialized === lastSynced.current) return
    const t = setTimeout(() => {
      saveState(db)
        .then(() => { lastSynced.current = serialized; setStatus('online') })
        .catch(() => setStatus('offline'))
    }, 500)
    return () => clearTimeout(t)
  }, [db])

  // ---- generic helpers -------------------------------------------------
  const log = useCallback((type, message) => {
    setDb((d) => ({
      ...d,
      activity: [{ id: uid('act'), type, message, date: new Date().toISOString() }, ...d.activity].slice(0, 500),
    }))
  }, [])

  const addTimeline = useCallback((empId, type, note, date) => {
    setDb((d) => ({
      ...d,
      timeline: [...d.timeline, { id: uid('tl'), empId, type, note, date: date || new Date().toISOString() }],
    }))
  }, [])

  // ---- Employees -------------------------------------------------------
  // Interns get their own code series (WD-INT-01) so they never consume an
  // employee number; converting an intern later assigns a fresh employee code.
  const nextEmpId = useCallback(
    (type = 'Full Time') => {
      const ids = db.settings?.ids || { employeePrefix: 'WD-', internPrefix: 'WD-INT-' }
      const isIntern = type === 'Intern'
      const prefix = isIntern ? ids.internPrefix : ids.employeePrefix
      const pad = isIntern ? 2 : 3
      const seqs = db.employees
        .map((e) => String(e.empId || ''))
        .filter((id) => (isIntern ? id.startsWith(ids.internPrefix) : id.startsWith(ids.employeePrefix) && !id.startsWith(ids.internPrefix)))
        .map((id) => parseInt(id.slice(prefix.length), 10))
        .filter((n) => !isNaN(n))
      const next = (seqs.length ? Math.max(...seqs) : 0) + 1
      return prefix + String(next).padStart(pad, '0')
    },
    [db.employees, db.settings]
  )

  const saveEmployee = useCallback(
    (emp) => {
      setDb((d) => {
        const exists = d.employees.some((e) => e.id === emp.id)
        const employees = exists ? d.employees.map((e) => (e.id === emp.id ? emp : e)) : [...d.employees, emp]
        return { ...d, employees }
      })
    },
    []
  )

  const createEmployee = useCallback(
    (emp) => {
      const id = uid('emp')
      const full = { id, status: 'Active', documents: [], ...emp }
      setDb((d) => ({ ...d, employees: [...d.employees, full] }))
      addTimeline(id, 'Employee Created', `${emp.name} added as ${emp.type}.`)
      log('Employee Added', `${emp.name} (${emp.empId}) joined as ${emp.designation}`)
      return full
    },
    [addTimeline, log]
  )

  const updateEmployee = useCallback(
    (id, patch, timelineNote) => {
      setDb((d) => ({ ...d, employees: d.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)) }))
      if (timelineNote) addTimeline(id, timelineNote.type, timelineNote.note)
      log('Employee Updated', `Updated ${patch.name || 'employee'} profile`)
    },
    [addTimeline, log]
  )

  const deleteEmployee = useCallback((id) => {
    setDb((d) => ({
      ...d,
      employees: d.employees.filter((e) => e.id !== id),
      timeline: d.timeline.filter((t) => t.empId !== id),
    }))
  }, [])

  // Convert an intern into a permanent employee: issues a fresh employee code
  // (keeping the intern code in history) and moves them into the employee list.
  const convertIntern = useCallback(
    (empId, data) => {
      const newId = nextEmpId('Full Time')
      let converted = null
      setDb((d) => ({
        ...d,
        employees: d.employees.map((e) => {
          if (e.id !== empId) return e
          converted = {
            ...e,
            internId: e.empId,
            empId: data.empId || newId,
            type: 'Full Time',
            designation: data.designation || e.designation,
            department: data.department || e.department,
            manager: data.manager || e.manager,
            location: data.location || e.location,
            joiningDate: data.effectiveDate || e.joiningDate,
            internSince: e.joiningDate,
            convertedOn: data.effectiveDate || new Date().toISOString().slice(0, 10),
            status: 'Active',
            compensation: { ...e.compensation, ...(data.compensation || {}) },
          }
          return converted
        }),
      }))
      const emp = db.employees.find((e) => e.id === empId)
      addTimeline(
        empId,
        'Converted to Full Time',
        `Internship (${emp?.empId}) converted to permanent employment as ${data.designation || emp?.designation}. New employee ID: ${data.empId || newId}.`,
        data.effectiveDate
      )
      log('Intern Converted', `${emp?.name} is now a full-time employee (${data.empId || newId})`)
      return converted
    },
    [db.employees, nextEmpId, addTimeline, log]
  )

  // ---- Promotions ------------------------------------------------------
  const promoteEmployee = useCallback(
    (empId, promo) => {
      const rec = { id: uid('pr'), empId, ...promo }
      setDb((d) => ({
        ...d,
        promotions: [...d.promotions, rec],
        employees: d.employees.map((e) =>
          e.id === empId
            ? {
                ...e,
                designation: promo.toDesignation,
                department: promo.newDepartment || e.department,
                manager: promo.newManager || e.manager,
                compensation: { ...e.compensation, ctc: promo.toSalary },
              }
            : e
        ),
      }))
      addTimeline(empId, 'Promotion', `Promoted to ${promo.toDesignation}.`, promo.effectiveDate)
      const emp = db.employees.find((e) => e.id === empId)
      log('Promotion Created', `${emp?.name} promoted to ${promo.toDesignation}`)
      return rec
    },
    [addTimeline, log, db.employees]
  )

  // ---- Payroll / Payslips ---------------------------------------------
  const generatePayslip = useCallback(
    (empId, month, payDate, extra = {}) => {
      const emp = db.employees.find((e) => e.id === empId)
      if (!emp) return null
      const slip = buildSlip(emp, month, payDate, extra)
      setDb((d) => ({ ...d, payslips: [slip, ...d.payslips.filter((p) => !(p.empId === empId && p.month === month))] }))
      addTimeline(empId, 'Payslip Generated', `Payslip generated for ${slip.monthLabel}.`)
      log('Payslip Generated', `${emp.name} — ${slip.monthLabel} (net ₹${slip.net.toLocaleString('en-IN')})`)
      return slip
    },
    [db.employees, addTimeline, log]
  )

  // Bulk generate across a set of months for one employee. `specs` is
  // [{ month, payDate, totalPay, workedDays, loan }] — one entry per month.
  const generatePayslipRange = useCallback(
    (empId, specs) => {
      const emp = db.employees.find((e) => e.id === empId)
      if (!emp || !specs?.length) return []
      const slips = specs.map((s) => buildSlip(emp, s.month, s.payDate, s))
      const months = new Set(slips.map((s) => s.month))
      setDb((d) => ({
        ...d,
        payslips: [...slips, ...d.payslips.filter((p) => !(p.empId === empId && months.has(p.month)))],
        timeline: [
          ...d.timeline,
          {
            id: uid('tl'),
            empId,
            type: 'Payslip Generated',
            note: `${slips.length} payslip(s) generated: ${slips[0].monthLabel} – ${slips[slips.length - 1].monthLabel}.`,
            date: new Date().toISOString(),
          },
        ],
      }))
      const total = slips.reduce((a, s) => a + s.net, 0)
      log('Payslips Generated', `${emp.name} — ${slips.length} months (net ₹${total.toLocaleString('en-IN')})`)
      return slips
    },
    [db.employees, log]
  )

  const runPayroll = useCallback(
    (month, payDate) => {
      const active = db.employees.filter((e) => e.status === 'Active')
      active.forEach((e) => generatePayslip(e.id, month, payDate))
      log('Payroll Run', `Payroll generated for ${active.length} employees (${month})`)
    },
    [db.employees, generatePayslip, log]
  )

  // ---- Documents -------------------------------------------------------
  const addDocument = useCallback(
    (doc) => {
      const rec = { id: uid('doc'), date: new Date().toISOString(), ...doc }
      setDb((d) => ({ ...d, documents: [rec, ...d.documents] }))
      if (doc.empId) addTimeline(doc.empId, doc.timelineType || 'Document Generated', `${doc.type} generated.`)
      log('Document Generated', `${doc.type}${doc.name ? ' — ' + doc.name : ''}`)
      return rec
    },
    [addTimeline, log]
  )

  // ---- Clients ---------------------------------------------------------
  const saveClient = useCallback((client) => {
    setDb((d) => {
      const exists = d.clients.some((c) => c.id === client.id)
      const full = exists ? client : { ...client, id: uid('cl') }
      const clients = exists ? d.clients.map((c) => (c.id === client.id ? client : c)) : [...d.clients, full]
      return { ...d, clients }
    })
  }, [])

  const deleteClient = useCallback((id) => {
    setDb((d) => ({ ...d, clients: d.clients.filter((c) => c.id !== id) }))
  }, [])

  // ---- Invoices --------------------------------------------------------
  // Numbers follow the reference format: IND2601 (Indian) / INT2601 (export),
  // i.e. <prefix><FY year code><running sequence>, sequenced per prefix.
  const nextInvoiceNumber = useCallback(
    (type = 'gst') => {
      const cfg = db.settings.invoice || { yearCode: '26', indianPrefix: 'IND', exportPrefix: 'INT' }
      const prefix = type === 'export' ? cfg.exportPrefix : cfg.indianPrefix
      const head = `${prefix}${cfg.yearCode}`
      const seqs = db.invoices
        .filter((i) => String(i.number).startsWith(prefix))
        .map((i) => parseInt(String(i.number).slice(prefix.length + String(cfg.yearCode).length), 10))
        .filter((n) => !isNaN(n))
      const next = (seqs.length ? Math.max(...seqs) : 0) + 1
      return head + String(next).padStart(2, '0')
    },
    [db.invoices, db.settings]
  )

  const saveInvoice = useCallback(
    (inv) => {
      setDb((d) => {
        const exists = d.invoices.some((i) => i.id === inv.id)
        const invoices = exists ? d.invoices.map((i) => (i.id === inv.id ? inv : i)) : [{ ...inv, events: inv.events || [{ type: 'Created', date: new Date().toISOString() }] }, ...d.invoices]
        return { ...d, invoices }
      })
      log(db.invoices.some((i) => i.id === inv.id) ? 'Invoice Updated' : 'Invoice Created', `${inv.number}`)
    },
    [log, db.invoices]
  )

  const setInvoiceStatus = useCallback((id, status) => {
    setDb((d) => ({
      ...d,
      invoices: d.invoices.map((i) =>
        i.id === id ? { ...i, status, events: [...(i.events || []), { type: status, date: new Date().toISOString() }] } : i
      ),
    }))
  }, [])

  const recordPayment = useCallback(
    (id, payment) => {
      setDb((d) => ({
        ...d,
        invoices: d.invoices.map((i) => {
          if (i.id !== id) return i
          const payments = [...(i.payments || []), { id: uid('pay'), ...payment }]
          const amountPaid = payments.reduce((s, p) => s + Number(p.amount || 0), 0)
          const status = amountPaid >= i.total ? 'Paid' : amountPaid > 0 ? 'Partially Paid' : i.status
          return { ...i, payments, amountPaid, status, events: [...(i.events || []), { type: status, date: new Date().toISOString() }] }
        }),
      }))
      const inv = db.invoices.find((i) => i.id === id)
      log('Invoice Paid', `Payment recorded for ${inv?.number}`)
    },
    [log, db.invoices]
  )

  const deleteInvoice = useCallback((id) => {
    setDb((d) => ({ ...d, invoices: d.invoices.filter((i) => i.id !== id) }))
  }, [])

  // ---- Expenses --------------------------------------------------------
  const saveExpense = useCallback(
    (exp) => {
      setDb((d) => {
        const exists = d.expenses.some((e) => e.id === exp.id)
        const full = exists ? exp : { ...exp, id: uid('exp') }
        const expenses = exists ? d.expenses.map((e) => (e.id === exp.id ? exp : e)) : [full, ...d.expenses]
        return { ...d, expenses }
      })
      if (!db.expenses.some((e) => e.id === exp.id)) log('Expense Added', `${exp.name} — ₹${Number(exp.amount).toLocaleString('en-IN')}`)
    },
    [log, db.expenses]
  )

  const deleteExpense = useCallback((id) => {
    setDb((d) => ({ ...d, expenses: d.expenses.filter((e) => e.id !== id) }))
  }, [])

  // ---- Custom Payments (personal lending / advances ledger) ------------
  const addPerson = useCallback(
    (name, note = '') => {
      const p = { id: uid('cp'), name: name.trim(), note, createdAt: new Date().toISOString() }
      setDb((d) => ({ ...d, customPeople: [...(d.customPeople || []), p] }))
      log('Custom Person Added', name)
      return p
    },
    [log]
  )
  const updatePerson = useCallback((id, patch) => {
    setDb((d) => ({ ...d, customPeople: (d.customPeople || []).map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
  }, [])
  const deletePerson = useCallback((id) => {
    setDb((d) => ({
      ...d,
      customPeople: (d.customPeople || []).filter((p) => p.id !== id),
      customPayments: (d.customPayments || []).filter((x) => x.personId !== id),
    }))
  }, [])

  const addPayment = useCallback(
    (pmt) => {
      const rec = { id: uid('cpay'), type: 'given', note: '', ...pmt, amount: Number(pmt.amount) || 0 }
      setDb((d) => ({ ...d, customPayments: [rec, ...(d.customPayments || [])] }))
      return rec
    },
    []
  )
  const updatePayment = useCallback((id, patch) => {
    setDb((d) => ({
      ...d,
      customPayments: (d.customPayments || []).map((x) =>
        x.id === id ? { ...x, ...patch, amount: patch.amount != null ? Number(patch.amount) || 0 : x.amount } : x
      ),
    }))
  }, [])
  const deletePayment = useCallback((id) => {
    setDb((d) => ({ ...d, customPayments: (d.customPayments || []).filter((x) => x.id !== id) }))
  }, [])

  // Clone a payment into the following `months` months (same amount, editable after).
  const duplicatePayment = useCallback(
    (id, months) => {
      setDb((d) => {
        const src = (d.customPayments || []).find((x) => x.id === id)
        if (!src) return d
        const copies = []
        for (let i = 1; i <= months; i++) {
          const base = new Date(src.date)
          base.setMonth(base.getMonth() + i)
          copies.push({ ...src, id: uid('cpay'), date: base.toISOString().slice(0, 10) })
        }
        return { ...d, customPayments: [...copies, ...(d.customPayments || [])] }
      })
      log('Payments Duplicated', `${months} month(s)`)
    },
    [log]
  )

  // ---- Backup / Restore -----------------------------------------------
  const restore = useCallback((data) => {
    setDb(data)
  }, [])
  const resetAll = useCallback(() => setDb(buildSeed()), [])
  const clearAll = useCallback(() => setDb(buildEmpty()), [])
  const updateSettings = useCallback((patch) => {
    setDb((d) => ({ ...d, settings: { ...d.settings, ...patch } }))
  }, [])

  // ---- Derived finance metrics ----------------------------------------
  const finance = useMemo(() => computeFinance(db), [db])

  const value = {
    db,
    ...db,
    customPeople: db.customPeople || [],
    customPayments: db.customPayments || [],
    status,
    loading: status === 'connecting',
    finance,
    log,
    addTimeline,
    nextEmpId,
    createEmployee,
    saveEmployee,
    updateEmployee,
    deleteEmployee,
    convertIntern,
    promoteEmployee,
    generatePayslip,
    generatePayslipRange,
    runPayroll,
    addDocument,
    saveClient,
    deleteClient,
    nextInvoiceNumber,
    saveInvoice,
    setInvoiceStatus,
    recordPayment,
    deleteInvoice,
    saveExpense,
    deleteExpense,
    addPerson,
    updatePerson,
    deletePerson,
    addPayment,
    updatePayment,
    deletePayment,
    duplicatePayment,
    restore,
    resetAll,
    clearAll,
    updateSettings,
  }

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export const useStore = () => {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

// Convert any currency to INR for unified finance roll-ups (illustrative rates).
// Monthly entitlement from the annual CTC — the ceiling for Base Salary.
export const monthlyEntitlement = (emp) => Math.round(Number(emp?.compensation?.ctc || 0) / 12)

// Split a month's total pay: Base Salary fills the monthly CTC entitlement,
// anything above it becomes Incentive Pay.
export function splitTotalPay(emp, totalPay) {
  const total = Math.max(0, Number(totalPay) || 0)
  const monthly = monthlyEntitlement(emp)
  const basic = Math.min(total, monthly)
  return { basic, incentive: Math.max(0, total - monthly), monthly, total }
}

// Pure payslip builder shared by single and bulk generation.
function buildSlip(emp, month, payDate, extra = {}) {
  const c = emp.compensation || {}
  const hasTotal = extra.totalPay != null && extra.totalPay !== ''

  let earnings
  if (hasTotal) {
    // Custom total pay → Base Salary + Incentive Pay (allowances folded into base).
    const { basic, incentive } = splitTotalPay(emp, extra.totalPay)
    earnings = { basic, hra: 0, special: 0, other: 0, bonus: incentive }
  } else {
    const bonus = extra.incentive != null && extra.incentive !== '' ? Number(extra.incentive) : c.bonus
    earnings = { basic: c.basic, hra: c.hra, special: c.special, other: c.other, bonus }
  }

  // Respect per-employee PF / ESIC / TDS enable toggles (default enabled).
  const deductions = {
    pf: c.pfEnabled === false ? 0 : c.pf,
    esic: c.esicEnabled === false ? 0 : c.esic,
    tax: c.taxEnabled === false ? 0 : c.tax,
    other: 0,
  }
  const loan = Number(extra.loan || 0)
  const gross = Object.values(earnings).reduce((a, b) => a + Number(b || 0), 0)
  const totalDeductions = Object.values(deductions).reduce((a, b) => a + Number(b || 0), 0) + loan
  const first = new Date(month + '-01')
  // Local-date string: toISOString() would shift back a day in +ve timezones.
  const lastDay = new Date(first.getFullYear(), first.getMonth() + 1, 0)
  const lastDayStr = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`

  return {
    id: uid('ps'),
    empId: emp.id,
    month,
    monthLabel: first.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    periodLabel: first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }).replace(' ', '-'),
    workedDays: extra.workedDays != null && extra.workedDays !== '' ? Number(extra.workedDays) : 26,
    loan,
    totalPay: hasTotal ? Number(extra.totalPay) : null,
    payDate: payDate || lastDayStr,
    earnings,
    deductions,
    gross,
    totalDeductions,
    net: gross - totalDeductions,
  }
}

// Inclusive list of "YYYY-MM" keys between two months.
export function monthsBetween(fromMonth, toMonth) {
  if (!fromMonth || !toMonth) return []
  const [fy, fm] = fromMonth.split('-').map(Number)
  const [ty, tm] = toMonth.split('-').map(Number)
  const out = []
  let y = fy, m = fm
  // Cap at 36 months so a mistyped range can't spin forever.
  while ((y < ty || (y === ty && m <= tm)) && out.length < 36) {
    out.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) { m = 1; y++ }
  }
  return out
}

const FX_TO_INR = { INR: 1, USD: 83, EUR: 90, GBP: 105, AED: 22.6, SGD: 62 }
export const toINR = (amount, currency) => Number(amount || 0) * (FX_TO_INR[currency] || 1)

function computeFinance(db) {
  const now = new Date()
  const thisMonth = monthKey(now)

  // Revenue = collected payments. Outstanding = unpaid balance on sent/overdue/partial.
  let collected = 0
  let revenueBooked = 0
  let outstanding = 0
  let pendingCount = 0
  let paidCount = 0
  const revByMonth = {}
  const collectionByMonth = {}

  db.invoices.forEach((inv) => {
    const totalINR = toINR(inv.total, inv.currency)
    const paidINR = toINR(inv.amountPaid, inv.currency)
    if (inv.status !== 'Draft' && inv.status !== 'Cancelled') {
      revenueBooked += totalINR
      const mk = monthKey(inv.date)
      revByMonth[mk] = (revByMonth[mk] || 0) + totalINR
    }
    collected += paidINR
    ;(inv.payments || []).forEach((p) => {
      const mk = monthKey(p.date)
      collectionByMonth[mk] = (collectionByMonth[mk] || 0) + toINR(p.amount, inv.currency)
    })
    if (inv.status === 'Paid') paidCount++
    if (['Sent', 'Viewed', 'Partially Paid', 'Overdue'].includes(inv.status)) {
      pendingCount++
      outstanding += totalINR - paidINR
    }
  })

  const expByMonth = {}
  let expenseTotal = 0
  const expByCategory = {}
  const expByVendor = {}
  db.expenses.forEach((e) => {
    const amt = Number(e.amount || 0)
    expenseTotal += amt
    const mk = monthKey(e.date)
    expByMonth[mk] = (expByMonth[mk] || 0) + amt
    expByCategory[e.category] = (expByCategory[e.category] || 0) + amt
    if (e.vendor) expByVendor[e.vendor] = (expByVendor[e.vendor] || 0) + amt
  })

  // Monthly payroll cost (active employees, net of nothing — gross CTC/12 basis)
  const monthlyPayroll = db.employees
    .filter((e) => e.status === 'Active')
    .reduce((s, e) => s + (e.compensation?.ctc || 0) / 12, 0)

  const thisMonthRevenue = revByMonth[thisMonth] || 0
  const thisMonthExpense = expByMonth[thisMonth] || 0

  // Build last 12 month buckets
  const months = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(monthKey(d))
  }
  const trend = months.map((m) => {
    const rev = revByMonth[m] || 0
    const exp = (expByMonth[m] || 0) + monthlyPayroll
    return { month: m, revenue: Math.round(rev), expense: Math.round(exp), payroll: Math.round(monthlyPayroll), collection: Math.round(collectionByMonth[m] || 0), profit: Math.round(rev - exp) }
  })

  const employees = db.employees
  const empStats = {
    total: employees.length,
    active: employees.filter((e) => e.status === 'Active').length,
    interns: employees.filter((e) => e.type === 'Intern').length,
    freelancers: employees.filter((e) => e.type === 'Freelancer').length,
    contractors: employees.filter((e) => e.type === 'Contractor').length,
    fulltime: employees.filter((e) => e.type === 'Full Time').length,
  }

  const netProfit = revenueBooked - expenseTotal - monthlyPayroll * 12 // rough annualized payroll? keep simple
  const monthProfit = thisMonthRevenue - thisMonthExpense - monthlyPayroll

  return {
    collected,
    revenueBooked,
    outstanding,
    pendingCount,
    paidCount,
    expenseTotal,
    monthlyPayroll,
    thisMonthRevenue,
    thisMonthExpense,
    monthProfit,
    netProfit: revenueBooked - expenseTotal,
    trend,
    expByCategory,
    expByVendor,
    empStats,
  }
}
