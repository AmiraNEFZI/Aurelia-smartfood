import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useCart } from '@/client/context/CartContext'
import { productApi, resolveProductImage } from '@/client/services/api'

interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
  image: string
}

const FALLBACK: Record<number, Product> = {
  1: { id: 1, name: 'Bananes', description: 'Bananes fraîches, riches en potassium. Idéales pour les smoothies et le petit-déjeuner.', price: 2.99, stock: 100, image: '/fruitables/img/fruite-item-3.jpg' },
  2: { id: 2, name: 'Orange Navel', description: 'Oranges juteuses et sucrées, sans pépins. Source de vitamine C.', price: 3.49, stock: 80, image: '/fruitables/img/fruite-item-1.jpg' },
  3: { id: 3, name: 'Raisins Muscat', description: 'Raisins doux et parfumés, parfaits en dessert.', price: 4.99, stock: 60, image: '/fruitables/img/fruite-item-5.jpg' },
  4: { id: 4, name: 'Brocoli', description: 'Brocoli vert frais, riche en fibres et vitamines.', price: 3.35, stock: 50, image: '/fruitables/img/vegetable-item-2.jpg' },
  5: { id: 5, name: 'Tomates Cerises', description: 'Tomates rouges et savoureuses, parfaites pour les salades.', price: 3.99, stock: 70, image: '/fruitables/img/vegetable-item-1.jpg' },
}

