// Professional document HTML templates (used for PDF + DOCX export & preview).
import { money, fmtDate } from './format.js'

// Duration/Qty may be free text (e.g. "Multiple Commissions"); treat non-numeric as 1.
export const qtyNum = (q) => {
  const n = Number(q)
  return q === '' || q == null || isNaN(n) ? 1 : n
}

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
    <div class="muted right">${company?.website || ''}<br/>${(company?.gstin || company?.gst) ? 'GSTIN: ' + (company.gstin || company.gst) : ''}</div>
  </div>`
}

// Authorised-signatory block: signature image (if uploaded) + name/title.
function signatureMark(company, title = 'Authorised Signatory') {
  const img = company?.signature
    ? `<img src="${company.signature}" alt="signature" style="height:54px;display:block;margin-bottom:2px"/>`
    : '<div style="height:46px;border-bottom:1px solid #94a3b8;width:180px;margin-bottom:6px"></div>'
  const name = company?.signatoryName ? `<b>${company.signatoryName}</b><br/>` : ''
  return `${img}${name}<span style="font-size:12px;color:#64748b">${title}${company?.name ? ', ' + company.name : ''}</span>`
}

// Date formatted like the reference invoices: "09 April 2026"
function longDate(d) {
  const date = new Date(d)
  if (isNaN(date)) return ''
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
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
    <div class="sign"><div>${signatureMark(company)}</div><div><div style="height:46px;border-bottom:1px solid #94a3b8;width:180px;margin-bottom:6px"></div><span style="font-size:12px;color:#64748b">${data.candidateName || emp.name} (Candidate)</span></div></div>
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
    <div class="sign"><div>${signatureMark(company)}</div><div><div style="height:46px;border-bottom:1px solid #94a3b8;width:180px;margin-bottom:6px"></div><span style="font-size:12px;color:#64748b">${emp.name} (Employee)</span></div></div>
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
    <div class="sign"><div>${signatureMark(company)}</div><div></div></div>
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
    <div class="sign"><div></div><div style="text-align:right">${signatureMark(company)}</div></div>
  </div>`
}

// Resolve the GST/export split for an invoice, with safe fallbacks so previews
// work even before the editor has stored the computed breakdown.
export function computeInvoiceTax(inv, client, company) {
  const type = inv.type || ((client?.country || '').toLowerCase() === 'india' ? 'gst' : 'export')
  const subtotal = inv.subtotal ?? (inv.items || []).reduce((s, i) => s + qtyNum(i.qty) * Number(i.rate || 0), 0)
  const discount = Number(inv.discount || 0)
  const taxable = subtotal - discount
  const rate = Number(inv.taxRate ?? company?.defaults?.gstRate ?? 18)

  // State code drives intra (CGST+SGST) vs inter (IGST). Derive from GSTIN
  // (first 2 digits) when not set explicitly.
  const stateOf = (entity, gstin) => (entity?.stateCode || String(gstin || '').slice(0, 2)).trim()
  let cgst = 0, sgst = 0, igst = 0
  if (type === 'gst') {
    const providerState = stateOf(company, company?.gstin || company?.gst)
    const clientState = stateOf(client, client?.gst)
    const interState = providerState && clientState && providerState !== clientState
    if (inv.cgst != null || inv.sgst != null || inv.igst != null) {
      cgst = Number(inv.cgst || 0); sgst = Number(inv.sgst || 0); igst = Number(inv.igst || 0)
    } else if (interState) {
      igst = Math.round((taxable * rate) / 100)
    } else {
      cgst = Math.round((taxable * rate) / 200)
      sgst = Math.round((taxable * rate) / 200)
    }
  }
  const taxAmount = cgst + sgst + igst
  const total = inv.total ?? taxable + taxAmount
  return { type, subtotal, discount, taxable, rate, cgst, sgst, igst, taxAmount, total, interState: igst > 0 }
}

