import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, CheckCircle, Clock, Truck, ToggleLeft, ToggleRight } from 'lucide-react'
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

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  EN_ATTENTE:      { label: 'En attente',      color: 'text-amber-400',   bg: 'bg-amber-500/15',   dot: 'bg-amber-400' },
  PRISE_EN_CHARGE: { label: 'Prise en charge', color: 'text-violet-400',  bg: 'bg-violet-500/15',  dot: 'bg-violet-400' },
  EN_LIVRAISON:    { label: 'En livraison',    color: 'text-cyan-400',    bg: 'bg-cyan-500/15',    dot: 'bg-cyan-400' },
  LIVREE:          { label: 'Livrée',          color: 'text-emerald-400', bg: 'bg-emerald-500/15', dot: 'bg-emerald-400' },
  ANNULEE:         { label: 'Annulée',         color: 'text-red-400',     bg: 'bg-red-500/15',     dot: 'bg-red-400' },
}

function getDriverUser() {
  try { return JSON.parse(localStorage.getItem('smartfood_user') || '{}') } catch { return {} }
}

export function DriverDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string>('HORS_LIGNE')
  const [togglingStatus, setTogglingStatus] = useState(false)
  const navigate = useNavigate()
  const driver = getDriverUser()

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Bonjour' : now.getHours() < 17 ? 'Bon après-midi' : 'Bonsoir'

  useEffect(() => {
    api.get('/orders/deliveries')
      .then(res => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  const handleToggleStatus = async () => {
    const newStatus = status === 'DISPONIBLE' ? 'HORS_LIGNE' : 'DISPONIBLE'
    setTogglingStatus(true)
    try {
      await api.patch(`/driver/status?status=${newStatus}`)
      setStatus(newStatus)
    } catch { /* ignore */ }
    finally { setTogglingStatus(false) }
  }

  const total     = orders.length
  const enCours   = orders.filter(o => o.status === 'EN_LIVRAISON' || o.status === 'PRISE_EN_CHARGE').length
  const livrees   = orders.filter(o => o.status === 'LIVREE').length
  const enAttente = orders.filter(o => o.status === 'EN_ATTENTE').length

  const kpis = [
    { icon: Package,      label: 'Total assignées',       value: total,     color: 'bg-orbit-primary/15 text-orbit-primary-light' },
    { icon: Truck,        label: 'En cours',              value: enCours,   color: 'bg-cyan-500/15 text-cyan-400' },
    { icon: CheckCircle,  label: "Livrées",               value: livrees,   color: 'bg-emerald-500/15 text-emerald-400' },
    { icon: Clock,        label: 'En attente',            value: enAttente, color: 'bg-amber-500/15 text-amber-400' },
  ]

  // 3 dernières commandes
  const recent = [...orders]
    .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
    .slice(0, 3)

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{greeting}, {driver.firstName} 👋</h1>
          <p className="text-slate-500 text-sm mt-1 capitalize">
            {now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Toggle statut */}
        <button
          onClick={handleToggleStatus}
          disabled={togglingStatus}
          className={cn(
            'flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border',
            status === 'DISPONIBLE'
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
              : 'bg-orbit-surface2 text-slate-400 border-orbit-border hover:text-slate-200'
          )}
        >
          {status === 'DISPONIBLE'
            ? <><ToggleRight className="w-5 h-5" />Disponible</>
            : <><ToggleLeft className="w-5 h-5" />Hors ligne</>
          }
        </button>
      </motion.div>

      {/* KPI Cards */}
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

      {/* Dernières livraisons */}
      <div className="bg-orbit-surface border border-orbit-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-orbit-border">
          <div>
            <h2 className="text-base font-bold text-slate-100">Dernières livraisons</h2>
            <p className="text-xs text-slate-500 mt-0.5">Vos 3 commandes les plus récentes</p>
          </div>
          <button
            onClick={() => navigate('/driver/orders')}
            className="text-xs text-orbit-primary-light hover:text-orbit-accent transition-colors font-medium"
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
            {recent.map(order => {
              const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.EN_ATTENTE
              return (
                <div key={order.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/2 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-orbit-surface2 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-200">Commande #{order.id}</p>
                    <p className="text-xs text-slate-500 truncate">{order.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-400">{Number(order.totalAmount).toFixed(2)} DT</p>
                    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', cfg.bg, cfg.color)}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
