// Seed data — gives the app a realistic populated state on first run.
import { uid } from './format'

const daysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}
const dateAgo = (n) => daysAgo(n).slice(0, 10)

function comp(ctc) {
  const basic = Math.round(ctc * 0.4 / 12)
  const hra = Math.round(basic * 0.5)
  const special = Math.round((ctc / 12) - basic - hra - 2000)
  return {
    ctc,
    basic,
    hra,
    special: Math.max(special, 0),
    other: 2000,
    bonus: Math.round(ctc * 0.05 / 12),
    pf: Math.round(basic * 0.12),
    esic: ctc < 252000 ? Math.round((ctc / 12) * 0.0075) : 0,
    tax: Math.round((ctc / 12) * 0.08),
  }
}

function emp(o) {
  return {
    id: uid('emp'),
    photo: '',
    email: '',
    mobile: '',
    address: '',
    dob: '',
    emergencyContact: '',
    location: 'Bengaluru',
    status: 'Active',
    documents: [],
    ...o,
    compensation: comp(o.ctc),
  }
}

export function buildSeed() {
  const employees = [
    emp({ empId: 'WD-001', name: 'Aarav Mehta', designation: 'Founder & CEO', department: 'Leadership', type: 'Full Time', joiningDate: '2021-03-01', manager: '', ctc: 4800000, email: 'aarav@windesign.in', mobile: '+91 98200 11111' }),
    emp({ empId: 'WD-002', name: 'Priya Sharma', designation: 'Head of Design', department: 'Design', type: 'Full Time', joiningDate: '2021-06-15', manager: 'Aarav Mehta', ctc: 2400000, email: 'priya@windesign.in', mobile: '+91 98200 22222' }),
    emp({ empId: 'WD-003', name: 'Rohan Verma', designation: 'Senior Engineer', department: 'Engineering', type: 'Full Time', joiningDate: '2022-01-10', manager: 'Aarav Mehta', ctc: 1800000, email: 'rohan@windesign.in', mobile: '+91 98200 33333' }),
    emp({ empId: 'WD-004', name: 'Sneha Iyer', designation: 'Product Designer', department: 'Design', type: 'Full Time', joiningDate: '2022-08-20', manager: 'Priya Sharma', ctc: 1200000, email: 'sneha@windesign.in', mobile: '+91 98200 44444' }),
    emp({ empId: 'WD-005', name: 'Karan Singh', designation: 'Frontend Engineer', department: 'Engineering', type: 'Full Time', joiningDate: '2023-02-01', manager: 'Rohan Verma', ctc: 1100000, email: 'karan@windesign.in', mobile: '+91 98200 55555' }),
    emp({ empId: 'WD-006', name: 'Ananya Das', designation: 'Marketing Lead', department: 'Marketing', type: 'Full Time', joiningDate: '2023-05-12', manager: 'Aarav Mehta', ctc: 1400000, email: 'ananya@windesign.in', mobile: '+91 98200 66666' }),
    emp({ empId: 'WD-007', name: 'Vikram Nair', designation: 'Design Intern', department: 'Design', type: 'Intern', joiningDate: dateAgo(120), manager: 'Sneha Iyer', ctc: 300000, email: 'vikram@windesign.in', mobile: '+91 98200 77777' }),
    emp({ empId: 'WD-008', name: 'Meera Joshi', designation: 'Content Writer', department: 'Marketing', type: 'Freelancer', joiningDate: dateAgo(90), manager: 'Ananya Das', ctc: 600000, email: 'meera@windesign.in', mobile: '+91 98200 88888' }),
    emp({ empId: 'WD-009', name: 'Arjun Reddy', designation: 'DevOps Contractor', department: 'Engineering', type: 'Contractor', joiningDate: dateAgo(200), manager: 'Rohan Verma', ctc: 1500000, email: 'arjun@windesign.in', mobile: '+91 98200 99999' }),
    emp({ empId: 'WD-010', name: 'Ishita Kapoor', designation: 'HR Manager', department: 'People', type: 'Full Time', joiningDate: '2022-11-01', manager: 'Aarav Mehta', ctc: 1300000, email: 'ishita@windesign.in', mobile: '+91 98200 10101' }),
  ]

  const empById = Object.fromEntries(employees.map((e) => [e.id, e]))

  const timeline = employees.flatMap((e) => [
    { id: uid('tl'), empId: e.id, type: 'Employee Created', date: e.joiningDate, note: `${e.name} added to the system as ${e.type}.` },
    { id: uid('tl'), empId: e.id, type: 'Appointment Letter Generated', date: e.joiningDate, note: `Appointed as ${e.designation}.` },
  ])
  // a couple of promotions
  timeline.push({ id: uid('tl'), empId: employees[3].id, type: 'Promotion', date: dateAgo(60), note: 'Promoted to Product Designer.' })

  const clients = [
    { id: uid('cl'), name: 'David Cohen', company: 'Nimbus Labs', email: 'david@nimbuslabs.io', phone: '+1 415 555 0101', country: 'USA', currency: 'USD', gst: '', taxNumber: 'EIN-84-220011', address: '500 Market St, San Francisco, CA', website: 'nimbuslabs.io', notes: 'Retainer client — monthly design ops.' },
    { id: uid('cl'), name: 'Rajesh Gupta', company: 'Lotus Retail Pvt Ltd', email: 'rajesh@lotusretail.in', phone: '+91 80 4040 1010', country: 'India', currency: 'INR', gst: '29ABCDE1234F1Z5', taxNumber: '', address: 'MG Road, Bengaluru, KA', website: 'lotusretail.in', notes: 'E-commerce revamp project.' },
    { id: uid('cl'), name: 'Sophie Laurent', company: 'Atelier Paris', email: 'sophie@atelier.fr', phone: '+33 1 42 00 00', country: 'France', currency: 'EUR', gst: '', taxNumber: 'FR-99-1122', address: '12 Rue de Rivoli, Paris', website: 'atelier.fr', notes: 'Brand identity engagement.' },
    { id: uid('cl'), name: 'Omar Farouk', company: 'Dunes Holding', email: 'omar@dunes.ae', phone: '+971 4 555 9090', country: 'UAE', currency: 'AED', gst: '', taxNumber: 'TRN-100200300', address: 'Sheikh Zayed Rd, Dubai', website: 'dunes.ae', notes: 'Web app + dashboard.' },
  ]

  const svc = (description, qty, rate) => ({ id: uid('it'), description, qty, rate })
  function invoice(o) {
    const items = o.items
    const subtotal = items.reduce((s, i) => s + i.qty * i.rate, 0)
    const discount = o.discount || 0
    const taxRate = o.taxRate ?? (o.currency === 'INR' ? 18 : 0)
    const taxAmount = Math.round(((subtotal - discount) * taxRate) / 100)
    const total = subtotal - discount + taxAmount
    return {
      id: uid('inv'),
      number: o.number,
      clientId: o.clientId,
      date: o.date,
      dueDate: o.dueDate,
      currency: o.currency,
      items,
      subtotal,
      discount,
      taxRate,
      taxAmount,
      total,
      amountPaid: o.amountPaid || 0,
      status: o.status,
      notes: o.notes || 'Thank you for your business.',
      terms: 'Payment due within 15 days of invoice date.',
      payments: o.payments || [],
      events: [{ type: 'Created', date: o.date }],
    }
  }

  const invoices = [
    invoice({ number: 'INV-2026-001', clientId: clients[0].id, currency: 'USD', date: dateAgo(70), dueDate: dateAgo(55), items: [svc('Design retainer — Jan', 1, 6000)], status: 'Paid', amountPaid: 6000, payments: [{ id: uid('pay'), date: dateAgo(58), amount: 6000, method: 'Bank Transfer' }] }),
    invoice({ number: 'INV-2026-002', clientId: clients[1].id, currency: 'INR', date: dateAgo(45), dueDate: dateAgo(30), items: [svc('E-commerce UI revamp — milestone 1', 1, 350000)], status: 'Paid', amountPaid: 413000, payments: [{ id: uid('pay'), date: dateAgo(33), amount: 413000, method: 'NEFT' }] }),
    invoice({ number: 'INV-2026-003', clientId: clients[2].id, currency: 'EUR', date: dateAgo(28), dueDate: dateAgo(13), items: [svc('Brand identity package', 1, 12000)], status: 'Partially Paid', amountPaid: 6000, payments: [{ id: uid('pay'), date: dateAgo(20), amount: 6000, method: 'Wire' }] }),
    invoice({ number: 'INV-2026-004', clientId: clients[3].id, currency: 'AED', date: dateAgo(20), dueDate: dateAgo(5), items: [svc('Web app development — sprint 1', 1, 45000)], status: 'Overdue' }),
    invoice({ number: 'INV-2026-005', clientId: clients[0].id, currency: 'USD', date: dateAgo(12), dueDate: dateAgo(-3), items: [svc('Design retainer — Feb', 1, 6000), svc('Extra dashboard screens', 4, 400)], status: 'Sent' }),
    invoice({ number: 'INV-2026-006', clientId: clients[1].id, currency: 'INR', date: dateAgo(5), dueDate: dateAgo(-10), items: [svc('Milestone 2', 1, 250000)], status: 'Draft' }),
  ]

  const expense = (o) => ({ id: uid('exp'), paymentMethod: 'Bank Transfer', notes: '', vendor: '', recurring: 'None', ...o })
  const expenses = [
    expense({ date: dateAgo(2), category: 'Office', name: 'Office Rent — June', vendor: 'Prestige Estates', amount: 180000, recurring: 'Monthly', paymentMethod: 'NEFT' }),
    expense({ date: dateAgo(3), category: 'Software & SaaS', name: 'Figma Organization', vendor: 'Figma', amount: 9600, recurring: 'Monthly', paymentMethod: 'Credit Card' }),
    expense({ date: dateAgo(3), category: 'Software & SaaS', name: 'Claude Max', vendor: 'Anthropic', amount: 8500, recurring: 'Monthly', paymentMethod: 'Credit Card' }),
    expense({ date: dateAgo(4), category: 'Software & SaaS', name: 'Framer Pro', vendor: 'Framer', amount: 3200, recurring: 'Monthly', paymentMethod: 'Credit Card' }),
    expense({ date: dateAgo(6), category: 'Software & SaaS', name: 'Cursor + ChatGPT', vendor: 'OpenAI/Cursor', amount: 4000, recurring: 'Monthly', paymentMethod: 'Credit Card' }),
    expense({ date: dateAgo(8), category: 'Office', name: 'Broadband — June', vendor: 'ACT Fibernet', amount: 2200, recurring: 'Monthly' }),
    expense({ date: dateAgo(8), category: 'Office', name: 'Electricity', vendor: 'BESCOM', amount: 14500, recurring: 'Monthly' }),
    expense({ date: dateAgo(11), category: 'Marketing', name: 'LinkedIn Ads', vendor: 'LinkedIn', amount: 65000, paymentMethod: 'Credit Card' }),
    expense({ date: dateAgo(14), category: 'Travel', name: 'Client visit — flights', vendor: 'Indigo', amount: 28000 }),
    expense({ date: dateAgo(16), category: 'Equipment', name: 'MacBook Pro M4', vendor: 'Apple', amount: 245000, paymentMethod: 'Credit Card' }),
    expense({ date: dateAgo(20), category: 'Legal & Accounting', name: 'CA retainer — Q1', vendor: 'Sharma & Co', amount: 45000, recurring: 'Quarterly' }),
    expense({ date: dateAgo(25), category: 'Marketing', name: 'Conference sponsorship', vendor: 'DesignUp', amount: 120000 }),
  ]

  const settings = {
    company: {
      name: 'Windesign Studio',
      address: 'WeWork Galaxy, Residency Road, Bengaluru 560025',
      email: 'hello@windesign.in',
      phone: '+91 80 1234 5678',
      website: 'www.windesign.in',
      gst: '29WINDS1234F1Z9',
      currency: 'INR',
      bank: 'HDFC Bank · A/C 50100123456789 · IFSC HDFC0001234',
      logo: '',
    },
    defaults: {
      probation: '3 months',
      notice: '30 days',
      taxRate: 18,
      salaryStructure: { basicPct: 40, hraPct: 50 },
    },
    invoicePrefix: 'INV-2026-',
    expenseCategories: ['Office', 'Software & SaaS', 'Employee', 'Travel', 'Marketing', 'Legal & Accounting', 'Equipment', 'Miscellaneous'],
  }

  return {
    employees,
    timeline,
    clients,
    invoices,
    expenses,
    payslips: [],
    promotions: [
      { id: uid('pr'), empId: employees[3].id, fromDesignation: 'UI Designer', toDesignation: 'Product Designer', fromSalary: 900000, toSalary: 1200000, effectiveDate: dateAgo(60), newDepartment: '', newManager: '', notes: 'Strong performance on the Nimbus project.' },
    ],
    documents: [],
    activity: [
      { id: uid('act'), type: 'Invoice Paid', message: 'Invoice INV-2026-002 marked paid (₹4,13,000)', date: daysAgo(33) },
      { id: uid('act'), type: 'Employee Added', message: 'Vikram Nair joined as Design Intern', date: daysAgo(120) },
      { id: uid('act'), type: 'Promotion Created', message: 'Sneha Iyer promoted to Product Designer', date: daysAgo(60) },
      { id: uid('act'), type: 'Expense Added', message: 'MacBook Pro M4 — ₹2,45,000', date: daysAgo(16) },
    ],
    settings,
  }
}
