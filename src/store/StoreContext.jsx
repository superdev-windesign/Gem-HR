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
  const nextEmpId = useCallback(() => {
    const nums = db.employees.map((e) => parseInt(String(e.empId).replace(/\D/g, ''), 10)).filter((n) => !isNaN(n))
    const next = (nums.length ? Math.max(...nums) : 0) + 1
    return 'WD-' + String(next).padStart(3, '0')
  }, [db.employees])

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
    (empId, month, payDate) => {
      const emp = db.employees.find((e) => e.id === empId)
      if (!emp) return null
      const c = emp.compensation
      const earnings = { basic: c.basic, hra: c.hra, special: c.special, other: c.other, bonus: c.bonus }
      const deductions = { pf: c.pf, esic: c.esic, tax: c.tax, other: 0 }
      const gross = Object.values(earnings).reduce((a, b) => a + b, 0)
      const totalDeductions = Object.values(deductions).reduce((a, b) => a + b, 0)
      const net = gross - totalDeductions
      const ml = new Date(month + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
      const slip = {
        id: uid('ps'),
        empId,
        month,
        monthLabel: ml,
        payDate: payDate || new Date().toISOString().slice(0, 10),
        earnings,
        deductions,
        gross,
        totalDeductions,
        net,
      }
      setDb((d) => ({ ...d, payslips: [slip, ...d.payslips.filter((p) => !(p.empId === empId && p.month === month))] }))
      addTimeline(empId, 'Payslip Generated', `Payslip generated for ${ml}.`)
      log('Payslip Generated', `${emp.name} — ${ml} (net ₹${net.toLocaleString('en-IN')})`)
      return slip
    },
    [db.employees, addTimeline, log]
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
    status,
    finance,
    log,
    addTimeline,
    nextEmpId,
    createEmployee,
    saveEmployee,
    updateEmployee,
    deleteEmployee,
    promoteEmployee,
    generatePayslip,
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
