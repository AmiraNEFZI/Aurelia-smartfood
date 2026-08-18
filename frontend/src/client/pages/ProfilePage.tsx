import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/client/context/AuthContext'
import { orderApi, type DriverReviewPayload } from '@/client/services/api'

interface OrderSummary {
  id: number
  status: string
  totalAmount: number
  orderDate: string
  address: string
  items: { productName: string; quantity: number; unitPrice: number }[]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  EN_ATTENTE:      { label: 'En attente',      color: '#f59e0b', icon: 'fa-clock' },
  CONFIRMEE:       { label: 'Confirmée',        color: '#3b82f6', icon: 'fa-check' },
  EN_PREPARATION:  { label: 'En préparation',   color: '#8b5cf6', icon: 'fa-box-open' },
  PRISE_EN_CHARGE: { label: 'Livreur assigné',  color: '#0ea5e9', icon: 'fa-motorcycle' },
  EN_LIVRAISON:    { label: 'En livraison',     color: '#10b981', icon: 'fa-truck' },
  LIVREE:          { label: 'Livrée',           color: '#22c55e', icon: 'fa-check-circle' },
  ANNULEE:         { label: 'Annulée',          color: '#ef4444', icon: 'fa-times-circle' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-TN', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function ProfilePage() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders]               = useState<OrderSummary[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null)
  const [showHistory, setShowHistory]     = useState(false)
  const [reviewingOrderId, setReviewingOrderId] = useState<number | null>(null)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewMessage, setReviewMessage] = useState<string | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return
    orderApi.getMyOrders()
      .then(res => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoadingOrders(false))
  }, [isAuthenticated])

  const handleLogout = () => { logout(); navigate('/') }

  const handleSubmitReview = async (orderId: number) => {
    setReviewError(null)
    setReviewMessage(null)
    try {
      const payload: DriverReviewPayload = { rating: reviewRating, comment: reviewComment.trim() || undefined }
      await orderApi.submitReview(orderId, payload)
      setReviewMessage('Merci ! Votre évaluation a bien été enregistrée.')
      setReviewingOrderId(null)
      setReviewComment('')
      setReviewRating(5)
    } catch (err: any) {
      setReviewError(err?.response?.data?.message || 'Impossible d’enregistrer votre évaluation pour le moment.')
    }
  }

  /* ── Non connecté ── */
  if (!isAuthenticated || !user) {
    return (
      <div className="container py-5">
        <div className="text-center py-5">
          <div
            className="rounded-circle d-inline-flex align-items-center justify-content-center mb-4"
            style={{ width: 80, height: 80, background: 'linear-gradient(135deg,#0b1f4e,#274181)' }}
          >
            <i className="fas fa-user-lock fa-2x text-white"></i>
          </div>
          <h4 className="fw-bold mb-2">Accès réservé</h4>
          <p className="text-muted mb-4">Vous devez être connecté pour accéder à votre profil.</p>
          <Link to="/login" className="btn btn-primary rounded-pill px-5 py-2 fw-semibold">
            <i className="fas fa-sign-in-alt me-2"></i>Se connecter
          </Link>
        </div>
      </div>
    )
  }

  const initials      = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
  const totalSpent    = orders.filter(o => o.status !== 'ANNULEE').reduce((s, o) => s + Number(o.totalAmount), 0)
  const deliveredCount = orders.filter(o => o.status === 'LIVREE').length
  const pendingCount   = orders.filter(o => !['LIVREE','ANNULEE'].includes(o.status)).length

  return (
    <>
      {/* ── HERO BANNER ── */}
      <div style={{
        background: 'linear-gradient(135deg,#0b1f4e 0%,#274181 60%,#1a4a9c 100%)',
        paddingTop: '3.5rem', paddingBottom: '6rem',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:280, height:280, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />
        <div style={{ position:'absolute', bottom:-80, left:-40, width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,0.03)' }} />

        <div className="container">
          {/* centré */}
          <div className="d-flex flex-column align-items-center text-center gap-3">
            {/* Avatar */}
            <div style={{
              width:90, height:90, borderRadius:'50%',
              background:'linear-gradient(135deg,#4f8ef7,#a78bfa)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'2rem', fontWeight:800, color:'#fff',
              border:'4px solid rgba(255,255,255,0.3)',
              boxShadow:'0 8px 32px rgba(0,0,0,0.25)',
            }}>
              {initials}
            </div>

            {/* Nom + rôle */}
            <div>
              <h2 className="text-white fw-bold mb-1" style={{ fontSize:'1.7rem' }}>
                {user.firstName} {user.lastName}
              </h2>
              <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
                <span style={{
                  background:'rgba(255,255,255,0.15)', color:'#fff',
                  borderRadius:20, padding:'3px 14px', fontSize:'0.82rem', fontWeight:600,
                  backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.2)',
                }}>
                  <i className="fas fa-user-tag me-1"></i>
                  {user.role === 'CLIENT' ? 'Client' : user.role === 'ADMIN' ? 'Administrateur' : 'Livreur'}
                </span>
                <span style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.85rem' }}>
                  <i className="fas fa-envelope me-1"></i>{user.email}
                </span>
              </div>
            </div>

            {/* Bouton déconnexion */}
            <button onClick={handleLogout} className="btn rounded-pill px-4 py-2" style={{
              background:'rgba(255,255,255,0.12)', color:'#fff',
              border:'1px solid rgba(255,255,255,0.25)', fontWeight:600, backdropFilter:'blur(8px)',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.7)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}>
              <i className="fas fa-sign-out-alt me-2"></i>Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* ── STATS STRIP ── */}
      <div className="container" style={{ marginTop:'-3rem', position:'relative', zIndex:10 }}>
        <div className="row g-3 justify-content-center">
          {[
            { icon:'fa-shopping-bag', label:'Commandes',     value:orders.length,                  color:'#4f8ef7', bg:'#eff6ff' },
            { icon:'fa-check-circle', label:'Livrées',       value:deliveredCount,                  color:'#22c55e', bg:'#f0fdf4' },
            { icon:'fa-clock',        label:'En cours',      value:pendingCount,                    color:'#f59e0b', bg:'#fffbeb' },
            { icon:'fa-wallet',       label:'Total dépensé', value:`${totalSpent.toFixed(2)} DT`,   color:'#8b5cf6', bg:'#faf5ff' },
          ].map((stat, i) => (
            <div key={i} className="col-6 col-md-3">
              <div className="d-flex align-items-center gap-3 p-3 rounded-4 h-100" style={{
                background:'#fff', boxShadow:'0 4px 24px rgba(11,31,78,0.10)',
                border:'1px solid rgba(11,31,78,0.06)',
              }}>
                <div className="d-flex align-items-center justify-content-center rounded-3"
                  style={{ width:44, height:44, background:stat.bg, flexShrink:0 }}>
                  <i className={`fas ${stat.icon}`} style={{ color:stat.color, fontSize:'1.1rem' }}></i>
                </div>
                <div>
                  <div className="fw-bold" style={{ fontSize:'1.15rem', color:'#0b1f4e' }}>{stat.value}</div>
                  <div className="text-muted" style={{ fontSize:'0.78rem' }}>{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROFILE INFO CARD (centré) ── */}
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-lg-6 col-md-8">
            <div className="rounded-4" style={{
              background:'#fff', boxShadow:'0 4px 24px rgba(11,31,78,0.09)',
              border:'1px solid rgba(11,31,78,0.06)', overflow:'hidden',
            }}>
              {/* En-tête card */}
              <div style={{
                background:'linear-gradient(135deg,#f0f5ff,#e8eeff)',
                padding:'1.25rem 1.5rem',
                borderBottom:'1px solid rgba(11,31,78,0.08)',
              }}>
                <h5 className="fw-bold mb-0" style={{ color:'#0b1f4e' }}>
                  <i className="fas fa-id-card me-2" style={{ color:'#4f8ef7' }}></i>
                  Informations personnelles
                </h5>
              </div>

              <div className="p-4">
                {/* Champs */}
                {[
                  { icon:'fa-user',    label:'Prénom',    value:user.firstName },
                  { icon:'fa-user',    label:'Nom',       value:user.lastName },
                  { icon:'fa-envelope',label:'Email',     value:user.email },
                  { icon:'fa-phone',   label:'Téléphone', value:user.phone || 'Non renseigné' },
                ].map((field, i) => (
                  <div key={i} className="mb-3">
                    <label style={{
                      fontSize:'0.75rem', fontWeight:700, color:'#8898aa',
                      textTransform:'uppercase', letterSpacing:'0.06em',
                    }}>
                      {field.label}
                    </label>
                    <div className="d-flex align-items-center gap-2 rounded-3 px-3 py-2" style={{
                      background:'#f8faff', border:'1px solid #e2eaf8',
                      fontSize:'0.93rem', color:'#0b1f4e', fontWeight:500,
                    }}>
                      <i className={`fas ${field.icon} text-muted`} style={{ fontSize:'0.8rem', opacity:0.6 }}></i>
                      {field.value}
                    </div>
                  </div>
                ))}

                {/* Rôle badge */}
                <div className="mt-4 pt-3" style={{ borderTop:'1px solid #e8eeff' }}>
                  <label style={{
                    fontSize:'0.75rem', fontWeight:700, color:'#8898aa',
                    textTransform:'uppercase', letterSpacing:'0.06em',
                  }}>
                    Rôle
                  </label>
                  <div className="mt-1">
                    <span className="rounded-pill px-3 py-1 d-inline-flex align-items-center gap-2" style={{
                      background:'#eff6ff', color:'#1d4ed8', fontWeight:700,
                      fontSize:'0.85rem', border:'1px solid #bfdbfe',
                    }}>
                      <i className="fas fa-shield-alt" style={{ fontSize:'0.75rem' }}></i>
                      {user.role === 'CLIENT' ? 'Client' : user.role === 'ADMIN' ? 'Administrateur' : 'Livreur'}
                    </span>
                  </div>
                </div>

                {/* Actions rapides */}
                <div className="mt-4 d-flex flex-column gap-2">
                  <Link to="/shop" className="btn rounded-3 py-2 fw-semibold" style={{
                    background:'linear-gradient(135deg,#0b1f4e,#274181)', color:'#fff', fontSize:'0.9rem',
                  }}>
                    <i className="fas fa-store me-2"></i>Parcourir la boutique
                  </Link>
                  <Link to="/cart" className="btn rounded-3 py-2 fw-semibold" style={{
                    background:'#f0f5ff', color:'#0b1f4e',
                    border:'1px solid #c7d7f8', fontSize:'0.9rem',
                  }}>
                    <i className="fas fa-shopping-cart me-2"></i>Mon panier
                  </Link>

                  {/* ── Bouton toggle historique ── */}
                  <button
                    type="button"
                    onClick={() => setShowHistory(h => !h)}
                    className="btn rounded-3 py-2 fw-semibold d-flex align-items-center justify-content-between"
                    style={{
                      background: showHistory ? '#0b1f4e' : '#f0f5ff',
                      color:      showHistory ? '#fff'    : '#0b1f4e',
                      border:     showHistory ? 'none'    : '1px solid #c7d7f8',
                      fontSize:'0.9rem',
                      transition:'all .2s',
                    }}
                  >
                    <span>
                      <i className="fas fa-receipt me-2"></i>
                      Historique des commandes
                      {orders.length > 0 && (
                        <span className="ms-2 badge rounded-pill" style={{
                          background: showHistory ? 'rgba(255,255,255,0.25)' : '#0b1f4e',
                          color:'#fff', fontSize:'0.72rem',
                        }}>
                          {orders.length}
                        </span>
                      )}
                    </span>
                    <i className={`fas fa-chevron-${showHistory ? 'up' : 'down'} ms-2`}
                      style={{ fontSize:'0.8rem', opacity:0.7 }}></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── HISTORIQUE (visible seulement si showHistory) ── */}
      {showHistory && (
        <div className="container pb-4">
          <div className="row justify-content-center">
            <div className="col-lg-8 col-md-10">
              <div className="rounded-4" style={{
                background:'#fff', boxShadow:'0 4px 24px rgba(11,31,78,0.09)',
                border:'1px solid rgba(11,31,78,0.06)', overflow:'hidden',
              }}>
                {/* En-tête */}
                <div style={{
                  background:'linear-gradient(135deg,#f0f5ff,#e8eeff)',
                  padding:'1.25rem 1.5rem',
                  borderBottom:'1px solid rgba(11,31,78,0.08)',
                }} className="d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0" style={{ color:'#0b1f4e' }}>
                    <i className="fas fa-receipt me-2" style={{ color:'#4f8ef7' }}></i>
                    Historique des commandes
                  </h5>
                  <span className="badge rounded-pill px-3 py-2"
                    style={{ background:'#0b1f4e', color:'#fff', fontSize:'0.8rem' }}>
                    {orders.length} commande{orders.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="p-4">
                  {loadingOrders ? (
                    <div className="text-center py-5">
                      <div className="spinner-grow text-primary mb-3" role="status"></div>
                      <p className="text-muted">Chargement de vos commandes...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-5">
                      <div className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                        style={{ width:72, height:72, background:'#f0f5ff' }}>
                        <i className="fas fa-shopping-bag fa-2x" style={{ color:'#c7d7f8' }}></i>
                      </div>
                      <h6 className="fw-bold mb-1" style={{ color:'#0b1f4e' }}>Aucune commande</h6>
                      <p className="text-muted mb-4" style={{ fontSize:'0.9rem' }}>
                        Vous n'avez pas encore passé de commande.
                      </p>
                      <Link to="/shop" className="btn rounded-pill px-4 py-2 fw-semibold"
                        style={{ background:'linear-gradient(135deg,#0b1f4e,#274181)', color:'#fff' }}>
                        <i className="fas fa-store me-2"></i>Découvrir la boutique
                      </Link>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {orders.map(order => {
                        const cfg = STATUS_CONFIG[order.status] ?? { label:order.status, color:'#6b7280', icon:'fa-circle' }
                        const isExpanded = expandedOrder === order.id

                        return (
                          <div key={order.id} className="rounded-3" style={{
                            border:'1.5px solid',
                            borderColor: isExpanded ? '#c7d7f8' : '#eef2fb',
                            background:  isExpanded ? '#f8fbff'  : '#fff',
                            transition:'all .2s', overflow:'hidden',
                          }}>
                            {/* Ligne résumé commande */}
                            <div className="d-flex align-items-center gap-3 p-3 flex-wrap"
                              style={{ cursor:'pointer' }}
                              onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                              <div className="d-flex align-items-center justify-content-center rounded-circle shrink-0"
                                style={{ width:40, height:40, background:`${cfg.color}18` }}>
                                <i className={`fas ${cfg.icon}`} style={{ color:cfg.color, fontSize:'1rem' }}></i>
                              </div>
                              <div className="grow">
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                  <span className="fw-bold" style={{ color:'#0b1f4e', fontSize:'0.95rem' }}>
                                    Commande #{order.id}
                                  </span>
                                  <span className="rounded-pill px-2" style={{
                                    background:`${cfg.color}18`, color:cfg.color,
                                    fontSize:'0.75rem', fontWeight:700,
                                    border:`1px solid ${cfg.color}30`, lineHeight:'1.8',
                                  }}>
                                    {cfg.label}
                                  </span>
                                </div>
                                <div style={{ fontSize:'0.8rem', color:'#8898aa' }}>
                                  <i className="fas fa-calendar me-1"></i>{formatDate(order.orderDate)}
                                </div>
                              </div>
                              <div className="d-flex align-items-center gap-3">
                                <div className="text-end">
                                  <div className="fw-bold" style={{ color:'#0b1f4e', fontSize:'1.05rem' }}>
                                    {Number(order.totalAmount).toFixed(2)} DT
                                  </div>
                                  <div style={{ fontSize:'0.75rem', color:'#8898aa' }}>
                                    {order.items.length} article{order.items.length > 1 ? 's' : ''}
                                  </div>
                                </div>
                                <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'}`}
                                  style={{ color:'#8898aa', fontSize:'0.8rem' }}></i>
                              </div>
                            </div>

                            {/* Détails dépliables */}
                            {isExpanded && (
                              <div style={{
                                borderTop:'1px solid #eef2fb', padding:'1rem 1.25rem',
                                background:'#f8fbff',
                              }}>
                                {/* Adresse */}
                                <div className="d-flex align-items-start gap-2 mb-3 p-2 rounded-3"
                                  style={{ background:'#fff', border:'1px solid #eef2fb' }}>
                                  <i className="fas fa-map-marker-alt mt-1" style={{ color:'#4f8ef7', fontSize:'0.85rem' }}></i>
                                  <div>
                                    <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#8898aa', textTransform:'uppercase', letterSpacing:'0.05em' }}>Adresse</div>
                                    <div style={{ fontSize:'0.88rem', color:'#0b1f4e', fontWeight:500 }}>{order.address}</div>
                                  </div>
                                </div>

                                {/* Articles */}
                                <div style={{ fontSize:'0.82rem', fontWeight:700, color:'#8898aa', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.5rem' }}>
                                  Articles
                                </div>
                                <div className="d-flex flex-column gap-1 mb-3">
                                  {order.items.map((item, i) => (
                                    <div key={i} className="d-flex justify-content-between align-items-center px-3 py-2 rounded-3"
                                      style={{ background: i % 2 === 0 ? '#fff' : '#f8faff', border:'1px solid #eef2fb' }}>
                                      <div className="d-flex align-items-center gap-2">
                                        <div className="d-flex align-items-center justify-content-center rounded-2"
                                          style={{ width:24, height:24, background:'#eff6ff', fontSize:'0.7rem', color:'#4f8ef7', fontWeight:700 }}>
                                          {item.quantity}
                                        </div>
                                        <span style={{ fontWeight:500, color:'#0b1f4e' }}>{item.productName}</span>
                                      </div>
                                      <span style={{ fontWeight:700, color:'#4f8ef7', fontSize:'0.88rem' }}>
                                        {(item.unitPrice * item.quantity).toFixed(2)} DT
                                      </span>
                                    </div>
                                  ))}
                                </div>

                                {/* Footer */}
                                <div className="d-flex justify-content-between align-items-center pt-2 flex-wrap gap-2"
                                  style={{ borderTop:'1px dashed #c7d7f8' }}>
                                  <span style={{ fontSize:'0.88rem', color:'#8898aa' }}>
                                    <i className="fas fa-money-bill-wave me-1" style={{ color:'#22c55e' }}></i>
                                    Paiement à la livraison
                                  </span>
                                  <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <span className="fw-bold" style={{ color:'#0b1f4e', fontSize:'1rem' }}>
                                      Total : {Number(order.totalAmount).toFixed(2)} DT
                                    </span>
                                    {order.status === 'LIVREE' && (
                                      <button
                                        type="button"
                                        className="btn btn-sm rounded-pill px-3"
                                        style={{ background:'#f0f5ff', color:'#0b1f4e', border:'1px solid #c7d7f8' }}
                                        onClick={() => setReviewingOrderId(reviewingOrderId === order.id ? null : order.id)}
                                      >
                                        <i className="fas fa-star me-2"></i>
                                        {reviewingOrderId === order.id ? 'Fermer' : 'Noter le livreur'}
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {order.status === 'LIVREE' && reviewingOrderId === order.id && (
                                  <div className="mt-3 rounded-4 p-3" style={{ background:'linear-gradient(135deg,#f8fbff,#f3f7ff)', border:'1px solid #dce9f7' }}>
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                      <i className="fas fa-star" style={{ color:'#f59e0b' }}></i>
                                      <span className="fw-bold" style={{ color:'#0b1f4e' }}>Évaluer votre livraison</span>
                                    </div>
                                    <p className="mb-3" style={{ fontSize:'0.9rem', color:'#4b5563' }}>
                                      Votre avis aide Aurelia Smart Food à maintenir un service fiable et professionnel.
                                    </p>

                                    <div className="d-flex gap-2 mb-3">
                                      {[1,2,3,4,5].map(star => (
                                        <button
                                          key={star}
                                          type="button"
                                          className="btn btn-sm rounded-circle"
                                          style={{ width:40, height:40, background: reviewRating >= star ? '#f59e0b' : '#fff', color: reviewRating >= star ? '#fff' : '#f59e0b', border:'1px solid #f59e0b' }}
                                          onClick={() => setReviewRating(star)}
                                        >
                                          <i className="fas fa-star"></i>
                                        </button>
                                      ))}
                                    </div>

                                    <textarea
                                      className="form-control mb-3"
                                      rows={3}
                                      placeholder="Partagez votre expérience avec le livreur..."
                                      value={reviewComment}
                                      onChange={e => setReviewComment(e.target.value)}
                                      style={{ borderColor:'#dce9f7', borderRadius:'14px' }}
                                    />

                                    {reviewMessage && <div className="alert alert-success py-2 mb-3">{reviewMessage}</div>}
                                    {reviewError && <div className="alert alert-danger py-2 mb-3">{reviewError}</div>}

                                    <button
                                      type="button"
                                      className="btn rounded-pill px-4 fw-semibold"
                                      style={{ background:'linear-gradient(135deg,#0b1f4e,#1f7a8c)', color:'#fff' }}
                                      onClick={() => handleSubmitReview(order.id)}
                                    >
                                      <i className="fas fa-paper-plane me-2"></i>Envoyer l’évaluation
                                    </button>
                                  </div>
                                )}
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
      )}

      {/* ── BOTTOM CTA ── */}
      <div className="container pb-5">
        <div className="rounded-4 p-4 d-flex align-items-center justify-content-between flex-wrap gap-3" style={{
          background:'linear-gradient(135deg,#0b1f4e,#274181)',
          boxShadow:'0 8px 32px rgba(11,31,78,0.25)',
        }}>
          <div>
            <h5 className="text-white fw-bold mb-1">Envie de quelque chose de frais ?</h5>
            <p className="mb-0" style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.9rem' }}>
              Découvrez notre sélection de produits frais livrés chez vous en 2h.
            </p>
          </div>
          <Link to="/shop" className="btn rounded-pill px-5 py-2 fw-bold"
            style={{ background:'#fff', color:'#0b1f4e', fontSize:'0.95rem', flexShrink:0 }}>
            <i className="fas fa-store me-2"></i>Commander maintenant
          </Link>
        </div>
      </div>
    </>
  )
}
