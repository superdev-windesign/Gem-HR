// Google Sign-In verification + email allowlist for the Windesign OS API.
import { OAuth2Client } from 'google-auth-library'

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || ''
const ALLOWED = (process.env.ALLOWED_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export const authEnabled = Boolean(CLIENT_ID)
const oauth = authEnabled ? new OAuth2Client(CLIENT_ID) : null

if (!authEnabled) {
  console.warn('⚠  GOOGLE_CLIENT_ID not set — API is running in OPEN mode (no login required).')
} else {
  console.log(`🔐 Google login enabled. Allowed: ${ALLOWED.length ? ALLOWED.join(', ') : 'any Google account (set ALLOWED_EMAILS to restrict)'}`)
}

export function isAllowed(email) {
  if (!ALLOWED.length) return true
  return ALLOWED.includes(String(email || '').toLowerCase())
}

// Verify a Google ID token from the Authorization: Bearer header.
export async function verifyToken(token) {
  if (!authEnabled) return { email: 'open-mode@local', name: 'Open Mode', picture: '' }
  const ticket = await oauth.verifyIdToken({ idToken: token, audience: CLIENT_ID })
  const p = ticket.getPayload()
  return { email: p.email, name: p.name, picture: p.picture, sub: p.sub, emailVerified: p.email_verified }
}

// Express middleware — protects routes when auth is enabled.
export async function requireAuth(req, res, next) {
  if (!authEnabled) {
    req.user = { email: 'open-mode@local' }
    return next()
  }
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Not authenticated' })
  try {
    const user = await verifyToken(token)
    if (!user.emailVerified) return res.status(403).json({ error: 'Email not verified' })
    if (!isAllowed(user.email)) return res.status(403).json({ error: 'access_denied', email: user.email })
    req.user = user
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
