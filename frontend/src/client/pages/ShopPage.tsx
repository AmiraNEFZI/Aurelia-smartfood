import { useState } from 'react'
import { Link } from 'react-router-dom'

const allProducts = [
  { id: 1, name: 'Grapes', price: 4.99, img: '/fruitables/img/fruite-item-5.jpg', category: 'Fruits' },
  { id: 2, name: 'Raspberries', price: 4.99, img: '/fruitables/img/fruite-item-2.jpg', category: 'Fruits' },
  { id: 3, name: 'Apricots', price: 4.99, img: '/fruitables/img/fruite-item-4.jpg', category: 'Fruits' },
  { id: 4, name: 'Banana', price: 4.99, img: '/fruitables/img/fruite-item-3.jpg', category: 'Fruits' },
  { id: 5, name: 'Oranges', price: 4.99, img: '/fruitables/img/fruite-item-1.jpg', category: 'Fruits' },
  { id: 6, name: 'Strawberry', price: 4.99, img: '/fruitables/img/fruite-item-6.jpg', category: 'Fruits' },
  { id: 7, name: 'Tomatoes', price: 3.99, img: '/fruitables/img/vegetable-item-1.jpg', category: 'Vegetables' },
  { id: 8, name: 'Broccoli', price: 3.35, img: '/fruitables/img/vegetable-item-2.jpg', category: 'Vegetables' },
  { id: 9, name: 'Big Banana', price: 2.99, img: '/fruitables/img/vegetable-item-3.png', category: 'Vegetables' },
  { id: 10, name: 'Potatoes', price: 2.99, img: '/fruitables/img/vegetable-item-5.jpg', category: 'Vegetables' },
  { id: 11, name: 'Green Pepper', price: 3.49, img: '/fruitables/img/vegetable-item-4.jpg', category: 'Vegetables' },
  { id: 12, name: 'Eggplant', price: 3.99, img: '/fruitables/img/vegetable-item-6.jpg', category: 'Vegetables' },
]

const featuredProducts = [
  { id: 1, name: 'Big Banana', price: 2.99, oldPrice: 4.11, img: '/fruitables/img/featur-1.jpg', rating: 4 },
  { id: 2, name: 'Raspberry', price: 2.99, oldPrice: 4.11, img: '/fruitables/img/featur-2.jpg', rating: 4 },
  { id: 3, name: 'Apple', price: 2.99, oldPrice: 4.11, img: '/fruitables/img/featur-3.jpg', rating: 4 },
]

