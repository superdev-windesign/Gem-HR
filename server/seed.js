// Seed the Turso database with the Windesign OS demo dataset.
// Run: npm run seed
import { ensureSchema, writeState, readState, client } from './db.js'
import { buildSeed } from '../src/lib/seed.js'

async function main() {
  console.log('→ Ensuring schema on Turso…')
  await ensureSchema()

  console.log('→ Building seed dataset…')
  const seed = buildSeed()

  console.log('→ Writing to Turso…')
  await writeState(seed)

  const state = await readState()
  console.log('\n✓ Seed complete. Rows in Turso:')
  for (const [k, v] of Object.entries(state)) {
    if (Array.isArray(v)) console.log(`   ${k.padEnd(12)} ${v.length}`)
  }
  console.log(`   settings     ${state.settings ? '1' : '0'}`)
  await client.close()
}

main().catch((err) => {
  console.error('✗ Seed failed:', err)
  process.exit(1)
})
