import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <>
      {/* Page Header */}
      <div className="container-fluid page-header py-5">
        <h1 className="text-center text-white display-6">404 Erreur</h1>
        <ol className="breadcrumb justify-content-center mb-0">
          <li className="breadcrumb-item"><Link to="/">Accueil</Link></li>
          <li className="breadcrumb-item active text-white">404</li>
        </ol>
      </div>

      {/* 404 */}
      <div className="container-fluid py-5">
        <div className="container py-5 text-center">
          <div className="row justify-content-center">
            <div className="col-lg-6">
              <i className="bi bi-exclamation-triangle display-1 text-secondary"></i>
              <h1 className="display-1">404</h1>
              <h1 className="mb-4">Page introuvable</h1>
              <p className="mb-4">
                Désolé, la page recherchée n'existe pas sur le site.
                Retournez à l'accueil ou utilisez le menu de navigation.
              </p>
              <Link className="btn border-secondary rounded-pill py-3 px-5" to="/">
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