export function ShopPage() {
  const [search, setSearch] = useState('')
  const [maxPrice, setMaxPrice] = useState(500)

  const filtered = allProducts.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) && p.price <= maxPrice
  )

  return (
    <>
      {/* Page Header */}
      <div className="container-fluid page-header py-5">
        <h1 className="text-center text-white display-6">Shop</h1>
        <ol className="breadcrumb justify-content-center mb-0">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item active text-white">Shop</li>
        </ol>
      </div>

      {/* Shop Content */}
      <div className="container-fluid fruite py-5">
        <div className="container py-5">
          <h1 className="mb-4">Fresh fruits shop</h1>
          <div className="row g-4">
            <div className="col-lg-12">
              <div className="row g-4">
                <div className="col-xl-3">
                  <div className="input-group w-100 mx-auto d-flex">
                    <input
                      type="search"
                      className="form-control p-3"
                      placeholder="Search products..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      aria-describedby="search-btn"
                    />
                    <span id="search-btn" className="input-group-text p-3"><i className="fa fa-search"></i></span>
                  </div>
                </div>
                <div className="col-6"></div>
                <div className="col-xl-3">
                  <div className="bg-light ps-3 py-3 rounded d-flex justify-content-between mb-4">
                    <label htmlFor="sortSelect">Default Sorting:</label>
                    <select id="sortSelect" className="border-0 form-select-sm bg-light me-3">
                      <option>Nothing</option>
                      <option>Popularity</option>
                      <option>Price: Low to High</option>
                      <option>Price: High to Low</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="row g-4">
                {/* Sidebar */}
                <div className="col-lg-3">
                  <div className="row g-4">
                    <div className="col-lg-12">
                      <div className="mb-3">
                        <h4>Categories</h4>
                        <ul className="list-unstyled fruite-categorie">
                          {[
                            { name: 'Apples', count: 3 }, { name: 'Oranges', count: 5 },
                            { name: 'Strawberry', count: 2 }, { name: 'Banana', count: 8 }, { name: 'Pumpkin', count: 5 }
                          ].map((cat, i) => (
                            <li key={i}>
                              <div className="d-flex justify-content-between fruite-name">
                                <a href="#"><i className="fas fa-apple-alt me-2"></i>{cat.name}</a>
                                <span>({cat.count})</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="mb-3">
                        <h4 className="mb-2">Price</h4>
                        <input
                          type="range"
                          className="form-range w-100"
                          id="priceRange"
                          min="0"
                          max="500"
                          value={maxPrice}
                          onChange={e => setMaxPrice(Number(e.target.value))}
                        />
                        <output htmlFor="priceRange">Max: ${maxPrice}</output>
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <h4>Featured products</h4>
                      {featuredProducts.map(fp => (
                        <div key={fp.id} className="d-flex align-items-center justify-content-start mb-3">
                          <div className="rounded me-4" style={{ width: '100px', height: '100px' }}>
                            <img src={fp.img} className="img-fluid rounded" alt={fp.name} />
                          </div>
                          <div>
                            <h6 className="mb-2">{fp.name}</h6>
                            <div className="d-flex mb-2">
                              {Array.from({ length: 5 }).map((_, j) => (
                                <i key={j} className={`fa fa-star ${j < fp.rating ? 'text-secondary' : ''}`}></i>
                              ))}
                            </div>
                            <div className="d-flex mb-2">
                              <h5 className="fw-bold me-2">${fp.price} $</h5>
                              <h5 className="text-danger text-decoration-line-through">{fp.oldPrice} $</h5>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="d-flex justify-content-center my-4">
                        <a href="#" className="btn border border-secondary px-4 py-3 rounded-pill text-primary w-100">View More</a>
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="position-relative">
                        <img src="/fruitables/img/banner-fruits.jpg" className="img-fluid w-100 rounded" alt="Banner" />
                        <div className="position-absolute" style={{ top: '50%', right: '10px', transform: 'translateY(-50%)' }}>
                          <h3 className="text-secondary fw-bold">Fresh<br />Fruits<br />Banner</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Products Grid */}
                <div className="col-lg-9">
                  <div className="row g-4 justify-content-center">
                    {filtered.length === 0 ? (
                      <div className="col-12 text-center py-5">
                        <p className="text-muted">No products found for your search.</p>
                      </div>
                    ) : (
                      filtered.map(item => (
                        <div key={item.id} className="col-md-6 col-lg-6 col-xl-4">
                          <div className="rounded position-relative fruite-item">
                            <div className="fruite-img">
                              <img src={item.img} className="img-fluid w-100 rounded-top" alt={item.name} />
                            </div>
                            <div className="text-white bg-secondary px-3 py-1 rounded position-absolute" style={{ top: '10px', left: '10px' }}>{item.category}</div>
                            <div className="p-4 border border-secondary border-top-0 rounded-bottom">
                              <h4>{item.name}</h4>
                              <p>Fresh organic {item.name.toLowerCase()} — hand-picked daily.</p>
                              <div className="d-flex justify-content-between flex-lg-wrap">
                                <p className="text-dark fs-5 fw-bold mb-0">${item.price} / kg</p>
                                <Link to="/cart" className="btn border border-secondary rounded-pill px-3 text-primary">
                                  <i className="fa fa-shopping-bag me-2 text-primary"></i>Add to cart
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
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
