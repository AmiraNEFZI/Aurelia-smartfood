import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

const products: Record<string, { name: string; category: string; price: string; img: string; rating: number }> = {
  '1': { name: 'Broccoli', category: 'Vegetables', price: '3.35', img: '/fruitables/img/single-item.jpg', rating: 4 },
  '2': { name: 'Raspberries', category: 'Fruits', price: '4.99', img: '/fruitables/img/fruite-item-2.jpg', rating: 5 },
  '3': { name: 'Banana', category: 'Fruits', price: '2.99', img: '/fruitables/img/fruite-item-3.jpg', rating: 4 },
}

const featuredProducts = [
  { id: 1, name: 'Big Banana', price: 2.99, oldPrice: 4.11, img: '/fruitables/img/featur-1.jpg', rating: 4 },
  { id: 2, name: 'Raspberry', price: 2.99, oldPrice: 4.11, img: '/fruitables/img/featur-2.jpg', rating: 4 },
  { id: 3, name: 'Apple', price: 2.99, oldPrice: 4.11, img: '/fruitables/img/featur-3.jpg', rating: 4 },
  { id: 4, name: 'Corn', price: 2.99, oldPrice: 4.11, img: '/fruitables/img/vegetable-item-4.jpg', rating: 4 },
]

export function ShopDetailPage() {
  const { id } = useParams()
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'description' | 'reviews'>('description')

  const product = products[id ?? '1'] ?? products['1']

  return (
    <>
      {/* Page Header */}
      <div className="container-fluid page-header py-5">
        <h1 className="text-center text-white display-6">Shop Detail</h1>
        <ol className="breadcrumb justify-content-center mb-0">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item"><Link to="/shop">Shop</Link></li>
          <li className="breadcrumb-item active text-white">{product.name}</li>
        </ol>
      </div>

      {/* Product Detail */}
      <div className="container-fluid py-5 mt-5">
        <div className="container py-5">
          <div className="row g-4 mb-5">
            <div className="col-lg-8 col-xl-9">
              <div className="row g-4">
                <div className="col-lg-6">
                  <div className="border rounded">
                    <img src={product.img} className="img-fluid rounded" alt={product.name} />
                  </div>
                </div>
                <div className="col-lg-6">
                  <h4 className="fw-bold mb-3">{product.name}</h4>
                  <p className="mb-3">Category: {product.category}</p>
                  <h5 className="fw-bold mb-3">{product.price} $</h5>
                  <div className="d-flex mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i key={i} className={`fa fa-star ${i < product.rating ? 'text-secondary' : ''}`}></i>
                    ))}
                  </div>
                  <p className="mb-4">
                    Farm-fresh organic {product.name.toLowerCase()}. Always harvested at peak ripeness and delivered directly from our trusted farms. No preservatives, no compromise.
                  </p>
                  <div className="input-group quantity mb-5" style={{ width: '100px' }}>
                    <div className="input-group-btn">
                      <button className="btn btn-sm btn-minus rounded-circle bg-light border" onClick={() => setQuantity(q => Math.max(1, q - 1))}>
                        <i className="fa fa-minus"></i>
                      </button>
                    </div>
                    <input type="text" className="form-control form-control-sm text-center border-0" value={quantity} readOnly />
                    <div className="input-group-btn">
                      <button className="btn btn-sm btn-plus rounded-circle bg-light border" onClick={() => setQuantity(q => q + 1)}>
                        <i className="fa fa-plus"></i>
                      </button>
                    </div>
                  </div>
                  <Link to="/cart" className="btn border border-secondary rounded-pill px-4 py-2 mb-4 text-primary">
                    <i className="fa fa-shopping-bag me-2 text-primary"></i>Add to cart
                  </Link>
                </div>

                {/* Tabs */}
                <div className="col-lg-12">
                  <nav>
                    <div className="nav nav-tabs mb-3">
                      <button
                        className={`nav-link border-white border-bottom-0 ${activeTab === 'description' ? 'active' : ''}`}
                        onClick={() => setActiveTab('description')}
                      >Description</button>
                      <button
                        className={`nav-link border-white border-bottom-0 ${activeTab === 'reviews' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reviews')}
                      >Reviews</button>
                    </div>
                  </nav>
                  <div className="tab-content mb-5">
                    {activeTab === 'description' && (
                      <div className="tab-pane active">
                        <p>Farm-fresh, certified organic {product.name.toLowerCase()}. Harvested at peak ripeness and delivered within 24 hours to ensure maximum freshness and nutritional value.</p>
                        <div className="px-2">
                          <div className="row g-4">
                            <div className="col-6">
                              {[['Weight', '1 kg'], ['Country of Origin', 'Local Farm'], ['Quality', 'Organic'], ['Check', 'Healthy'], ['Min Weight', '250 g']].map(([k, v]) => (
                                <div key={k} className="row text-center align-items-center justify-content-center py-2" style={{ background: k === 'Weight' || k === 'Quality' || k === 'Min Weight' ? '#f8f9fa' : 'white' }}>
                                  <div className="col-6"><p className="mb-0">{k}</p></div>
                                  <div className="col-6"><p className="mb-0">{v}</p></div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {activeTab === 'reviews' && (
                      <div className="tab-pane active">
                        {[{ name: 'Jason Smith', date: 'April 12, 2024', rating: 4, text: 'Great quality product! Very fresh and tasty. Will definitely order again.' },
                          { name: 'Sam Peters', date: 'March 5, 2024', rating: 4, text: 'Excellent freshness and packaging. Highly recommended for health-conscious shoppers.' }
                        ].map((r, i) => (
                          <div key={i} className="d-flex mb-4">
                            <img src="/fruitables/img/avatar.jpg" className="img-fluid rounded-circle p-3" style={{ width: '100px', height: '100px' }} alt={r.name} />
                            <div>
                              <p className="mb-2" style={{ fontSize: '14px' }}>{r.date}</p>
                              <div className="d-flex justify-content-between">
                                <h5>{r.name}</h5>
                                <div className="d-flex mb-3">
                                  {Array.from({ length: 5 }).map((_, j) => (
                                    <i key={j} className={`fa fa-star ${j < r.rating ? 'text-secondary' : ''}`}></i>
                                  ))}
                                </div>
                              </div>
                              <p>{r.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Leave a review */}
                  <form action="#">
                    <h4 className="mb-5 fw-bold">Leave a Reply</h4>
                    <div className="row g-4">
                      <div className="col-lg-6"><div className="border-bottom rounded"><input type="text" className="form-control border-0 me-4" placeholder="Your Name *" /></div></div>
                      <div className="col-lg-6"><div className="border-bottom rounded"><input type="email" className="form-control border-0" placeholder="Your Email *" /></div></div>
                      <div className="col-lg-12"><div className="border-bottom rounded my-4"><textarea className="form-control border-0" rows={8} placeholder="Your Review *"></textarea></div></div>
                      <div className="col-lg-12">
                        <div className="d-flex justify-content-between py-3 mb-5">
                          <div className="d-flex align-items-center">
                            <p className="mb-0 me-3">Please rate:</p>
                            <div className="d-flex align-items-center" style={{ fontSize: '12px' }}>
                              {Array.from({ length: 5 }).map((_, i) => <i key={i} className="fa fa-star text-muted"></i>)}
                            </div>
                          </div>
                          <a href="#" className="btn border border-secondary text-primary rounded-pill px-4 py-3">Post Comment</a>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-lg-4 col-xl-3">
              <div className="row g-4 fruite">
                <div className="col-lg-12">
                  <div className="input-group w-100 mx-auto d-flex mb-4">
                    <input type="search" className="form-control p-3" placeholder="keywords" />
                    <span className="input-group-text p-3"><i className="fa fa-search"></i></span>
                  </div>
                  <div className="mb-4">
                    <h4>Categories</h4>
                    <ul className="list-unstyled fruite-categorie">
                      {[['Apples', 3], ['Oranges', 5], ['Strawberry', 2], ['Banana', 8], ['Pumpkin', 5]].map(([n, c]) => (
                        <li key={n}><div className="d-flex justify-content-between fruite-name"><a href="#"><i className="fas fa-apple-alt me-2"></i>{n}</a><span>({c})</span></div></li>
                      ))}
                    </ul>
                  </div>
                  <h4 className="mb-4">Featured products</h4>
                  {featuredProducts.map(fp => (
                    <div key={fp.id} className="d-flex align-items-center justify-content-start mb-3">
                      <div className="rounded" style={{ width: '100px', height: '100px' }}>
                        <img src={fp.img} className="img-fluid rounded" alt={fp.name} />
                      </div>
                      <div className="ms-3">
                        <h6 className="mb-2">{fp.name}</h6>
                        <div className="d-flex mb-2">{Array.from({ length: fp.rating }).map((_, j) => <i key={j} className="fa fa-star text-secondary"></i>)}</div>
                        <div className="d-flex mb-2">
                          <h5 className="fw-bold me-2">{fp.price} $</h5>
                          <h5 className="text-danger text-decoration-line-through">{fp.oldPrice} $</h5>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
