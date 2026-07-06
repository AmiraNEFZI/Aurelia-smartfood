import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '@/client/context/CartContext'
import { useAuth } from '@/client/context/AuthContext'

export function CartPage() {
  const { items, removeItem, updateQty, subtotal, clearCart } = useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const shipping = items.length > 0 ? 2.0 : 0
  const total = subtotal + shipping

  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Redirect to login with return path
      navigate('/login?redirect=/checkout')
    } else {
      navigate('/checkout')
    }
  }

  return (
    <>
      {/* Page Header */}
      <div className="container-fluid page-header py-5" style={{ background: '#F8FFF0', padding: '40px 0', minHeight: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <h1 className="text-center text-dark display-6" style={{ marginBottom: '8px' }}>Mon Panier</h1>
        <ol className="breadcrumb justify-content-center mb-0" style={{ display: 'flex', gap: '8px', listStyle: 'none', padding: 0, margin: 0 }}>
          <li className="breadcrumb-item"><Link to="/" style={{ color: '#4B5E20', textDecoration: 'none' }}>Accueil</Link></li>
          <li style={{ color: '#8FA673' }}>/</li>
          <li className="breadcrumb-item"><Link to="/shop" style={{ color: '#4B5E20', textDecoration: 'none' }}>Boutique</Link></li>
          <li style={{ color: '#8FA673' }}>/</li>
          <li className="breadcrumb-item active text-dark" style={{ color: '#2E4B14' }}>Panier</li>
        </ol>
      </div>

      <div className="container-fluid py-5">
        <div className="container py-5">
          {items.length === 0 ? (
            /* Empty cart state */
            <div className="text-center py-5">
              <i className="fa fa-shopping-bag fa-5x text-muted mb-4" style={{ opacity: 0.3 }}></i>
              <h3 className="text-muted mb-3">Votre panier est vide</h3>
              <p className="text-muted mb-4">Découvrez nos produits frais et ajoutez-les à votre panier.</p>
              <Link to="/shop" className="btn btn-primary rounded-pill px-5 py-3">
                <i className="fas fa-store me-2"></i>Parcourir la boutique
              </Link>
            </div>
          ) : (
            <div className="row g-5">
              {/* Cart items */}
              <div className="col-lg-8">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-bottom py-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0 fw-bold">
                        <i className="fa fa-shopping-bag text-primary me-2"></i>
                        {items.length} article{items.length > 1 ? 's' : ''}
                      </h5>
                      <button
                        className="btn btn-sm btn-outline-danger rounded-pill"
                        onClick={() => clearCart()}
                      >
                        <i className="fas fa-trash me-1"></i>Vider le panier
                      </button>
                    </div>
                  </div>
                  <div className="card-body p-0">
                    {items.map((item, idx) => (
                      <div key={item.id} className={`d-flex align-items-center p-3 gap-3 ${idx < items.length - 1 ? 'border-bottom' : ''}`}>
                        {/* Product image */}
                        <img
                          src={item.img || '/fruitables/img/hero-img-1.png'}
                          alt={item.name}
                          className="rounded"
                          style={{ width: '75px', height: '75px', objectFit: 'cover', flexShrink: 0 }}
                          onError={e => { e.currentTarget.src = '/fruitables/img/hero-img-1.png' }}
                        />

                        {/* Product info */}
                        <div className="flex-grow-1">
                          <h6 className="fw-bold mb-1">{item.name}</h6>
                          <span className="text-primary fw-bold">{item.price.toFixed(2)} DT</span>
                        </div>

                        {/* Quantity controls */}
                        <div className="input-group" style={{ width: '110px' }}>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => updateQty(item.id, -1)}
                          >
                            <i className="fa fa-minus" style={{ fontSize: '10px' }}></i>
                          </button>
                          <span className="form-control form-control-sm text-center border-secondary fw-bold">
                            {item.quantity}
                          </span>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => updateQty(item.id, 1)}
                          >
                            <i className="fa fa-plus" style={{ fontSize: '10px' }}></i>
                          </button>
                        </div>

                        {/* Subtotal */}
                        <div className="text-end" style={{ minWidth: '80px' }}>
                          <p className="fw-bold text-dark mb-0">{(item.price * item.quantity).toFixed(2)} DT</p>
                        </div>

                        {/* Remove */}
                        <button
                          className="btn btn-sm btn-outline-danger rounded-circle"
                          onClick={() => removeItem(item.id)}
                          style={{ width: '32px', height: '32px', padding: 0 }}
                          title="Supprimer"
                        >
                          <i className="fa fa-times" style={{ fontSize: '11px' }}></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3">
                  <Link to="/shop" className="btn btn-outline-secondary rounded-pill px-4">
                    <i className="fas fa-arrow-left me-2"></i>Continuer mes achats
                  </Link>
                </div>
              </div>

              {/* Order summary */}
              <div className="col-lg-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-white border-bottom py-3">
                    <h5 className="mb-0 fw-bold">Récapitulatif</h5>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="text-muted">Sous-total</span>
                      <span className="fw-bold">{subtotal.toFixed(2)} DT</span>
                    </div>
                    <div className="d-flex justify-content-between mb-3 pb-3 border-bottom">
                      <span className="text-muted">Livraison</span>
                      <span className="text-success fw-bold">
                        {shipping === 0 ? 'Gratuite' : `${shipping.toFixed(2)} DT`}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between mb-4">
                      <span className="fs-5 fw-bold">Total</span>
                      <span className="fs-5 fw-bold text-primary">{total.toFixed(2)} DT</span>
                    </div>

                    <button
                      className="btn btn-primary w-100 py-3 rounded-pill fw-bold"
                      onClick={handleCheckout}
                      style={{ fontSize: '15px' }}
                    >
                      {isAuthenticated ? (
                        <><i className="fas fa-credit-card me-2"></i>Passer la commande</>
                      ) : (
                        <><i className="fas fa-lock me-2"></i>Se connecter pour commander</>
                      )}
                    </button>

                    {!isAuthenticated && (
                      <p className="text-center text-muted small mt-2 mb-0">
                        Vous serez redirigé vers la page de connexion
                      </p>
                    )}

                    {/* Payment info */}
                    <div className="mt-4 p-3 bg-light rounded">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <i className="fas fa-shield-alt text-success"></i>
                        <span className="small fw-bold">Paiement sécurisé</span>
                      </div>
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <i className="fas fa-money-bill-wave text-primary"></i>
                        <span className="small">Paiement à la livraison disponible</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <i className="fas fa-truck text-primary"></i>
                        <span className="small">Livraison en 2h maximum</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
