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
                  <h1 className="text-primary mb-0">Aurelia Smart Food</h1>
                  <p className="text-secondary mb-0">Commerce de proximité</p>
                </Link>
              </div>
              <div className="col-lg-6">
                <div className="position-relative mx-auto">
                  <input className="form-control border-0 w-100 py-3 px-4 rounded-pill" type="email" placeholder="Votre email" />
                  <button type="submit" className="btn btn-primary border-0 border-secondary py-3 px-4 position-absolute rounded-pill text-white" style={{ top: 0, right: 0 }}>
                    S'inscrire
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
                <h4 className="text-light mb-3">Pourquoi nous choisir ?</h4>
                <p className="mb-4">Aurelia Smart Food vous propose un service de proximité avec une sélection adaptée au quotidien.</p>
                <a href="#" className="btn border-secondary py-2 px-4 rounded-pill text-primary">Découvrir</a>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="d-flex flex-column text-start footer-item">
                <h4 className="text-light mb-3">Informations</h4>
                <a className="btn-link" href="#">À propos</a>
                <Link className="btn-link" to="/contact">Contact</Link>
                <a className="btn-link" href="#">Politique de confidentialité</a>
                <a className="btn-link" href="#">Conditions générales</a>
                <a className="btn-link" href="#">Politique de retour</a>
                <a className="btn-link" href="#">FAQ</a>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="d-flex flex-column text-start footer-item">
                <h4 className="text-light mb-3">Mon compte</h4>
                <Link className="btn-link" to="/profile">Mon compte</Link>
                <Link className="btn-link" to="/shop">Boutique</Link>
                <Link className="btn-link" to="/cart">Panier</Link>
                <a className="btn-link" href="#">Liste de souhaits</a>
                <a className="btn-link" href="#">Historique des commandes</a>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="footer-item">
                <h4 className="text-light mb-3">Contact</h4>
                <p>Adresse : 123 avenue de l'Industrie, Tunis</p>
                <p>Email : contact@aurelia-smartfood.com</p>
                <p>Téléphone : +216 71 234 567</p>
                <p className="mb-2">Paiements acceptés :</p>
                <ul className="list-unstyled small mb-0 text-muted">
                  <li>Cartes bancaires</li>
                  <li>Mobile money</li>
                  <li>Paiement à la livraison</li>
                </ul>
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
                <Link to="/"><i className="fas fa-copyright text-light me-2"></i>Aurelia Smart Food</Link>, Tous droits réservés.
              </span>
            </div>
            <div className="col-md-6 my-auto text-center text-md-end text-white">
              Propulsé par <strong>React + Spring Boot</strong>
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
