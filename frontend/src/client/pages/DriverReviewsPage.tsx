import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/client/context/AuthContext'
import {
  orderApi,
  type DriverReviewPayload,
  type ComplaintPayload,
  type ComplaintCategory,
  COMPLAINT_CATEGORY_LABELS,
} from '@/client/services/api'

interface OrderSummary {
  id: number; status: string; totalAmount: number
  orderDate: string; address: string; driverName?: string
  items: { productName: string; quantity: number; unitPrice: number }[]
}

type ActivePanel = null | { type: 'review' | 'complaint'; orderId: number }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-TN', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function DriverReviewsPage() {
  const { user, isAuthenticated } = useAuth()
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)

  // ── Évaluation ───────────────────────────────────────────────────────────
  const [activePanel, setActivePanel] = useState<ActivePanel>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')

  // ── Réclamation ──────────────────────────────────────────────────────────
  const [complaintCategory, setComplaintCategory] = useState<ComplaintCategory>('AUTRE')
  const [complaintDescription, setComplaintDescription] = useState('')

  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg]     = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    orderApi.getMyOrders()
      .then(res => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [isAuthenticated])

  const deliveredOrders = useMemo(() => orders.filter(o => o.status === 'LIVREE'), [orders])

  const openPanel = (type: 'review' | 'complaint', orderId: number) => {
    if (activePanel?.type === type && activePanel.orderId === orderId) {
      setActivePanel(null)
    } else {
      setActivePanel({ type, orderId })
      setSuccessMsg(null)
      setErrorMsg(null)
      setReviewRating(5)
      setReviewComment('')
      setComplaintCategory('AUTRE')
      setComplaintDescription('')
    }
  }

  const handleSubmitReview = async (orderId: number) => {
    setSubmitting(true)
    setErrorMsg(null)
    try {
      const payload: DriverReviewPayload = { rating: reviewRating, comment: reviewComment.trim() || undefined }
      await orderApi.submitReview(orderId, payload)
      setSuccessMsg('Merci ! Votre évaluation a bien été enregistrée.')
      setActivePanel(null)
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Impossible d\'enregistrer votre évaluation.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitComplaint = async (orderId: number) => {
    if (!complaintDescription.trim()) { setErrorMsg('La description est obligatoire.'); return }
    setSubmitting(true)
    setErrorMsg(null)
    try {
      const payload: ComplaintPayload = { category: complaintCategory, description: complaintDescription.trim() }
      await orderApi.submitComplaint(orderId, payload)
      setSuccessMsg('Votre réclamation a bien été transmise. Notre équipe en prendra connaissance rapidement.')
      setActivePanel(null)
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Impossible de soumettre votre réclamation.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="container py-5">
        <div className="text-center py-5">
          <h4 className="fw-bold mb-2">Évaluations & Réclamations</h4>
          <p className="text-muted mb-4">Vous devez être connecté pour accéder à cette interface.</p>
          <Link to="/login" className="btn btn-primary rounded-pill px-4">Se connecter</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-9">
          <div className="rounded-4 overflow-hidden shadow-sm" style={{ background: '#fff', border: '1px solid #e8eeff' }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,#0b1f4e 0%,#1f7a8c 100%)', padding: '2rem' }}>
              <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                <div>
                  <h2 className="fw-bold text-white mb-2">Mes livraisons</h2>
                  <p className="mb-0 text-white-50">Notez votre livreur ou signalez un problème après chaque livraison.</p>
                </div>
                <Link to="/profile" className="btn btn-light rounded-pill px-4 fw-semibold">
                  <i className="fas fa-arrow-left me-2"></i>Retour
                </Link>
              </div>
            </div>

            <div className="p-4 p-md-5">

              {/* Message global succès/erreur */}
              {successMsg && (
                <div className="alert alert-success rounded-3 mb-4 d-flex align-items-start gap-2">
                  <i className="fas fa-check-circle mt-1"></i>
                  <span>{successMsg}</span>
                </div>
              )}

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-grow text-primary mb-3" role="status"></div>
                  <p className="text-muted">Chargement...</p>
                </div>
              ) : deliveredOrders.length === 0 ? (
                <div className="text-center py-5">
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                    style={{ width: 72, height: 72, background: '#f0f5ff' }}>
                    <i className="fas fa-truck fa-2x" style={{ color: '#6b8fe0' }}></i>
                  </div>
                  <h5 className="fw-bold text-dark">Aucune livraison à évaluer</h5>
                  <p className="text-muted">Les commandes livrées apparaîtront ici.</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {deliveredOrders.map(order => {
                    const isReviewOpen    = activePanel?.type === 'review'    && activePanel.orderId === order.id
                    const isComplaintOpen = activePanel?.type === 'complaint' && activePanel.orderId === order.id

                    return (
                      <div key={order.id} className="rounded-4 p-4"
                        style={{ border: '1px solid #e8eeff', background: '#f8fbff' }}>

                        {/* Infos commande */}
                        <div className="d-flex justify-content-between flex-wrap gap-2 align-items-start mb-3">
                          <div>
                            <div className="fw-bold text-dark">Commande #{order.id}</div>
                            <div className="text-muted small">{formatDate(order.orderDate)}</div>
                          </div>
                          <span className="rounded-pill px-3 py-1"
                            style={{ background: '#eaf7ee', color: '#15803d', fontWeight: 700, fontSize: '0.8rem' }}>
                            <i className="fas fa-check-circle me-2"></i>Livrée
                          </span>
                        </div>

                        <div className="mb-2">
                          <span className="fw-semibold text-dark me-2">Livreur :</span>
                          <span className="text-muted">{order.driverName || 'Livreur assigné'}</span>
                        </div>
                        <div className="mb-3">
                          <span className="fw-semibold text-dark me-2">Adresse :</span>
                          <span className="text-muted">{order.address}</span>
                        </div>

                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                          <div className="fw-bold text-dark">Total : {Number(order.totalAmount).toFixed(2)} DT</div>

                          {/* Boutons actions */}
                          <div className="d-flex gap-2 flex-wrap">
                            {/* Bouton évaluation */}
                            <button type="button"
                              className="btn rounded-pill px-3 py-2 fw-semibold"
                              style={{
                                background: isReviewOpen ? '#0b1f4e' : 'linear-gradient(135deg,#0b1f4e,#1f7a8c)',
                                color: '#fff', fontSize: '0.85rem',
                              }}
                              onClick={() => openPanel('review', order.id)}
                            >
                              <i className="fas fa-star me-2"></i>
                              {isReviewOpen ? 'Fermer' : 'Noter cette livraison'}
                            </button>

                            {/* Bouton réclamation */}
                            <button type="button"
                              className="btn rounded-pill px-3 py-2 fw-semibold"
                              style={{
                                background: isComplaintOpen ? '#7f1d1d' : '#fff1f1',
                                color: isComplaintOpen ? '#fff' : '#b91c1c',
                                border: '1px solid #fca5a5',
                                fontSize: '0.85rem',
                              }}
                              onClick={() => openPanel('complaint', order.id)}
                            >
                              <i className="fas fa-exclamation-triangle me-2"></i>
                              {isComplaintOpen ? 'Fermer' : 'Signaler un problème'}
                            </button>
                          </div>
                        </div>

                        {/* Panneau évaluation */}
                        {isReviewOpen && (
                          <div className="mt-3 rounded-4 p-4"
                            style={{ background: '#fff', border: '1px solid #dce9f7' }}>
                            <h6 className="fw-bold mb-3" style={{ color: '#0b1f4e' }}>
                              <i className="fas fa-star me-2 text-warning"></i>
                              Évaluer le livreur
                            </h6>

                            {/* Étoiles */}
                            <div className="d-flex gap-2 mb-3">
                              {[1, 2, 3, 4, 5].map(star => (
                                <button key={star} type="button"
                                  className="btn btn-sm rounded-circle"
                                  style={{
                                    width: 42, height: 42,
                                    background: reviewRating >= star ? '#f59e0b' : '#fff',
                                    color: reviewRating >= star ? '#fff' : '#f59e0b',
                                    border: '2px solid #f59e0b',
                                  }}
                                  onClick={() => setReviewRating(star)}
                                >
                                  <i className="fas fa-star"></i>
                                </button>
                              ))}
                              <span className="ms-2 align-self-center text-muted small">
                                {reviewRating}/5
                              </span>
                            </div>

                            <textarea className="form-control mb-3" rows={3}
                              placeholder="Décrivez votre expérience (optionnel)..."
                              value={reviewComment}
                              onChange={e => setReviewComment(e.target.value)}
                              style={{ borderRadius: '12px', borderColor: '#dce9f7' }}
                            />

                            {errorMsg && <div className="alert alert-danger py-2 mb-3 small">{errorMsg}</div>}

                            <button type="button"
                              className="btn rounded-pill px-4 fw-semibold"
                              style={{ background: 'linear-gradient(135deg,#0b1f4e,#1f7a8c)', color: '#fff' }}
                              onClick={() => handleSubmitReview(order.id)}
                              disabled={submitting}
                            >
                              {submitting
                                ? <><span className="spinner-border spinner-border-sm me-2"></span>Envoi...</>
                                : <><i className="fas fa-paper-plane me-2"></i>Envoyer mon avis</>}
                            </button>
                          </div>
                        )}

                        {/* Panneau réclamation */}
                        {isComplaintOpen && (
                          <div className="mt-3 rounded-4 p-4"
                            style={{ background: '#fff9f9', border: '1px solid #fca5a5' }}>
                            <h6 className="fw-bold mb-1" style={{ color: '#b91c1c' }}>
                              <i className="fas fa-exclamation-triangle me-2"></i>
                              Signaler un problème
                            </h6>
                            <p className="text-muted small mb-3">
                              Votre réclamation sera transmise à notre équipe et affectera l'évaluation du livreur.
                            </p>

                            {/* Catégorie */}
                            <label className="form-label small fw-semibold text-dark">Type de problème</label>
                            <select
                              className="form-select mb-3"
                              value={complaintCategory}
                              onChange={e => setComplaintCategory(e.target.value as ComplaintCategory)}
                              style={{ borderRadius: '12px', borderColor: '#fca5a5', fontSize: '0.9rem' }}
                            >
                              {(Object.entries(COMPLAINT_CATEGORY_LABELS) as [ComplaintCategory, string][]).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                            </select>

                            {/* Description */}
                            <label className="form-label small fw-semibold text-dark">Description du problème *</label>
                            <textarea className="form-control mb-3" rows={3}
                              placeholder="Décrivez le problème rencontré avec précision..."
                              value={complaintDescription}
                              onChange={e => setComplaintDescription(e.target.value)}
                              style={{ borderRadius: '12px', borderColor: '#fca5a5' }}
                            />

                            {errorMsg && <div className="alert alert-danger py-2 mb-3 small">{errorMsg}</div>}

                            <button type="button"
                              className="btn rounded-pill px-4 fw-semibold"
                              style={{ background: '#b91c1c', color: '#fff' }}
                              onClick={() => handleSubmitComplaint(order.id)}
                              disabled={submitting}
                            >
                              {submitting
                                ? <><span className="spinner-border spinner-border-sm me-2"></span>Envoi...</>
                                : <><i className="fas fa-flag me-2"></i>Soumettre la réclamation</>}
                            </button>
                          </div>
                        )}

                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
