import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@/client/context/AuthContext'
import { orderApi } from '@/client/services/api'

interface OrderDetails {
  id: number
  status: string
  totalAmount: number
  address: string
  orderDate: string
  items: { productName: string; quantity: number; unitPrice: number }[]
}

export function OrderConfirmationPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    orderApi.getById(Number(id))
      .then(res => setOrder(res.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [id])

  return (
    <>
      {/* Page Header */}
      <div className="container-fluid py-5" style={{ background: 'linear-gradient(135deg, rgba(11, 31, 78, 0.95), rgba(39, 65, 129, 0.95))' }}>
        <div className="text-center text-white py-3">
          <div
            className="rounded-circle bg-white d-inline-flex align-items-center justify-content-center mb-3 shadow"
            style={{ width: '80px', height: '80px' }}
          >
            <i className="fas fa-check-circle text-success fa-3x"></i>
          </div>
          <h1 className="display-5 fw-bold mb-2">Commande Confirmée !</h1>
          <p className="fs-5 mb-0 opacity-90">
            Merci <strong>{user?.firstName} {user?.lastName}</strong>, votre commande a été bien reçue.
          </p>
        </div>
      </div>

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-7">

            {/* Delivery time banner */}
            <div className="alert border-0 shadow-sm mb-4 py-3 px-4 d-flex align-items-center gap-3"
              style={{ background: 'linear-gradient(135deg, rgba(11, 31, 78, 0.15), rgba(11, 31, 78, 0.08))', borderRadius: '14px' }}
              role="alert">
              <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                style={{ width: '48px', height: '48px', flexShrink: 0 }}>
                <i className="fas fa-truck text-white fa-lg"></i>
              </div>
              <div>
                <p className="fw-bold mb-0" style={{ color: '#856404' }}>Livraison en cours de préparation</p>
                <p className="mb-0 small" style={{ color: '#856404' }}>
                  Votre commande sera livrée dans <strong>2 heures maximum</strong>.
                  Un livreur vous sera assigné très prochainement.
                </p>
              </div>
            </div>

            {/* Order details card */}
            <div className="card border-0 shadow-sm" style={{ borderRadius: '16px' }}>
              <div className="card-header bg-white py-3 px-4 border-bottom" style={{ borderRadius: '16px 16px 0 0' }}>
                <div className="d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">
                    <i className="fas fa-receipt text-primary me-2"></i>
                    Détails de la commande
                  </h5>
                  {id && (
                    <span className="badge bg-primary rounded-pill px-3 py-2">
                      Commande #{id}
                    </span>
                  )}
                </div>
              </div>
              <div className="card-body p-4">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-grow text-primary" role="status"></div>
                    <p className="mt-3 text-muted">Chargement des détails...</p>
                  </div>
                ) : order ? (
                  <>
                    {/* Status */}
                    <div className="d-flex align-items-center gap-3 mb-4 p-3 bg-light rounded-3">
                      <i className="fas fa-clock text-primary fa-lg"></i>
                      <div>
                        <small className="text-muted d-block">Statut</small>
                        <span className="badge bg-primary text-white px-3 py-2 rounded-pill">
                          {order.status === 'EN_ATTENTE' ? 'En attente d\'un livreur' :
                           order.status === 'PRISE_EN_CHARGE' ? 'Livreur assigné' :
                           order.status === 'EN_LIVRAISON' ? 'En cours de livraison' :
                           order.status === 'LIVREE' ? 'Livrée' : order.status}
                        </span>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="d-flex align-items-start gap-3 mb-4 p-3 bg-light rounded-3">
                      <i className="fas fa-map-marker-alt text-primary fa-lg mt-1"></i>
                      <div>
                        <small className="text-muted d-block">Adresse de livraison</small>
                        <span className="fw-semibold">{order.address}</span>
                      </div>
                    </div>

                    {/* Items */}
                    <h6 className="fw-bold mb-3">Articles commandés</h6>
                    {order.items.map((item, i) => (
                      <div key={i} className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                        <div>
                          <span className="fw-semibold">{item.productName}</span>
                          <small className="text-muted ms-2">x{item.quantity}</small>
                        </div>
                        <span className="fw-bold text-primary">
                          {(item.unitPrice * item.quantity).toFixed(2)} DT
                        </span>
                      </div>
                    ))}

                    <div className="d-flex justify-content-between mt-3 pt-2">
                      <span className="fs-5 fw-bold">Total payé</span>
                      <span className="fs-5 fw-bold text-primary">{order.totalAmount.toFixed(2)} DT</span>
                    </div>

                    <div className="mt-2 text-muted small">
                      <i className="fas fa-money-bill-wave me-1 text-primary"></i>
                      Paiement à la livraison (espèces)
                    </div>
                  </>
                ) : (
                  /* Fallback when API not available yet */
                  <div className="text-center py-4">
                    <i className="fas fa-check-circle text-success fa-4x mb-3"></i>
                    <h5 className="fw-bold">Commande #{id} enregistrée !</h5>
                    <p className="text-muted">
                      Votre commande a été créée avec succès.<br />
                      Paiement à la livraison — livraison en 2 heures maximum.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="d-flex gap-3 mt-4 justify-content-center flex-wrap">
              <Link to="/" className="btn btn-outline-secondary rounded-pill px-4 py-2">
                <i className="fas fa-home me-2"></i>Retour à l'accueil
              </Link>
              <Link to="/shop" className="btn btn-primary rounded-pill px-4 py-2">
                <i className="fas fa-store me-2"></i>Continuer mes achats
              </Link>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
