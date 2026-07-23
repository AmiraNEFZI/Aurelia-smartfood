import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, CheckCircle, Clock, Truck, MapPin, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '@/client/services/api'
import { cn } from '@/utils/cn'

interface Order {
  id: number
  clientName: string
  address: string
  totalAmount: number
  status: string
  orderDate: string
}

// ── Statuts livreur disponibles ───────────────────────────────────────────────
// EN_LIGNE est déprécié côté backend — supprimé de l'UI (remplacé par DISPONIBLE)
const DRIVER_STATUSES = [
  {
    key: 'DISPONIBLE',
    label: 'Disponible',
    desc: 'Prêt à recevoir des commandes',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
    dotPulse: 'animate-pulse',
  },
  {
    key: 'OCCUPE',
    label: 'Occupé',
    desc: 'En cours de livraison',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
    dotPulse: '',
  },
  {
    key: 'HORS_LIGNE',
    label: 'Hors ligne',
    desc: 'Non disponible',
    color: 'text-slate-400',
    bg: 'bg-slate-500/15',
    border: 'border-slate-500/30',
    dot: 'bg-slate-500',
    dotPulse: '',
  },
]

const ORDER_STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  EN_ATTENTE:      { label: 'En attente',      color: 'text-amber-400',   bg: 'bg-amber-500/15',   dot: 'bg-amber-400' },
  PRISE_EN_CHARGE: { label: 'Prise en charge', color: 'text-violet-400',  bg: 'bg-violet-500/15',  dot: 'bg-violet-400' },
  EN_LIVRAISON:    { label: 'En livraison',    color: 'text-cyan-400',    bg: 'bg-cyan-500/15',    dot: 'bg-cyan-400' },
  LIVREE:          { label: 'Livrée',          color: 'text-emerald-400', bg: 'bg-emerald-500/15', dot: 'bg-emerald-400' },
  ANNULEE:         { label: 'Annulée',         color: 'text-red-400',     bg: 'bg-red-500/15',     dot: 'bg-red-400' },
}

function getDriverUser() {
  try { return JSON.parse(localStorage.getItem('smartfood_user') || '{}') } catch { return {} }
}

