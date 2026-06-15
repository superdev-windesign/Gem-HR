// Thin client for the Windesign OS API (Turso-backed, Google-auth aware).
const BASE = '/api'
const TOKEN_KEY = 'wd-auth-token'

export const getToken = () => localStorage.getItem(TOKEN_KEY) || ''
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

function authHeaders(extra = {}) {
  const t = getToken()
  return t ? { ...extra, Authorization: `Bearer ${t}` } : extra
}

export async function fetchState() {
  const res = await fetch(`${BASE}/state`, { headers: authHeaders() })
  if (res.status === 401 || res.status === 403) throw Object.assign(new Error('unauthorized'), { status: res.status })
  if (!res.ok) throw new Error(`state ${res.status}`)
  const data = await res.json()
  return data && Array.isArray(data.employees) ? data : null
}

export async function saveState(state) {
  const res = await fetch(`${BASE}/state`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(state),
  })
  if (!res.ok) throw new Error(`save ${res.status}`)
  return res.json()
}

export async function reseed() {
  const res = await fetch(`${BASE}/seed`, { method: 'POST', headers: authHeaders() })
  if (!res.ok) throw new Error(`seed ${res.status}`)
  return res.json()
}

export async function clearWorkspace() {
  const res = await fetch(`${BASE}/clear`, { method: 'POST', headers: authHeaders() })
  if (!res.ok) throw new Error(`clear ${res.status}`)
  return res.json()
}
