import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '@/client/context/CartContext'
import { productApi, partnerApi, resolveProductImage } from '@/client/services/api'

interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
  image: string
  partnerAvailable?: boolean
}

// Fallback products when API is not yet connected
const FALLBACK_PRODUCTS: Product[] = [
  { id: 1, name: 'Bananes', description: 'Bananes fraîches, riches en potassium.', price: 2.99, stock: 100, image: '/fruitables/img/fruite-item-3.jpg' },
  { id: 2, name: 'Orange Navel', description: 'Oranges juteuses et sucrées, source de vitamine C.', price: 3.49, stock: 80, image: '/fruitables/img/fruite-item-1.jpg' },
  { id: 3, name: 'Raisins Muscat', description: 'Raisins doux et parfumés, idéaux pour le dessert.', price: 4.99, stock: 60, image: '/fruitables/img/fruite-item-5.jpg' },
  { id: 4, name: 'Brocoli Frais', description: 'Brocoli vert frais, riche en fibres et vitamines.', price: 3.35, stock: 50, image: '/fruitables/img/vegetable-item-2.jpg' },
  { id: 5, name: 'Tomates Cerises', description: 'Tomates cerises rouges, parfaites pour les salades.', price: 3.99, stock: 70, image: '/fruitables/img/vegetable-item-1.jpg' },
]

