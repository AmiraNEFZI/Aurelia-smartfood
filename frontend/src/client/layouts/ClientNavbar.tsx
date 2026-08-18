import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '@/client/context/CartContext'
import { useAuth } from '@/client/context/AuthContext'
import { NotificationMenu } from '@/client/components/NotificationMenu'

export function ClientNavbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { totalItems } = useCart()
  const { user, logout, isAuthenticated } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const isActive = (path: string) =>
    pathname === path || (path !== '/' && pathname.startsWith(path)) ? 'active' : ''

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      {/* ═══ SEARCH MODAL ═══ */}
      <div className="modal fade" id="searchModal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-fullscreen">
          <div className="modal-content rounded-0">
            <div className="modal-header">
              <h5 className="modal-title">Rechercher un produit</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body d-flex align-items-center">
              <div className="input-group w-75 mx-auto d-flex">
                <input type="search" className="form-control p-3" placeholder="Entrez un mot-clé..." />
                <span className="input-group-text p-3"><i className="fa fa-search"></i></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FIXED NAVBAR WRAPPER ═══ */}
      <div className="container-fluid fixed-top" style={{ padding: 0 }}>

        {/* TOP BAR — masqué sur très petits écrans */}
        <div className="container-fluid topbar bg-primary d-none d-sm-block">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div className="top-info d-flex flex-wrap align-items-center gap-3">
              <small className="text-white mb-0">
                <i className="fas fa-map-marker-alt me-2 text-secondary"></i>
                <a href="#" className="text-white text-decoration-none">123 Street, Tunis</a>
              </small>
              <small className="text-white mb-0 d-none d-md-inline">
                <i className="fas fa-envelope me-2 text-secondary"></i>
                <a href="#" className="text-white text-decoration-none">contact@aurelia-smartfood.com</a>
              </small>
            </div>
            <div className="top-link text-white d-flex flex-wrap align-items-center gap-2">
              {isAuthenticated ? (
                <span className="small mb-0">
                  <i className="fas fa-user me-1"></i>
                  Bonjour, <strong>{user?.firstName}</strong>
                </span>
              ) : (
                <>
                  <Link to="/login" className="text-white text-decoration-none small">Se connecter</Link>
                  <span className="text-white">/</span>
                  <Link to="/register" className="text-white text-decoration-none small">Créer un compte</Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* MAIN NAVBAR */}
        <div className="container-fluid px-0 client-navbar-wrapper">
          <nav className="navbar w-100 px-3 main-navbar" style={{ flexWrap: 'nowrap', minHeight: '72px' }}>

            {/* Brand */}
            <Link to="/" className="navbar-brand d-flex align-items-center mb-0 flex-shrink-0" onClick={closeMenu}>
              <img src="/logo.svg" alt="Aurelia SmartFood" />
              <span className="ms-2 fw-bold d-none d-md-inline" style={{ color: 'var(--aurelia-dark)', whiteSpace: 'nowrap' }}>
                Aurelia Smart Food
              </span>
            </Link>

            {/* Desktop links — ≥1200px, sur une seule ligne garantie */}
            <div
              className="d-none d-xl-flex align-items-center justify-content-center flex-nowrap mx-auto"
              style={{ gap: '0.25rem', overflow: 'hidden' }}
            >
              <Link to="/"            className={`nav-link px-2 py-2 ${isActive('/')}`}            style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>Accueil</Link>
              <Link to="/shop"        className={`nav-link px-2 py-2 ${isActive('/shop')}`}        style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>Boutique</Link>
              <Link to="/cart"        className={`nav-link px-2 py-2 ${isActive('/cart')}`}        style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>Panier</Link>
              <Link to="/profile"     className={`nav-link px-2 py-2 ${isActive('/profile')}`}     style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>Profil</Link>
              <Link to="/testimonials"className={`nav-link px-2 py-2 ${isActive('/testimonials')}`}style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>Témoignages</Link>
              <Link to="/contact"     className={`nav-link px-2 py-2 ${isActive('/contact')}`}     style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>Contact</Link>
              {!isAuthenticated && (
                <>
                  <Link to="/login"    className={`nav-link px-2 py-2 ${isActive('/login')}`}    style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>Connexion</Link>
                  <Link to="/register" className={`nav-link px-2 py-2 ${isActive('/register')}`} style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>Inscription</Link>
                </>
              )}
            </div>

            {/* Right icons */}
            <div className="d-flex align-items-center gap-2 ms-auto flex-shrink-0">
              {/* Search — desktop seulement */}
              <button
                className="btn btn-outline-secondary rounded-circle bg-white d-none d-xl-flex align-items-center justify-content-center"
                style={{ width: '36px', height: '36px', padding: 0 }}
                data-bs-toggle="modal" data-bs-target="#searchModal" type="button"
              >
                <i className="fas fa-search text-primary" style={{ fontSize: '0.85rem' }}></i>
              </button>

              {/* Panier — toujours visible */}
              <Link to="/cart" className="position-relative text-dark text-decoration-none" title="Mon panier">
                <i className="fa fa-shopping-bag fa-2x"></i>
                {totalItems > 0 && (
                  <span
                    className="position-absolute bg-secondary rounded-circle d-flex align-items-center justify-content-center text-dark px-1"
                    style={{ top: '-5px', left: '15px', height: '20px', minWidth: '20px', fontSize: '11px', fontWeight: 'bold' }}
                  >
                    {totalItems}
                  </span>
                )}
              </Link>

              {/* Notifications — desktop */}
              <span className="d-none d-md-block">
                <NotificationMenu />
              </span>

              {/* Avatar dropdown — desktop ≥1200px */}
              {isAuthenticated ? (
                <div className="dropdown d-none d-xl-block">
                  <button
                    className="btn border border-secondary rounded-circle bg-white dropdown-toggle d-flex align-items-center justify-content-center"
                    style={{ width: '40px', height: '40px', padding: 0, fontWeight: 'bold', color: 'var(--aurelia-primary)', fontSize: '16px' }}
                    data-bs-toggle="dropdown" aria-expanded="false"
                  >
                    {user?.firstName?.charAt(0).toUpperCase()}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 mt-2">
                    <li><span className="dropdown-item-text text-muted small fw-semibold px-3 py-1">{user?.firstName} {user?.lastName}</span></li>
                    <li><hr className="dropdown-divider my-1" /></li>
                    <li><Link to="/reviews" className="dropdown-item small" onClick={closeMenu}><i className="fas fa-star me-2 text-warning"></i>Évaluer mes livraisons</Link></li>
                    <li><Link to="/profile" className="dropdown-item small" onClick={closeMenu}><i className="fas fa-user me-2 text-primary"></i>Mon profil</Link></li>
                    <li><Link to="/cart"    className="dropdown-item small" onClick={closeMenu}><i className="fa fa-shopping-bag me-2 text-primary"></i>Mon panier {totalItems > 0 && <span className="badge bg-primary ms-1">{totalItems}</span>}</Link></li>
                    <li><button className="dropdown-item text-danger small" onClick={handleLogout}><i className="fas fa-sign-out-alt me-2"></i>Déconnexion</button></li>
                  </ul>
                </div>
              ) : (
                <Link to="/login" className="text-dark text-decoration-none d-none d-xl-block" title="Se connecter">
                  <i className="fas fa-user fa-2x"></i>
                </Link>
              )}

              {/* Hamburger — visible en dessous de xl (< 1200px) */}
              <button
                className="d-xl-none border-0 p-1 ms-1"
                type="button"
                onClick={() => setMenuOpen(o => !o)}
                aria-label="Menu"
                style={{ background: 'transparent', cursor: 'pointer', lineHeight: 1 }}
              >
                <span style={{ display: 'block', width: '24px', height: '2px', background: 'var(--aurelia-dark)', margin: '5px 0', transition: 'all .25s',
                  transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
                <span style={{ display: 'block', width: '24px', height: '2px', background: 'var(--aurelia-dark)', margin: '5px 0', transition: 'all .25s',
                  opacity: menuOpen ? 0 : 1 }} />
                <span style={{ display: 'block', width: '24px', height: '2px', background: 'var(--aurelia-dark)', margin: '5px 0', transition: 'all .25s',
                  transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
              </button>
            </div>
          </nav>

          {/* ── MOBILE DRAWER ── */}
          {menuOpen && (
            <>
              {/* Backdrop */}
              <div
                onClick={closeMenu}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1040, top: 0 }}
              />
              {/* Drawer */}
              <div
                style={{
                  position: 'fixed', top: 0, right: 0, bottom: 0, width: '280px',
                  background: '#fff', zIndex: 1050, overflowY: 'auto',
                  boxShadow: '-4px 0 24px rgba(11,31,78,0.18)',
                  display: 'flex', flexDirection: 'column',
                  animation: 'slideInRight .22s ease',
                }}
              >
                {/* Drawer header */}
                <div className="d-flex align-items-center justify-content-between px-4 py-3"
                  style={{ borderBottom: '1px solid #e8eeff', background: 'linear-gradient(135deg,#0b1f4e,#274181)' }}>
                  <div className="d-flex align-items-center gap-2">
                    <img src="/logo.svg" alt="logo" style={{ height: 32 }} />
                    <span className="fw-bold text-white small">Aurelia Smart Food</span>
                  </div>
                  <button onClick={closeMenu} className="btn p-1" style={{ color: '#fff', fontSize: '18px', background: 'transparent', border: 'none' }}>✕</button>
                </div>

                {/* User info */}
                {isAuthenticated && (
                  <div className="px-4 py-3" style={{ background: '#f8fbff', borderBottom: '1px solid #e8eeff' }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                        style={{ width: 40, height: 40, background: 'linear-gradient(135deg,#4f8ef7,#a78bfa)', fontSize: 16, flexShrink: 0 }}>
                        {user?.firstName?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="fw-bold" style={{ color: '#0b1f4e', fontSize: '0.95rem' }}>{user?.firstName} {user?.lastName}</div>
                        <div className="text-muted" style={{ fontSize: '0.78rem' }}>{user?.email}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Nav links */}
                <nav className="flex-grow-1 px-3 py-3">
                  {[
                    { to: '/',             label: 'Accueil',        icon: 'fa-home' },
                    { to: '/shop',         label: 'Boutique',       icon: 'fa-store' },
                    { to: '/cart',         label: `Panier${totalItems > 0 ? ` (${totalItems})` : ''}`, icon: 'fa-shopping-bag' },
                    { to: '/profile',      label: 'Mon profil',     icon: 'fa-user' },
                    { to: '/reviews',      label: 'Mes évaluations',icon: 'fa-star' },
                    { to: '/testimonials', label: 'Témoignages',    icon: 'fa-comments' },
                    { to: '/contact',      label: 'Contact',        icon: 'fa-envelope' },
                    ...(!isAuthenticated ? [
                      { to: '/login',    label: 'Se connecter', icon: 'fa-sign-in-alt' },
                      { to: '/register', label: 'Créer un compte', icon: 'fa-user-plus' },
                    ] : []),
                  ].map(item => (
                    <Link key={item.to} to={item.to} onClick={closeMenu}
                      className={`d-flex align-items-center gap-3 px-3 py-2 rounded-3 mb-1 text-decoration-none ${isActive(item.to) ? '' : ''}`}
                      style={{
                        color: isActive(item.to) ? '#0b1f4e' : '#475569',
                        fontWeight: isActive(item.to) ? 700 : 500,
                        background: isActive(item.to) ? '#eff6ff' : 'transparent',
                        fontSize: '0.95rem',
                        transition: 'background .15s',
                      }}
                    >
                      <i className={`fas ${item.icon}`} style={{ width: 18, textAlign: 'center', color: isActive(item.to) ? '#0b1f4e' : '#94a3b8', fontSize: '0.85rem' }}></i>
                      {item.label}
                    </Link>
                  ))}
                </nav>

                {/* Logout */}
                {isAuthenticated && (
                  <div className="px-3 pb-4 pt-2" style={{ borderTop: '1px solid #e8eeff' }}>
                    <button onClick={handleLogout}
                      className="d-flex align-items-center gap-3 px-3 py-2 rounded-3 w-100 text-start border-0"
                      style={{ color: '#dc2626', fontWeight: 600, background: '#fff1f1', fontSize: '0.95rem', cursor: 'pointer' }}>
                      <i className="fas fa-sign-out-alt" style={{ width: 18, textAlign: 'center' }}></i>
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Animation keyframe pour le drawer */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}