// ── Composant StatusPicker ────────────────────────────────────────────────────
function StatusPicker({ current, onChange, loading = false }: {
  current: string
  onChange: (s: string) => void
  loading?: boolean
}) {
  const [open, setOpen] = useState(false)
  const currentCfg = DRIVER_STATUSES.find(s => s.key === current) ?? DRIVER_STATUSES[3]

  return (
    <div className="relative">
      <button
        onClick={() => !loading && setOpen(o => !o)}
        disabled={loading}
        className={cn(
          'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all',
          currentCfg.bg, currentCfg.color, currentCfg.border,
          loading && 'opacity-60 cursor-not-allowed'
        )}
      >
        {loading ? (
          <span className="w-2 h-2 rounded-full border border-current border-t-transparent animate-spin flex-shrink-0" />
        ) : (
          <span className={cn('w-2 h-2 rounded-full flex-shrink-0', currentCfg.dot, currentCfg.dotPulse)} />
        )}
        {currentCfg.label}
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-64 bg-orbit-surface2 border border-orbit-border rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="px-3 py-2 border-b border-orbit-border">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Changer mon statut</p>
              </div>
              {DRIVER_STATUSES.map(s => {
                // Un livreur OCCUPE ne peut passer qu'à HORS_LIGNE (pas DISPONIBLE directement)
                const isDisabled = current === 'OCCUPE' && s.key === 'DISPONIBLE'
                return (
                  <button
                    key={s.key}
                    onClick={() => { if (!isDisabled) { onChange(s.key); setOpen(false) } }}
                    disabled={isDisabled}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                      isDisabled
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:bg-white/5 cursor-pointer',
                      current === s.key && 'bg-white/5'
                    )}
                  >
                    <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', s.dot)} />
                    <div className="flex-1">
                      <p className={cn('text-sm font-semibold', s.color)}>{s.label}</p>
                      <p className="text-xs text-slate-600">
                        {isDisabled ? 'Libéré automatiquement à la livraison' : s.desc}
                      </p>
                    </div>
                    {current === s.key && (
                      <span className="text-xs text-slate-500">✓</span>
                    )}
                  </button>
                )
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export function DriverDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [driverStatus, setDriverStatus] = useState<string>('HORS_LIGNE')
  const [statusLoading, setStatusLoading] = useState(false)
  const navigate = useNavigate()
  const driver = getDriverUser()

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Bonjour' : now.getHours() < 17 ? 'Bon après-midi' : 'Bonsoir'

  useEffect(() => {
    // Charger les commandes
    api.get('/orders/deliveries')
      .then(res => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))

    // Charger le vrai statut du livreur depuis l'API
    api.get('/users/me')
      .then(res => {
        if (res.data?.statutLivreur) {
          setDriverStatus(res.data.statutLivreur)
        }
      })
      .catch(() => {}) // ignore si endpoint pas dispo
  }, [])

  const handleStatusChange = async (newStatus: string) => {
    const prev = driverStatus
    setDriverStatus(newStatus) // optimistic update
    setStatusLoading(true)
    try {
      await api.patch(`/driver/status?status=${newStatus}`)
    } catch (err: unknown) {
      setDriverStatus(prev) // rollback on error
      const ax = err as { response?: { data?: { message?: string } } }
      console.warn('Statut non changé:', ax.response?.data?.message)
    } finally {
      setStatusLoading(false)
    }
  }

  const total    = orders.length
  const enCours  = orders.filter(o => ['EN_LIVRAISON', 'PRISE_EN_CHARGE'].includes(o.status)).length
  const livrees  = orders.filter(o => o.status === 'LIVREE').length
  const annulees = orders.filter(o => o.status === 'ANNULEE').length

  const kpis = [
    { icon: Package,     label: 'Total assignées', value: total,     color: 'bg-orbit-primary/15 text-orbit-primary-light' },
    { icon: Truck,       label: 'En cours',        value: enCours,   color: 'bg-cyan-500/15 text-cyan-400' },
    { icon: CheckCircle, label: 'Livrées',          value: livrees,   color: 'bg-emerald-500/15 text-emerald-400' },
    { icon: Clock,       label: 'Annulées',         value: annulees,  color: 'bg-red-500/15 text-red-400' },
  ]

  const recent = [...orders]
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
    .slice(0, 4)

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">
            {greeting}, {driver.firstName} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1 capitalize">
            {now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Sélecteur de statut */}
        <StatusPicker current={driverStatus} onChange={handleStatusChange} loading={statusLoading} />
      </motion.div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-orbit-surface border border-orbit-border rounded-xl p-5 hover:border-orbit-border2 transition-colors"
          >
            <div className={cn('p-2 rounded-lg w-fit mb-3', kpi.color)}>
              <kpi.icon className="w-4 h-4" />
            </div>
            <p className="text-xs text-slate-500 mb-1">{kpi.label}</p>
            <p className="text-3xl font-bold text-slate-100">{loading ? '...' : kpi.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Dernières livraisons ── */}
      <div className="bg-orbit-surface border border-orbit-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-orbit-border">
          <div>
            <h2 className="text-base font-bold text-slate-100">Dernières livraisons</h2>
            <p className="text-xs text-slate-500 mt-0.5">Commandes les plus récentes assignées</p>
          </div>
          <button
            onClick={() => navigate('/driver/orders')}
            className="text-xs text-orbit-accent-light hover:text-orbit-primary-light transition-colors font-medium"
          >
            Voir tout →
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-orbit-accent border-t-transparent animate-spin" />
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-10 h-10 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Aucune livraison assignée pour le moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-orbit-border">
            {recent.map((order, i) => {
              const cfg = ORDER_STATUS_CFG[order.status] ?? ORDER_STATUS_CFG.EN_ATTENTE
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors cursor-pointer"
                  onClick={() => navigate('/driver/orders')}
                >
                  <div className="w-10 h-10 rounded-xl bg-orbit-surface2 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-200">Commande #{order.id}</p>
                      <span className="text-xs text-slate-500">·</span>
                      <p className="text-xs text-slate-500">{order.clientName}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-600 flex-shrink-0" />
                      <p className="text-xs text-slate-500 truncate">{order.address}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-emerald-400 mb-1">{Number(order.totalAmount).toFixed(2)} DT</p>
                    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1', cfg.bg, cfg.color)}>
                      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
                      {cfg.label}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Guide rapide ── */}
      <div className="bg-orbit-surface border border-orbit-border rounded-xl p-5">
        <h3 className="text-sm font-bold text-slate-200 mb-4">💡 Comment gérer mes livraisons</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { step: '1', title: 'Mettre "Disponible"', desc: 'Activez votre statut pour recevoir des commandes', color: 'bg-emerald-500/15 text-emerald-400' },
            { step: '2', title: 'Aller sur "Mes livraisons"', desc: 'Trouvez la commande assignée et cliquez dessus', color: 'bg-cyan-500/15 text-cyan-400' },
            { step: '3', title: 'Mettre à jour le statut', desc: 'Démarrez la livraison puis marquez-la comme livrée', color: 'bg-violet-500/15 text-violet-400' },
          ].map(g => (
            <div key={g.step} className={cn('rounded-xl p-4', g.color.split(' ')[0])}>
              <p className={cn('text-2xl font-black mb-2', g.color.split(' ')[1])}>{g.step}</p>
              <p className="text-sm font-semibold text-slate-200 mb-1">{g.title}</p>
              <p className="text-xs text-slate-500">{g.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
