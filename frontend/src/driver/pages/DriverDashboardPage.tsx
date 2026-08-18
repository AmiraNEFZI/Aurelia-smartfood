import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, CheckCircle, Truck, MapPin, ChevronDown,
  Star, TrendingUp, Award, MessageSquare, AlertTriangle, ShieldAlert
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '@/client/services/api'
import { cn } from '@/utils/cn'

// ── Interfaces ────────────────────────────────────────────────────────────────
interface Order {
  id: number; clientName: string; address: string
  totalAmount: number; status: string; orderDate: string
}

interface ReviewItem {
  id: number; orderId: number; rating: number
  comment?: string; createdAt: string
}

interface MyReviewsSummary {
  driverId: number; driverName: string
  averageRating: number; totalReviews: number
  satisfactionPct: number; recentReviews: ReviewItem[]
}

interface ComplaintItem {
  id: number; orderId: number; clientName: string
  categoryLabel: string; description: string
  status: string; createdAt: string
}

// ── Config statuts livreur ────────────────────────────────────────────────────
const DRIVER_STATUSES = [
  { key: 'DISPONIBLE', label: 'Disponible', desc: 'Prêt à recevoir des commandes',
    color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30',
    dot: 'bg-emerald-400', dotPulse: 'animate-pulse' },
  { key: 'OCCUPE', label: 'Occupé', desc: 'En cours de livraison',
    color: 'text-amber-400', bg: 'bg-amber-500/15', border: 'border-amber-500/30',
    dot: 'bg-amber-400', dotPulse: '' },
  { key: 'HORS_LIGNE', label: 'Hors ligne', desc: 'Non disponible',
    color: 'text-slate-400', bg: 'bg-slate-500/15', border: 'border-slate-500/30',
    dot: 'bg-slate-500', dotPulse: '' },
]

const ORDER_STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  EN_ATTENTE:      { label: 'En attente',      color: 'text-amber-400',   bg: 'bg-amber-500/15',  dot: 'bg-amber-400' },
  PRISE_EN_CHARGE: { label: 'Prise en charge', color: 'text-violet-400',  bg: 'bg-violet-500/15', dot: 'bg-violet-400' },
  EN_LIVRAISON:    { label: 'En livraison',     color: 'text-cyan-400',    bg: 'bg-cyan-500/15',   dot: 'bg-cyan-400' },
  LIVREE:          { label: 'Livrée',           color: 'text-emerald-400', bg: 'bg-emerald-500/15',dot: 'bg-emerald-400' },
  ANNULEE:         { label: 'Annulée',          color: 'text-red-400',     bg: 'bg-red-500/15',    dot: 'bg-red-400' },
}

function getDriverUser() {
  try { return JSON.parse(localStorage.getItem('smartfood_user') || '{}') } catch { return {} }
}

// ── Étoiles ───────────────────────────────────────────────────────────────────
function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn('w-4 h-4', i < Math.round(value) ? 'text-amber-400' : 'text-slate-700')}
          fill="currentColor"
        />
      ))}
    </div>
  )
}

// ── Barre satisfaction ────────────────────────────────────────────────────────
function SatisfactionBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? 'bg-emerald-400' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="w-full bg-orbit-border rounded-full h-2 overflow-hidden">
      <motion.div
        className={cn('h-2 rounded-full', color)}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
      />
    </div>
  )
}

