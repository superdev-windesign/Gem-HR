export function validateInvoiceState(state) {
 const numbers=new Set(), ids=new Set()
 for(const inv of state.invoices || []) {
  const number=String(inv.number||'').trim().toUpperCase()
  if(!number || numbers.has(number)) throw new Error(`Duplicate or missing invoice number: ${number}`)
  if(!inv.id || ids.has(inv.id)) throw new Error('Duplicate or missing invoice ID.')
  if(!Number.isFinite(inv.total) || inv.total<0) throw new Error(`${number}: invalid total.`)
  if(!Number.isFinite(inv.amountPaid) || inv.amountPaid<0 || inv.amountPaid>inv.total+.01) throw new Error(`${number}: invalid paid amount.`)
  numbers.add(number);ids.add(inv.id)
 }
}
