export const fiscalYear = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10)!==date) throw new Error('Enter a valid invoice date.')
  const [year, month] = date.split('-').map(Number)
  return year - (month < 4 ? 1 : 0)
}
export const fyLabel = date => { const y = fiscalYear(date); return `${y}–${String(y + 1).slice(-2)}` }
export const invoiceHead = (type, date, config = {}) => `${type === 'export' ? config.exportPrefix || 'INT' : config.indianPrefix || 'IND'}${String(fiscalYear(date)).slice(-2)}`
export function nextNumber(invoices, type, date, config = {}) {
  const head = invoiceHead(type, date, config)
  const seq = invoices.map(i => String(i.number)).filter(n => n.startsWith(head) && /^\d+$/.test(n.slice(head.length))).map(n => Number(n.slice(head.length)))
  return head + String(Math.max(0, Number(config.sequences?.[head] || 0), ...seq) + 1).padStart(2, '0')
}
export function reserveNumber(config = {}, number) {
  const m = /^(IND|INT)(\d{2})(\d+)$/.exec(number)
  if (!m) return config
  const head = m[1] + m[2]
  return { ...config, sequences: { ...config.sequences, [head]: Math.max(config.sequences?.[head] || 0, Number(m[3])) } }
}
export const clientForInvoice = (invoice, clients) => invoice.clientSnapshot || clients.find(c => c.id === invoice.clientId)
export const invoiceType = client => /^india$/i.test(client?.country?.trim() || '') ? 'gst' : 'export'
export const addDays = (date, days) => { const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10) }
export function duplicateInvoice(source, invoices, clients, date, config = {}) {
  const client = clients.find(c => c.id === source.clientId)
  const type = client ? invoiceType(client) : source.type
  const { sourcePdf, sourceFile, sourceHash, sourceText, importWarnings, taxLines, imported, paymentDateUnknown, ...copy } = source
  return { ...copy, id: crypto.randomUUID(), clientId: client?.id || '', clientSnapshot: client ? { ...client } : undefined,
    number: nextNumber(invoices, type, date, config), type, date, dueDate: addDays(date, 15),
    currency: type === 'gst' ? 'INR' : client?.currency || source.currency,
    status: 'Draft', amountPaid: 0, payments: [], events: [], duplicateOf: source.number,
    items: source.items.map(i => ({ ...i, id: crypto.randomUUID() })),
    subtotal: undefined, total: undefined, cgst: undefined, sgst: undefined, igst: undefined, taxAmount: undefined }
}
export function validateInvoice(inv, invoices, client, { historical = false } = {}) {
  const errors = []
  if (!client?.company?.trim() && !client?.name?.trim()) errors.push('Choose a client.')
  try {
    fiscalYear(inv.date)
    if (!historical && !inv.number?.startsWith(invoiceHead(inv.type, inv.date))) errors.push('Invoice number must match its type and financial year.')
  } catch(e) { errors.push(e.message) }
  if (!/^[A-Za-z0-9/-]{1,16}$/.test(inv.number || '')) errors.push('Use an invoice number of 1–16 letters, digits, / or -.')
  if (invoices.some(i => i.id !== inv.id && i.number.toUpperCase() === inv.number?.toUpperCase())) errors.push('This invoice number already exists.')
  if (inv.dueDate && inv.dueDate < inv.date) errors.push('Due date cannot be before the invoice date.')
  if (!inv.items?.length || inv.items.some(i => !i.description?.trim() || !Number.isFinite(Number(i.rate)) || Number(i.rate) < 0 || (i.qty !== '' && !isNaN(Number(i.qty)) && Number(i.qty) <= 0))) errors.push('Each line needs a description, positive quantity and valid non-negative rate.')
  if (!Number.isFinite(Number(inv.taxRate)) || inv.taxRate < 0 || inv.taxRate > 100) errors.push('GST rate must be between 0 and 100.')
  const subtotal = (inv.items || []).reduce((s, i) => s + Number(i.rate) * (isNaN(Number(i.qty)) || i.qty === '' ? 1 : Number(i.qty)), 0)
  if (!Number.isFinite(Number(inv.discount || 0)) || Number(inv.discount || 0) < 0 || Number(inv.discount || 0) > subtotal) errors.push('Discount must be between zero and subtotal.')
  if (inv.type === 'gst' && inv.currency !== 'INR') errors.push('Indian GST invoices must use INR.')
  if (!historical && inv.type === 'gst' && !/^\d{2}$/.test(client?.stateCode || client?.gst?.slice(0, 2) || '')) errors.push('Set the client GST state code before issuing an Indian invoice.')
  return errors
}
export function mergeInvoiceImport(db, entries, paid = false) {
  const next = structuredClone(db)
  const result = { added: [], skipped: [], conflicts: [], clientsAdded: 0 }
  for (const entry of entries) {
    const inv = entry.invoice
    const existing = next.invoices.find(i => i.number.toUpperCase() === inv.number.toUpperCase())
    if (existing) {
      if (existing.sourceHash && existing.sourceHash === inv.sourceHash) result.skipped.push(inv.number)
      else result.conflicts.push(inv.number)
      continue
    }
    const errors = validateInvoice(inv, next.invoices, entry.client, { historical: true })
    if (errors.length) throw new Error(`${inv.number}: ${errors.join(' ')}`)
    const key = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ')
    let client = next.clients.find(c => key(c.company || c.name) === key(entry.client.company) && key(c.country) === key(entry.client.country))
    if (!client) { client = { ...entry.client, id: crypto.randomUUID() }; next.clients.push(client); result.clientsAdded++ }
    next.invoices.push({ ...inv, id: crypto.randomUUID(), imported: true, clientId: client.id, clientSnapshot: { ...entry.client, id: client.id }, status: paid ? 'Paid' : 'Sent', amountPaid: paid ? inv.total : 0, payments: [], paymentDateUnknown: paid,
      events: [{ type: paid ? 'Imported — paid (payment date not supplied)' : 'Imported', date: new Date().toISOString() }] })
    next.settings.invoice = reserveNumber(next.settings.invoice, inv.number)
    result.added.push(inv.number)
  }
  return { state: next, result }
}
