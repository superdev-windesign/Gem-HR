import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { setToken, getToken } from '../lib/api'

const AuthCtx = createContext(null)

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
export const AUTH_ENABLED = Boolean(GOOGLE_CLIENT_ID)
const ALLOWED = (import.meta.env.VITE_ALLOWED_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

function decodeJWT(token) {
  try {
    const payload = token.split('.')[1]
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json)))
  } catch {
    return null
  }
}

const isAllowed = (email) => !ALLOWED.length || ALLOWED.includes(String(email || '').toLowerCase())

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')

  // Restore a previous session (if the ID token is still valid).
  useEffect(() => {
    if (!AUTH_ENABLED) return
    const t = getToken()
    if (!t) return
    const p = decodeJWT(t)
    if (p && p.exp * 1000 > Date.now() && isAllowed(p.email)) {
      setUser({ email: p.email, name: p.name, picture: p.picture })
    } else {
      setToken('')
    }
  }, [])

  const login = useCallback((credential) => {
    const p = decodeJWT(credential)
    if (!p?.email) { setError('Could not read Google account.'); return }
    if (!isAllowed(p.email)) {
      setError(`Access denied for ${p.email}. This workspace is restricted.`)
      setToken('')
      return
    }
    setToken(credential)
    setUser({ email: p.email, name: p.name, picture: p.picture })
    setError('')
  }, [])

  const logout = useCallback(() => {
    setToken('')
    setUser(null)
    setError('')
  }, [])

  const value = { user, error, login, logout, authEnabled: AUTH_ENABLED, allowedList: ALLOWED, setError }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => useContext(AuthCtx)
