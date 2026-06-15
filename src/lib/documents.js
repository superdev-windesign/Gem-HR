// Professional document HTML templates (used for PDF + DOCX export & preview).
import { money, fmtDate } from './format'

const styleBlock = `
  <style>
    .doc{font-family:Inter,Arial,sans-serif;color:#1e293b;max-width:760px;margin:0 auto}
    .doc .hd{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1f47f5;padding-bottom:16px;margin-bottom:24px}
    .doc .brand{font-size:22px;font-weight:800;color:#1f47f5}
    .doc .muted{color:#64748b;font-size:12px}
    .doc h2{font-size:18px;margin:18px 0 6px}
    .doc p{font-size:13px;line-height:1.7;margin:8px 0}
    .doc table{width:100%;border-collapse:collapse;margin:14px 0;font-size:13px}
    .doc th,.doc td{border:1px solid #e2e8f0;padding:8px 10px;text-align:left}
    .doc th{background:#f1f5f9;font-weight:700}
    .doc .right{text-align:right}
    .doc .total{background:#eef4ff;font-weight:700}
    .doc .sign{margin-top:48px;display:flex;justify-content:space-between}
    .doc .badge{display:inline-block;background:#eef4ff;color:#1f47f5;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:700}
  </style>`

function header(company) {
  return `<div class="hd">
    <div>
      <div class="brand">${company?.name || 'Windesign'}</div>
      <div class="muted">${company?.address || ''}</div>
      <div class="muted">${[company?.email, company?.phone].filter(Boolean).join(' · ')}</div>
    </div>
    <div class="muted right">${company?.website || ''}<br/>${company?.gst ? 'GSTIN: ' + company.gst : ''}</div>
  </div>`
}

export function offerLetterHTML(emp, data, company) {
  const s = data.salary || {}
  return `${styleBlock}<div class="doc">${header(company)}
    <span class="badge">OFFER LETTER</span>
    <p class="right muted">Date: ${fmtDate(data.date || new Date())}</p>
    <h2>Dear ${data.candidateName || emp.name},</h2>
    <p>We are delighted to extend an offer of employment for the position of <b>${data.role || emp.designation}</b> in the <b>${data.department || emp.department}</b> department at ${company?.name || 'our company'}.</p>
    <p>Your tentative date of joining will be <b>${fmtDate(data.joiningDate)}</b>, based at <b>${data.location || emp.location}</b>, reporting to <b>${data.manager || emp.manager || '—'}</b>. This offer carries a probation period of <b>${data.probation || '3 months'}</b> and a notice period of <b>${data.notice || '30 days'}</b>.</p>
    <h2>Compensation Structure</h2>
    <table>
      <tr><th>Component</th><th class="right">Monthly</th><th class="right">Annual</th></tr>
      <tr><td>Basic Salary</td><td class="right">${money(s.basic, company?.currency)}</td><td class="right">${money(s.basic * 12, company?.currency)}</td></tr>
      <tr><td>HRA</td><td class="right">${money(s.hra, company?.currency)}</td><td class="right">${money(s.hra * 12, company?.currency)}</td></tr>
      <tr><td>Special Allowance</td><td class="right">${money(s.special, company?.currency)}</td><td class="right">${money(s.special * 12, company?.currency)}</td></tr>
      <tr><td>Other Allowances</td><td class="right">${money(s.other, company?.currency)}</td><td class="right">${money(s.other * 12, company?.currency)}</td></tr>
      <tr class="total"><td>Total CTC</td><td class="right">${money(data.monthly, company?.currency)}</td><td class="right">${money(data.annual, company?.currency)}</td></tr>
    </table>
    <p>We look forward to welcoming you to the team. Please sign and return a copy of this letter as a token of your acceptance.</p>
    <div class="sign"><div><b>____________________</b><br/>For ${company?.name || 'Windesign'}</div><div><b>____________________</b><br/>${data.candidateName || emp.name}</div></div>
  </div>`
}

export function appointmentLetterHTML(emp, data, company) {
  return `${styleBlock}<div class="doc">${header(company)}
    <span class="badge">APPOINTMENT LETTER</span>
    <p class="right muted">Date: ${fmtDate(data.date || new Date())}</p>
    <h2>Dear ${emp.name},</h2>
    <p>With reference to your acceptance of our offer, we are pleased to confirm your appointment as <b>${data.role || emp.designation}</b> in the <b>${data.department || emp.department}</b> department, effective <b>${fmtDate(data.joiningDate || emp.joiningDate)}</b>.</p>
    <table>
      <tr><th>Employee ID</th><td>${emp.empId}</td><th>Designation</th><td>${data.role || emp.designation}</td></tr>
      <tr><th>Department</th><td>${data.department || emp.department}</td><th>Reporting Manager</th><td>${data.manager || emp.manager || '—'}</td></tr>
      <tr><th>Work Location</th><td>${data.location || emp.location}</td><th>Employment Type</th><td>${emp.type}</td></tr>
      <tr><th>Annual CTC</th><td colspan="3">${money(emp.compensation?.ctc, company?.currency)}</td></tr>
    </table>
    <p>Your employment will be governed by the company's policies as amended from time to time. We welcome you aboard and wish you a long and successful career with us.</p>
    <div class="sign"><div><b>____________________</b><br/>Authorised Signatory<br/>${company?.name || 'Windesign'}</div><div><b>____________________</b><br/>${emp.name}</div></div>
  </div>`
}

