import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { LayoutDashboard, Package, LogOut, Menu, Truck, Sun, Moon } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import '@/admin/admin.css'

const routeLabels: Record<string, string> = {
  '/driver/dashboard': 'Tableau de bord',
  '/driver/orders': 'Mes livraisons',
}

function getDriverUser() {
  try { return JSON.parse(localStorage.getItem('smartfood_user') || '{}') } catch { return {} }
}

export function DriverLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggle: toggleTheme } = useTheme()
  const driver = getDriverUser()

  const initials = driver
    ? `${driver.firstName?.charAt(0) ?? ''}${driver.lastName?.charAt(0) ?? ''}`.toUpperCase()
    : 'LV'
  const displayName = driver
    ? `${driver.firstName ?? ''} ${driver.lastName ?? ''}`.trim()
    : 'Livreur'

  const handleLogout = () => {
    localStorage.removeItem('smartfood_user')
    navigate('/login')
  }

  const navItems = [
    { path: '/driver/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { path: '/driver/orders',    label: 'Mes livraisons',   icon: Package },
  ]

  const pageTitle = routeLabels[location.pathname] ?? 'Espace Livreur'

  return (
    <div className="admin-root flex h-screen bg-orbit-bg overflow-hidden">
      <div className="orbit-glow-bg" />

      {/* ── Sidebar ── */}
      <aside
        style={{ width: collapsed ? 72 : 240, transition: 'width 0.25s ease' }}
        className="fixed left-0 top-0 h-screen bg-orbit-surface border-r border-orbit-border flex flex-col z-40 overflow-hidden flex-shrink-0"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-orbit-border">
          <div className="w-8 h-8 rounded-lg bg-orbit-accent flex items-center justify-center flex-shrink-0 shadow-lg">
            <Truck className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-slate-100 font-semibold text-base tracking-tight whitespace-nowrap">
              Espace Livreur
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative group
                ${isActive
                  ? 'bg-orbit-accent/15 text-orbit-accent-light'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-orbit-accent rounded-r-full" />
                  )}
                  <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom user info */}
        <div className="border-t border-orbit-border p-3">
          <div className={`flex items-center gap-3 p-2 rounded-lg ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orbit-accent to-orbit-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{displayName}</p>
                <p className="text-xs text-orbit-accent-light truncate">Livreur</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div
        style={{ marginLeft: collapsed ? 72 : 240, transition: 'margin-left 0.25s ease' }}
        className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden"
      >
        {/* Topbar */}
        <header className="h-16 border-b border-orbit-border bg-orbit-surface/80 backdrop-blur-xl flex items-center px-6 gap-4 flex-shrink-0 z-30">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Livreur</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-200 font-medium">{pageTitle}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {/* Dark / Light toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Role badge */}
            <span className="text-xs px-2.5 py-1 rounded-full bg-orbit-accent/15 text-orbit-accent-light font-semibold border border-orbit-accent/20">
              LIVREUR
            </span>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 min-h-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
