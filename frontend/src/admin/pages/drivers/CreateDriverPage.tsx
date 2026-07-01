import { useState } from 'react'
import { Card, CardHeader, CardBody, Button } from '@/admin/components/ui'
import { Input } from '@/admin/components/ui/Input'
import api from '@/client/services/api'

export function CreateDriverPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      const payload = { firstName, lastName, phone, email, password }
      await api.post('/admin/drivers', payload)
      setSuccess('Livreur ajouté avec succès')
      setFirstName('')
      setLastName('')
      setPhone('')
      setEmail('')
      setPassword('')
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <form onSubmit={handleSubmit} className="max-w-3xl">
        <Card>
          <CardHeader title="Créer un livreur" subtitle="Ajouter un compte livreur (réservé à l'admin)" />
          <CardBody className="space-y-4">
            {error && <div className="text-sm text-red-400">{error}</div>}
            {success && <div className="text-sm text-emerald-400">{success}</div>}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Prénom" value={firstName} onChange={e => setFirstName(e.target.value)} required />
              <Input label="Nom" value={lastName} onChange={e => setLastName(e.target.value)} required />
              <Input label="Téléphone" value={phone} onChange={e => setPhone(e.target.value)} required />
              <Input label="Email" value={email} onChange={e => setEmail(e.target.value)} required type="email" />
              <Input label="Mot de passe temporaire" value={password} onChange={e => setPassword(e.target.value)} required type="password" />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" size="md" disabled={loading}>{loading ? 'Enregistrement...' : "Créer le livreur"}</Button>
            </div>
          </CardBody>
        </Card>
      </form>
    </div>
  )
}
