import { Outlet, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import './driver.css'

const navItems = [
  { path: '/driver/dashboard', label: 'Tableau de bord' },
  { path: '/driver/orders', label: 'Mes livraisons' },
]

export function DriverLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()

  return (
    <div className="driver-shell">
      <aside className={`driver-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="driver-brand">
          <div className="driver-brand-logo">A</div>
          <div>
            <h1 className="driver-brand-title">Aurelia Driver</h1>
            <p className="driver-brand-subtitle">Espace livreur</p>
          </div>
        </div>

        <nav className="driver-nav">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`driver-nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="driver-main">
        <header className="driver-topbar">
          <button className="driver-toggle" onClick={() => setSidebarOpen(o => !o)}>
            <i className="fas fa-bars"></i>
          </button>
          <div>
            <p className="driver-welcome">Bienvenue dans l’espace livreur</p>
            <h2 className="driver-welcome-subtitle">Suivez vos commandes assignées en temps réel</h2>
          </div>
        </header>

        <main className="driver-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
