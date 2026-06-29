import { useState } from 'react'
import { Link } from 'react-router-dom'

export function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
    setForm({ name: '', email: '', message: '' })
  }

  return (
    <>
      {/* Page Header */}
      <div className="container-fluid page-header py-5">
        <h1 className="text-center text-white display-6">Contact</h1>
        <ol className="breadcrumb justify-content-center mb-0">
          <li className="breadcrumb-item"><Link to="/">Home</Link></li>
          <li className="breadcrumb-item active text-white">Contact</li>
        </ol>
      </div>

      {/* Contact */}
      <div className="container-fluid contact py-5">
        <div className="container py-5">
          <div className="p-5 bg-light rounded">
            <div className="row g-4">
              <div className="col-12">
                <div className="text-center mx-auto" style={{ maxWidth: '700px' }}>
                  <h1 className="text-primary">Get in touch</h1>
                  <p className="mb-4">
                    Have a question about our products or delivery? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                  </p>
                </div>
              </div>

              {/* Map */}
              <div className="col-lg-12">
                <div className="h-100 rounded">
                  <iframe
                    className="rounded w-100"
                    style={{ height: '400px', border: 0 }}
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d387191.33750346623!2d-73.97968099999999!3d40.6974881!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2sbd!4v1694259649153!5m2!1sen!2sbd"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Location map"
                  ></iframe>
                </div>
              </div>

              {/* Form */}
              <div className="col-lg-7">
                {sent ? (
                  <div className="alert alert-success" role="alert">
                    <h4 className="alert-heading">Message sent!</h4>
                    <p className="mb-0">Thank you for contacting SmartFood. We'll get back to you within 24 hours.</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <input
                      type="text"
                      name="name"
                      className="w-100 form-control border-0 py-3 mb-4"
                      placeholder="Your Name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                    <input
                      type="email"
                      name="email"
                      className="w-100 form-control border-0 py-3 mb-4"
                      placeholder="Enter Your Email"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                    <textarea
                      name="message"
                      className="w-100 form-control border-0 mb-4"
                      rows={5}
                      placeholder="Your Message"
                      value={form.message}
                      onChange={handleChange}
                      required
                    ></textarea>
                    <button className="w-100 btn form-control border-secondary py-3 bg-white text-primary" type="submit">
                      Submit
                    </button>
                  </form>
                )}
              </div>

              {/* Contact Info */}
              <div className="col-lg-5">
                <div className="d-flex p-4 rounded mb-4 bg-white">
                  <i className="fas fa-map-marker-alt fa-2x text-primary me-4"></i>
                  <div>
                    <h4>Address</h4>
                    <p className="mb-2">123 Street New York, USA</p>
                  </div>
                </div>
                <div className="d-flex p-4 rounded mb-4 bg-white">
                  <i className="fas fa-envelope fa-2x text-primary me-4"></i>
                  <div>
                    <h4>Mail Us</h4>
                    <p className="mb-2">contact@smartfood.com</p>
                  </div>
                </div>
                <div className="d-flex p-4 rounded bg-white">
                  <i className="fa fa-phone-alt fa-2x text-primary me-4"></i>
                  <div>
                    <h4>Telephone</h4>
                    <p className="mb-2">(+012) 3456 7890</p>
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
