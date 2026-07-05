import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Pencil, Trash2, RefreshCw, X, Building2,
  Package, Phone, Mail, Globe, MapPin, ToggleLeft, ToggleRight,
  ChevronDown, ChevronUp, AlertCircle,
} from 'lucide-react'
import { Card, Input, Button, Badge } from '@/admin/components/ui'
import { partnerApi, adminProductsApi } from '@/client/services/api'
import type { PartnerData, PartnerProductData } from '@/client/services/api'
import { cn } from '@/utils/cn'

// ── Modal Partenaire ──────────────────────────────────────────────────────────
function PartnerModal({ partner, onClose, onSaved }: {
  partner: PartnerData | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!partner
  const [form, setForm] = useState({
    name: partner?.name ?? '',
    email: partner?.email ?? '',
    phone: partner?.phone ?? '',
    address: partner?.address ?? '',
    contactPerson: partner?.contactPerson ?? '',
    website: partner?.website ?? '',
    description: partner?.description ?? '',
    isActive: partner?.isActive ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isEdit) await partnerApi.update(partner!.id, form)
      else await partnerApi.create(form)
      onSaved()
      onClose()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      setError(ax.response?.data?.message ?? 'Erreur lors de l\'enregistrement.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl bg-orbit-surface border border-orbit-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-orbit-border">
          <h2 className="text-lg font-bold text-slate-100">
            {isEdit ? `Modifier "${partner!.name}"` : 'Nouveau partenaire'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 overflow-y-auto max-h-[65vh]">
            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
            <Input label="Nom du partenaire *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required prefix={<Building2 className="w-3.5 h-3.5" />} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} prefix={<Mail className="w-3.5 h-3.5" />} />
              <Input label="Téléphone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} prefix={<Phone className="w-3.5 h-3.5" />} />
            </div>
            <Input label="Personne de contact" value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))} />
            <Input label="Adresse" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} prefix={<MapPin className="w-3.5 h-3.5" />} />
            <Input label="Site web" value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} prefix={<Globe className="w-3.5 h-3.5" />} />
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
              <textarea className="w-full bg-orbit-surface2 border border-orbit-border rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orbit-primary resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <button type="button" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}>
                {form.isActive ? <ToggleRight className="w-8 h-8 text-emerald-400" /> : <ToggleLeft className="w-8 h-8 text-slate-500" />}
              </button>
              <span className="text-sm text-slate-300">{form.isActive ? 'Partenaire actif' : 'Partenaire inactif'}</span>
            </label>
          </div>
          <div className="flex gap-3 px-6 py-4 border-t border-orbit-border">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm text-slate-400 border border-orbit-border hover:bg-white/5 transition-colors">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-orbit-primary text-white hover:bg-orbit-primary/80 transition-colors disabled:opacity-50">
              {loading ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ── Modal Produit Partenaire ──────────────────────────────────────────────────
function ProductModal({ partnerId, pp, products, onClose, onSaved }: {
  partnerId: number
  pp: PartnerProductData | null
  products: { id: number; name: string; price: number }[]
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!pp
  const [productId, setProductId] = useState(pp?.productId ?? 0)
  const [stock, setStock] = useState(pp?.stock?.toString() ?? '')
  const [price, setPrice] = useState(pp?.price?.toString() ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!productId) { setError('Sélectionnez un produit.'); return }
    setError('')
    setLoading(true)
    // Normaliser la virgule en point pour le prix (format français → JSON)
    const normalizedPrice = parseFloat(price.replace(',', '.'))
    const normalizedStock = parseInt(stock, 10)
    if (isNaN(normalizedPrice) || normalizedPrice < 0) { setError('Prix invalide.'); setLoading(false); return }
    if (isNaN(normalizedStock) || normalizedStock < 0) { setError('Stock invalide.'); setLoading(false); return }
    try {
      if (isEdit) await partnerApi.updateProduct(pp!.id, { stock: normalizedStock, price: normalizedPrice })
      else await partnerApi.addProduct(partnerId, { productId, stock: normalizedStock, price: normalizedPrice })
      onSaved()
      onClose()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      setError(ax.response?.data?.message ?? 'Erreur.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
        className="w-full max-w-md bg-orbit-surface border border-orbit-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-orbit-border">
          <h2 className="text-lg font-bold text-slate-100">{isEdit ? 'Modifier le stock' : 'Ajouter un produit'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
            {!isEdit && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Produit *</label>
                <select value={productId} onChange={e => setProductId(Number(e.target.value))}
                  className="w-full bg-orbit-surface2 border border-orbit-border rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orbit-primary">
                  <option value={0}>— Sélectionner un produit —</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (prix Aurelia : {p.price} DT)</option>)}
                </select>
              </div>
            )}
            {isEdit && <p className="text-sm text-slate-300 font-semibold">{pp!.productName}</p>}
            <Input label="Stock disponible *" type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} required prefix={<Package className="w-3.5 h-3.5" />} />
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Prix partenaire (DT) *</label>
              <input
                type="text"
                inputMode="decimal"
                className="w-full bg-orbit-surface2 border border-orbit-border rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orbit-primary"
                placeholder="ex: 1.95 ou 1,95"
                value={price}
                onChange={e => setPrice(e.target.value)}
                required
              />
              <p className="text-xs text-slate-600 mt-1">Prix auquel le partenaire fournit ce produit</p>
            </div>
          </div>
          <div className="flex gap-3 px-6 py-4 border-t border-orbit-border">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm text-slate-400 border border-orbit-border hover:bg-white/5 transition-colors">Annuler</button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-orbit-primary text-white hover:bg-orbit-primary/80 transition-colors disabled:opacity-50">
              {loading ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ── Card Partenaire ───────────────────────────────────────────────────────────
function PartnerCard({ partner, allProducts, onEdit, onDelete, onToggle, onRefresh }: {
  partner: PartnerData
  allProducts: { id: number; name: string; price: number }[]
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
  onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingPP, setEditingPP] = useState<PartnerProductData | null>(null)

  const handleRemoveProduct = async (ppId: number) => {
    if (!confirm('Retirer ce produit du partenaire ?')) return
    await partnerApi.removeProduct(ppId)
    onRefresh()
  }

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-orbit-surface border border-orbit-border rounded-xl overflow-hidden hover:border-orbit-border2 transition-all">

        {/* Header */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orbit-primary/15 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-orbit-primary-light" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">{partner.name}</h3>
                {partner.contactPerson && <p className="text-xs text-slate-500">{partner.contactPerson}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full',
                partner.isActive ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-500/15 text-slate-400')}>
                {partner.isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>

          {/* Infos */}
          <div className="space-y-1.5 mb-4">
            {partner.email && <div className="flex items-center gap-2 text-xs text-slate-500"><Mail className="w-3 h-3" />{partner.email}</div>}
            {partner.phone && <div className="flex items-center gap-2 text-xs text-slate-500"><Phone className="w-3 h-3" />{partner.phone}</div>}
            {partner.address && <div className="flex items-center gap-2 text-xs text-slate-500"><MapPin className="w-3 h-3" /><span className="truncate">{partner.address}</span></div>}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-orbit-surface2 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-slate-200">{partner.totalProducts}</p>
              <p className="text-[10px] text-slate-500">Produits</p>
            </div>
            <div className="bg-orbit-surface2 rounded-lg p-2.5 text-center">
              <p className="text-lg font-bold text-emerald-400">{partner.totalStock}</p>
              <p className="text-[10px] text-slate-500">Unités en stock</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-orbit-primary/15 text-orbit-primary-light text-xs font-medium hover:bg-orbit-primary/25 transition-colors">
              <Pencil className="w-3 h-3" />Modifier
            </button>
            <button onClick={onToggle} className={cn('flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors',
              partner.isActive ? 'bg-amber-500/15 text-amber-400 hover:bg-amber-500/25' : 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25')}>
              {partner.isActive ? <ToggleLeft className="w-3 h-3" /> : <ToggleRight className="w-3 h-3" />}
              {partner.isActive ? 'Désactiver' : 'Activer'}
            </button>
            <button onClick={onDelete} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Produits section */}
        <div className="border-t border-orbit-border">
          <button onClick={() => setExpanded(e => !e)}
            className="w-full flex items-center justify-between px-5 py-3 text-xs text-slate-400 hover:text-slate-200 hover:bg-white/3 transition-colors">
            <span className="font-medium">Produits & stocks ({partner.products.length})</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                <div className="px-5 pb-4 space-y-2">
                  {partner.products.length === 0 ? (
                    <p className="text-xs text-slate-600 italic py-2">Aucun produit configuré.</p>
                  ) : (
                    partner.products.map(pp => (
                      <div key={pp.id} className="flex items-center gap-3 bg-orbit-surface2 rounded-lg p-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-300 truncate">{pp.productName}</p>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[11px] text-slate-500">Stock : <span className={cn('font-bold', pp.stock > 5 ? 'text-emerald-400' : pp.stock > 0 ? 'text-amber-400' : 'text-red-400')}>{pp.stock}</span></span>
                            <span className="text-[11px] text-slate-500">Prix : <span className="font-bold text-slate-300">{Number(pp.price).toFixed(2)} DT</span></span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', pp.isAvailable && pp.stock > 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400')}>
                            {pp.isAvailable && pp.stock > 0 ? '✓' : '✗'}
                          </span>
                          <button onClick={() => { setEditingPP(pp); setShowProductModal(true) }} className="p-1 rounded text-orbit-primary-light hover:bg-orbit-primary/15 transition-colors">
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleRemoveProduct(pp.id)} className="p-1 rounded text-red-400 hover:bg-red-500/15 transition-colors">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  <button onClick={() => { setEditingPP(null); setShowProductModal(true) }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-orbit-border text-xs text-slate-500 hover:text-slate-300 hover:border-orbit-border2 transition-colors">
                    <Plus className="w-3.5 h-3.5" />Ajouter un produit
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {showProductModal && (
          <ProductModal
            partnerId={partner.id}
            pp={editingPP}
            products={allProducts}
            onClose={() => setShowProductModal(false)}
            onSaved={onRefresh}
          />
        )}
      </AnimatePresence>
    </>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export function PartnersPage() {
  const [partners, setPartners] = useState<PartnerData[]>([])
  const [allProducts, setAllProducts] = useState<{ id: number; name: string; price: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editPartner, setEditPartner] = useState<PartnerData | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const [pRes, prodRes] = await Promise.all([
        partnerApi.getAll(),
        adminProductsApi.getAll(),
      ])
      setPartners(Array.isArray(pRes.data) ? pRes.data : [])
      setAllProducts(Array.isArray(prodRes.data) ? prodRes.data : [])
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Supprimer le partenaire "${name}" et tous ses stocks ?`)) return
    await partnerApi.delete(id)
    setPartners(p => p.filter(x => x.id !== id))
  }

  const handleToggle = async (id: number) => {
    const res = await partnerApi.toggle(id)
    setPartners(p => p.map(x => x.id === id ? res.data : x))
  }

  const filtered = partners.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.contactPerson ?? '').toLowerCase().includes(search.toLowerCase())
  )

  const activeCount = partners.filter(p => p.isActive).length
  const totalStock = partners.reduce((s, p) => s + p.totalStock, 0)

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Partenaires</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {partners.length} partenaires · {activeCount} actifs · {totalStock} unités en stock total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => { setEditPartner(null); setShowModal(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orbit-primary text-white text-sm font-semibold hover:bg-orbit-primary/80 transition-colors">
            <Plus className="w-4 h-4" />Nouveau partenaire
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-orbit-accent/10 border border-orbit-accent/20 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-orbit-accent-light flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-orbit-accent-light">Sourcing automatique activé</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Quand un produit Aurelia est en rupture, le système sélectionne automatiquement le partenaire avec le prix le plus bas.
            En cas d'égalité de prix, le choix est aléatoire.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Input prefix={<Search className="w-3.5 h-3.5" />} placeholder="Rechercher un partenaire..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-orbit-primary border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Aucun partenaire trouvé.</p>
          <button onClick={() => { setEditPartner(null); setShowModal(true) }} className="mt-3 text-sm text-orbit-primary-light hover:underline">
            + Ajouter le premier partenaire
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(partner => (
            <PartnerCard
              key={partner.id}
              partner={partner}
              allProducts={allProducts}
              onEdit={() => { setEditPartner(partner); setShowModal(true) }}
              onDelete={() => handleDelete(partner.id, partner.name)}
              onToggle={() => handleToggle(partner.id)}
              onRefresh={load}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <PartnerModal
            partner={editPartner}
            onClose={() => setShowModal(false)}
            onSaved={load}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