export function promotionLetterHTML(emp, promo, company) {
  return `${styleBlock}<div class="doc">${header(company)}
    <span class="badge">PROMOTION LETTER</span>
    <p class="right muted">Date: ${fmtDate(promo.effectiveDate || new Date())}</p>
    <h2>Dear ${emp.name},</h2>
    <p>In recognition of your contribution and performance, we are pleased to promote you from <b>${promo.fromDesignation}</b> to <b>${promo.toDesignation}</b>, effective <b>${fmtDate(promo.effectiveDate)}</b>.</p>
    <table>
      <tr><th></th><th>Previous</th><th>Revised</th></tr>
      <tr><td>Designation</td><td>${promo.fromDesignation}</td><td>${promo.toDesignation}</td></tr>
      <tr><td>Annual Salary</td><td>${money(promo.fromSalary, company?.currency)}</td><td>${money(promo.toSalary, company?.currency)}</td></tr>
      ${promo.newDepartment ? `<tr><td>Department</td><td>${emp.department}</td><td>${promo.newDepartment}</td></tr>` : ''}
      ${promo.newManager ? `<tr><td>Manager</td><td>${emp.manager || '—'}</td><td>${promo.newManager}</td></tr>` : ''}
    </table>
    ${promo.notes ? `<p>${promo.notes}</p>` : ''}
    <p>Congratulations on your well-deserved promotion. We look forward to your continued success.</p>
    <div class="sign"><div><b>____________________</b><br/>For ${company?.name || 'Windesign'}</div><div></div></div>
  </div>`
}

export function payslipHTML(emp, slip, company) {
  const e = slip.earnings, d = slip.deductions
  return `${styleBlock}<div class="doc">${header(company)}
    <span class="badge">PAYSLIP — ${slip.monthLabel}</span>
    <table>
      <tr><th>Employee</th><td>${emp.name}</td><th>Employee ID</th><td>${emp.empId}</td></tr>
      <tr><th>Designation</th><td>${emp.designation}</td><th>Department</th><td>${emp.department}</td></tr>
      <tr><th>Pay Period</th><td>${slip.monthLabel}</td><th>Pay Date</th><td>${fmtDate(slip.payDate)}</td></tr>
    </table>
    <table>
      <tr><th>Earnings</th><th class="right">Amount</th><th>Deductions</th><th class="right">Amount</th></tr>
      <tr><td>Basic</td><td class="right">${money(e.basic, company?.currency)}</td><td>Provident Fund</td><td class="right">${money(d.pf, company?.currency)}</td></tr>
      <tr><td>HRA</td><td class="right">${money(e.hra, company?.currency)}</td><td>ESIC</td><td class="right">${money(d.esic, company?.currency)}</td></tr>
      <tr><td>Special Allowance</td><td class="right">${money(e.special, company?.currency)}</td><td>Tax (TDS)</td><td class="right">${money(d.tax, company?.currency)}</td></tr>
      <tr><td>Other Allowances</td><td class="right">${money(e.other, company?.currency)}</td><td>Other</td><td class="right">${money(d.other, company?.currency)}</td></tr>
      <tr><td>Bonus</td><td class="right">${money(e.bonus, company?.currency)}</td><td></td><td></td></tr>
      <tr class="total"><td>Gross Earnings</td><td class="right">${money(slip.gross, company?.currency)}</td><td>Total Deductions</td><td class="right">${money(slip.totalDeductions, company?.currency)}</td></tr>
    </table>
    <table><tr class="total"><td>Net Pay</td><td class="right">${money(slip.net, company?.currency)}</td></tr></table>
    <p class="muted">This is a system-generated payslip and does not require a signature.</p>
  </div>`
}

export function invoiceHTML(inv, client, company) {
  const cur = inv.currency || company?.currency || 'INR'
  const rows = (inv.items || [])
    .map(
      (it) =>
        `<tr><td>${it.description || ''}</td><td class="right">${it.qty}</td><td class="right">${money(it.rate, cur)}</td><td class="right">${money(it.qty * it.rate, cur)}</td></tr>`
    )
    .join('')
  return `${styleBlock}<div class="doc">${header(company)}
    <div style="display:flex;justify-content:space-between">
      <div><span class="badge">INVOICE</span><h2>${inv.number}</h2>
        <div class="muted">Issue: ${fmtDate(inv.date)} · Due: ${fmtDate(inv.dueDate)}</div></div>
      <div class="right">
        <div class="muted">Billed To</div>
        <b>${client?.company || client?.name || '—'}</b><br/>
        <span class="muted">${client?.address || ''}<br/>${client?.gst ? 'GSTIN: ' + client.gst : ''}</span>
      </div>
    </div>
    <table>
      <tr><th>Description</th><th class="right">Qty</th><th class="right">Rate</th><th class="right">Amount</th></tr>
      ${rows}
      <tr><td colspan="3" class="right">Subtotal</td><td class="right">${money(inv.subtotal, cur)}</td></tr>
      ${inv.discount ? `<tr><td colspan="3" class="right">Discount</td><td class="right">- ${money(inv.discount, cur)}</td></tr>` : ''}
      <tr><td colspan="3" class="right">Tax (${inv.taxRate || 0}%)</td><td class="right">${money(inv.taxAmount, cur)}</td></tr>
      <tr class="total"><td colspan="3" class="right">Total</td><td class="right">${money(inv.total, cur)}</td></tr>
      ${inv.amountPaid ? `<tr><td colspan="3" class="right">Paid</td><td class="right">${money(inv.amountPaid, cur)}</td></tr><tr class="total"><td colspan="3" class="right">Balance Due</td><td class="right">${money(inv.total - inv.amountPaid, cur)}</td></tr>` : ''}
    </table>
    ${inv.notes ? `<p><b>Notes:</b> ${inv.notes}</p>` : ''}
    ${inv.terms ? `<p class="muted"><b>Terms:</b> ${inv.terms}</p>` : ''}
    ${company?.bank ? `<p class="muted"><b>Bank Details:</b> ${company.bank}</p>` : ''}
  </div>`
}
