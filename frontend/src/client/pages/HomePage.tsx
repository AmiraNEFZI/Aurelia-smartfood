import { Link } from 'react-router-dom'

export function HomePage() {
  const fruits = [
    { id: 1, name: 'Grapes', price: '$4.99 / kg', img: '/fruitables/img/fruite-item-5.jpg', category: 'Fruits' },
    { id: 2, name: 'Raspberries', price: '$4.99 / kg', img: '/fruitables/img/fruite-item-2.jpg', category: 'Fruits' },
    { id: 3, name: 'Apricots', price: '$4.99 / kg', img: '/fruitables/img/fruite-item-4.jpg', category: 'Fruits' },
    { id: 4, name: 'Banana', price: '$4.99 / kg', img: '/fruitables/img/fruite-item-3.jpg', category: 'Fruits' },
    { id: 5, name: 'Oranges', price: '$4.99 / kg', img: '/fruitables/img/fruite-item-1.jpg', category: 'Fruits' },
    { id: 6, name: 'Strawberry', price: '$4.99 / kg', img: '/fruitables/img/fruite-item-6.jpg', category: 'Fruits' },
    { id: 7, name: 'Tomatoes', price: '$3.99 / kg', img: '/fruitables/img/vegetable-item-1.jpg', category: 'Vegetables' },
    { id: 8, name: 'Broccoli', price: '$3.35 / kg', img: '/fruitables/img/vegetable-item-2.jpg', category: 'Vegetables' },
  ]

  const bestSellers = [
    { id: 1, name: 'Raspberry', price: '$4.99 / kg', img: '/fruitables/img/best-product-1.jpg', rating: 4 },
    { id: 2, name: 'Black Plum', price: '$3.99 / kg', img: '/fruitables/img/best-product-2.jpg', rating: 5 },
    { id: 3, name: 'Custard Apple', price: '$5.99 / kg', img: '/fruitables/img/best-product-3.jpg', rating: 4 },
    { id: 4, name: 'Snap Melon', price: '$6.99 / kg', img: '/fruitables/img/best-product-4.jpg', rating: 5 },
  ]

  return (
    <>
      {/* Hero */}
      <div className="container-fluid py-5 mb-5 hero-header">
        <div className="container py-5">
          <div className="row g-5 align-items-center">
            <div className="col-md-12 col-lg-7">
              <h4 className="mb-3 text-secondary">100% Organic Foods</h4>
              <h1 className="mb-5 display-3 text-primary">Organic Veggies &amp; Fruits Foods</h1>
              <div className="position-relative mx-auto">
                <input className="form-control border-2 border-secondary w-75 py-3 px-4 rounded-pill" type="text" placeholder="Search products..." />
                <button type="submit" className="btn btn-primary border-2 border-secondary py-3 px-4 position-absolute rounded-pill text-white h-100" style={{ top: 0, right: '25%' }}>
                  Search Now
                </button>
              </div>
            </div>
            <div className="col-md-12 col-lg-5">
              <div id="heroCarousel" className="carousel slide position-relative" data-bs-ride="carousel">
                <div className="carousel-inner" role="listbox">
                  <div className="carousel-item active rounded">
                    <img src="/fruitables/img/hero-img-1.png" className="img-fluid w-100 h-100 bg-secondary rounded" alt="Fruits" />
                    <a href="#" className="btn px-4 py-2 text-white rounded">Fruits</a>
                  </div>
                  <div className="carousel-item rounded">
                    <img src="/fruitables/img/hero-img-2.jpg" className="img-fluid w-100 h-100 rounded" alt="Vegetables" />
                    <a href="#" className="btn px-4 py-2 text-white rounded">Vegetables</a>
                  </div>
                </div>
                <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
                  <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                  <span className="visually-hidden">Previous</span>
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
                  <span className="carousel-control-next-icon" aria-hidden="true"></span>
                  <span className="visually-hidden">Next</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container-fluid featurs py-5">
        <div className="container py-5">
          <div className="row g-4">
            {[
              { icon: 'fa-car-side', title: 'Free Shipping', desc: 'Free on order over $300' },
              { icon: 'fa-user-shield', title: 'Security Payment', desc: '100% security payment' },
              { icon: 'fa-exchange-alt', title: '30 Day Return', desc: '30 day money guarantee' },
              { icon: 'fa-phone-alt', title: '24/7 Support', desc: 'Support every time fast' },
            ].map((f, i) => (
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

      {/* Products Tabs */}
      <div className="container-fluid fruite py-5">
        <div className="container py-5">
          <div className="tab-class text-center">
            <div className="row g-4">
              <div className="col-lg-4 text-start">
                <h1>Our Organic Products</h1>
              </div>
              <div className="col-lg-8 text-end">
                <ul className="nav nav-pills d-inline-flex text-center mb-5">
                  {['All Products', 'Vegetables', 'Fruits', 'Bread', 'Meat'].map((tab, i) => (
                    <li key={i} className="nav-item">
                      <a className={`d-flex m-2 py-2 bg-light rounded-pill ${i === 0 ? 'active' : ''}`} data-bs-toggle="pill" href={`#tab-${i + 1}`}>
                        <span className="text-dark" style={{ width: '130px' }}>{tab}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="tab-content">
              <div id="tab-1" className="tab-pane fade show p-0 active">
                <div className="row g-4">
                  {fruits.map(item => (
                    <div key={item.id} className="col-md-6 col-lg-4 col-xl-3">
                      <div className="rounded position-relative fruite-item">
                        <div className="fruite-img">
                          <img src={item.img} className="img-fluid w-100 rounded-top" alt={item.name} />
                        </div>
                        <div className="text-white bg-secondary px-3 py-1 rounded position-absolute" style={{ top: '10px', left: '10px' }}>{item.category}</div>
                        <div className="p-4 border border-secondary border-top-0 rounded-bottom">
                          <h4>{item.name}</h4>
                          <p>Fresh organic {item.name.toLowerCase()} — hand-picked and delivered to your door.</p>
                          <div className="d-flex justify-content-between flex-lg-wrap">
                            <p className="text-dark fs-5 fw-bold mb-0">{item.price}</p>
                            <Link to="/cart" className="btn border border-secondary rounded-pill px-3 text-primary">
                              <i className="fa fa-shopping-bag me-2 text-primary"></i>Add to cart
                            </Link>
                          </div>
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

      {/* Banner */}
      <div className="container-fluid banner my-5 py-5" data-parallax="scroll" data-image-src="/fruitables/img/banner-fruits.jpg">
        <div className="container py-5">
          <div className="row g-5">
            <div className="col-lg-6">
              <div className="p-5 bg-white rounded">
                <h6 className="text-primary">100% Organic</h6>
                <h1 className="display-5">Fresh From Our Farm</h1>
                <p className="mb-0">We deliver farm-fresh produce directly to your doorstep. No middlemen, no compromise on quality.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Best Sellers */}
      <div className="container-fluid py-5">
        <div className="container py-5">
          <div className="text-center mx-auto mb-5" style={{ maxWidth: '700px' }}>
            <h1>Our Best Sellers</h1>
            <p>Discover what our customers love most — top-rated fresh products.</p>
          </div>
          <div className="row g-4">
            {bestSellers.map(item => (
              <div key={item.id} className="col-md-6 col-lg-4 col-xl-3">
                <div className="p-4 rounded bg-light">
                  <img src={item.img} className="img-fluid w-100 rounded mb-4" alt={item.name} />
                  <Link to={`/shop/${item.id}`} className="d-flex justify-content-center">
                    <h5 className="text-dark">{item.name}</h5>
                  </Link>
                  <div className="d-flex justify-content-center mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i key={i} className={`fa fa-star ${i < item.rating ? 'text-secondary' : 'text-muted'}`}></i>
                    ))}
                  </div>
                  <div className="d-flex justify-content-center flex-lg-wrap">
                    <p className="text-dark fs-5 fw-bold mb-0 me-3">{item.price}</p>
                    <Link to="/cart" className="btn border border-secondary rounded-pill px-3 text-primary">
                      <i className="fa fa-shopping-bag me-2 text-primary"></i>Add to cart
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonial Preview */}
      <div className="container-fluid py-5">
        <div className="container py-5">
          <div className="testimonial-header text-center mb-5">
            <h4 className="text-primary">Our Testimonial</h4>
            <h1 className="display-5 mb-0 text-dark">Our Clients Say!</h1>
          </div>
          <div className="row g-4 justify-content-center">
            {[
              { name: 'John Doe', profession: 'Nutritionist', text: 'SmartFood delivers the freshest produce I\'ve ever tasted. The quality is consistently outstanding!' },
              { name: 'Jane Smith', profession: 'Chef', text: 'I use SmartFood for all my restaurant\'s fresh ingredients. Always on time, always perfect quality.' },
              { name: 'Mike Johnson', profession: 'Fitness Trainer', text: 'The organic selection is incredible. My clients love knowing I source from SmartFood.' },
            ].map((t, i) => (
              <div key={i} className="col-md-6 col-lg-4">
                <div className="testimonial-item img-border-radius bg-light rounded p-4">
                  <div className="position-relative">
                    <i className="fa fa-quote-right fa-2x text-secondary position-absolute" style={{ bottom: '30px', right: '0' }}></i>
                    <div className="mb-4 pb-4 border-bottom border-secondary">
                      <p className="mb-0">{t.text}</p>
                    </div>
                    <div className="d-flex align-items-center flex-nowrap">
                      <div className="bg-secondary rounded">
                        <img src="/fruitables/img/testimonial-1.jpg" className="img-fluid rounded" style={{ width: '80px', height: '80px' }} alt={t.name} />
                      </div>
                      <div className="ms-4 d-block">
                        <h5 className="text-dark">{t.name}</h5>
                        <p className="m-0 pb-3">{t.profession}</p>
                        <div className="d-flex">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <i key={j} className="fas fa-star text-primary"></i>
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
