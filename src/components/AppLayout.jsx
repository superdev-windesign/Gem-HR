import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import ErrorBoundary from './ErrorBoundary'
import {
  LayoutDashboard, Users, Wallet, FileText, Receipt, Building2, CreditCard,
  BarChart3, Settings, Search, Moon, Sun, Menu, X, TrendingUp, Bell, LogOut, Command,
} from 'lucide-react'
import { useTheme } from '../store/ThemeContext'
import { useStore } from '../store/StoreContext'
import { useAuth } from '../store/AuthContext'
import GlobalSearch from './GlobalSearch'
import { Avatar } from './ui'
import { relativeTime } from '../lib/format'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/payroll', label: 'Payroll', icon: Wallet },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/invoices', label: 'Invoices', icon: Receipt },
  { to: '/clients', label: 'Clients', icon: Building2 },
  { to: '/expenses', label: 'Expenses', icon: CreditCard },
  { to: '/finance', label: 'Finance', icon: TrendingUp },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <div className="grid place-items-center h-9 w-9 rounded-xl bg-brand-600 text-white font-extrabold">W</div>
      <div className="leading-tight">
        <p className="font-extrabold text-slate-900 dark:text-white">Windesign OS</p>
        <p className="text-[10px] uppercase tracking-widest text-slate-400">Business OS</p>
      </div>
    </div>
  )
}

export default function AppLayout() {
  const { theme, toggle } = useTheme()
  const { settings, activity, status } = useStore()
  const { user, logout, authEnabled } = useAuth()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const nav = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const SidebarInner = (
    <>
      <div className="h-16 flex items-center justify-between pr-2">
        <Logo />
        <button className="lg:hidden btn-ghost !p-1.5" onClick={() => setMobileNav(false)}>
          <X size={18} />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto py-2">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            onClick={() => setMobileNav(false)}
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            <n.icon size={18} />
            {n.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
        <div className="flex items-center gap-3 px-2 py-2">
          {user?.picture ? (
            <img src={user.picture} alt={user.name} className="h-9 w-9 rounded-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <Avatar name={user?.name || settings.company.name} size={36} />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{user?.name || settings.company.name}</p>
            <p className="text-xs text-slate-400 truncate">{user?.email || 'Admin · CEO'}</p>
          </div>
          {authEnabled && user && (
            <button onClick={logout} className="btn-ghost !p-1.5" title="Sign out"><LogOut size={16} /></button>
          )}
        </div>
      </div>
    </>
  )

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sticky top-0 h-screen">
        {SidebarInner}
      </aside>

      {/* Mobile sidebar */}
      {mobileNav && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setMobileNav(false)} />
          <aside className="relative flex flex-col w-64 h-full bg-white dark:bg-slate-900 px-3">{SidebarInner}</aside>
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="h-16 sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
          <button className="lg:hidden btn-ghost !p-2" onClick={() => setMobileNav(true)}>
            <Menu size={20} />
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 flex-1 max-w-md rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm text-slate-400 hover:border-brand-400 transition"
          >
            <Search size={16} />
            <span className="flex-1 text-left">Search anything…</span>
            <kbd className="hidden sm:flex items-center gap-0.5 text-[10px] font-semibold border border-slate-300 dark:border-slate-600 rounded px-1.5 py-0.5">
              <Command size={10} /> K
            </kbd>
          </button>
          <div className="flex-1" />
          <span className="hidden sm:flex items-center gap-1.5 chip bg-slate-100 dark:bg-slate-800 text-slate-500" title={`Turso database — ${status}`}>
            <span className={`h-2 w-2 rounded-full ${status === 'online' ? 'bg-emerald-500' : status === 'offline' ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'}`} />
            {status === 'online' ? 'Turso' : status === 'offline' ? 'Offline' : 'Syncing'}
          </span>
          <div className="relative">
            <button className="btn-ghost !p-2 relative" onClick={() => setNotifOpen((o) => !o)}>
              <Bell size={19} />
              {activity.length > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500" />}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 card !p-0 z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 font-semibold text-sm">Recent Activity</div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                    {activity.slice(0, 12).map((a) => (
                      <div key={a.id} className="px-4 py-2.5">
                        <p className="text-sm text-slate-700 dark:text-slate-200">{a.message}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{a.type} · {relativeTime(a.date)}</p>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { setNotifOpen(false); nav('/reports') }} className="w-full px-4 py-2.5 text-sm font-semibold text-brand-600 hover:bg-slate-50 dark:hover:bg-slate-800 border-t border-slate-200 dark:border-slate-800">
                    View activity log
                  </button>
                </div>
              </>
            )}
          </div>
          <button className="btn-ghost !p-2" onClick={toggle} title="Toggle theme">
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto">
          <ErrorBoundary key={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