// ── StatusPicker ──────────────────────────────────────────────────────────────
function StatusPicker({ current, onChange, loading = false }: {
  current: string; onChange: (s: string) => void; loading?: boolean
}) {
  const [open, setOpen] = useState(false)
  const cfg = DRIVER_STATUSES.find(s => s.key === current) ?? DRIVER_STATUSES[2]
  return (
    <div className="relative">
      <button
        onClick={() => !loading && setOpen(o => !o)}
        disabled={loading}
        className={cn('flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all',
          cfg.bg, cfg.color, cfg.border, loading && 'opacity-60 cursor-not-allowed')}
      >
        {loading
          ? <span className="w-2 h-2 rounded-full border border-current border-t-transparent animate-spin" />
          : <span className={cn('w-2 h-2 rounded-full', cfg.dot, cfg.dotPulse)} />}
        {cfg.label}
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
                const disabled = current === 'OCCUPE' && s.key === 'DISPONIBLE'
                return (
                  <button key={s.key}
                    onClick={() => { if (!disabled) { onChange(s.key); setOpen(false) } }}
                    disabled={disabled}
                    className={cn('w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                      disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-white/5',
                      current === s.key && 'bg-white/5')}
                  >
                    <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', s.dot)} />
                    <div className="flex-1">
                      <p className={cn('text-sm font-semibold', s.color)}>{s.label}</p>
                      <p className="text-xs text-slate-600">
                        {disabled ? 'Libéré automatiquement à la livraison' : s.desc}
                      </p>
                    </div>
                    {current === s.key && <span className="text-xs text-slate-500">✓</span>}
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
  const [orders, setOrders]           = useState<Order[]>([])
  const [loading, setLoading]         = useState(true)
  const [driverStatus, setDriverStatus] = useState('HORS_LIGNE')
  const [statusLoading, setStatusLoading] = useState(false)
  const [reviews, setReviews]         = useState<MyReviewsSummary | null>(null)
  const [complaints, setComplaints]   = useState<ComplaintItem[]>([])
  const [showComplaints, setShowComplaints] = useState(false)
  const navigate = useNavigate()
  const driver = getDriverUser()

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Bonjour' : now.getHours() < 17 ? 'Bon après-midi' : 'Bonsoir'

  useEffect(() => {
    api.get('/orders/deliveries')
      .then(res => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))

    api.get('/users/me')
      .then(res => { if (res.data?.statutLivreur) setDriverStatus(res.data.statutLivreur) })
      .catch(() => {})

    // Charger les évaluations du livreur connecté
    api.get('/driver/my-reviews')
      .then(res => setReviews(res.data))
      .catch(() => setReviews(null))

    // Charger les réclamations reçues
    api.get('/driver/my-complaints')
      .then(res => setComplaints(Array.isArray(res.data) ? res.data : []))
      .catch(() => setComplaints([]))
  }, [])

  const handleStatusChange = async (newStatus: string) => {
    const prev = driverStatus
    setDriverStatus(newStatus)
    setStatusLoading(true)
    try {
      await api.patch(`/driver/status?status=${newStatus}`)
    } catch (err: unknown) {
      setDriverStatus(prev)
      const ax = err as { response?: { data?: { message?: string } } }
      console.warn('Statut non changé:', ax.response?.data?.message)
    } finally {
      setStatusLoading(false)
    }
  }

  const total   = orders.length
  const enCours = orders.filter(o => ['EN_LIVRAISON', 'PRISE_EN_CHARGE'].includes(o.status)).length
  const livrees = orders.filter(o => o.status === 'LIVREE').length
  const annulees = orders.filter(o => o.status === 'ANNULEE').length

  const kpis = [
    { icon: Package,     label: 'Total assignées', value: total,    color: 'bg-orbit-primary/15 text-orbit-primary-light' },
    { icon: Truck,       label: 'En cours',        value: enCours,  color: 'bg-cyan-500/15 text-cyan-400' },
    { icon: CheckCircle, label: 'Livrées',          value: livrees,  color: 'bg-emerald-500/15 text-emerald-400' },
    { icon: Package,     label: 'Annulées',         value: annulees, color: 'bg-red-500/15 text-red-400' },
  ]

  const recent = [...orders]
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
    .slice(0, 4)

  // Couleur du score satisfaction
  const pct = reviews?.satisfactionPct ?? 0
  const satisfactionColor = pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-red-400'
  const satisfactionLabel = pct >= 80 ? 'Excellent' : pct >= 60 ? 'Bien' : pct > 0 ? 'À améliorer' : '—'

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{greeting}, {driver.firstName} 👋</h1>
          <p className="text-slate-500 text-sm mt-1 capitalize">
            {now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <StatusPicker current={driverStatus} onChange={handleStatusChange} loading={statusLoading} />
      </motion.div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
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

      {/* ── Satisfaction client ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-orbit-surface border border-orbit-border rounded-xl overflow-hidden"
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-orbit-border bg-gradient-to-r from-amber-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/15">
              <Award className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Satisfaction client</h2>
              <p className="text-xs text-slate-500 mt-0.5">Basée sur les évaluations des clients après livraison</p>
            </div>
          </div>
          {reviews && reviews.totalReviews > 0 && (
            <div className={cn('text-2xl font-black', satisfactionColor)}>
              {satisfactionLabel}
            </div>
          )}
        </div>

        <div className="p-5">
          {!reviews || reviews.totalReviews === 0 ? (
            /* Aucune évaluation */
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-orbit-surface2 border border-orbit-border flex items-center justify-center">
                <Star className="w-6 h-6 text-slate-600" />
              </div>
              <p className="text-sm font-semibold text-slate-400">Aucune évaluation pour le moment</p>
              <p className="text-xs text-slate-600 text-center max-w-xs">
                Vos clients pourront noter vos livraisons après réception de leur commande.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Score principal */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center gap-3 p-5 bg-orbit-surface2 rounded-2xl border border-orbit-border">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <div className={cn('text-6xl font-black', satisfactionColor)}>
                  {reviews.averageRating.toFixed(1)}
                </div>
                <StarRating value={reviews.averageRating} />
                <p className="text-xs text-slate-500">
                  sur {reviews.totalReviews} avis client{reviews.totalReviews > 1 ? 's' : ''}
                </p>
                {/* Barre satisfaction */}
                <div className="w-full space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Taux de satisfaction</span>
                    <span className={cn('font-bold', satisfactionColor)}>{reviews.satisfactionPct}%</span>
                  </div>
                  <SatisfactionBar pct={reviews.satisfactionPct} />
                </div>
              </div>

              {/* Derniers commentaires */}
              <div className="lg:col-span-2 flex flex-col gap-3">
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <p className="text-sm font-semibold text-slate-300">Derniers avis</p>
                </div>
                {reviews.recentReviews.length === 0 ? (
                  <p className="text-xs text-slate-600 italic">Aucun commentaire écrit pour le moment.</p>
                ) : (
                  reviews.recentReviews.map((r, i) => (
                    <motion.div key={r.id}
                      initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="flex items-start gap-3 p-3 bg-orbit-surface2 rounded-xl border border-orbit-border"
                    >
                      <div className="w-8 h-8 rounded-full bg-orbit-primary/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-orbit-primary-light">
                        {r.rating}★
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StarRating value={r.rating} />
                          <span className="text-[11px] text-slate-600">
                            Commande #{r.orderId}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{r.comment}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Réclamations reçues ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-orbit-surface border border-orbit-border rounded-xl overflow-hidden"
      >
        {/* En-tête cliquable */}
        <button
          onClick={() => setShowComplaints(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 border-b border-orbit-border hover:bg-white/3 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-xl', complaints.length > 0 ? 'bg-red-500/15' : 'bg-slate-500/10')}>
              <ShieldAlert className={cn('w-5 h-5', complaints.length > 0 ? 'text-red-400' : 'text-slate-500')} />
            </div>
            <div className="text-left">
              <h2 className="text-base font-bold text-slate-100">Réclamations reçues</h2>
              <p className="text-xs text-slate-500 mt-0.5">Signalements de clients suite à vos livraisons</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {complaints.length > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/25">
                {complaints.length} réclamation{complaints.length > 1 ? 's' : ''}
              </span>
            )}
            <ChevronDown className={cn('w-4 h-4 text-slate-500 transition-transform', showComplaints && 'rotate-180')} />
          </div>
        </button>

        {/* Contenu dépliable */}
        <AnimatePresence>
          {showComplaints && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-5">
                {complaints.length === 0 ? (
                  <div className="flex flex-col items-center py-6 gap-2">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-emerald-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-300">Aucune réclamation</p>
                    <p className="text-xs text-slate-600 text-center">
                      Continuez votre excellent travail !
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {complaints.map((c, i) => (
                      <motion.div key={c.id}
                        initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20"
                      >
                        <div className="w-8 h-8 rounded-full bg-red-500/15 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full">
                                {c.categoryLabel}
                              </span>
                              <span className="text-[11px] text-slate-600">
                                Commande #{c.orderId}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-600 flex-shrink-0">
                              {new Date(c.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed">{c.description}</p>
                          <p className="text-[11px] text-slate-600 mt-1">
                            Signalé par : {c.clientName}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Dernières livraisons ── */}
      <div className="bg-orbit-surface border border-orbit-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-orbit-border">
          <div>
            <h2 className="text-base font-bold text-slate-100">Dernières livraisons</h2>
            <p className="text-xs text-slate-500 mt-0.5">Commandes les plus récentes assignées</p>
          </div>
          <button onClick={() => navigate('/driver/orders')}
            className="text-xs text-orbit-accent-light hover:text-orbit-primary-light transition-colors font-medium">
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
                <motion.div key={order.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
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
