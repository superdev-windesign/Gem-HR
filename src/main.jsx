import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import App from './App'
import Login from './pages/Login'
import { ThemeProvider } from './store/ThemeContext'
import { StoreProvider } from './store/StoreContext'
import { AuthProvider, useAuth, AUTH_ENABLED, GOOGLE_CLIENT_ID } from './store/AuthContext'
import './index.css'

function Gate() {
  const { user, authEnabled } = useAuth()
  if (authEnabled && !user) return <Login />
  return (
    <StoreProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StoreProvider>
  )
}

function Root() {
  const tree = (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
  return AUTH_ENABLED ? <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{tree}</GoogleOAuthProvider> : tree
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  </React.StrictMode>
)
