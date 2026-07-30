// Professional document HTML templates (used for PDF + DOCX export & preview).
import { money, fmtDate } from './format.js'
import { LOGO_DATA_URL } from './logo.js'

// Duration/Qty may be free text (e.g. "Multiple Commissions"); treat non-numeric as 1.
export const qtyNum = (q) => {
  const n = Number(q)
  return q === '' || q == null || isNaN(n) ? 1 : n
}

// Date formatted like the reference letters: "09 April 2026"
function longDate(d) {
  const date = new Date(d)
  if (isNaN(date)) return ''
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

// Authorised-signatory block: signature image + name/title.
function signatureMark(company, title = 'Authorised Signatory') {
  const img = company?.signature
    ? `<img src="${company.signature}" alt="signature" style="height:56px;display:block;margin-bottom:2px"/>`
    : '<div style="height:48px;border-bottom:1px solid #94a3b8;width:190px;margin-bottom:6px"></div>'
  const name = company?.signatoryName ? `<b>${company.signatoryName}</b><br/>` : ''
  return `${img}${name}<span style="font-size:12px;color:#64748b">${title}${company?.name ? ', ' + company.name : ''}</span>`
}

const ICON = {
  home: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10l9-7 9 7"/><path d="M5 9v11h14V9"/></svg>',
  phone: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>',
  mail: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>',
}

// The official Windesign letterhead: black accent bars, wordmark, CIN/website,
// and a contact footer. `body` is the letter content HTML.
function letterhead(company, body) {
  const c = company || {}
  // Official brand wordmark; a custom uploaded logo overrides it.
  const logo = `<img src="${c.logo || LOGO_DATA_URL}" alt="windesign" class="lh-logo"/>`

  // The header/footer live in <thead>/<tfoot> of a wrapper table: browsers repeat
  // those on every printed page, so multi-page letters keep the letterhead.
  return `<style>
    .lh{font-family:Inter,'Helvetica Neue',Arial,sans-serif;color:#1e293b;background:#fff;max-width:800px;margin:0 auto;color-scheme:light}
    .lh *{box-sizing:border-box}
    .lh table.sheet{width:100%;border-collapse:collapse}
    .lh .bar{height:11px;background:#0a0a0a;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .lh .bar-top{width:72%;border-radius:0 3px 3px 0}
    .lh .bar-bot{width:72%;margin-left:auto;border-radius:3px 0 0 3px}
    .lh .head{display:flex;justify-content:space-between;align-items:center;padding:16px 2px 12px;border-bottom:1px solid #e2e8f0}
    .lh .lh-logo{height:34px;width:auto;display:block}
    .lh .meta{text-align:right;font-size:11.5px;color:#475569;line-height:1.75;white-space:nowrap}
    .lh .foot{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;padding:10px 2px 12px;border-top:1px solid #e2e8f0;font-size:10.5px;color:#475569;line-height:1.5}
    .lh .foot .cell{display:flex;gap:6px;align-items:flex-start}
    .lh .foot svg{flex:none;margin-top:1px}
    .lh .content{padding:22px 2px;font-size:12.5px;line-height:1.75}
    .lh h1.title{font-size:19px;font-weight:800;color:#16264a;text-align:center;margin:0;letter-spacing:.3px}
    .lh .subtitle{text-align:center;font-size:10px;letter-spacing:3.5px;color:#64748b;margin:5px 0 20px;text-transform:uppercase}
    .lh .refrow{display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0;padding-bottom:10px;margin-bottom:16px;font-size:12px}
    .lh p{margin:11px 0;text-align:justify}
    .lh table.kv{width:100%;border-collapse:collapse;margin:16px 0;font-size:12px}
    .lh table.kv td{border:1px solid #e2e8f0;padding:9px 12px}
    .lh table.kv .k{background:#f8fafc;font-weight:700;width:36%}
    .lh table.comp{width:100%;border-collapse:collapse;margin:14px 0;font-size:12px}
    .lh table.comp th,.lh table.comp td{border:1px solid #e2e8f0;padding:8px 10px;text-align:left}
    .lh table.comp th{background:#f1f5f9;font-weight:700;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .lh table.comp .r{text-align:right}
    .lh table.comp .tot{background:#f8fafc;font-weight:800;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .lh .sect{font-weight:700;color:#16264a;margin:18px 0 4px;font-size:13px}
    .lh .sign{margin-top:46px;display:flex;justify-content:space-between;page-break-inside:avoid}
    .lh ol.terms{margin:8px 0 14px;padding-left:18px}
    .lh ol.terms li{margin-bottom:9px;text-align:justify;line-height:1.7}
    .lh .ack{margin-top:26px;padding-top:16px;border-top:1px solid #e2e8f0;page-break-inside:avoid}
    .lh .ackrow{display:flex;justify-content:space-between;gap:40px;margin-top:34px}
    .lh .ackrow>div{flex:1}
    .lh .ackline{border-bottom:1px solid #94a3b8;height:34px;margin-bottom:6px}
    .lh .ackrow span{font-size:11.5px;color:#64748b}
    .lh table.kv,.lh table.comp,.lh .refrow{page-break-inside:avoid}
  </style>
  <div class="lh">
    <table class="sheet">
      <thead><tr><td>
        <div class="bar bar-top"></div>
        <div class="head">
          <div>${logo}</div>
          <div class="meta">${c.cin ? 'CIN: ' + c.cin : ''}<br/>${c.website || ''}</div>
        </div>
      </td></tr></thead>
      <tfoot><tr><td>
        <div class="foot">
          <div class="cell">${ICON.home}<span>${c.address || ''}</span></div>
          <div class="cell">${ICON.phone}<span>${c.phone || ''}</span></div>
          <div class="cell">${ICON.mail}<span>${c.email || ''}</span></div>
        </div>
        <div class="bar bar-bot"></div>
      </td></tr></tfoot>
      <tbody><tr><td><div class="content">${body}</div></td></tr></tbody>
    </table>
  </div>`
}

function kv(rows) {
  return `<table class="kv">${rows.filter(Boolean).map(([k, v]) => `<tr><td class="k">${k}</td><td class="v">${v}</td></tr>`).join('')}</table>`
}
function refRow(ref, date) {
  return `<div class="refrow"><div><b>Ref. No.:</b> ${ref}</div><div><b>Date:</b> ${longDate(date)}</div></div>`
}
function toBlock(emp) {
  return `<p>To,<br/><b>${emp.name}</b>${emp.email ? `<br/>Email: ${emp.email}` : ''}${emp.mobile ? `<br/>Mobile: ${emp.mobile}` : ''}</p>`
}
function signRow(company, rightName, rightLabel) {
  const right = rightName
    ? `<div style="text-align:right"><div style="height:48px;border-bottom:1px solid #94a3b8;width:190px;margin:0 0 6px auto"></div><span style="font-size:12px;color:#64748b">${rightName} (${rightLabel})</span></div>`
    : '<div></div>'
  return `<div class="sign"><div>${signatureMark(company)}</div>${right}</div>`
}

export function offerLetterHTML(emp, data, company) {
  const s = data.salary || {}
  const cur = company?.currency
  const year = new Date(data.date || Date.now()).getFullYear()
  const body = `
    <h1 class="title">OFFER LETTER</h1>
    <div class="subtitle">Windesign · ${data.department || emp.department}</div>
    ${refRow(data.ref || `WD/HR/OFR/${year}/${emp.empId}`, data.date || new Date())}
    ${toBlock({ name: data.candidateName || emp.name, email: emp.email, mobile: emp.mobile })}
    <p><b>Subject: Offer of Employment — ${data.role || emp.designation}</b></p>
    <p>Dear ${data.candidateName || emp.name},</p>
    <p>We are delighted to extend an offer of employment for the position of <b>${data.role || emp.designation}</b> in the <b>${data.department || emp.department}</b> department at ${company?.name || 'our company'}. Your skills and enthusiasm stood out through our selection process, and we look forward to having you on the team.</p>
    <p>The principal terms of this offer are set out below.</p>
    ${kv([
      ['Position', data.role || emp.designation],
      ['Department', data.department || emp.department],
      ['Date of Joining', longDate(data.joiningDate)],
      ['Reporting Manager', data.manager || emp.manager || '—'],
      ['Work Location', data.location || emp.location],
      ['Probation Period', data.probation || '3 months'],
      ['Notice Period', data.notice || '30 days'],
    ])}
    <div class="sect">Compensation Structure</div>
    <table class="comp">
      <tr><th>Component</th><th class="r">Monthly</th><th class="r">Annual</th></tr>
      <tr><td>Basic Salary</td><td class="r">${money(s.basic, cur)}</td><td class="r">${money(s.basic * 12, cur)}</td></tr>
      <tr><td>House Rent Allowance</td><td class="r">${money(s.hra, cur)}</td><td class="r">${money(s.hra * 12, cur)}</td></tr>
      <tr><td>Special Allowance</td><td class="r">${money(s.special, cur)}</td><td class="r">${money(s.special * 12, cur)}</td></tr>
      <tr><td>Other Allowances</td><td class="r">${money(s.other, cur)}</td><td class="r">${money(s.other * 12, cur)}</td></tr>
      <tr class="tot"><td>Total CTC</td><td class="r">${money(data.monthly, cur)}</td><td class="r">${money(data.annual, cur)}</td></tr>
    </table>
    <p>We look forward to welcoming you. Please sign and return a copy of this letter as a token of your acceptance.</p>
    ${signRow(company, data.candidateName || emp.name, 'Candidate')}`
  return letterhead(company, body)
}

// Internship offer letter — mirrors the official Windesign internship letter,
// including the ten standard terms and the acknowledgement block.
export function internshipOfferLetterHTML(emp, data, company) {
  const c = company || {}
  const year = new Date(data.date || Date.now()).getFullYear()
  const stipend = Number(data.stipend || 0)
  const stipendText = `Rs. ${stipend.toLocaleString('en-IN')} per month`
  const terms = [
    ['Stipend and payment', `A consolidated stipend of Rs. ${stipend.toLocaleString('en-IN')} per month will be paid to you, credited to your registered bank account on or before the 7th day of the following month, subject to any deductions required under applicable law. No other allowance, reimbursement or benefit is payable unless approved in writing by the Company.`],
    ['Nature of engagement', 'This is a fixed-term internship undertaken for the purpose of training and practical exposure. It does not constitute an offer of employment, and you will not be treated as an employee of the Company for any purpose during the internship period.'],
    ['Attendance and conduct', "You are expected to observe the working hours stated above and to comply with the Company's policies on conduct, attendance, information security and workplace behaviour, as communicated from time to time."],
    ['Confidentiality', 'You shall keep confidential all proprietary information, source code, client data, designs, business plans and other non-public information accessed during the internship, and shall not disclose or use the same for any purpose other than performing your assigned work. This obligation survives the completion or termination of the internship.'],
    ['Intellectual property', 'All work product, code, designs, documentation and other deliverables created by you in the course of the internship shall vest exclusively with the Company, and you assign all rights, title and interest therein to the Company.'],
    ['Termination', "Either party may terminate this internship by giving 15 days' prior written notice. The Company may terminate the internship with immediate effect in the event of misconduct, breach of confidentiality, unsatisfactory performance or unauthorised absence."],
    ['Completion certificate', 'On successful completion of the internship period, and subject to satisfactory performance and conduct, you will be issued an Internship Completion Certificate.'],
    ['Future employment', "Depending on your performance during the internship and the Company's business requirements at the relevant time, you may be considered for a full-time role. Such consideration is at the Company's sole discretion and is not assured by this letter."],
    ['Documentation', 'You are required to submit copies of your government-issued photo identification, address proof, educational certificates and two passport-size photographs on or before your date of joining.'],
    ['Governing law', 'This letter shall be governed by the laws of India, and the courts at Nagpur, Maharashtra shall have exclusive jurisdiction over any dispute arising out of it.'],
  ]
  const body = `
    <h1 class="title">INTERNSHIP OFFER LETTER</h1>
    <div class="subtitle">Windesign · ${data.department || emp.department}</div>
    ${refRow(data.ref || `WD/HR/INT/${year}/${emp.empId}`, data.date || new Date())}
    ${toBlock({ name: data.candidateName || emp.name, email: emp.email, mobile: emp.mobile })}
    <p><b>Subject: Offer of Internship — ${data.role || emp.designation}</b></p>
    <p>Dear ${(data.candidateName || emp.name).split(' ')[0]},</p>
    <p>Further to our discussions and your interest in joining us, we are delighted to offer you an internship with ${c.name || 'Windesign'} in the position of <b>${data.role || emp.designation}</b> within the ${data.department || emp.department} department. Your technical aptitude and enthusiasm stood out through our selection process, and we look forward to having you contribute to our product team.</p>
    <p>The principal terms of this internship are set out below.</p>
    ${kv([
      ['Position', data.role || emp.designation],
      ['Department', data.department || emp.department],
      ['Date of Joining', longDate(data.joiningDate || emp.joiningDate)],
      ['Duration', data.duration || '6 months from the date of joining'],
      ['Reporting Manager', data.manager || emp.manager || '—'],
      ['Work Location', data.location || emp.location],
      ['Working Days', data.workingDays || 'Monday to Friday, 10:00 AM to 7:00 PM'],
      ['Stipend', stipendText],
    ])}
    <div class="sect">Terms and Conditions</div>
    <ol class="terms">
      ${terms.map(([h, t]) => `<li><b>${h}.</b> ${t}</li>`).join('')}
    </ol>
    <p>Please confirm your acceptance by signing the acknowledgement below and returning a scanned copy of this letter to ${c.email || ''} within seven (7) days of receipt. Should you have any questions, please feel free to reach out to us.</p>
    <p>We look forward to welcoming you to the team.</p>
    <p style="margin-bottom:0">Warm regards,</p>
    <div style="margin-top:6px">${signatureMark(company, c.signatoryTitle || 'Founder & Director')}</div>
    <div class="ack">
      <div class="sect" style="margin-top:0">Acknowledgement and Acceptance</div>
      <p>I, <b>${data.candidateName || emp.name}</b>, have read and understood the terms and conditions set out in this letter and accept the internship offered to me on the terms stated herein. I confirm that I will report for joining on the date mentioned above.</p>
      <div class="ackrow">
        <div><div class="ackline"></div><span>Signature of Candidate</span></div>
        <div><div class="ackline"></div><span>Date</span></div>
      </div>
    </div>`
  return letterhead(company, body)
}

export function appointmentLetterHTML(emp, data, company) {
  const year = new Date(data.date || Date.now()).getFullYear()
  const body = `
    <h1 class="title">APPOINTMENT LETTER</h1>
    <div class="subtitle">Windesign · ${data.department || emp.department}</div>
    ${refRow(data.ref || `WD/HR/APT/${year}/${emp.empId}`, data.date || new Date())}
    ${toBlock(emp)}
    <p><b>Subject: Appointment as ${data.role || emp.designation}</b></p>
    <p>Dear ${emp.name},</p>
    <p>With reference to your acceptance of our offer, we are pleased to confirm your appointment as <b>${data.role || emp.designation}</b> in the <b>${data.department || emp.department}</b> department, effective <b>${longDate(data.joiningDate || emp.joiningDate)}</b>.</p>
    ${kv([
      ['Employee ID', emp.empId],
      ['Designation', data.role || emp.designation],
      ['Department', data.department || emp.department],
      ['Reporting Manager', data.manager || emp.manager || '—'],
      ['Work Location', data.location || emp.location],
      ['Employment Type', emp.type],
      ['Annual CTC', money(emp.compensation?.ctc, company?.currency)],
    ])}
    <p>Your employment will be governed by the company's policies as amended from time to time. We welcome you aboard and wish you a long and successful career with us.</p>
    ${signRow(company, emp.name, 'Employee')}`
  return letterhead(company, body)
}

export function promotionLetterHTML(emp, promo, company) {
  const cur = company?.currency
  const year = new Date(promo.effectiveDate || Date.now()).getFullYear()
  const body = `
    <h1 class="title">PROMOTION LETTER</h1>
    <div class="subtitle">Windesign · ${promo.newDepartment || emp.department}</div>
    ${refRow(`WD/HR/PRM/${year}/${emp.empId}`, promo.effectiveDate || new Date())}
    ${toBlock(emp)}
    <p><b>Subject: Promotion to ${promo.toDesignation}</b></p>
    <p>Dear ${emp.name},</p>
    <p>In recognition of your contribution and performance, we are pleased to promote you from <b>${promo.fromDesignation}</b> to <b>${promo.toDesignation}</b>, effective <b>${longDate(promo.effectiveDate)}</b>.</p>
    <table class="comp">
      <tr><th></th><th>Previous</th><th>Revised</th></tr>
      <tr><td>Designation</td><td>${promo.fromDesignation}</td><td>${promo.toDesignation}</td></tr>
      <tr><td>Annual Salary</td><td>${money(promo.fromSalary, cur)}</td><td>${money(promo.toSalary, cur)}</td></tr>
      ${promo.newDepartment ? `<tr><td>Department</td><td>${emp.department}</td><td>${promo.newDepartment}</td></tr>` : ''}
      ${promo.newManager ? `<tr><td>Manager</td><td>${emp.manager || '—'}</td><td>${promo.newManager}</td></tr>` : ''}
    </table>
    ${promo.notes ? `<p>${promo.notes}</p>` : ''}
    <p>Congratulations on your well-deserved promotion. We look forward to your continued success.</p>
    ${signRow(company)}`
  return letterhead(company, body)
}

// Payslip modeled on the provided sample (centered header, earnings/deductions tables).
export function payslipHTML(emp, slip, company) {
  const e = slip.earnings || {}, d = slip.deductions || {}
  const amt = (n) => Number(n || 0).toLocaleString('en-IN')
  const c = company || {}

  const earnRows = [
    ['Basic Pay', e.basic],
    ['Incentive Pay', e.bonus],
    ['House Rent Allowance', e.hra],
    ['Meal Allowance', Number(e.special || 0) + Number(e.other || 0)],
  ]
  const dedRows = [
    ['Provident Fund', d.pf],
    ['Professional Tax', d.tax],
    ...(Number(d.esic || 0) > 0 ? [['ESIC', d.esic]] : []),
    ['Loan', slip.loan || 0],
  ]
  const totalEarn = earnRows.reduce((s, [, v]) => s + Number(v || 0), 0)
  const totalDed = dedRows.reduce((s, [, v]) => s + Number(v || 0), 0)
  const net = totalEarn - totalDed

  const pad = (rows, to) => {
    const r = rows.slice()
    while (r.length < to) r.push(['', ''])
    return r
  }
  const eRows = pad(earnRows, 5).map(([k, v]) => `<tr><td>${k}</td><td class="r">${k ? amt(v) : ''}</td></tr>`).join('')
  const dRows = pad(dedRows, 4).map(([k, v]) => `<tr><td>${k}</td><td class="r">${k ? amt(v) : ''}</td></tr>`).join('')

  return `<style>
    .ps{font-family:'Times New Roman',Georgia,serif;color:#111;max-width:720px;margin:0 auto;padding:8px 20px}
    .ps h1{text-align:center;font-size:22px;font-weight:600;margin:0 0 8px}
    .ps .co{text-align:center;font-weight:700;font-size:15px;line-height:1.4}
    .ps .addr{text-align:center;font-size:13px;margin:4px 0 18px}
    .ps .meta{display:flex;justify-content:space-between;font-size:13px;margin-bottom:18px;gap:30px}
    .ps .meta .col{flex:1}
    .ps .meta .row{display:flex;margin-bottom:4px}
    .ps .meta .lbl{width:130px;color:#111}
    .ps table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:16px}
    .ps th,.ps td{border:1px solid #333;padding:6px 10px}
    .ps th{background:#d9d9d9;font-weight:700;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .ps td.r,.ps th.r{text-align:right}
    .ps .tot td{font-weight:700}
    .ps .sign{display:flex;justify-content:space-between;margin-top:44px;font-size:13px}
    .ps .sign .line{border-top:1px solid #111;width:230px;margin-top:44px}
    .ps .note{text-align:center;font-size:13px;margin-top:36px}
  </style>
  <div class="ps">
    <h1>Pay slip</h1>
    <div class="co">${c.legalName || c.name || ''}</div>
    <div class="addr">${c.address || ''}</div>
    <div class="meta">
      <div class="col">
        <div class="row"><span class="lbl">Date of Joining</span><span>: ${emp.joiningDate || '—'}</span></div>
        <div class="row"><span class="lbl">Pay Period</span><span>: ${slip.periodLabel || slip.monthLabel}</span></div>
        <div class="row"><span class="lbl">Worked Days</span><span>&nbsp;&nbsp;${slip.workedDays ?? 26}</span></div>
      </div>
      <div class="col">
        <div class="row"><span class="lbl">Employee Name</span><span>: ${emp.name}</span></div>
        <div class="row"><span class="lbl">Designation</span><span>: ${emp.designation || '—'}</span></div>
        <div class="row"><span class="lbl">Department</span><span>: ${emp.department || '—'}</span></div>
      </div>
    </div>
    <table>
      <tr><th>Earnings</th><th class="r">Amount</th></tr>
      ${eRows}
      <tr class="tot"><td class="r">Total Earnings</td><td class="r">${amt(totalEarn)}</td></tr>
    </table>
    <table>
      <tr><th>Deductions</th><th class="r">Amount</th></tr>
      ${dRows}
      <tr class="tot"><td class="r">Total Deductions</td><td class="r">${amt(totalDed)}</td></tr>
      <tr class="tot"><td class="r">Net Pay</td><td class="r">${amt(net)}</td></tr>
    </table>
    <div class="sign">
      <div>Employer Signature${c.signature ? `<br/><img src="${c.signature}" style="height:52px;margin-top:6px"/>` : '<div class="line"></div>'}</div>
      <div style="text-align:right">Employee Signature<div class="line"></div></div>
    </div>
    <div class="note">This is system generated pay slip</div>
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
        <img src="${company?.logo || LOGO_DATA_URL}" alt="windesign" style="height:30px;display:block;margin-bottom:8px"/>
        <div class="title" style="font-size:15px;color:#1e293b">${company?.name || 'Windesign'}</div>
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
