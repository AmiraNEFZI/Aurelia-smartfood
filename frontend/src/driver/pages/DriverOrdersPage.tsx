import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, Truck, MapPin, X, CheckCircle, Package } from 'lucide-react'
import api from '@/client/services/api'
import { cn } from '@/utils/cn'

interface OrderItem { productName: string; quantity: number; unitPrice: number; subtotal: number }
interface Order {
  id: number
  clientName: string
  address: string
  totalAmount: number
  status: string
  orderDate: string
  items?: OrderItem[]
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  EN_ATTENTE:      { label: 'En attente',      color: 'text-amber-400',   bg: 'bg-amber-500/15',   dot: 'bg-amber-400' },
  PRISE_EN_CHARGE: { label: 'Prise en charge', color: 'text-violet-400',  bg: 'bg-violet-500/15',  dot: 'bg-violet-400' },
  EN_LIVRAISON:    { label: 'En livraison',    color: 'text-cyan-400',    bg: 'bg-cyan-500/15',    dot: 'bg-cyan-400' },
  LIVREE:          { label: 'Livrée ✓',        color: 'text-emerald-400', bg: 'bg-emerald-500/15', dot: 'bg-emerald-400' },
  ANNULEE:         { label: 'Annulée',         color: 'text-red-400',     bg: 'bg-red-500/15',     dot: 'bg-red-400' },
}

// Actions disponibles par statut pour le livreur
const NEXT_ACTIONS: Record<string, { label: string; next: string; color: string }[]> = {
  PRISE_EN_CHARGE: [{ label: '🚚 Démarrer la livraison', next: 'EN_LIVRAISON', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/25' }],
  EN_LIVRAISON:    [{ label: '✅ Marquer comme livrée',   next: 'LIVREE',       color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25' }],
}

function OrderModal({ order, onClose, onStatusUpdate }: {
  order: Order
  onClose: () => void
  onStatusUpdate: (id: number, status: string) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.EN_ATTENTE
  const actions = NEXT_ACTIONS[order.status] ?? []

  const handleAction = async (next: string) => {
    setSaving(true)
    await onStatusUpdate(order.id, next)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-orbit-surface border border-orbit-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orbit-border">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Commande #{order.id}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {new Date(order.orderDate).toLocaleDateString('fr-FR', { dateStyle: 'long' })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Statut */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Statut actuel</span>
            <span className={cn('text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5', cfg.bg, cfg.color)}>
              <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />{cfg.label}
            </span>
          </div>

          {/* Adresse */}
          <div className="bg-orbit-surface2 rounded-xl p-4 flex items-start gap-3">
            <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500 mb-1">Adresse de livraison</p>
              <p className="text-sm font-semibold text-slate-200">{order.address}</p>
            </div>
          </div>

          {/* Client */}
          <div className="bg-orbit-surface2 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-2">Client</p>
            <p className="text-sm font-semibold text-slate-200">{order.clientName}</p>
          </div>

          {/* Articles */}
          {order.items && order.items.length > 0 && (
            <div className="bg-orbit-surface2 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider font-semibold">Articles</p>
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-slate-300">{item.productName} <span className="text-slate-600">×{item.quantity}</span></span>
                    <span className="text-slate-200 font-medium">{Number(item.subtotal).toFixed(2)} DT</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-orbit-border flex justify-between">
                <span className="text-sm font-bold text-slate-200">Total à encaisser</span>
                <span className="text-sm font-bold text-emerald-400">{Number(order.totalAmount).toFixed(2)} DT</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 flex items-center gap-1">
                💵 Paiement en espèces à la livraison
              </p>
            </div>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <div className="space-y-2">
              {actions.map(action => (
                <button
                  key={action.next}
                  onClick={() => handleAction(action.next)}
                  disabled={saving}
                  className={cn('w-full py-3 rounded-xl text-sm font-bold border transition-all disabled:opacity-50', action.color)}
                >
                  {saving ? 'Mise à jour...' : action.label}
                </button>
              ))}
            </div>
          )}

          {order.status === 'LIVREE' && (
            <div className="text-center py-2 flex items-center justify-center gap-2 text-emerald-400 font-semibold text-sm">
              <CheckCircle className="w-5 h-5" /> Livraison complétée
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export function DriverOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Order | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all')

  const load = () => {
    setLoading(true)
    api.get('/orders/deliveries')
      .then(res => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleStatusUpdate = async (id: number, status: string) => {
    await api.patch(`/orders/${id}/status?status=${status}`)
    load()
  }

  const filtered = orders.filter(o => {
    if (filter === 'active') return ['PRISE_EN_CHARGE', 'EN_LIVRAISON', 'EN_ATTENTE'].includes(o.status)
    if (filter === 'done')   return o.status === 'LIVREE' || o.status === 'ANNULEE'
    return true
  })

  const activeCount = orders.filter(o => ['PRISE_EN_CHARGE', 'EN_LIVRAISON', 'EN_ATTENTE'].includes(o.status)).length
  const doneCount   = orders.filter(o => o.status === 'LIVREE' || o.status === 'ANNULEE').length

  return (
    <div className="p-6 space-y-5 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Mes livraisons</h1>
          <p className="text-slate-500 text-sm mt-0.5">{orders.length} commandes assignées</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-1 bg-orbit-surface2 border border-orbit-border rounded-lg p-1 w-fit">
        {([
          { key: 'all',    label: `Toutes (${orders.length})` },
          { key: 'active', label: `En cours (${activeCount})` },
          { key: 'done',   label: `Terminées (${doneCount})` },
        ] as { key: typeof filter; label: string }[]).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap',
              filter === f.key ? 'bg-orbit-accent text-white' : 'text-slate-500 hover:text-slate-300'
            )}
          >{f.label}</button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-orbit-accent border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-500">Aucune livraison trouvée.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((order, i) => {
            const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.EN_ATTENTE
            const hasActions = !!NEXT_ACTIONS[order.status]?.length
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-orbit-surface border border-orbit-border rounded-xl p-5 hover:border-orbit-border2 transition-all cursor-pointer"
                onClick={() => setSelected(order)}
              >
                {/* Top */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-slate-500 font-mono mb-1">#{order.id}</p>
                    <p className="text-sm font-bold text-slate-200">{order.clientName}</p>
                  </div>
                  <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5', cfg.bg, cfg.color)}>
                    <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                    {cfg.label}
                  </span>
                </div>

                {/* Adresse */}
                <div className="flex items-start gap-2 mb-4">
                  <MapPin className="w-3.5 h-3.5 text-slate-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-slate-400 line-clamp-2">{order.address}</p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-orbit-border">
                  <span className="text-base font-bold text-emerald-400">{Number(order.totalAmount).toFixed(2)} DT</span>
                  {hasActions ? (
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-orbit-accent/15 text-orbit-accent-light font-medium">
                      Action requise →
                    </span>
                  ) : (
                    <span className="text-xs text-slate-600">
                      {new Date(order.orderDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <OrderModal
            order={selected}
            onClose={() => setSelected(null)}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
