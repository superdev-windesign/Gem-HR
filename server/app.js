// Builds the Windesign OS Express app. Used by both the local server
// (server/index.js → app.listen) and the Vercel serverless function (api/index.js).
import express from 'express'
import cors from 'cors'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureSchema, readState, writeState } from './db.js'
import { buildSeed, buildEmpty } from '../src/lib/seed.js'
import { requireAuth, authEnabled } from './auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Run schema setup once per (cold) process, memoized.
let schemaReady
const initSchema = () => (schemaReady ||= ensureSchema())

export function createApp() {
  const app = express()
  app.use(cors())
  app.use(express.json({ limit: '15mb' }))

  const router = express.Router()

  router.get('/health', (_req, res) => res.json({ ok: true, db: 'turso', authEnabled }))

  router.get('/me', requireAuth, (req, res) => res.json({ user: req.user, authEnabled }))

  router.get('/state', requireAuth, async (_req, res) => {
    try {
      await initSchema()
      let state = await readState()
      if (!state.settings) {
        await writeState(buildEmpty())
        state = await readState()
      }
      res.json(state)
    } catch (err) {
      console.error('GET /state', err)
      res.status(500).json({ error: err.message })
    }
  })

  router.put('/state', requireAuth, async (req, res) => {
    try {
      if (!req.body || !Array.isArray(req.body.employees)) return res.status(400).json({ error: 'Invalid state payload' })
      await initSchema()
      await writeState(req.body)
      res.json({ ok: true })
    } catch (err) {
      console.error('PUT /state', err)
      res.status(500).json({ error: err.message })
    }
  })

  router.post('/seed', requireAuth, async (_req, res) => {
    try {
      await initSchema()
      await writeState(buildSeed())
      res.json({ ok: true, ...(await readState()) })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  router.post('/clear', requireAuth, async (_req, res) => {
    try {
      await initSchema()
      await writeState(buildEmpty())
      res.json({ ok: true, ...(await readState()) })
    } catch (err) {
      res.status(500).json({ error: err.message })
    }
  })

  // Mount under /api (local dev + Vercel rewrite) and at root (in case the
  // serverless platform strips the /api prefix) — both resolve the same routes.
  app.use('/api', router)
  app.use('/', router)

  // Serve the built SPA locally (npm start). On Vercel the static build is
  // served by the platform, so this branch is simply skipped.
  const dist = path.join(__dirname, '..', 'dist')
  if (fs.existsSync(dist)) {
    app.use(express.static(dist))
    app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')))
  }

  return app
}
