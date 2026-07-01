import { useAuth } from '@/client/context/AuthContext'
import { Link } from 'react-router-dom'

export function ProfilePage() {
  const { user, logout, isAuthenticated } = useAuth()

  if (!isAuthenticated || !user) {
    return (
      <div className="container py-5">
        <div className="alert alert-primary text-white" role="alert" style={{ backgroundColor: 'var(--aurelia-primary)', borderColor: 'var(--aurelia-primary)', color: '#ffffff' }}>
          Vous devez être connecté pour accéder à votre profil.
        </div>
        <Link to="/login" className="btn btn-primary">
          Se connecter
        </Link>
      </div>
    )
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
            <div className="card-body p-5">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                  <h1 className="h3 fw-bold mb-1">Mon profil</h1>
                  <p className="text-muted mb-0">Informations de votre compte SmartFood.</p>
                </div>
                <button
                  className="btn btn-outline-danger"
                  onClick={logout}
                  type="button"
                >
                  Déconnexion
                </button>
              </div>

              <div className="row gy-3">
                <div className="col-md-6">
                  <label className="form-label text-muted">Prénom</label>
                  <div className="form-control bg-light border-0">{user.firstName}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Nom</label>
                  <div className="form-control bg-light border-0">{user.lastName}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Email</label>
                  <div className="form-control bg-light border-0">{user.email}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label text-muted">Téléphone</label>
                  <div className="form-control bg-light border-0">{user.phone || '-'}</div>
                </div>
                <div className="col-12">
                  <label className="form-label text-muted">Rôle</label>
                  <div className="form-control bg-light border-0">{user.role}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
