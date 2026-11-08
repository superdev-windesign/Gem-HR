import test from 'node:test'
import assert from 'node:assert/strict'
import { withInvoiceStatus } from '../src/lib/invoicing.js'

test('Editing an unpaid or partially paid invoice to Paid settles its full balance', () => {
  for (const status of ['Sent', 'Partially Paid', 'Overdue']) {
    const old = { id: 'nexmark', number: 'INT2616', status, total: 700, amountPaid: 0, payments: [] }
    const saved = withInvoiceStatus(old, 'Paid')
    assert.equal(saved.status, 'Paid')
    assert.equal(saved.amountPaid, 700)
    assert.equal(saved.total - saved.amountPaid, 0)
    assert.equal(saved.paymentDateUnknown, true)
    assert.deepEqual(saved.payments, [])
    assert.equal(old.amountPaid, 0)
  }
})

test('Paid status preserves real receipt details and records no invented payment dates', () => {
  const payments = [{ id: 'receipt', amount: 200.01, date: '2026-10-12', method: 'Bank Transfer' }]
  const partial = withInvoiceStatus({ total: 4193.33, amountPaid: 200.01, payments }, 'Paid')
  assert.equal(partial.amountPaid, 4193.33)
  assert.deepEqual(partial.payments, payments)
  assert.equal(partial.paymentDateUnknown, true)
  const full = withInvoiceStatus({ ...partial, total: 200.01 }, 'Paid')
  assert.equal(full.paymentDateUnknown, false)
  assert.throws(() => withInvoiceStatus({ ...partial, total: 100 }, 'Paid'), /recorded payments/)
})

test('Other status edits preserve paid amounts and receipts', () => {
  const old = { total: 700, amountPaid: 200, payments: [{ amount: 200 }], status: 'Partially Paid' }
  for (const status of ['Draft', 'Sent', 'Viewed', 'Partially Paid', 'Overdue', 'Cancelled']) {
    assert.deepEqual(withInvoiceStatus(old, status), { ...old, status })
  }
})
