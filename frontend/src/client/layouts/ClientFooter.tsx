import { Link } from 'react-router-dom'

export function ClientFooter() {
  return (
    <>
      {/* Footer */}
      <div className="container-fluid bg-dark text-white-50 footer pt-5 mt-5">
        <div className="container py-5">
          <div className="pb-4 mb-4" style={{ borderBottom: '1px solid rgba(226, 175, 24, 0.5)' }}>
            <div className="row g-4">
              <div className="col-lg-3">
                <Link to="/">
                  <h1 className="text-primary mb-0">SmartFood</h1>
                  <p className="text-secondary mb-0">Fresh products</p>
                </Link>
              </div>
              <div className="col-lg-6">
                <div className="position-relative mx-auto">
                  <input className="form-control border-0 w-100 py-3 px-4 rounded-pill" type="email" placeholder="Your Email" />
                  <button type="submit" className="btn btn-primary border-0 border-secondary py-3 px-4 position-absolute rounded-pill text-white" style={{ top: 0, right: 0 }}>
                    Subscribe Now
                  </button>
                </div>
              </div>
              <div className="col-lg-3">
                <div className="d-flex justify-content-end pt-3">
                  <a className="btn btn-outline-secondary me-2 btn-md-square rounded-circle" href="#"><i className="fab fa-twitter"></i></a>
                  <a className="btn btn-outline-secondary me-2 btn-md-square rounded-circle" href="#"><i className="fab fa-facebook-f"></i></a>
                  <a className="btn btn-outline-secondary me-2 btn-md-square rounded-circle" href="#"><i className="fab fa-youtube"></i></a>
                  <a className="btn btn-outline-secondary btn-md-square rounded-circle" href="#"><i className="fab fa-linkedin-in"></i></a>
                </div>
              </div>
            </div>
          </div>
          <div className="row g-5">
            <div className="col-lg-3 col-md-6">
              <div className="footer-item">
                <h4 className="text-light mb-3">Why People Like us!</h4>
                <p className="mb-4">Fresh, organic products delivered to your door. Quality you can taste, prices you'll love.</p>
                <a href="#" className="btn border-secondary py-2 px-4 rounded-pill text-primary">Read More</a>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="d-flex flex-column text-start footer-item">
                <h4 className="text-light mb-3">Shop Info</h4>
                <a className="btn-link" href="#">About Us</a>
                <Link className="btn-link" to="/contact">Contact Us</Link>
                <a className="btn-link" href="#">Privacy Policy</a>
                <a className="btn-link" href="#">Terms &amp; Condition</a>
                <a className="btn-link" href="#">Return Policy</a>
                <a className="btn-link" href="#">FAQs &amp; Help</a>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="d-flex flex-column text-start footer-item">
                <h4 className="text-light mb-3">Account</h4>
                <a className="btn-link" href="#">My Account</a>
                <Link className="btn-link" to="/shop/1">Shop Details</Link>
                <Link className="btn-link" to="/cart">Shopping Cart</Link>
                <a className="btn-link" href="#">Wishlist</a>
                <a className="btn-link" href="#">Order History</a>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="footer-item">
                <h4 className="text-light mb-3">Contact</h4>
                <p>Address: 1429 Netus Rd, NY 48247</p>
                <p>Email: contact@smartfood.com</p>
                <p>Phone: +0123 4567 8910</p>
                <p>Payment Accepted</p>
                <img src="/fruitables/img/payment.png" className="img-fluid" alt="Payment methods" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="container-fluid copyright bg-dark py-4">
        <div className="container">
          <div className="row">
            <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
              <span className="text-light">
                <Link to="/"><i className="fas fa-copyright text-light me-2"></i>SmartFood</Link>, All rights reserved.
              </span>
            </div>
            <div className="col-md-6 my-auto text-center text-md-end text-white">
              Powered by <strong>React + Spring Boot</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Back to top */}
      <a href="#" className="btn btn-primary border-3 border-primary rounded-circle back-to-top">
        <i className="fa fa-arrow-up"></i>
      </a>
    </>
  )
}
