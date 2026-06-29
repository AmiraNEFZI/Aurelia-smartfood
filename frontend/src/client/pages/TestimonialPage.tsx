import { Link } from 'react-router-dom'

const testimonials = [
  { name: 'John Doe', profession: 'Nutritionist', rating: 4, text: "SmartFood delivers the freshest produce I've ever tasted. The quality is consistently outstanding and the delivery is always on time!" },
  { name: 'Jane Smith', profession: 'Chef', rating: 5, text: "I use SmartFood for all my restaurant's fresh ingredients. Always on time, always perfect quality. My customers notice the difference." },
  { name: 'Mike Johnson', profession: 'Fitness Trainer', rating: 5, text: "The organic selection is incredible. My clients love knowing I source from SmartFood. Highly recommended for health-conscious people." },
  { name: 'Sarah Connor', profession: 'Food Blogger', rating: 4, text: 'As a food blogger, freshness is everything. SmartFood never disappoints. The variety and quality keep my recipes top-notch.' },
  { name: 'David Lee', profession: 'Home Cook', rating: 5, text: 'The convenience of having fresh organic food delivered to my door is unbeatable. SmartFood has changed the way my family eats.' },
  { name: 'Emily Brown', profession: 'Dietitian', rating: 5, text: "I recommend SmartFood to all my clients. The nutritional value of their fresh produce is exceptional. A truly trustworthy service." },
]

export function TestimonialPage() {
  return (
    <>
      {/* Page Header */}
      <div className="container-fluid page-header py-5">
        <h1 className="text-center text-white display-6">Testimonial</h1>
        <ol className="breadcrumb justify-content-center mb-0">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item active text-white">Testimonial</li>
        </ol>
      </div>

      {/* Testimonials */}
      <div className="container-fluid testimonial py-5">
        <div className="container py-5">
          <div className="testimonial-header text-center mb-5">
            <h4 className="text-primary">Our Testimonial</h4>
            <h1 className="display-5 mb-0 text-dark">Our Client Saying!</h1>
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
                      <div className="bg-secondary rounded">
                        <img src="/fruitables/img/testimonial-1.jpg" className="img-fluid rounded" style={{ width: '100px', height: '100px' }} alt={t.name} />
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
