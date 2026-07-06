import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '@/client/context/CartContext'
import { useAuth } from '@/client/context/AuthContext'
import { useNotifications } from '@/client/context/NotificationContext'
import { orderApi } from '@/client/services/api'

export function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart()
  const { isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const [address, setAddress] = useState('')
  const [paymentMethod] = useState<'ESPECES'>('ESPECES') // only cash for now
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [successOrderId, setSuccessOrderId] = useState<number | null>(null)
  const { addNotification } = useNotifications()

  const shipping = 2.0
  const total = subtotal + shipping

  // Redirect if not authenticated or cart is empty
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout')
      return
    }
    if (items.length === 0 && !submitting && successOrderId === null) {
      navigate('/cart')
    }
  }, [isAuthenticated, items, navigate, submitting, successOrderId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!address.trim()) {
      setError("Veuillez saisir votre adresse de livraison.")
      return
    }
    setError('')
    setSubmitting(true)
    setLoading(true)

    try {
      const res = await orderApi.checkout({
        address: address.trim(),
        paymentMethod,
      })
      const orderId = res.data.id
      setSuccessOrderId(orderId)
      addNotification({
        title: 'Commande confirmée',
        message: `Votre commande #${orderId} a bien été enregistrée.`,
        orderId,
      })
      clearCart()  // async mais on n'attend pas — la navigation se fait immédiatement
      navigate(`/order-confirmation/${orderId}`, { replace: true })
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } }
      setError(
        axiosErr.response?.data?.message ||
        'Une erreur est survenue. Veuillez réessayer.'
      )
    } finally {
      setLoading(false)
      setSubmitting(false)
    }
  }

  if (!isAuthenticated || items.length === 0) return null

  return (
    <>
      {/* Page Header */}
      <div className="container-fluid page-header py-5">
        <h1 className="text-center text-white display-6">Finaliser la commande</h1>
        <ol className="breadcrumb justify-content-center mb-0">
          <li className="breadcrumb-item"><Link to="/">Accueil</Link></li>
          <li className="breadcrumb-item"><Link to="/cart" className="text-white">Panier</Link></li>
          <li className="breadcrumb-item active text-white">Commande</li>
        </ol>
      </div>

      <div className="container py-5">
        {/* Progress steps */}
        <div className="d-flex justify-content-center align-items-center gap-3 mb-5">
          {[
            { icon: 'fa-shopping-bag', label: 'Panier', done: true },
            { icon: 'fa-sign-in-alt', label: 'Connexion', done: true },
            { icon: 'fa-map-marker-alt', label: 'Livraison', active: true },
            { icon: 'fa-check-circle', label: 'Confirmation', done: false },
          ].map((step, i) => (
            <div key={i} className="d-flex align-items-center gap-2">
              <div
                className={`rounded-circle d-flex align-items-center justify-content-center
                  ${step.done ? 'bg-success text-white' : step.active ? 'bg-primary text-white' : 'bg-light text-muted'}`}
                style={{ width: '42px', height: '42px', flexShrink: 0 }}
              >
                <i className={`fas ${step.icon}`} style={{ fontSize: '14px' }}></i>
              </div>
              <span className={`d-none d-md-inline small fw-semibold ${step.active ? 'text-primary' : step.done ? 'text-success' : 'text-muted'}`}>
                {step.label}
              </span>
              {i < 3 && <div className="flex-grow-1 border-top border-2 mx-1" style={{ minWidth: '30px', opacity: 0.3 }}></div>}
            </div>
          ))}
        </div>

        <div className="row g-5 justify-content-center">
          {/* Left: Delivery form */}
          <div className="col-lg-7">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <div className="card-body p-4 p-md-5">
                <h4 className="fw-bold mb-1">
                  <i className="fas fa-map-marker-alt text-primary me-2"></i>
                  Adresse de livraison
                </h4>
                <p className="text-muted small mb-4">Bonjour <strong>{user?.firstName}</strong>, où souhaitez-vous être livré ?</p>

                {error && (
                  <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 py-2" role="alert">
                    <i className="fas fa-exclamation-circle"></i>
                    <span style={{ fontSize: '13px' }}>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label className="form-label fw-semibold">
                      Adresse complète <span className="text-danger">*</span>
                    </label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="Ex: 12 Rue de la Liberté, Cité Ennasr, Ariana"
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      required
                      style={{ borderRadius: '10px', resize: 'none' }}
                    />
                    <small className="text-muted">
                      <i className="fas fa-info-circle me-1"></i>
                      Indiquez le numéro, la rue, la ville et tout repère utile pour le livreur.
                    </small>
                  </div>

                  {/* Payment method — cash only */}
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Mode de paiement</label>
                    <div
                      className="border rounded-3 p-3 d-flex align-items-center gap-3 bg-light"
                      style={{ cursor: 'default' }}
                    >
                      <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                        style={{ width: '44px', height: '44px', flexShrink: 0 }}>
                        <i className="fas fa-money-bill-wave text-white"></i>
                      </div>
                      <div>
                        <p className="fw-bold mb-0">Paiement à la livraison</p>
                        <small className="text-muted">Payez en espèces lors de la réception de votre commande</small>
                      </div>
                      <div className="ms-auto">
                        <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                          style={{ width: '22px', height: '22px' }}>
                          <i className="fas fa-check text-white" style={{ fontSize: '10px' }}></i>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-3 rounded-pill fw-bold"
                    disabled={loading || !address.trim()}
                    style={{ fontSize: '16px' }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Confirmation en cours...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check-circle me-2"></i>
                        Confirmer ma commande
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <div className="card-header bg-white border-bottom py-3 px-4" style={{ borderRadius: '16px 16px 0 0' }}>
                <h6 className="fw-bold mb-0">
                  <i className="fas fa-receipt text-primary me-2"></i>
                  Récapitulatif ({items.length} article{items.length > 1 ? 's' : ''})
                </h6>
              </div>
              <div className="card-body px-4 py-3">
                {items.map(item => (
                  <div key={item.id} className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom">
                    <img src={item.img || '/fruitables/img/hero-img-1.png'} alt={item.name}
                      className="rounded" style={{ width: '55px', height: '55px', objectFit: 'cover', flexShrink: 0 }}
                      onError={e => { e.currentTarget.src = '/fruitables/img/hero-img-1.png' }} />
                    <div className="flex-grow-1">
                      <p className="mb-0 fw-semibold small">{item.name}</p>
                      <small className="text-muted">x{item.quantity}</small>
                    </div>
                    <span className="fw-bold small">{(item.price * item.quantity).toFixed(2)} DT</span>
                  </div>
                ))}

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Sous-total</span>
                  <span>{subtotal.toFixed(2)} DT</span>
                </div>
                <div className="d-flex justify-content-between mb-3 pb-3 border-bottom">
                  <span className="text-muted">Livraison</span>
                  <span className="text-success">{shipping.toFixed(2)} DT</span>
                </div>
                <div className="d-flex justify-content-between">
                  <span className="fs-6 fw-bold">Total</span>
                  <span className="fs-6 fw-bold text-primary">{total.toFixed(2)} DT</span>
                </div>

                <div className="mt-4 p-3 bg-primary bg-opacity-10 rounded-3">
                  <div className="d-flex align-items-center gap-2">
                    <i className="fas fa-truck text-primary"></i>
                    <span className="small fw-semibold text-primary">Livraison estimée : 2 heures max</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
