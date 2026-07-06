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
  // enrichi après chargement
  partnerAvailable?: boolean
}

export function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [maxPrice, setMaxPrice] = useState(20)
  const [loading, setLoading] = useState(true)
  const [addedId, setAddedId] = useState<number | null>(null)
  const { addItem } = useCart()

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      try {
        const res = await productApi.getAll()
        if (!active) return

        const prods: Product[] = Array.isArray(res.data) ? res.data : []

        // Pour les produits en rupture, vérifier disponibilité partenaire
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
        if (active) setProducts([])
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => { active = false }
  }, [])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) && p.price <= maxPrice
  )

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

  // Un produit est commandable si stock Aurelia > 0 OU partenaire disponible
  const isOrderable = (p: Product) => p.stock > 0 || p.partnerAvailable === true

  return (
    <>
      {/* Page Header */}
      <div className="container-fluid page-header py-5">
        <h1 className="text-center text-white display-6">Boutique</h1>
        <ol className="breadcrumb justify-content-center mb-0">
          <li className="breadcrumb-item"><Link to="/">Accueil</Link></li>
          <li className="breadcrumb-item active text-white">Boutique</li>
        </ol>
      </div>

      <div className="container-fluid fruite py-5">
        <div className="container py-5">
          <div className="row g-4">

            {/* Sidebar */}
            <div className="col-lg-3">
              <div className="bg-light rounded p-4 mb-4">
                <h5 className="mb-3 fw-bold">Recherche</h5>
                <div className="input-group">
                  <input type="search" className="form-control" placeholder="Rechercher..."
                    value={search} onChange={e => setSearch(e.target.value)} />
                  <span className="input-group-text bg-primary text-white">
                    <i className="fa fa-search"></i>
                  </span>
                </div>
              </div>

              <div className="bg-light rounded p-4 mb-4">
                <h5 className="mb-3 fw-bold">Prix maximum</h5>
                <input type="range" className="form-range w-100"
                  min="1" max="20" step="0.5" value={maxPrice}
                  onChange={e => setMaxPrice(Number(e.target.value))} />
                <div className="d-flex justify-content-between">
                  <span className="text-muted small">0 DT</span>
                  <span className="text-primary fw-bold">{maxPrice} DT</span>
                </div>
              </div>

              <div className="bg-light rounded p-4">
                <h5 className="mb-3 fw-bold">Produits disponibles</h5>
                <p className="text-primary fw-bold fs-4 mb-0">{filtered.length}</p>
                <small className="text-muted">produit(s) trouvé(s)</small>
              </div>
            </div>

            {/* Products Grid */}
            <div className="col-lg-9">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-grow text-primary" role="status"></div>
                  <p className="mt-3 text-muted">Chargement des produits...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-search fa-4x text-muted mb-3"></i>
                  <h4 className="text-muted">Aucun produit trouvé</h4>
                  <p className="text-muted">Essayez d'autres critères de recherche.</p>
                </div>
              ) : (
                <div className="row g-4">
                  {filtered.map(product => (
                    <div key={product.id} className="col-md-6 col-xl-4">
                      <div
                        className="card border-0 shadow-sm h-100"
                        style={{ borderRadius: '12px', overflow: 'hidden', transition: 'transform 0.2s, box-shadow 0.2s' }}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLDivElement
                          el.style.transform = 'translateY(-4px)'
                          el.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)'
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLDivElement
                          el.style.transform = 'translateY(0)'
                          el.style.boxShadow = ''
                        }}
                      >
                        {/* Image */}
                        <div style={{ position: 'relative', overflow: 'hidden', height: '200px' }}>
                          <img
                            src={resolveProductImage(product.image) || '/fruitables/img/hero-img-1.png'}
                            onError={e => { e.currentTarget.src = '/fruitables/img/hero-img-1.png' }}
                            alt={product.name}
                            className="w-100 h-100"
                            style={{ objectFit: 'cover', transition: 'transform 0.3s' }}
                            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
                            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                          />

                          {/* Badge */}
                          {product.stock === 0 && product.partnerAvailable === true && (
                            <div
                              className="position-absolute top-0 start-0 text-white px-2 py-1 rounded-end"
                              style={{ fontSize: '11px', marginTop: '10px', backgroundColor: '#6366f1' }}
                            >
                              🤝 Via partenaire
                            </div>
                          )}
                          {product.stock === 0 && product.partnerAvailable !== true && (
                            <div
                              className="position-absolute top-0 start-0 bg-danger text-white px-2 py-1 rounded-end"
                              style={{ fontSize: '11px', marginTop: '10px' }}
                            >
                              Rupture de stock
                            </div>
                          )}
                          {product.stock > 0 && product.stock < 10 && (
                            <div
                              className="position-absolute top-0 start-0 bg-primary text-white px-2 py-1 rounded-end"
                              style={{ fontSize: '11px', marginTop: '10px' }}
                            >
                              Stock limité
                            </div>
                          )}
                        </div>

                        {/* Body */}
                        <div className="card-body d-flex flex-column p-3">
                          <Link to={`/shop/${product.id}`} className="text-decoration-none">
                            <h6 className="fw-bold text-dark mb-1">{product.name}</h6>
                          </Link>
                          <p className="text-muted small mb-3 flex-grow-1">
                            {truncate(product.description, 90)}
                          </p>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fs-5 fw-bold text-primary">
                              {product.price.toFixed(2)} DT
                            </span>
                            <button
                              className={`btn btn-sm rounded-pill px-3 ${addedId === product.id ? 'btn-success' : 'btn-primary'}`}
                              onClick={() => handleAddToCart(product)}
                              disabled={!isOrderable(product)}
                              style={{ transition: 'all 0.3s', fontSize: '12px' }}
                            >
                              {addedId === product.id
                                ? <><i className="fa fa-check me-1"></i>Ajouté !</>
                                : !isOrderable(product)
                                  ? <>Indisponible</>
                                  : <><i className="fa fa-shopping-bag me-1"></i>Ajouter</>
                              }
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