export function ShopDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description')

  useEffect(() => {
    if (!id) return
    productApi.getById(Number(id))
      .then(res => setProduct(res.data))
      .catch(() => setProduct(FALLBACK[Number(id)] ?? null))
      .finally(() => setLoading(false))
  }, [id])

  const handleAddToCart = () => {
    if (!product) return
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        productId: product.id,
        name: product.name,
        price: product.price,
        img: resolveProductImage(product.image),
        category: 'Produit',
      })
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleBuyNow = () => {
    handleAddToCart()
    navigate('/cart')
  }

  if (loading) {
    return (
      <div className="text-center py-5 mt-5">
        <div className="spinner-grow text-primary" role="status"></div>
        <p className="mt-3 text-muted">Chargement du produit...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container py-5 text-center mt-5">
        <i className="fas fa-exclamation-circle fa-4x text-muted mb-3"></i>
        <h3 className="text-muted">Produit introuvable</h3>
        <Link to="/shop" className="btn btn-primary rounded-pill px-4 mt-3">
          Retour à la boutique
        </Link>
      </div>
    )
  }

  return (
    <>
      {/* Page Header */}
      <div className="container-fluid page-header py-5">
        <h1 className="text-center text-white display-6">{product.name}</h1>
        <ol className="breadcrumb justify-content-center mb-0">
          <li className="breadcrumb-item"><Link to="/">Accueil</Link></li>
          <li className="breadcrumb-item"><Link to="/shop" className="text-white">Boutique</Link></li>
          <li className="breadcrumb-item active text-white">{product.name}</li>
        </ol>
      </div>

      <div className="container py-5">
        <div className="row g-5 align-items-start">
          {/* Product image */}
          <div className="col-lg-5">
            <div className="card border-0 shadow-sm p-3" style={{ borderRadius: '16px' }}>
              <img
                src={resolveProductImage(product.image) || '/fruitables/img/hero-img-1.png'}
                onError={e => { e.currentTarget.src = '/fruitables/img/hero-img-1.png' }}
                alt={product.name}
                className="img-fluid w-100"
                style={{ borderRadius: '12px', maxHeight: '400px', objectFit: 'cover' }}
              />
            </div>
          </div>

          {/* Product info */}
          <div className="col-lg-7">
            <div className="mb-2">
              <span className="badge bg-primary rounded-pill px-3 py-2">Qualité sélectionnée</span>
              {product.stock > 0 && product.stock < 10 && (
                <span className="badge bg-primary text-white rounded-pill px-3 py-2 ms-2">Stock limité</span>
              )}
              {product.stock === 0 && (
                <span className="badge bg-danger rounded-pill px-3 py-2 ms-2">Rupture de stock</span>
              )}
            </div>

            <h2 className="fw-bold mb-3">{product.name}</h2>

            <div className="d-flex align-items-center gap-2 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <i key={i} className="fas fa-star text-primary" style={{ fontSize: '16px' }}></i>
              ))}
              <span className="text-muted small ms-1">(12 avis)</span>
            </div>

            <h3 className="text-primary fw-bold mb-4">{product.price.toFixed(2)} DT</h3>

            <p className="text-muted mb-4" style={{ lineHeight: '1.8' }}>{product.description}</p>

            {/* Stock info */}
            <div className="d-flex align-items-center gap-2 mb-4">
              <i className={`fas fa-circle ${product.stock > 0 ? 'text-success' : 'text-danger'}`} style={{ fontSize: '10px' }}></i>
              <small className={product.stock > 0 ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>
                {product.stock > 0 ? `En stock (${product.stock} disponibles)` : 'Rupture de stock'}
              </small>
            </div>

            {/* Quantity + Actions */}
            {product.stock > 0 && (
              <>
                <div className="d-flex align-items-center gap-4 mb-4">
                  <label className="fw-semibold">Quantité :</label>
                  <div className="input-group" style={{ width: '120px' }}>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    >
                      <i className="fa fa-minus" style={{ fontSize: '10px' }}></i>
                    </button>
                    <span className="form-control text-center fw-bold border-secondary">
                      {quantity}
                    </span>
                    <button
                      className="btn btn-outline-secondary"
                      onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                    >
                      <i className="fa fa-plus" style={{ fontSize: '10px' }}></i>
                    </button>
                  </div>
                </div>

                <div className="d-flex gap-3 flex-wrap">
                  <button
                    className={`btn rounded-pill px-4 py-2 fw-bold ${added ? 'btn-success' : 'btn-outline-primary'}`}
                    onClick={handleAddToCart}
                    style={{ transition: 'all 0.3s', minWidth: '180px' }}
                  >
                    {added ? (
                      <><i className="fa fa-check me-2"></i>Ajouté au panier !</>
                    ) : (
                      <><i className="fa fa-shopping-bag me-2"></i>Ajouter au panier</>
                    )}
                  </button>
                  <button
                    className="btn btn-primary rounded-pill px-4 py-2 fw-bold"
                    onClick={handleBuyNow}
                    style={{ minWidth: '150px' }}
                  >
                    <i className="fas fa-bolt me-2"></i>Commander
                  </button>
                </div>
              </>
            )}

            {/* Features */}
            <div className="mt-4 pt-4 border-top">
              <div className="row g-3">
                {[
                  { icon: 'fa-star', text: 'Qualité garantie', color: 'text-success' },
                  { icon: 'fa-truck', text: 'Livraison rapide', color: 'text-primary' },
                  { icon: 'fa-shield-alt', text: 'Service fiable', color: 'text-primary' },
                  { icon: 'fa-undo', text: 'Retour simple', color: 'text-info' },
                ].map((f, i) => (
                  <div key={i} className="col-6">
                    <div className="d-flex align-items-center gap-2">
                      <i className={`fas ${f.icon} ${f.color}`}></i>
                      <small className="text-muted">{f.text}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs: Description & Reviews */}
        <div className="mt-5">
          <ul className="nav nav-tabs border-bottom mb-4">
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold ${activeTab === 'description' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('description')}
              >
                Description
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold ${activeTab === 'reviews' ? 'active text-primary' : 'text-muted'}`}
                onClick={() => setActiveTab('reviews')}
              >
                Avis clients (3)
              </button>
            </li>
          </ul>

          {activeTab === 'description' && (
            <div className="row g-4">
              <div className="col-md-6">
                <p className="text-muted" style={{ lineHeight: '1.8' }}>{product.description}</p>
                <ul className="list-unstyled">
                  {[
                    { label: 'Poids', value: '1 kg' },
                    { label: 'Origine', value: 'Provenance locale' },
                    { label: 'Qualité', value: 'Contrôlée et fiable' },
                    { label: 'Conservation', value: 'Lieu frais et sec' },
                  ].map((row, i) => (
                    <li key={i} className={`d-flex py-2 ${i < 3 ? 'border-bottom' : ''}`}>
                      <span className="text-muted" style={{ minWidth: '140px' }}>{row.label}</span>
                      <span className="fw-semibold">{row.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="row g-4">
              {[
                { name: 'Ahmed M.', rating: 5, date: '12 Juin 2026', text: 'Produit excellent, très frais et de bonne qualité. Livraison rapide !' },
                { name: 'Fatma T.', rating: 4, date: '8 Juin 2026', text: 'Très satisfaite de ma commande. Je recommande vivement SmartFood.' },
                { name: 'Mohamed K.', rating: 5, date: '2 Juin 2026', text: 'Qualité irréprochable, livraison en moins d\'une heure. Parfait !' },
              ].map((r, i) => (
                <div key={i} className="col-md-4">
                  <div className="card border-0 shadow-sm p-3" style={{ borderRadius: '12px' }}>
                    <div className="d-flex align-items-center gap-3 mb-2">
                      <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center text-white fw-bold"
                        style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                        {r.name.charAt(0)}
                      </div>
                      <div>
                        <p className="fw-bold mb-0 small">{r.name}</p>
                        <small className="text-muted">{r.date}</small>
                      </div>
                    </div>
                    <div className="mb-2">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <i key={j} className={`fas fa-star ${j < r.rating ? 'text-primary' : 'text-muted'}`} style={{ fontSize: '12px' }}></i>
                      ))}
                    </div>
                    <p className="text-muted small mb-0 fst-italic">"{r.text}"</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Back to shop */}
        <div className="mt-5 text-center">
          <Link to="/shop" className="btn btn-outline-secondary rounded-pill px-5 py-2">
            <i className="fas fa-arrow-left me-2"></i>Retour à la boutique
          </Link>
        </div>
      </div>
    </>
  )
}
