import { useMemo, useState } from 'react'
import {
  HandCoins, Plus, Trash2, Copy, Pencil, ArrowDownLeft, ArrowUpRight, Users, Wallet, X,
} from 'lucide-react'
import { useStore } from '../store/StoreContext'
import { PageHeader, Card, StatCard, Avatar, Badge, Modal, Field, Input, Textarea, Select, EmptyState, useConfirm } from '../components/ui'
import { money, fmtDate, todayISO } from '../lib/format'

// Add / edit a single ledger entry (given out or received back)
function PaymentModal({ open, onClose, personName, initial, defaultType }) {
  const { addPayment, updatePayment } = useStore()
  const editing = !!initial?.id
  const blank = { type: defaultType || 'given', date: todayISO(), amount: '', note: '' }
  const [f, setF] = useState(editing ? initial : blank)
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const submit = () => {
    if (!f.amount) return
    if (editing) updatePayment(initial.id, { type: f.type, date: f.date, amount: f.amount, note: f.note })
    else addPayment({ personId: initial.personId, type: f.type, date: f.date, amount: f.amount, note: f.note })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title={`${editing ? 'Edit' : 'Add'} entry — ${personName}`} size="sm"
      footer={<><button className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit}>{editing ? 'Save' : 'Add Entry'}</button></>}>
      <Field label="Type" className="mb-3">
        <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          {[{ v: 'given', l: '↑ Paid / Given' }, { v: 'received', l: '↓ Got Back' }].map((o) => (
            <button key={o.v} onClick={() => set('type', o.v)} className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${f.type === o.v ? 'bg-white dark:bg-slate-700 text-brand-600 shadow-sm' : 'text-slate-500'}`}>{o.l}</button>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><Input type="date" value={f.date} onChange={(e) => set('date', e.target.value)} /></Field>
        <Field label="Amount (₹)"><Input type="number" value={f.amount} onChange={(e) => set('amount', e.target.value)} autoFocus /></Field>
      </div>
      <Field label="Note (optional)" className="mt-3"><Input value={f.note} onChange={(e) => set('note', e.target.value)} placeholder="e.g. April retainer" /></Field>
    </Modal>
  )
}

function DuplicateModal({ open, onClose, payment }) {
  const { duplicatePayment } = useStore()
  const [months, setMonths] = useState(3)
  if (!payment) return null
  return (
    <Modal open={open} onClose={onClose} title="Duplicate for coming months" size="sm"
      footer={<><button className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={() => { duplicatePayment(payment.id, Number(months) || 1); onClose() }}><Copy size={15} /> Create {months} entries</button></>}>
      <p className="text-sm text-slate-500 mb-4">Creates copies of <b>{money(payment.amount)}</b> for the next months (from {fmtDate(payment.date)}), same amount. You can edit any amount afterwards.</p>
      <Field label="Number of following months"><Input type="number" min="1" max="36" value={months} onChange={(e) => setMonths(e.target.value)} /></Field>
    </Modal>
  )
}

function AddPersonModal({ open, onClose }) {
  const { addPerson } = useStore()
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const submit = () => { if (!name.trim()) return; addPerson(name, note); setName(''); setNote(''); onClose() }
  return (
    <Modal open={open} onClose={onClose} title="Add Person" size="sm"
      footer={<><button className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit}>Add Person</button></>}>
      <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ramesh" autoFocus /></Field>
      <Field label="Note (optional)" className="mt-3"><Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="What this is for" /></Field>
    </Modal>
  )
}

export default function CustomPayments() {
  const { customPeople, customPayments, deletePerson, deletePayment } = useStore()
  const { confirm, node } = useConfirm()
  const [selectedId, setSelectedId] = useState(null)
  const [personModal, setPersonModal] = useState(false)
  const [payModal, setPayModal] = useState(null) // { personId } | { entry } | { defaultType }
  const [dupModal, setDupModal] = useState(null)

  // Per-person totals
  const totals = useMemo(() => {
    const m = {}
    customPeople.forEach((p) => (m[p.id] = { given: 0, received: 0, count: 0 }))
    customPayments.forEach((x) => {
      if (!m[x.personId]) return
      m[x.personId].count++
      if (x.type === 'received') m[x.personId].received += Number(x.amount || 0)
      else m[x.personId].given += Number(x.amount || 0)
    })
    Object.values(m).forEach((t) => (t.balance = t.given - t.received))
    return m
  }, [customPeople, customPayments])

  const grand = useMemo(() => {
    let given = 0, received = 0
    Object.values(totals).forEach((t) => { given += t.given; received += t.received })
    return { given, received, balance: given - received }
  }, [totals])

  const selected = customPeople.find((p) => p.id === selectedId) || customPeople[0] || null
  const ledger = customPayments
    .filter((x) => x.personId === selected?.id)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  const st = selected ? totals[selected.id] || { given: 0, received: 0, balance: 0 } : null

  const removePerson = async (p) => {
    if (await confirm({ title: 'Delete person?', message: `${p.name} and all their entries will be removed.`, danger: true, confirmText: 'Delete' })) {
      deletePerson(p.id)
      if (selectedId === p.id) setSelectedId(null)
    }
  }
  const removeEntry = async (x) => {
    if (await confirm({ title: 'Delete entry?', message: `${x.type === 'received' ? 'Received' : 'Given'} ${money(x.amount)} on ${fmtDate(x.date)}.`, danger: true, confirmText: 'Delete' })) deletePayment(x.id)
  }

  return (
    <div>
      {node}
      <PageHeader title="Custom Payments" subtitle="Track money you pay people & what you get back" icon={HandCoins}
        actions={<button className="btn-primary" onClick={() => setPersonModal(true)}><Plus size={16} /> Add Person</button>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="People" value={customPeople.length} icon={Users} tone="brand" />
        <StatCard label="Total Given" value={money(grand.given)} sub="Paid out" icon={ArrowUpRight} tone="red" />
        <StatCard label="Total Got Back" value={money(grand.received)} sub="Received" icon={ArrowDownLeft} tone="green" />
        <StatCard label="Net Outstanding" value={money(grand.balance)} sub="Given − Got back" icon={Wallet} tone={grand.balance >= 0 ? 'amber' : 'green'} />
      </div>

      {customPeople.length === 0 ? (
        <Card><EmptyState icon={HandCoins} title="No people yet" hint="Add a person, then log the payments you make to them and any amount you get back." action={<button className="btn-primary" onClick={() => setPersonModal(true)}><Plus size={16} /> Add Person</button>} /></Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* People list */}
          <div className="space-y-2">
            {customPeople.map((p) => {
              const t = totals[p.id] || { given: 0, received: 0, balance: 0 }
              const active = selected?.id === p.id
              return (
                <button key={p.id} onClick={() => setSelectedId(p.id)}
                  className={`w-full text-left card !p-3 transition ${active ? 'ring-2 ring-brand-500' : 'hover:shadow-soft'}`}>
                  <div className="flex items-center gap-3">
                    <Avatar name={p.name} size={38} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-slate-400 truncate">Given {money(t.given)} · Got {money(t.received)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${t.balance > 0 ? 'text-amber-600' : t.balance < 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{money(t.balance)}</p>
                      <p className="text-[10px] text-slate-400">balance</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Ledger */}
          {selected && (
            <Card className="lg:col-span-2 !p-0 overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Avatar name={selected.name} size={44} />
                    <div>
                      <p className="font-bold text-lg">{selected.name}</p>
                      {selected.note && <p className="text-xs text-slate-400">{selected.note}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-outline !py-1.5" onClick={() => setPayModal({ personId: selected.id, defaultType: 'received' })}><ArrowDownLeft size={15} /> Got Back</button>
                    <button className="btn-primary !py-1.5" onClick={() => setPayModal({ personId: selected.id, defaultType: 'given' })}><Plus size={15} /> Add Payment</button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="rounded-lg bg-rose-500/10 p-2.5 text-center"><p className="text-xs text-slate-400">Given</p><p className="font-bold text-rose-600">{money(st.given)}</p></div>
                  <div className="rounded-lg bg-emerald-500/10 p-2.5 text-center"><p className="text-xs text-slate-400">Got Back</p><p className="font-bold text-emerald-600">{money(st.received)}</p></div>
                  <div className="rounded-lg bg-amber-500/10 p-2.5 text-center"><p className="text-xs text-slate-400">Balance</p><p className="font-bold text-amber-600">{money(st.balance)}</p></div>
                </div>
              </div>

              {ledger.length === 0 ? (
                <div className="p-5"><EmptyState icon={Wallet} title="No entries yet" hint="Add a payment you made, then duplicate it across coming months." /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 dark:bg-slate-900/60"><tr><th className="th">Date</th><th className="th">Type</th><th className="th">Note</th><th className="th text-right">Amount</th><th className="th text-right">Actions</th></tr></thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {ledger.map((x) => (
                        <tr key={x.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="td whitespace-nowrap">{fmtDate(x.date)}</td>
                          <td className="td">{x.type === 'received' ? <Badge tone="Paid">Got Back</Badge> : <Badge tone="Overdue">Given</Badge>}</td>
                          <td className="td text-slate-500">{x.note || '—'}</td>
                          <td className={`td text-right font-semibold ${x.type === 'received' ? 'text-emerald-600' : 'text-rose-600'}`}>{x.type === 'received' ? '+ ' : '− '}{money(x.amount)}</td>
                          <td className="td text-right">
                            <div className="flex justify-end gap-1">
                              {x.type === 'given' && <button className="btn-ghost !p-1.5" title="Duplicate for coming months" onClick={() => setDupModal(x)}><Copy size={15} /></button>}
                              <button className="btn-ghost !p-1.5" title="Edit" onClick={() => setPayModal({ entry: x })}><Pencil size={15} /></button>
                              <button className="btn-ghost !p-1.5 text-rose-500" title="Delete" onClick={() => removeEntry(x)}><Trash2 size={15} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800">
                <button className="btn-ghost text-rose-600 -ml-2" onClick={() => removePerson(selected)}><Trash2 size={15} /> Delete {selected.name}</button>
              </div>
            </Card>
          )}
        </div>
      )}

      <AddPersonModal open={personModal} onClose={() => setPersonModal(false)} />
      <PaymentModal
        key={payModal?.entry?.id || payModal?.personId || 'none'}
        open={!!payModal}
        onClose={() => setPayModal(null)}
        personName={selected?.name || ''}
        defaultType={payModal?.defaultType}
        initial={payModal?.entry ? payModal.entry : payModal ? { personId: payModal.personId } : null}
      />
      <DuplicateModal open={!!dupModal} onClose={() => setDupModal(null)} payment={dupModal} />
    </div>
  )
}
