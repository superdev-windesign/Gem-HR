# Windesign OS — Business Operating System

A premium, single-page **Business Operating System** that combines HRMS + CRM + Finance + lightweight ERP into one workspace. Built with **React + Vite + Tailwind + Recharts**. All data lives in the browser (localStorage) with full **JSON backup & restore** — no backend required.

## Run it

```bash
npm install
npm run dev      # http://localhost:5180
npm run build    # production build
```

On first launch it seeds realistic demo data (10 employees, 4 clients, 6 invoices, 12 expenses, a promotion, activity feed). Use **Settings → Backup & Data → Reset** to reload fresh data at any time.

## Modules

| Module | Highlights |
| --- | --- |
| **Dashboard** | CEO view — revenue/expense/profit KPIs, 7 charts, recent invoices/expenses/promotions/activity, upcoming payroll |
| **Employees** | Directory with search/filter/export, auto employee IDs, 4 employment types. Profile with personal/professional/compensation tabs, **permanent timeline**, documents, payslips |
| **Document Generators** | Offer Letter, Appointment Letter, Promotion Letter, Payslip — editable, exported to **PDF & DOCX**, auto-stored in profile + timeline. Every action is independent (non-sequential workflow) |
| **Payroll** | Salary register, one-click monthly payroll run, salary ledger by cycle, payroll trend, payslip PDF/DOCX |
| **Documents** | Central repository aggregating every generated document + invoices + payslips, with type filters and search |
| **Clients** | Directory + profile with revenue, pending payments, invoice history & payment timeline. Multi-currency |
| **Invoices** | Line items, GST/international, discount + tax, 7 statuses, payment tracking, invoice timeline, PDF/DOCX/CSV export, live preview |
| **Expenses** | Add expense, 8 category groups, recurring (Monthly/Quarterly/Yearly), ledger with filters, analytics (trend, category donut, top vendors) |
| **Finance** | Unified revenue + expense + payroll view, P&L summary, cash flow report, profit margin |
| **Reports** | 9 report types (employees, payroll, promotions, invoices, revenue, expenses, clients, cash flow, activity log) → CSV / Excel / JSON / Print-PDF |
| **Settings** | Company info + logo, defaults & tax, salary structure, full **JSON backup/restore**, role-based access overview, dark/light theme |

## Cross-cutting features

- **Global search** (⌘K / Ctrl+K) across employees, clients, invoices, expenses, documents
- **Activity log** auditing every create/update/payment/document action
- **Dark & light mode**, fully responsive, premium SaaS styling
- **Export everywhere** — CSV, Excel (.xls), PDF (print), DOCX, JSON
- All entities interconnected (employee → timeline → documents → payroll; client → invoices → finance)

## Architecture

```
src/
  store/        StoreContext (all entities + actions + computed finance), ThemeContext
  lib/          format, export (csv/xls/pdf/doc/json), documents (letter/invoice HTML), seed
  components/   AppLayout, GlobalSearch, Charts, ui (Card/Modal/Table/Badge/…)
  pages/        Dashboard, Employees, EmployeeProfile, Payroll, Documents,
                Invoices, Clients, ClientProfile, Expenses, Finance, Reports, Settings
```

Data persists to `localStorage` under `windesign-os-data-v1`. Currency roll-ups to INR use illustrative FX rates in `store/StoreContext.jsx`.
