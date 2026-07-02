import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { LayoutDashboard, Package, LogOut, Menu, X, Truck } from 'lucide-react'
import '@/admin/admin.css'

function getDriverUser() {
  try {
    const s = localStorage.getItem('smartfood_user')
    return s ? JSON.parse(s) : null
  } catch { return null }
}

export function DriverLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const driver = getDriverUser()

  const initials = driver
    ? `${driver.firstName?.charAt(0) ?? ''}${driver.lastName?.charAt(0) ?? ''}`.toUpperCase()
    : 'LV'
  const displayName = driver ? `${driver.firstName ?? ''} ${driver.lastName ?? ''}`.trim() : 'Livreur'

  const handleLogout = () => {
    localStorage.removeItem('smartfood_user')
    navigate('/login')
  }

  const navItems = [
    { path: '/driver/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { path: '/driver/orders',    label: 'Mes livraisons',   icon: Package },
  ]

  return (
    <div className="admin-root flex h-screen bg-orbit-bg overflow-hidden">
      {/* Glow background */}
      <div className="orbit-glow-bg" />

      {/* ── Sidebar ── */}
      <aside
        style={{ width: collapsed ? 72 : 256, transition: 'width 0.25s ease' }}
        className="fixed left-0 top-0 h-screen bg-orbit-surface border-r border-orbit-border flex flex-col z-40 overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-orbit-border">
          <div className="w-8 h-8 rounded-lg bg-orbit-accent flex items-center justify-center flex-shrink-0">
            <Truck className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-slate-100 font-semibold text-lg tracking-tight whitespace-nowrap">
              Espace Livreur
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                ${isActive
                  ? 'bg-orbit-accent/15 text-orbit-accent-light'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`
              }
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-orbit-border p-3">
          <div className="flex items-center gap-3 p-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orbit-accent to-orbit-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">{displayName}</p>
                <p className="text-xs text-slate-500 truncate">Livreur</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Déconnexion"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div
        style={{ marginLeft: collapsed ? 72 : 256, transition: 'margin-left 0.25s ease' }}
        className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden"
      >
        {/* Topbar */}
        <header className="h-16 border-b border-orbit-border bg-orbit-surface/80 backdrop-blur-xl flex items-center px-6 gap-4 flex-shrink-0">
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Livreur</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-200 font-medium">{displayName}</span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs px-2.5 py-1 rounded-full bg-orbit-accent/15 text-orbit-accent-light font-semibold">
              LIVREUR
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