const features = [
  { icon: 'fa-car-side', title: 'Livraison Rapide', desc: 'Livraison en 2h maximum' },
  { icon: 'fa-shield-alt', title: 'Paiement Sécurisé', desc: '100% sécurisé' },
  { icon: 'fa-leaf', title: 'Large sélection', desc: 'Une gamme complète pour tous les besoins' },
  { icon: 'fa-phone-alt', title: 'Support 24/7', desc: 'Assistance rapide' },
]

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [addedId, setAddedId] = useState<number | null>(null)
  const { addItem } = useCart()

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const res = await productApi.getAll()
        if (!active) return

        const prods: Product[] = Array.isArray(res.data) ? res.data : FALLBACK_PRODUCTS

        // Enrichir chaque produit en rupture avec la disponibilité partenaire
        const enriched = await Promise.all(
          prods.map(async (p) => {
            if (p.stock === 0) {
              try {
                const r = await partnerApi.checkAvailability(p.id)
                return { ...p, partnerAvailable: r.data === true }
              } catch {
                return { ...p, partnerAvailable: false }
              }
            }
            return { ...p, partnerAvailable: undefined }
          })
        )

        if (!active) return
        setProducts(enriched)
      } catch {
        if (active) setProducts(FALLBACK_PRODUCTS)
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  const truncate = (text: string, max = 100) =>
    text.length > max ? `${text.slice(0, max).trimEnd()}...` : text

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      img: resolveProductImage(product.image),
      category: 'Produit',
    })
    setAddedId(product.id)
    setTimeout(() => setAddedId(null), 1500)
  }

  return (
    <>
      {/* ── HERO ── */}
      <div className="container-fluid py-5 mb-5 hero-header">
        <div className="container py-5">
          <div className="row g-5 align-items-center">
            <div className="col-md-12 col-lg-7">
              <h4 className="mb-3 text-secondary">Votre marketplace de livraison rapide</h4>
              <h1 className="mb-5 display-3 text-primary">Aurelia Smart Food : votre quotidien simplifié</h1>
              <p className="mb-4 text-muted fs-5">Découvrez une large sélection de produits de qualité, avec un service fiable et des livraisons rapides.</p>
              <div className="d-flex gap-3">
                <Link to="/shop" className="btn btn-primary border-secondary py-3 px-4 rounded-pill text-white">
                  <i className="fas fa-store me-2"></i>Voir la Boutique
                </Link>
                <Link to="/register" className="btn btn-outline-secondary py-3 px-4 rounded-pill">
                  Créer un compte
                </Link>
              </div>
            </div>
            <div className="col-md-12 col-lg-5">
              <div id="heroCarousel" className="carousel slide position-relative" data-bs-ride="carousel">
                <div className="carousel-inner" role="listbox">
                  <div className="carousel-item active rounded overflow-hidden">
                    <img src="/fruitables/img/banner-fruits.jpg" className="img-fluid w-100 h-100 rounded" alt="Fruits frais" />
                    <Link to="/shop" className="btn btn-primary px-4 py-2 rounded position-absolute" style={{ bottom: '24px', left: '24px' }}>
                      Découvrir
                    </Link>
                  </div>
                  <div className="carousel-item rounded overflow-hidden">
                    <img src="/fruitables/img/hero-img-2.jpg" className="img-fluid w-100 h-100 rounded" alt="Produits frais" />
                    <Link to="/shop" className="btn btn-primary px-4 py-2 rounded position-absolute" style={{ bottom: '24px', left: '24px' }}>
                      Explorer
                    </Link>
                  </div>
                </div>
                <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
                  <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                  <span className="visually-hidden">Précédent</span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
                  <span className="carousel-control-next-icon" aria-hidden="true"></span>
                  <span className="visually-hidden">Suivant</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div className="container-fluid featurs py-5">
        <div className="container py-5">
          <div className="row g-4">
            {features.map((f, i) => (
              <div key={i} className="col-md-6 col-lg-3">
                <div className="featurs-item text-center rounded bg-light p-4">
                  <div className="featurs-icon btn-square rounded-circle bg-secondary mb-5 mx-auto">
                    <i className={`fas ${f.icon} fa-3x text-white`}></i>
                  </div>
                  <div className="featurs-content text-center">
                    <h5>{f.title}</h5>
                    <p className="mb-0">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRODUCTS ── */}
      <div className="container-fluid fruite py-5">
        <div className="container py-5">
          <div className="text-center mb-5">
            <h4 className="text-primary">Notre sélection</h4>
            <h1 className="display-5">Produits de qualité pour votre quotidien</h1>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-grow text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : (
            <div className="row g-4">
              {products.map(product => (
                <div key={product.id} className="col-md-6 col-lg-4 col-xl-3">
                  <div className="rounded position-relative fruite-item h-100" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="fruite-img" style={{ overflow: 'hidden', borderRadius: '8px 8px 0 0' }}>
                      <Link to={`/shop/${product.id}`}>
                        <img
                          src={resolveProductImage(product.image) || '/fruitables/img/hero-img-1.png'}
                          className="img-fluid w-100"
                          alt={product.name}
                          style={{ height: '200px', objectFit: 'cover', transition: 'transform 0.3s' }}
                          onError={e => { e.currentTarget.src = '/fruitables/img/hero-img-1.png' }}
                          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                        />
                      </Link>
                    </div>
                    {product.stock < 10 && product.stock > 0 && (
                      <div className="text-white bg-primary px-3 py-1 rounded position-absolute" style={{ top: '10px', left: '10px', fontSize: '11px' }}>
                        Stock limité
                      </div>
                    )}
                    {product.stock === 0 && product.partnerAvailable === true && (
                      <div className="text-white px-3 py-1 rounded position-absolute" style={{ top: '10px', left: '10px', fontSize: '11px', backgroundColor: '#6366f1' }}>
                        🤝 Via partenaire
                      </div>
                    )}
                    {product.stock === 0 && product.partnerAvailable !== true && (
                      <div className="text-white bg-danger px-3 py-1 rounded position-absolute" style={{ top: '10px', left: '10px', fontSize: '11px' }}>
                        Rupture de stock
                      </div>
                    )}
                    <div className="p-4 border border-secondary border-top-0 rounded-bottom flex-grow-1 d-flex flex-column justify-content-between">
                      <div>
                        <Link to={`/shop/${product.id}`} className="text-decoration-none text-dark">
                          <h5 className="mb-2">{product.name}</h5>
                        </Link>
                        <p className="text-muted small mb-3" style={{ minHeight: '40px' }}>{truncate(product.description, 90)}</p>
                      </div>
                      <div className="d-flex justify-content-between align-items-center">
                        <p className="text-dark fs-5 fw-bold mb-0">{product.price.toFixed(2)} DT</p>
                        <button
                          className={`btn rounded-pill px-3 ${addedId === product.id ? 'btn-success' : 'btn-outline-primary'}`}
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0 && product.partnerAvailable !== true}
                          style={{ transition: 'all 0.3s', fontSize: '13px' }}
                        >
                          {addedId === product.id ? (
                            <><i className="fa fa-check me-1"></i>Ajouté !</>
                          ) : product.stock === 0 && product.partnerAvailable !== true ? (
                            <>Indisponible</>
                          ) : (
                            <><i className="fa fa-shopping-bag me-1"></i>Ajouter</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-5">
            <Link to="/shop" className="btn btn-primary rounded-pill px-5 py-3">
              <i className="fas fa-store me-2"></i>Voir tous les produits
            </Link>
          </div>
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div className="container-fluid py-5 bg-light">
        <div className="container py-5">
          <div className="text-center mb-5">
            <h4 className="text-primary">Comment ça marche ?</h4>
            <h1 className="display-5">Simple et rapide</h1>
          </div>
          <div className="row g-4 text-center">
            {[
              { step: '1', icon: 'fa-store', title: 'Parcourez', desc: 'Découvrez notre catalogue de produits du quotidien.' },
              { step: '2', icon: 'fa-shopping-cart', title: 'Ajoutez au panier', desc: 'Choisissez vos articles et progressez en un clic.' },
              { step: '3', icon: 'fa-user-plus', title: 'Connectez-vous', desc: 'Créez un compte ou connectez-vous pour valider votre commande.' },
              { step: '4', icon: 'fa-truck', title: 'Recevez', desc: 'Votre commande est livrée chez vous en moins de 2 heures.' },
            ].map((s, i) => (
              <div key={i} className="col-md-6 col-lg-3">
                <div className="bg-white rounded p-4 shadow-sm h-100">
                  <div className="rounded-circle bg-primary d-inline-flex align-items-center justify-content-center mb-3"
                    style={{ width: '60px', height: '60px' }}>
                    <i className={`fas ${s.icon} fa-xl text-white`}></i>
                  </div>
                  <div className="badge bg-secondary rounded-pill mb-2">Étape {s.step}</div>
                  <h5 className="fw-bold">{s.title}</h5>
                  <p className="text-muted small mb-0">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TESTIMONIALS ── */}
      <div className="container-fluid py-5">
        <div className="container py-5">
          <div className="text-center mb-5">
            <h4 className="text-primary">Témoignages</h4>
            <h1 className="display-5">Ce que disent nos clients</h1>
          </div>
          <div className="row g-4 justify-content-center">
            {[
              { name: 'Ahmed Ben Ali', role: 'Client fidèle', text: 'SmartFood me livre des produits incroyablement frais. La qualité est toujours au rendez-vous !' },
              { name: 'Fatma Trabelsi', role: 'Chef cuisinière', text: 'J\'utilise SmartFood pour mon restaurant. Toujours livré à temps avec une qualité parfaite.' },
              { name: 'Mohamed Gharbi', role: 'Coach sportif', text: 'Service de proximité fiable et produits bien sélectionnés. Je recommande Aurelia Smart Food.' },
            ].map((t, i) => (
              <div key={i} className="col-md-6 col-lg-4">
                <div className="testimonial-item img-border-radius bg-light rounded p-4 h-100">
                  <div className="position-relative">
                    <i className="fa fa-quote-right fa-2x text-secondary position-absolute" style={{ bottom: '30px', right: '0' }}></i>
                    <div className="mb-4 pb-4 border-bottom border-secondary">
                      <p className="mb-0 fst-italic">"{t.text}"</p>
                    </div>
                    <div className="d-flex align-items-center">
                      <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                        style={{ width: '55px', height: '55px', fontSize: '20px', flexShrink: 0 }}>
                        {t.name.charAt(0)}
                      </div>
                      <div className="ms-3">
                        <h6 className="text-dark fw-bold mb-0">{t.name}</h6>
                        <small className="text-muted">{t.role}</small>
                        <div className="mt-1">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <i key={j} className="fas fa-star text-primary" style={{ fontSize: '12px' }}></i>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
