import { useRef, useState } from 'react'
import { Card, CardHeader, CardBody, Button } from '@/admin/components/ui'
import { Input } from '@/admin/components/ui/Input'
import api, { uploadApi } from '@/client/services/api'

export function CreateProductPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')
  const [image, setImage] = useState<string | File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)
    try {
      let imageUrl: string | null = null
      // If a File was selected, upload it first
      if (image && image instanceof File) {
        const fd = new FormData()
        fd.append('file', image)
        const resp = await uploadApi.uploadFile(fd)
        imageUrl = resp.data.url
      } else if (typeof image === 'string') {
        imageUrl = image
      }

      const payload = {
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        image: imageUrl,
      }
      await api.post('/products', payload)
      setSuccess('Produit créé avec succès')
      setName('')
      setDescription('')
      setPrice('')
      setStock('')
      setImage(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
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
          <CardHeader title="Créer un produit" subtitle="Ajoutez un produit au catalogue" />
          <CardBody className="space-y-4">
            {error && <div className="text-sm text-red-400">{error}</div>}
            {success && <div className="text-sm text-emerald-400">{success}</div>}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input label="Nom" value={name} onChange={e => setName(e.target.value)} required />
              <Input label="Prix" value={price} onChange={e => setPrice(e.target.value)} required />
              <Input label="Stock" value={stock} onChange={e => setStock(e.target.value)} required />
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Image</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) {
                      setImage(f)
                      setPreviewUrl(URL.createObjectURL(f))
                    }
                  }}
                />
                <div className="mt-2">
                  {previewUrl && (
                    <img src={previewUrl} alt="Aperçu" style={{ maxWidth: '160px', borderRadius: 8 }} />
                  )}
                  {typeof image === 'string' && image.startsWith('/') && (
                    <img src={image} alt="preview" style={{ maxWidth: '160px', borderRadius: 8 }} />
                  )}
                  {image && image instanceof File && !previewUrl && (
                    <div className="text-sm text-slate-300">Fichier prêt à être uploadé : {image.name}</div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
              <textarea
                className="w-full rounded-lg bg-orbit-surface2 p-3 text-sm text-slate-200"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={6}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" size="md" disabled={loading}>{loading ? 'Enregistrement...' : 'Créer le produit'}</Button>
            </div>
          </CardBody>
        </Card>
      </form>
    </div>
  )
}
