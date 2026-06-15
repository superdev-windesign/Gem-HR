# Windesign OS — Business Operating System

A premium, single-page **Business Operating System** that combines HRMS + CRM + Finance + lightweight ERP into one workspace. Built with **React + Vite + Tailwind + Recharts**, backed by a small **Node/Express API on a Turso (libSQL) database**. The browser keeps a localStorage cache for instant load and offline resilience, with full **JSON backup & restore** in Settings.

## Setup

1. Copy `.env.example` → `.env` and fill in your Turso credentials:
   ```
   TURSO_DATABASE_URL=libsql://<your-db>.turso.io
   TURSO_AUTH_TOKEN=<your-token>
   PORT=8787
   ```
2. Install and seed:
   ```bash
   npm install
   npm run seed     # creates tables on Turso + loads demo data
   ```

## Run it (two processes)

```bash
npm run server   # API → http://localhost:8787  (talks to Turso)
npm run dev      # app → http://localhost:5180   (Vite proxies /api → 8787)
```

For a single-process production deploy:
```bash
npm run build    # outputs dist/
npm start        # Express serves the API + the built app on PORT
```

A topbar badge shows live DB status (**Turso / Syncing / Offline**). Useful data commands:

```bash
npm run seed     # load demo data (10 employees, 4 clients, 6 invoices, …)
npm run clear    # wipe all records, keep company settings — start fresh
```

You can also **Clear All Records** or **Load Demo Data** from **Settings → Backup & Data**.

## Authentication (Google / Gmail sign-in)

Access is gated by **Google Sign-In** with an email allowlist. It's optional: if `GOOGLE_CLIENT_ID` is unset the app runs in open mode (no login). To enable it:

1. Go to **[Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)** → *Create Credentials* → **OAuth client ID** → **Web application**.
2. Under **Authorized JavaScript origins** add `http://localhost:5180` (and your production URL).
3. Copy the **Client ID** into `.env` — set it in **both** places:
   ```
   GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
   VITE_GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
   ALLOWED_EMAILS=you@gmail.com,teammate@gmail.com
   VITE_ALLOWED_EMAILS=you@gmail.com,teammate@gmail.com
   ```
4. Restart `npm run server` and `npm run dev`. Only the listed Gmail accounts can sign in; the backend independently verifies every Google token and re-checks the allowlist, so the API is protected even if someone bypasses the UI. Leave `ALLOWED_EMAILS` blank to permit any Google account.

## Deploy to Vercel

The frontend (Vite → `dist`) and the API (`api/index.js`, an Express app run as a serverless function) deploy together on Vercel as one project — same origin, no CORS, no separate backend host.

1. **Push to GitHub**, then in [vercel.com/new](https://vercel.com/new) **Import** the repo. Vercel auto-detects Vite (build `vite build`, output `dist`); `vercel.json` routes `/api/*` to the function.
2. **Add Environment Variables** (Project → Settings → Environment Variables) for Production *and* Preview:
   | Name | Value |
   | --- | --- |
   | `TURSO_DATABASE_URL` | `libsql://…turso.io` |
   | `TURSO_AUTH_TOKEN` | your Turso token |
   | `GOOGLE_CLIENT_ID` | `…apps.googleusercontent.com` |
   | `ALLOWED_EMAILS` | `hr@windesign.io,jitutoc@gmail.com` |
   | `VITE_GOOGLE_CLIENT_ID` | same Client ID (inlined into the frontend at build) |
   | `VITE_ALLOWED_EMAILS` | same allowlist |
3. **Update Google OAuth origins** — in Google Cloud Console → Credentials → your Web client, add your Vercel URL (e.g. `https://gem-hr.vercel.app`) and any custom domain to **Authorized JavaScript origins**.
4. **Deploy.** Open the URL → login page → sign in with an allowed account.

> Turso is reached over its remote libSQL protocol, so it works fine from Vercel's serverless runtime. `.env` is never deployed — secrets live in Vercel's env settings. Re-deploy after changing any `VITE_` variable (those are baked in at build time).

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
server/
  db.js         Turso/libSQL client, schema, read/write state
  index.js      Express API: GET/PUT /api/state, POST /api/seed, /api/health
  seed.js       npm run seed → loads demo data into Turso
src/
  store/        StoreContext (loads from /api/state, debounced save, localStorage cache), ThemeContext
  lib/          api, format, export (csv/xls/pdf/doc/json), documents, seed
  components/   AppLayout, GlobalSearch, Charts, ui (Card/Modal/Table/Badge/…)
  pages/        Dashboard, Employees, EmployeeProfile, Payroll, Documents,
                Invoices, Clients, ClientProfile, Expenses, Finance, Reports, Settings
```

**Data model.** Each collection (employees, clients, invoices, …) is a Turso table of `(id, data-JSON)` rows; settings is a single row. The client treats `/api/state` as the source of truth and pushes the full workspace (debounced) on every change, caching locally so the UI loads instantly and survives the API being down. Currency roll-ups to INR use illustrative FX rates in `store/StoreContext.jsx`.

> **Security:** `.env` holds your Turso write token and is gitignored — never commit it. Rotate the token if it is ever exposed.
