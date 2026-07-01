import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '@/client/context/CartContext'
import { useAuth } from '@/client/context/AuthContext'
import { NotificationMenu } from '@/client/components/NotificationMenu'

export function ClientNavbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { totalItems } = useCart()
  const { user, logout, isAuthenticated } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isActive = (path: string) =>
    pathname === path || (path !== '/' && pathname.startsWith(path)) ? 'active' : ''

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

        {/* TOP BAR — vert #81C408 */}
        <div className="container-fluid topbar bg-primary">
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div className="top-info d-flex flex-wrap align-items-center gap-3">
              <small className="text-white mb-0">
                <i className="fas fa-map-marker-alt me-2 text-secondary"></i>
                <a href="#" className="text-white text-decoration-none">123 Street, Tunis</a>
              </small>
              <small className="text-white mb-0">
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
                  <Link to="/login" className="text-white text-decoration-none small">
                    Se connecter
                  </Link>
                  <span className="text-white">/</span>
                  <Link to="/register" className="text-white text-decoration-none small">
                    Créer un compte
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* MAIN NAVBAR */}
        <div className="container-fluid px-0 client-navbar-wrapper">
          <nav className="navbar navbar-expand-lg navbar-light w-100 px-3 main-navbar">
            <Link to="/" className="navbar-brand d-flex align-items-center mb-0">
              <img src="/logo.svg" alt="Aurelia SmartFood" />
              <span className="ms-2 fw-bold text-white">Aurelia Smart Food</span>
            </Link>

            <div className="navbar-nav mx-auto d-flex align-items-center justify-content-center gap-3 flex-wrap">
              <Link to="/" className={`nav-item nav-link ${isActive('/')}`}>
                Accueil
              </Link>
              <Link to="/shop" className={`nav-item nav-link ${isActive('/shop')}`}>
                Boutique
              </Link>
              <Link to="/cart" className={`nav-item nav-link ${isActive('/cart')}`}>
                Panier
              </Link>
              <Link to="/profile" className={`nav-item nav-link ${isActive('/profile')}`}>
                Profil
              </Link>
              <Link to="/testimonials" className={`nav-item nav-link ${isActive('/testimonials')}`}>
                Témoignages
              </Link>
              <Link to="/contact" className={`nav-item nav-link ${isActive('/contact')}`}>
                Contact
              </Link>
              {!isAuthenticated && (
                <>
                  <Link to="/login" className={`nav-item nav-link ${isActive('/login')}`}>
                    Connexion
                  </Link>
                  <Link to="/register" className={`nav-item nav-link ${isActive('/register')}`}>
                    Inscription
                  </Link>
                </>
              )}
            </div>

            <div className="d-flex align-items-center gap-3 ms-auto">
              <button
                className="btn btn-outline-secondary btn-md-square rounded-circle bg-white"
                data-bs-toggle="modal"
                data-bs-target="#searchModal"
                type="button"
              >
                <i className="fas fa-search text-primary"></i>
              </button>

              <Link
                to="/cart"
                className="position-relative text-dark text-decoration-none"
                title="Mon panier"
              >
                <i className="fa fa-shopping-bag fa-2x"></i>
                <span
                  className="position-absolute bg-secondary rounded-circle d-flex align-items-center justify-content-center text-dark px-1"
                  style={{
                    top: '-5px',
                    left: '15px',
                    height: '20px',
                    minWidth: '20px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                >
                  {totalItems}
                </span>
              </Link>

              <NotificationMenu />

              {isAuthenticated ? (
                <div className="dropdown">
                  <button
                    className="btn border border-secondary rounded-circle bg-white dropdown-toggle d-flex align-items-center justify-content-center"
                    style={{
                      width: '40px',
                      height: '40px',
                      padding: 0,
                      fontWeight: 'bold',
                      color: 'var(--aurelia-primary)',
                      fontSize: '16px',
                    }}
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                  >
                    {user?.firstName?.charAt(0).toUpperCase()}
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow border-0 rounded-3 mt-2">
                    <li>
                      <span className="dropdown-item-text text-muted small fw-semibold px-3 py-1">
                        {user?.firstName} {user?.lastName}
                      </span>
                    </li>
                    <li><hr className="dropdown-divider my-1" /></li>
                    <li>
                      <Link to="/profile" className="dropdown-item small">
                        <i className="fas fa-user me-2 text-primary"></i>
                        Mon profil
                      </Link>
                    </li>
                    <li>
                      <Link to="/cart" className="dropdown-item small">
                        <i className="fa fa-shopping-bag me-2 text-primary"></i>
                        Mon panier {totalItems > 0 && <span className="badge bg-primary ms-1">{totalItems}</span>}
                      </Link>
                    </li>
                    <li>
                      <button className="dropdown-item text-danger small" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt me-2"></i>Déconnexion
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="text-dark text-decoration-none"
                  title="Se connecter"
                >
                  <i className="fas fa-user fa-2x"></i>
                </Link>
              )}
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}
