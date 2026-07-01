import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/client/context/AuthContext'
import { authApi } from '@/client/services/api'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login({ email, password })
      login(res.data)
      const role = res.data.role
      if (role === 'ADMIN' || role?.name === 'ADMIN') {
        navigate('/admin/dashboard')
      } else if (role === 'LIVREUR' || role?.name === 'LIVREUR') {
        navigate('/driver/dashboard')
      } else {
        navigate(redirect)
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr.response?.data?.message || 'Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Page Header */}
      <div className="container-fluid page-header py-5">
        <h1 className="text-center text-white display-6">Connexion</h1>
        <ol className="breadcrumb justify-content-center mb-0">
          <li className="breadcrumb-item"><Link to="/">Accueil</Link></li>
          <li className="breadcrumb-item active text-white">Connexion</li>
        </ol>
      </div>

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-5">
            <div className="card border-0 shadow-lg" style={{ borderRadius: '16px' }}>
              <div className="card-body p-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <div className="rounded-circle bg-primary d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: '70px', height: '70px' }}>
                    <i className="fas fa-user fa-2x text-white"></i>
                  </div>
                  <h3 className="fw-bold">Bon retour !</h3>
                  <p className="text-muted">Connectez-vous pour passer votre commande</p>
                </div>

                {/* Error */}
                {error && (
                  <div className="alert alert-danger d-flex align-items-center gap-2 rounded-pill px-3 py-2" role="alert">
                    <i className="fas fa-exclamation-circle"></i>
                    <span style={{ fontSize: '13px' }}>{error}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="fas fa-envelope text-muted"></i>
                      </span>
                      <input
                        type="email"
                        className="form-control border-start-0 ps-0"
                        placeholder="votre@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Mot de passe</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">
                        <i className="fas fa-lock text-muted"></i>
                      </span>
                      <input
                        type={showPwd ? 'text' : 'password'}
                        className="form-control border-start-0 border-end-0 ps-0"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="input-group-text bg-light border-start-0"
                        onClick={() => setShowPwd(v => !v)}
                      >
                        <i className={`fas ${showPwd ? 'fa-eye-slash' : 'fa-eye'} text-muted`}></i>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-3 rounded-pill fw-bold"
                    disabled={loading}
                    style={{ fontSize: '15px' }}
                  >
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Connexion...</>
                    ) : (
                      <><i className="fas fa-sign-in-alt me-2"></i>Se connecter</>
                    )}
                  </button>
                </form>

                <hr className="my-4" />

                <div className="text-center">
                  <p className="text-muted mb-0">
                    Pas encore de compte ?{' '}
                    <Link
                      to={`/register${redirect !== '/' ? `?redirect=${redirect}` : ''}`}
                      className="text-primary fw-bold text-decoration-none"
                    >
                      Créer un compte
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
