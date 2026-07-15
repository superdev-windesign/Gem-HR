// Turso (libSQL) data layer for Windesign OS.
// Each collection is stored as a table of (id, data-JSON) rows so the whole
// workspace can be read/written as one state object while remaining queryable.
import { createClient } from '@libsql/client'

const url = process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_AUTH_TOKEN

if (!url) {
  console.error('Missing TURSO_DATABASE_URL. Create a .env file (see .env.example) and run with --env-file=.env')
  process.exit(1)
}

export const client = createClient({ url, authToken })

// Collections persisted as keyed JSON rows
export const COLLECTIONS = [
  'employees', 'timeline', 'clients', 'invoices',
  'expenses', 'payslips', 'promotions', 'documents', 'activity',
  'customPeople', 'customPayments',
]

export async function ensureSchema() {
  for (const c of COLLECTIONS) {
    await client.execute(
      `CREATE TABLE IF NOT EXISTS ${c} (id TEXT PRIMARY KEY, data TEXT NOT NULL)`
    )
  }
  await client.execute(
    `CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL)`
  )
}

export async function readState() {
  const out = {}
  for (const c of COLLECTIONS) {
    const res = await client.execute(`SELECT data FROM ${c}`)
    out[c] = res.rows.map((r) => JSON.parse(r.data))
  }
  const s = await client.execute(`SELECT data FROM settings WHERE id = 1`)
  out.settings = s.rows.length ? JSON.parse(s.rows[0].data) : null
  return out
}

export async function isSeeded() {
  const res = await client.execute(`SELECT COUNT(*) AS n FROM employees`)
  return Number(res.rows[0]?.n || 0) > 0
}

export async function writeState(state) {
  const stmts = []
  for (const c of COLLECTIONS) {
    stmts.push({ sql: `DELETE FROM ${c}`, args: [] })
    for (const item of state[c] || []) {
      stmts.push({
        sql: `INSERT INTO ${c} (id, data) VALUES (?, ?)`,
        args: [String(item.id), JSON.stringify(item)],
      })
    }
  }
  if (state.settings) {
    stmts.push({
      sql: `INSERT INTO settings (id, data) VALUES (1, ?)
            ON CONFLICT(id) DO UPDATE SET data = excluded.data`,
      args: [JSON.stringify(state.settings)],
    })
  }
  // libSQL allows up to large batches; run as a single write transaction.
  await client.batch(stmts, 'write')
}
