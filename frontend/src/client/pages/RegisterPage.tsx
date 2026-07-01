import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/client/context/AuthContext'
import { authApi } from '@/client/services/api'

export function RegisterPage() {
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', email: '', password: '', confirm: ''
  })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    setLoading(true)
    try {
      const res = await authApi.register({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email,
        password: form.password,
      })
      login(res.data)
      navigate(redirect)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(axiosErr.response?.data?.message || 'Erreur lors de la création du compte.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Page Header */}
      <div className="container-fluid page-header py-5">
        <h1 className="text-center text-white display-6">Créer un compte</h1>
        <ol className="breadcrumb justify-content-center mb-0">
          <li className="breadcrumb-item"><Link to="/">Accueil</Link></li>
          <li className="breadcrumb-item active text-white">Inscription</li>
        </ol>
      </div>

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card border-0 shadow-lg" style={{ borderRadius: '16px' }}>
              <div className="card-body p-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <div className="rounded-circle bg-primary d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: '70px', height: '70px' }}>
                    <i className="fas fa-user-plus fa-2x text-white"></i>
                  </div>
                  <h3 className="fw-bold">Rejoignez SmartFood</h3>
                  <p className="text-muted">Créez votre compte pour commander</p>
                </div>

                {/* Error */}
                {error && (
                  <div className="alert alert-danger d-flex align-items-center gap-2 rounded-pill px-3 py-2" role="alert">
                    <i className="fas fa-exclamation-circle"></i>
                    <span style={{ fontSize: '13px' }}>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Prénom <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0"><i className="fas fa-user text-muted"></i></span>
                        <input name="firstName" type="text" className="form-control border-start-0 ps-0"
                          placeholder="Prénom" value={form.firstName} onChange={handleChange} required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Nom <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0"><i className="fas fa-user text-muted"></i></span>
                        <input name="lastName" type="text" className="form-control border-start-0 ps-0"
                          placeholder="Nom" value={form.lastName} onChange={handleChange} required />
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Téléphone <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0"><i className="fas fa-phone text-muted"></i></span>
                        <input name="phone" type="tel" className="form-control border-start-0 ps-0"
                          placeholder="+216 XX XXX XXX" value={form.phone} onChange={handleChange} required />
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Email <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0"><i className="fas fa-envelope text-muted"></i></span>
                        <input name="email" type="email" className="form-control border-start-0 ps-0"
                          placeholder="votre@email.com" value={form.email} onChange={handleChange} required autoComplete="email" />
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Mot de passe <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0"><i className="fas fa-lock text-muted"></i></span>
                        <input name="password" type={showPwd ? 'text' : 'password'}
                          className="form-control border-start-0 border-end-0 ps-0"
                          placeholder="Minimum 6 caractères" value={form.password}
                          onChange={handleChange} required autoComplete="new-password" />
                        <button type="button" className="input-group-text bg-light border-start-0" onClick={() => setShowPwd(v => !v)}>
                          <i className={`fas ${showPwd ? 'fa-eye-slash' : 'fa-eye'} text-muted`}></i>
                        </button>
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-semibold">Confirmer le mot de passe <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0"><i className="fas fa-lock text-muted"></i></span>
                        <input name="confirm" type={showPwd ? 'text' : 'password'}
                          className="form-control border-start-0 ps-0"
                          placeholder="Répétez le mot de passe" value={form.confirm}
                          onChange={handleChange} required autoComplete="new-password" />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-3 rounded-pill fw-bold mt-4"
                    disabled={loading}
                    style={{ fontSize: '15px' }}
                  >
                    {loading ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Création...</>
                    ) : (
                      <><i className="fas fa-user-plus me-2"></i>Créer mon compte</>
                    )}
                  </button>
                </form>

                <hr className="my-4" />
                <div className="text-center">
                  <p className="text-muted mb-0">
                    Déjà un compte ?{' '}
                    <Link to={`/login${redirect !== '/' ? `?redirect=${redirect}` : ''}`}
                      className="text-primary fw-bold text-decoration-none">
                      Se connecter
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
