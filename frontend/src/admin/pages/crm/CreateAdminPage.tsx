import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, User, Mail, Lock, Phone, Eye, EyeOff } from 'lucide-react'
import { Button, Input, Card, CardHeader, CardBody } from '@/admin/components/ui'
import { adminUsersApi } from '@/client/services/api'

export function CreateAdminPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await adminUsersApi.createAdmin(form)
      setSuccess(true)
      setTimeout(() => navigate('/admin/crm/contacts'), 1500)
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      setError(ax.response?.data?.message || 'Erreur lors de la création.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Créer un compte Administrateur</h1>
          <p className="text-slate-500 text-sm">L'admin aura accès au dashboard complet</p>
        </div>
      </div>

      {success ? (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-orbit-primary/15 flex items-center justify-center mx-auto mb-4">
            <span className="text-orbit-primary-light text-3xl">✓</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-2">Administrateur créé avec succès !</h2>
          <p className="text-slate-500 text-sm">Redirection vers la liste...</p>
        </motion.div>
      ) : (
        <Card>
          <CardHeader title="Informations de l'administrateur" subtitle="Tous les champs marqués * sont obligatoires" />
          <CardBody className="pt-5 border-t border-orbit-border mt-4">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-orbit-danger/10 border border-orbit-danger/20 text-red-400 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Prénom *" name="firstName" placeholder="Prénom" prefix={<User className="w-3.5 h-3.5" />}
                  value={form.firstName} onChange={handleChange} required />
                <Input label="Nom *" name="lastName" placeholder="Nom" prefix={<User className="w-3.5 h-3.5" />}
                  value={form.lastName} onChange={handleChange} required />
              </div>
              <Input label="Téléphone" name="phone" type="tel" placeholder="+216 XX XXX XXX"
                prefix={<Phone className="w-3.5 h-3.5" />} value={form.phone} onChange={handleChange} />
              <Input label="Email *" name="email" type="email" placeholder="admin@smartfood.com"
                prefix={<Mail className="w-3.5 h-3.5" />} value={form.email} onChange={handleChange} required />
              <Input
                label="Mot de passe *"
                name="password"
                type={showPwd ? 'text' : 'password'}
                placeholder="Minimum 6 caractères"
                prefix={<Lock className="w-3.5 h-3.5" />}
                suffix={
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="text-slate-500 hover:text-slate-300 transition-colors">
                    {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                }
                value={form.password}
                onChange={handleChange}
                required
              />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" loading={loading} className="flex-1">
                  Créer l'administrateur
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
