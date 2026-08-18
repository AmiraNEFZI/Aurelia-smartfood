import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Package, LogOut, Menu, Truck, Sun, Moon, X } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'
import '@/admin/admin.css'

const routeLabels: Record<string, string> = {
  '/driver/dashboard': 'Tableau de bord',
  '/driver/orders':    'Mes livraisons',
}

function getDriverUser() {
  try { return JSON.parse(localStorage.getItem('smartfood_user') || '{}') } catch { return {} }
}

/** Détecte si l'écran est mobile (< 768px) */
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

export function DriverLayout() {
  const isMobile = useIsMobile()
  // Desktop : collapsed = sidebar icônes seulement (72px)
  // Mobile  : mobileOpen = drawer overlay
  const [collapsed,   setCollapsed]   = useState(false)
  const [mobileOpen,  setMobileOpen]  = useState(false)

  const navigate   = useNavigate()
  const location   = useLocation()
  const { theme, toggle: toggleTheme } = useTheme()
  const driver = getDriverUser()

  const initials    = driver ? `${driver.firstName?.charAt(0) ?? ''}${driver.lastName?.charAt(0) ?? ''}`.toUpperCase() : 'LV'
  const displayName = driver ? `${driver.firstName ?? ''} ${driver.lastName ?? ''}`.trim() : 'Livreur'

  const handleLogout = () => {
    localStorage.removeItem('smartfood_user')
    navigate('/login')
  }

  const navItems = [
    { path: '/driver/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { path: '/driver/orders',    label: 'Mes livraisons',   icon: Package },
  ]

  const pageTitle  = routeLabels[location.pathname] ?? 'Espace Livreur'

  // Sur mobile : sidebar = overlay. Sur desktop : sidebar fixe réduite/étendue.
  const sidebarW    = isMobile ? 256 : (collapsed ? 72 : 240)
  const marginLeft  = isMobile ? 0   : (collapsed ? 72 : 240)
  const showSidebar = isMobile ? mobileOpen : true

  const closeMobile = () => setMobileOpen(false)

  return (
    <div className="admin-root flex h-screen bg-orbit-bg overflow-hidden">
      <div className="orbit-glow-bg" />

      {/* ── Backdrop mobile ── */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 z-30"
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <AnimatePresence>
        {showSidebar && (
          <motion.aside
            key="sidebar"
            initial={isMobile ? { x: -256 } : false}
            animate={{ x: 0 }}
            exit={isMobile ? { x: -256 } : undefined}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{ width: sidebarW }}
            className={cn(
              'top-0 h-screen bg-orbit-surface border-r border-orbit-border flex flex-col z-40 overflow-hidden flex-shrink-0',
              isMobile ? 'fixed left-0' : 'fixed left-0'
            )}
          >
            {/* Logo + close mobile */}
            <div className="flex items-center gap-3 px-4 py-5 border-b border-orbit-border">
              <div className="w-8 h-8 rounded-lg bg-orbit-accent flex items-center justify-center flex-shrink-0 shadow-lg">
                <Truck className="w-4 h-4 text-white" />
              </div>
              {(!collapsed || isMobile) && (
                <span className="text-slate-100 font-semibold text-base tracking-tight whitespace-nowrap flex-1">
                  Espace Livreur
                </span>
              )}
              {isMobile && (
                <button onClick={closeMobile} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Nav */}
            <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
              {navItems.map(item => (
                <NavLink key={item.path} to={item.path}
                  onClick={isMobile ? closeMobile : undefined}
                  title={collapsed && !isMobile ? item.label : undefined}
                  className={({ isActive }) =>
                    cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative group',
                      isActive ? 'bg-orbit-accent/15 text-orbit-accent-light' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5')
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-orbit-accent rounded-r-full" />}
                      <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                      {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            {/* User info */}
            <div className="border-t border-orbit-border p-3">
              <div className={cn('flex items-center gap-3 p-2 rounded-lg', collapsed && !isMobile && 'justify-center')}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orbit-accent to-orbit-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {initials}
                </div>
                {(!collapsed || isMobile) && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{displayName}</p>
                    <p className="text-xs text-orbit-accent-light truncate">Livreur</p>
                  </div>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div
        style={{ marginLeft, transition: isMobile ? 'none' : 'margin-left 0.25s ease' }}
        className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden"
      >
        {/* Topbar */}
        <header className="h-16 border-b border-orbit-border bg-orbit-surface/80 backdrop-blur-xl flex items-center px-4 gap-3 flex-shrink-0 z-30">
          <button
            onClick={() => isMobile ? setMobileOpen(o => !o) : setCollapsed(c => !c)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-sm min-w-0">
            <span className="text-slate-500 hidden sm:inline">Livreur</span>
            <span className="text-slate-600 hidden sm:inline">/</span>
            <span className="text-slate-200 font-medium truncate">{pageTitle}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}>
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <span className="text-xs px-2.5 py-1 rounded-full bg-orbit-accent/15 text-orbit-accent-light font-semibold border border-orbit-accent/20 hidden sm:inline">
              LIVREUR
            </span>

            <button onClick={handleLogout}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors">
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
