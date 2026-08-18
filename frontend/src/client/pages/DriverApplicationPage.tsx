import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Phone, FileText } from 'lucide-react'
import api, { driverApplicationsApi } from '@/client/services/api'

export function DriverApplicationPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', document: null as File | null })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target
    if (name === 'document' && files?.[0]) {
      setForm(f => ({ ...f, document: files[0] }))
      return
    }
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.document) {
      setError('Un document est requis.')
      return
    }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', form.document)
      const uploadRes = await api.post('/uploads', fd)
      const documentUrl = uploadRes.data?.url as string

      await driverApplicationsApi.submit({
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone,
        email: form.email,
        documentUrl,
      })
      setSuccess(true)
      setTimeout(() => navigate('/'), 1800)
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      setError(ax.response?.data?.message || 'Erreur lors de l’envoi de votre candidature.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-12">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow-lg">
            <div className="card-body p-5">
              <div className="d-flex align-items-start gap-3 mb-4">
                <div className="rounded-circle bg-primary d-inline-flex align-items-center justify-content-center" style={{ width: 56, height: 56 }}>
                  <FileText className="text-white" />
                </div>
                <div>
                  <h3 className="fw-bold mb-1">Devenir livreur</h3>
                  <p className="text-muted mb-0">Soumettez vos informations et votre document. Un administrateur validera votre compte.</p>
                </div>
              </div>

              {success ? (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center py-5">
                  <div className="rounded-circle bg-success d-inline-flex align-items-center justify-content-center mb-4" style={{ width: 72, height: 72 }}>
                    <span className="text-white fs-1">✓</span>
                  </div>
                  <h4 className="fw-bold">Candidature reçue</h4>
                  <p className="text-muted">Nous vous enverrons un email une fois votre compte activé.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Prénom</label>
                      <div className="input-group">
                        <span className="input-group-text"><User className="text-muted" /></span>
                        <input name="firstName" type="text" className="form-control" value={form.firstName} onChange={handleChange} required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Nom</label>
                      <div className="input-group">
                        <span className="input-group-text"><User className="text-muted" /></span>
                        <input name="lastName" type="text" className="form-control" value={form.lastName} onChange={handleChange} required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Téléphone</label>
                      <div className="input-group">
                        <span className="input-group-text"><Phone className="text-muted" /></span>
                        <input name="phone" type="tel" className="form-control" value={form.phone} onChange={handleChange} required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <div className="input-group">
                        <span className="input-group-text"><Mail className="text-muted" /></span>
                        <input name="email" type="email" className="form-control" value={form.email} onChange={handleChange} required />
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Document d’identité</label>
                      <input name="document" type="file" accept="image/*,.pdf" className="form-control" onChange={handleChange} required />
                      <p className="form-text text-muted">JPEG, PNG ou PDF. Le document sera vérifié par l’administrateur.</p>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between gap-3 mt-4">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
                      Retour
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Envoi en cours...' : 'Soumettre la candidature'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
