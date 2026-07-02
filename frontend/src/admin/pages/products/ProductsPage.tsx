import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Pencil, Trash2, RefreshCw, Package, X, Upload } from 'lucide-react'
import { Card, Input, Button } from '@/admin/components/ui'
import { adminProductsApi, uploadApi, resolveProductImage } from '@/client/services/api'
import { cn } from '@/utils/cn'

interface Product {
  id: number
  name: string
  description?: string
  price: number
  stock: number
  image?: string
}

const EMPTY_FORM = { name: '', description: '', price: '', stock: '', image: '' }

function ProductModal({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!product
  const [form, setForm] = useState({
    name: product?.name ?? '',
    description: product?.description ?? '',
    price: product?.price?.toString() ?? '',
    stock: product?.stock?.toString() ?? '',
    image: product?.image ?? '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>(resolveProductImage(product?.image) ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let imageUrl = form.image
      if (file) {
        const fd = new FormData(); fd.append('file', file)
        const res = await uploadApi.uploadFile(fd)
        imageUrl = res.data.url
      }
      const payload = {
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
        image: imageUrl || undefined,
      }
      if (isEdit) await adminProductsApi.update(product!.id, payload)
      else await adminProductsApi.create(payload)
      onSaved()
      onClose()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      setError(ax.response?.data?.message ?? 'Erreur lors de l\'enregistrement.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-orbit-surface border border-orbit-border rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-orbit-border">
          <h2 className="text-lg font-bold text-slate-100">
            {isEdit ? `Modifier "${product!.name}"` : 'Nouveau produit'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Input label="Nom du produit *" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
              <Input label="Prix (DT) *" type="number" step="0.01" min="0" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
              <Input label="Stock *" type="number" min="0" value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} required />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
              <textarea
                className="w-full bg-orbit-surface2 border border-orbit-border rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orbit-primary resize-none"
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Description du produit..."
              />
            </div>

            {/* Image */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Image</label>
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-orbit-border rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer hover:border-orbit-primary/50 transition-colors"
              >
                {preview ? (
                  <img src={preview} alt="preview" className="h-24 object-contain rounded-lg" />
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-slate-600" />
                    <p className="text-xs text-slate-500">Cliquer pour choisir une image</p>
                  </>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
              {!file && (
                <Input
                  label="" placeholder="Ou entrez une URL d'image..."
                  value={form.image}
                  onChange={e => { setForm(f => ({ ...f, image: e.target.value })); setPreview(e.target.value) }}
                  className="mt-2"
                />
              )}
            </div>
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-orbit-border">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-slate-400 border border-orbit-border hover:bg-white/5 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-orbit-primary text-white hover:bg-orbit-primary/80 transition-colors disabled:opacity-50">
              {loading ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editProduct, setEditProduct] = useState<Product | null | 'new'>('new' as never)
  const [showModal, setShowModal] = useState(false)
  const [modalProduct, setModalProduct] = useState<Product | null>(null)

  const load = () => {
    setLoading(true)
    adminProductsApi.getAll()
      .then(res => setProducts(Array.isArray(res.data) ? res.data : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Supprimer "${name}" ?`)) return
    try {
      await adminProductsApi.delete(id)
      setProducts(p => p.filter(x => x.id !== id))
    } catch { alert('Erreur lors de la suppression.') }
  }

  const openCreate = () => { setModalProduct(null); setShowModal(true) }
  const openEdit = (p: Product) => { setModalProduct(p); setShowModal(true) }

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Produits</h1>
          <p className="text-slate-500 text-sm mt-0.5">{products.length} produits dans le catalogue</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orbit-primary text-white text-sm font-semibold hover:bg-orbit-primary/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau produit
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Input
          prefix={<Search className="w-3.5 h-3.5" />}
          placeholder="Rechercher un produit..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-orbit-primary border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">Aucun produit trouvé.</p>
          <button onClick={openCreate} className="mt-3 text-sm text-orbit-primary-light hover:underline">
            + Créer le premier produit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-orbit-surface border border-orbit-border rounded-xl overflow-hidden hover:border-orbit-border2 transition-all group"
            >
              {/* Image */}
              <div className="h-40 bg-orbit-surface2 flex items-center justify-center overflow-hidden">
                {product.image ? (
                  <img
                    src={resolveProductImage(product.image)}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={e => { e.currentTarget.style.display = 'none' }}
                  />
                ) : (
                  <Package className="w-12 h-12 text-slate-700" />
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-slate-200 truncate">{product.name}</h3>
                {product.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{product.description}</p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-emerald-400">{product.price?.toFixed(2)} DT</span>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full font-medium',
                    product.stock > 10 ? 'bg-emerald-500/15 text-emerald-400' :
                    product.stock > 0 ? 'bg-amber-500/15 text-amber-400' :
                    'bg-red-500/15 text-red-400'
                  )}>
                    {product.stock > 0 ? `${product.stock} en stock` : 'Rupture'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-orbit-border">
                  <button
                    onClick={() => openEdit(product)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-orbit-primary/15 text-orbit-primary-light text-xs font-medium hover:bg-orbit-primary/25 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(product.id, product.name)}
                    className="flex items-center justify-center p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <ProductModal
            product={modalProduct}
            onClose={() => setShowModal(false)}
            onSaved={load}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