export function invoiceHTML(inv, client, company) {
  const t = computeInvoiceTax(inv, client, company)
  const isGST = t.type === 'gst'
  const cur = inv.currency || (isGST ? 'INR' : 'USD')
  const bank = company?.bank || {}
  const accent = '#1f47f5'

  const field = (label, value) =>
    value ? `<div style="margin-bottom:6px"><div style="font-size:9px;text-transform:uppercase;letter-spacing:.5px;color:#94a3b8">${label}</div><div style="font-size:12px;color:#1e293b;font-weight:600">${value}</div></div>` : ''

  const rows = (inv.items || [])
    .map(
      (it, i) => `<tr>
        <td style="text-align:center">${i + 1}</td>
        <td><b>${it.description || ''}</b>${it.note ? `<div style="font-size:11px;color:#64748b">${it.note}</div>` : ''}</td>
        <td style="text-align:center">${it.qty}</td>
        <td style="text-align:right">${money(it.rate, cur, { decimals: isGST ? 0 : 2 })}</td>
        <td style="text-align:right">${money(qtyNum(it.qty) * Number(it.rate || 0), cur, { decimals: isGST ? 0 : 2 })}</td>
      </tr>`
    )
    .join('')

  const taxRows = isGST
    ? `<tr><td colspan="4" style="text-align:right;border:none">Taxable Value</td><td style="text-align:right">${money(t.taxable, cur)}</td></tr>
       ${t.interState
        ? `<tr><td colspan="4" style="text-align:right;border:none">IGST ${t.rate}%</td><td style="text-align:right">${money(t.igst, cur)}</td></tr>`
        : `<tr><td colspan="4" style="text-align:right;border:none">CGST ${t.rate / 2}%</td><td style="text-align:right">${money(t.cgst, cur)}</td></tr>
           <tr><td colspan="4" style="text-align:right;border:none">SGST ${t.rate / 2}%</td><td style="text-align:right">${money(t.sgst, cur)}</td></tr>`}`
    : ''

  return `<style>
    .inv{font-family:Inter,Arial,sans-serif;color:#1e293b;max-width:780px;margin:0 auto;font-size:12px}
    .inv .title{font-size:20px;font-weight:800;color:${accent}}
    .inv .tag{display:inline-block;margin-top:4px;background:${accent};color:#fff;padding:3px 12px;border-radius:6px;font-size:11px;font-weight:700;letter-spacing:.5px}
    .inv .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid ${accent};padding-bottom:14px;margin-bottom:16px}
    .inv .grid2{display:flex;gap:24px;margin:14px 0}
    .inv .box{flex:1;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px}
    .inv .box h4{margin:0 0 8px;font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:${accent}}
    .inv table.items{width:100%;border-collapse:collapse;margin-top:8px}
    .inv table.items th{background:${accent};color:#fff;padding:8px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.4px;text-align:left}
    .inv table.items td{border-bottom:1px solid #eef2f7;padding:9px 10px;vertical-align:top}
    .inv table.tot{width:280px;margin-left:auto;border-collapse:collapse;margin-top:10px}
    .inv table.tot td{padding:6px 10px;font-size:12px}
    .inv .grand{background:#eef4ff;font-weight:800;font-size:14px}
    .inv .meta div{margin-bottom:4px}
    .inv .muted{color:#64748b}
    .inv .sign{display:flex;justify-content:space-between;align-items:flex-end;margin-top:36px}
  </style>
  <div class="inv">
    <div class="top">
      <div>
        ${company?.logo ? `<img src="${company.logo}" style="max-height:46px;margin-bottom:6px"/>` : ''}
        <div class="title">${company?.name || 'Windesign'}</div>
        <div class="muted" style="max-width:300px;margin-top:4px">${company?.address || ''}</div>
        <div class="tag">${isGST ? 'GST INVOICE' : 'EXPORT INVOICE'}</div>
      </div>
      <div class="meta" style="text-align:right;font-size:12px">
        <div style="font-size:15px;font-weight:800">Invoice for design services</div>
        <div style="margin-top:6px"><span class="muted">Invoice No: </span><b>${inv.number}</b></div>
        <div><span class="muted">Date: </span><b>${longDate(inv.date)}</b></div>
        ${isGST && company?.cin ? `<div class="muted">CIN: ${company.cin}</div>` : ''}
        <div class="muted">Reverse charge: ${inv.reverseCharge || 'No'}</div>
        <div class="muted">Mode of Transport: ${inv.modeOfTransport || 'Digital'}</div>
      </div>
    </div>

    <div class="grid2">
      <div class="box">
        <h4>Billed By (Provider)</h4>
        ${field('Name', company?.name)}
        ${field('Address', company?.address)}
        ${field('GSTIN', company?.gstin || company?.gst)}
        ${field('Email', company?.email)}
        ${field('Mobile', company?.phone)}
        ${field('Web', company?.website)}
      </div>
      <div class="box">
        <h4>Billed To (Customer)</h4>
        ${field('Name', client?.company || client?.name)}
        ${field('Address', client?.address)}
        ${field('Country', client?.country)}
        ${isGST ? field('GSTIN', client?.gst) : field('Reg. / ROC / Tax No', client?.taxNumber)}
        ${field('Email', client?.email)}
      </div>
    </div>

    <table class="items">
      <thead><tr><th style="width:34px;text-align:center">Sr</th><th>Service Name</th><th style="width:90px;text-align:center">Duration / Qty</th><th style="width:110px;text-align:right">Rate</th><th style="width:120px;text-align:right">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <table class="tot">
      ${isGST ? taxRows : `<tr><td style="text-align:right;border:none">Subtotal</td><td style="text-align:right">${money(t.subtotal, cur, { decimals: 2 })}</td></tr>`}
      ${inv.discount ? `<tr><td style="text-align:right;border:none">Discount</td><td style="text-align:right">− ${money(inv.discount, cur)}</td></tr>` : ''}
      <tr class="grand"><td>Total Amount${isGST ? '' : ` (${cur})`}</td><td style="text-align:right">${money(t.total, cur, { decimals: isGST ? 0 : 2 })}</td></tr>
      ${inv.amountPaid ? `<tr><td style="text-align:right;border:none">Paid</td><td style="text-align:right">${money(inv.amountPaid, cur)}</td></tr><tr class="grand"><td>Balance Due</td><td style="text-align:right">${money(t.total - inv.amountPaid, cur)}</td></tr>` : ''}
    </table>

    <p class="muted" style="margin-top:14px">Declaration: The particulars given above are true and correct.</p>

    <div class="grid2">
      <div class="box">
        <h4>Bank Details</h4>
        <div class="muted" style="font-size:11px">${company?.defaults?.paymentTerms || 'Payment within 15 days via money transfer only to the following account'}</div>
        <div style="margin-top:8px;font-size:12px;line-height:1.8">
          <div><b>Name:</b> ${bank.accountName || company?.legalName || ''}</div>
          <div><b>Account number:</b> ${bank.accountNumber || ''}</div>
          <div><b>IFSC:</b> ${bank.ifsc || ''} &nbsp; <b>SWIFT:</b> ${bank.swift || ''}</div>
          <div><b>Bank:</b> ${bank.bankName || ''}</div>
          <div><b>Branch:</b> ${bank.branch || ''}</div>
        </div>
      </div>
      <div class="box" style="display:flex;flex-direction:column;justify-content:flex-end">
        ${inv.notes ? `<div class="muted" style="margin-bottom:auto"><b>Notes:</b> ${inv.notes}</div>` : ''}
        <div style="text-align:right;margin-top:20px">${signatureMark(company)}</div>
      </div>
    </div>
  </div>`
}
