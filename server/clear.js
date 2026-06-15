// Wipe all business records from Turso, keeping company/tax defaults.
// Run: npm run clear
import { ensureSchema, writeState, readState, client } from './db.js'
import { buildEmpty } from '../src/lib/seed.js'

async function main() {
  console.log('→ Clearing workspace on Turso…')
  await ensureSchema()
  await writeState(buildEmpty())
  const state = await readState()
  console.log('\n✓ Workspace cleared. Rows in Turso:')
  for (const [k, v] of Object.entries(state)) {
    if (Array.isArray(v)) console.log(`   ${k.padEnd(12)} ${v.length}`)
  }
  console.log('\nYou can now add fresh employees, clients and invoices.')
  await client.close()
}

main().catch((err) => {
  console.error('✗ Clear failed:', err)
  process.exit(1)
})
