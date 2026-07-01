import { Link } from 'react-router-dom'

const testimonials = [
  { name: 'John Doe', profession: 'Client fidèle', rating: 4, text: "Aurelia Smart Food propose une sélection de produits fiables et un service de livraison très rapide. Je recommande." },
  { name: 'Jane Smith', profession: 'Restauratrice', rating: 5, text: "Les commandes sont toujours complètes et fraîches. La plateforme est simple et le suivi est clair." },
  { name: 'Mike Johnson', profession: 'Livraison locale', rating: 5, text: "Un service de proximité efficace, parfait pour nos besoins quotidiens. L’équipe est réactive et professionnelle." },
  { name: 'Sarah Connor', profession: 'Acheteuse', rating: 4, text: 'J’aime la rapidité et la qualité des produits. Le site est agréable et facile à utiliser.' },
  { name: 'David Lee', profession: 'Chef de famille', rating: 5, text: 'Les prix sont accessibles et la livraison est fiable. Aurelia Smart Food facilite vraiment le quotidien.' },
  { name: 'Emily Brown', profession: 'Épicière', rating: 5, text: "Service sérieux et produits bien choisis. C’est devenu mon fournisseur de confiance." },
]

export function TestimonialPage() {
  return (
    <>
      {/* Page Header */}
      <div className="container-fluid page-header py-5">
        <h1 className="text-center text-white display-6">Témoignages</h1>
        <ol className="breadcrumb justify-content-center mb-0">
          <li className="breadcrumb-item"><Link to="/">Accueil</Link></li>
          <li className="breadcrumb-item active text-white">Témoignages</li>
        </ol>
      </div>

      {/* Testimonials */}
      <div className="container-fluid testimonial py-5">
        <div className="container py-5">
          <div className="testimonial-header text-center mb-5">
            <h4 className="text-primary">Témoignages</h4>
            <h1 className="display-5 mb-0 text-dark">Ce que disent nos clients</h1>
          </div>
          <div className="row g-4">
            {testimonials.map((t, i) => (
              <div key={i} className="col-md-6 col-lg-4">
                <div className="testimonial-item img-border-radius bg-light rounded p-4">
                  <div className="position-relative">
                    <i className="fa fa-quote-right fa-2x text-secondary position-absolute" style={{ bottom: '30px', right: '0' }}></i>
                    <div className="mb-4 pb-4 border-bottom border-secondary">
                      <p className="mb-0">{t.text}</p>
                    </div>
                    <div className="d-flex align-items-center flex-nowrap">
                      <div className="bg-secondary rounded d-flex align-items-center justify-content-center" style={{ width: '100px', height: '100px' }}>
                        <span className="text-white fw-bold" style={{ fontSize: '18px' }}>{t.name.charAt(0)}</span>
                      </div>
                      <div className="ms-4 d-block">
                        <h4 className="text-dark">{t.name}</h4>
                        <p className="m-0 pb-3">{t.profession}</p>
                        <div className="d-flex pe-5">
                          {Array.from({ length: 5 }).map((_, j) => (
                            <i key={j} className={`fas fa-star ${j < t.rating ? 'text-primary' : 'text-muted'}`}></i>
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
