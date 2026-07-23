import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RefreshCw, Truck, MapPin, X, CheckCircle,
  Package, Clock, ChevronRight, User, ShoppingBag,
  Banknote, Calendar,
} from 'lucide-react'
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

// ── Config statuts ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, {
  label: string; color: string; bg: string; dot: string
  border: string; gradient: string
}> = {
  EN_ATTENTE: {
    label: 'En attente', color: 'text-amber-400', bg: 'bg-amber-500/15',
    dot: 'bg-amber-400', border: 'border-amber-500/30', gradient: 'from-amber-500/10',
  },
  PRISE_EN_CHARGE: {
    label: 'Prise en charge', color: 'text-violet-400', bg: 'bg-violet-500/15',
    dot: 'bg-violet-400', border: 'border-violet-500/30', gradient: 'from-violet-500/10',
  },
  EN_LIVRAISON: {
    label: 'En livraison', color: 'text-cyan-400', bg: 'bg-cyan-500/15',
    dot: 'bg-cyan-400', border: 'border-cyan-500/30', gradient: 'from-cyan-500/10',
  },
  LIVREE: {
    label: 'Livrée', color: 'text-emerald-400', bg: 'bg-emerald-500/15',
    dot: 'bg-emerald-400', border: 'border-emerald-500/30', gradient: 'from-emerald-500/10',
  },
  ANNULEE: {
    label: 'Annulée', color: 'text-red-400', bg: 'bg-red-500/15',
    dot: 'bg-red-400', border: 'border-red-500/30', gradient: 'from-red-500/10',
  },
}

// ── Actions disponibles par statut ────────────────────────────────────────────
const NEXT_ACTIONS: Record<string, {
  label: string; sublabel: string; next: string
  btnClass: string; icon: React.ReactNode
}[]> = {
  PRISE_EN_CHARGE: [{
    label: 'Démarrer la livraison',
    sublabel: 'Indiquer que vous êtes en route',
    next: 'EN_LIVRAISON',
    btnClass: 'bg-cyan-500 hover:bg-cyan-400 text-white',
    icon: <Truck className="w-4 h-4" />,
  }],
  EN_LIVRAISON: [{
    label: 'Confirmer la livraison',
    sublabel: 'Marquer comme remise au client',
    next: 'LIVREE',
    btnClass: 'bg-emerald-500 hover:bg-emerald-400 text-white',
    icon: <CheckCircle className="w-4 h-4" />,
  }],
}

// ── Modal ──────────────────────────────────────────────────────────────────────
function OrderModal({ order, onClose, onStatusUpdate }: {
  order: Order
  onClose: () => void
  onStatusUpdate: (id: number, status: string) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const cfg     = STATUS_CFG[order.status] ?? STATUS_CFG.EN_ATTENTE
  const actions = NEXT_ACTIONS[order.status] ?? []
  const isFinished = order.status === 'LIVREE' || order.status === 'ANNULEE'

  const handleAction = async (next: string) => {
    setSaving(true)
    try {
      await onStatusUpdate(order.id, next)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="w-full sm:max-w-lg bg-orbit-surface border border-orbit-border rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: '92vh' }}
      >
        {/* ── Header ── */}
        <div className={cn(
          'flex items-center justify-between px-5 py-4 rounded-t-3xl sm:rounded-t-2xl bg-gradient-to-r to-transparent',
          cfg.gradient
        )}>
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-xl', cfg.bg)}>
              <Package className={cn('w-5 h-5', cfg.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Commande #{order.id}</h2>
                <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1', cfg.bg, cfg.color, cfg.border, 'border')}>
                  <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
                  {cfg.label}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" />
                {new Date(order.orderDate).toLocaleDateString('fr-FR', {
                  day: '2-digit', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">

          {/* Client */}
          <div className="flex items-center gap-3 p-3 bg-orbit-surface2 rounded-xl border border-orbit-border/60">
            <div className="w-9 h-9 rounded-full bg-orbit-primary/20 flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-orbit-primary-light" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">Client</p>
              <p className="text-sm font-semibold text-slate-100">{order.clientName}</p>
            </div>
          </div>

          {/* Adresse */}
          <div className="flex items-start gap-3 p-3 bg-orbit-surface2 rounded-xl border border-orbit-border/60">
            <div className="w-9 h-9 rounded-full bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">Adresse de livraison</p>
              <p className="text-sm font-semibold text-slate-100 mt-0.5">{order.address}</p>
            </div>
          </div>

          {/* Articles */}
          {order.items && order.items.length > 0 && (
            <div className="bg-orbit-surface2 rounded-xl border border-orbit-border/60 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-orbit-border/60">
                <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                <p className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">
                  Articles ({order.items.length})
                </p>
              </div>
              <div className="divide-y divide-orbit-border/40">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="flex-shrink-0 w-5 h-5 rounded-md bg-orbit-primary/20 text-orbit-primary-light text-[11px] font-bold flex items-center justify-center">
                        {item.quantity}
                      </span>
                      <span className="text-sm text-slate-300 truncate">{item.productName}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-200 ml-3 flex-shrink-0">
                      {Number(item.subtotal).toFixed(2)} DT
                    </span>
                  </div>
                ))}
              </div>
              {/* Total */}
              <div className="px-3 py-3 bg-emerald-500/8 border-t border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400">
                  <Banknote className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium">Paiement en espèces à la livraison</span>
                </div>
                <span className="text-base font-bold text-emerald-400">
                  {Number(order.totalAmount).toFixed(2)} DT
                </span>
              </div>
            </div>
          )}

          {/* État livraison terminée */}
          {isFinished && (
            <div className={cn(
              'rounded-xl p-4 flex items-center gap-3',
              order.status === 'LIVREE'
                ? 'bg-emerald-500/10 border border-emerald-500/25'
                : 'bg-red-500/10 border border-red-500/25'
            )}>
              {order.status === 'LIVREE' ? (
                <>
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-400">Livraison confirmée</p>
                    <p className="text-xs text-slate-500">Cette commande a été livrée avec succès.</p>
                  </div>
                </>
              ) : (
                <>
                  <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-red-400">Commande annulée</p>
                    <p className="text-xs text-slate-500">Cette commande a été annulée.</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Footer avec boutons d'action ── */}
        {actions.length > 0 && (
          <div className="px-5 pb-5 pt-3 border-t border-orbit-border space-y-2">
            {actions.map(action => (
              <button
                key={action.next}
                onClick={() => handleAction(action.next)}
                disabled={saving}
                className={cn(
                  'w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-bold',
                  'transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed',
                  'shadow-lg',
                  action.btnClass
                )}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Mise à jour en cours...
                  </>
                ) : (
                  <>
                    {action.icon}
                    <span>{action.label}</span>
                  </>
                )}
              </button>
            ))}
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Footer fermeture si pas d'action */}
        {actions.length === 0 && (
          <div className="px-5 pb-5 pt-3 border-t border-orbit-border">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all border border-orbit-border"
            >
              Fermer
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────────────────────
export function DriverOrdersPage() {
  const [orders, setOrders]     = useState<Order[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<Order | null>(null)
  const [filter, setFilter]     = useState<'all' | 'active' | 'done'>('all')

  const load = (silent = false) => {
    if (!silent) setLoading(true)
    api.get('/orders/deliveries')
      .then(res => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    const interval = setInterval(() => load(true), 20_000)
    return () => clearInterval(interval)
  }, [])

  const handleStatusUpdate = async (id: number, status: string) => {
    await api.patch(`/orders/${id}/status?status=${status}`)
    load(true)
  }

  const activeCount = orders.filter(o => ['PRISE_EN_CHARGE', 'EN_LIVRAISON'].includes(o.status)).length
  const doneCount   = orders.filter(o => ['LIVREE', 'ANNULEE'].includes(o.status)).length

  const filtered = orders.filter(o => {
    if (filter === 'active') return ['PRISE_EN_CHARGE', 'EN_LIVRAISON'].includes(o.status)
    if (filter === 'done')   return ['LIVREE', 'ANNULEE'].includes(o.status)
    return true
  })

  return (
    <div className="p-5 space-y-5 max-w-[1280px]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Mes livraisons</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {orders.length} commande{orders.length !== 1 ? 's' : ''} assignée{orders.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => load()}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all border border-orbit-border text-xs font-medium disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Actualiser
        </button>
      </div>

      {/* ── KPIs rapides ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', value: orders.length, color: 'text-slate-300', bg: 'bg-white/5', icon: Package },
          { label: 'En cours', value: activeCount, color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: Truck },
          { label: 'Terminées', value: doneCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle },
        ].map((kpi, i) => (
          <div key={i} className={cn('rounded-xl p-3 flex items-center gap-3 border border-orbit-border', kpi.bg)}>
            <kpi.icon className={cn('w-4 h-4 flex-shrink-0', kpi.color)} />
            <div>
              <p className={cn('text-xl font-bold', kpi.color)}>{kpi.value}</p>
              <p className="text-[11px] text-slate-600">{kpi.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtres ── */}
      <div className="flex items-center gap-1 bg-orbit-surface2 border border-orbit-border rounded-xl p-1 w-fit">
        {([
          { key: 'all',    label: 'Toutes',     count: orders.length },
          { key: 'active', label: 'En cours',   count: activeCount },
          { key: 'done',   label: 'Terminées',  count: doneCount },
        ] as { key: typeof filter; label: string; count: number }[]).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
              filter === f.key
                ? 'bg-orbit-accent text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            {f.label}
            <span className={cn(
              'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
              filter === f.key ? 'bg-white/20 text-white' : 'bg-orbit-border text-slate-500'
            )}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Liste ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-orbit-accent border-t-transparent animate-spin" />
          <p className="text-sm text-slate-600">Chargement des livraisons...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-orbit-surface2 border border-orbit-border flex items-center justify-center">
            <Package className="w-7 h-7 text-slate-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-400">Aucune livraison trouvée</p>
            <p className="text-xs text-slate-600 mt-1">
              {filter === 'active'
                ? "Vous n'avez pas de livraison en cours."
                : filter === 'done'
                  ? "Aucune livraison terminée pour le moment."
                  : "Passez en statut Disponible pour recevoir des commandes."}
            </p>
          </div>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="text-xs text-orbit-accent-light hover:underline">
              Voir toutes les livraisons
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((order, i) => {
            const cfg        = STATUS_CFG[order.status] ?? STATUS_CFG.EN_ATTENTE
            const hasActions = !!NEXT_ACTIONS[order.status]?.length
            const isActive   = ['PRISE_EN_CHARGE', 'EN_LIVRAISON'].includes(order.status)

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.035 }}
                onClick={() => setSelected(order)}
                className={cn(
                  'group relative bg-orbit-surface rounded-2xl border cursor-pointer',
                  'hover:shadow-lg transition-all duration-200',
                  isActive
                    ? cn('border-2', cfg.border, 'hover:shadow-current/10')
                    : 'border-orbit-border hover:border-orbit-border2',
                )}
              >
                {/* Accent strip pour les commandes actives */}
                {isActive && (
                  <div className={cn('absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl', cfg.dot)} />
                )}

                <div className="p-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', cfg.bg)}>
                        <Truck className={cn('w-4 h-4', cfg.color)} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-mono">#{order.id}</p>
                        <p className="text-sm font-bold text-slate-100 leading-tight mt-0.5">{order.clientName}</p>
                      </div>
                    </div>
                    <span className={cn(
                      'text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border flex-shrink-0',
                      cfg.bg, cfg.color, cfg.border
                    )}>
                      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot,
                        isActive && 'animate-pulse')} />
                      {cfg.label}
                    </span>
                  </div>

                  {/* Adresse */}
                  <div className="flex items-start gap-2 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-slate-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{order.address}</p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-orbit-border/60">
                    <div>
                      <p className="text-[11px] text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(order.orderDate).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-emerald-400">
                        {Number(order.totalAmount).toFixed(2)} DT
                      </span>
                      {hasActions ? (
                        <div className={cn(
                          'flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg',
                          cfg.bg, cfg.color
                        )}>
                          Agir
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── Modal ── */}
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
