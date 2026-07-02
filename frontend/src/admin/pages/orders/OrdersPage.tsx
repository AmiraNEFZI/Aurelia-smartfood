import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, RefreshCw, ChevronDown, X, Truck, Eye, CheckCircle, XCircle,
} from 'lucide-react'
import { Button, Badge, Avatar, Card, Input } from '@/admin/components/ui'
import { adminOrdersApi, adminUsersApi } from '@/client/services/api'
import type { OrderResponse } from '@/client/services/api'
import { cn } from '@/utils/cn'

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  EN_ATTENTE:      { label: 'En attente',      color: 'text-amber-400',   bg: 'bg-amber-500/15',    dot: 'bg-amber-400' },
  PRISE_EN_CHARGE: { label: 'Prise en charge', color: 'text-violet-400',  bg: 'bg-violet-500/15',   dot: 'bg-violet-400' },
  EN_LIVRAISON:    { label: 'En livraison',    color: 'text-cyan-400',    bg: 'bg-cyan-500/15',     dot: 'bg-cyan-400' },
  LIVREE:          { label: 'Livrée',          color: 'text-emerald-400', bg: 'bg-emerald-500/15',  dot: 'bg-emerald-400' },
  ANNULEE:         { label: 'Annulée',         color: 'text-red-400',     bg: 'bg-red-500/15',      dot: 'bg-red-400' },
}

const ALL_STATUSES = ['EN_ATTENTE', 'PRISE_EN_CHARGE', 'EN_LIVRAISON', 'LIVREE', 'ANNULEE']

interface Driver { id: number; firstName: string; lastName: string; statutLivreur: string }

// ── Modal détail commande ──────────────────────────────────────────────────────
function OrderDetailModal({
  order, drivers, onClose, onStatusChange, onAssignDriver,
}: {
  order: OrderResponse
  drivers: Driver[]
  onClose: () => void
  onStatusChange: (id: number, status: string) => Promise<void>
  onAssignDriver: (orderId: number, driverId: number) => Promise<void>
}) {
  const [selectedStatus, setSelectedStatus] = useState(order.status)
  const [selectedDriver, setSelectedDriver] = useState<number | ''>(order.driverId ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      if (selectedStatus !== order.status) {
        await onStatusChange(order.id, selectedStatus)
      }
      if (selectedDriver && selectedDriver !== order.driverId) {
        await onAssignDriver(order.id, Number(selectedDriver))
      }
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.EN_ATTENTE

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-orbit-surface border border-orbit-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-orbit-border">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Commande #{order.id}</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {new Date(order.orderDate).toLocaleDateString('fr-FR', { dateStyle: 'full' })}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Client + statut courant */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar initials={(order.clientName || 'U').slice(0, 2)} size="md" />
              <div>
                <p className="text-sm font-semibold text-slate-200">{order.clientName}</p>
                <p className="text-xs text-slate-500">{order.address}</p>
              </div>
            </div>
            <span className={cn('text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5', cfg.bg, cfg.color)}>
              <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
              {cfg.label}
            </span>
          </div>

          {/* Articles */}
          <div className="bg-orbit-surface2 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Articles</p>
            <div className="space-y-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-300">{item.productName} <span className="text-slate-600">×{item.quantity}</span></span>
                  <span className="text-slate-200 font-medium">{item.subtotal?.toFixed(2)} DT</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-orbit-border flex justify-between">
              <span className="text-sm font-bold text-slate-200">Total</span>
              <span className="text-sm font-bold text-emerald-400">{order.totalAmount?.toFixed(2)} DT</span>
            </div>
          </div>

          {/* Changer statut */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Changer le statut
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ALL_STATUSES.map(s => {
                const c = STATUS_CFG[s]
                return (
                  <button
                    key={s}
                    onClick={() => setSelectedStatus(s)}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all border',
                      selectedStatus === s
                        ? `${c.bg} ${c.color} border-current`
                        : 'bg-orbit-surface2 text-slate-500 border-orbit-border hover:border-orbit-border2'
                    )}
                  >
                    <span className={cn('w-2 h-2 rounded-full flex-shrink-0', c.dot)} />
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Assigner livreur */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              <Truck className="w-3.5 h-3.5 inline mr-1.5" />
              Assigner un livreur
            </label>
            {order.driverName && (
              <p className="text-xs text-slate-500 mb-2">
                Actuel : <span className="text-cyan-400 font-medium">{order.driverName}</span>
              </p>
            )}
            <select
              value={selectedDriver}
              onChange={e => setSelectedDriver(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-orbit-surface2 border border-orbit-border rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-orbit-primary"
            >
              <option value="">— Sélectionner un livreur —</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.firstName} {d.lastName}
                  {d.statutLivreur === 'DISPONIBLE' ? ' ✓ Disponible' :
                   d.statutLivreur === 'OCCUPE' ? ' ⚠ Occupé' : ' ✗ Hors ligne'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-orbit-border">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-sm text-slate-400 border border-orbit-border hover:bg-white/5 transition-colors">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-orbit-primary text-white hover:bg-orbit-primary/80 transition-colors disabled:opacity-50"
          >
            {saving ? 'Sauvegarde...' : 'Enregistrer'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Page principale ────────────────────────────────────────────────────────────
export function OrdersPage() {
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      adminOrdersApi.getAll(),
      adminUsersApi.getAll('LIVREUR'),
    ])
      .then(([ordRes, drvRes]) => {
        setOrders(Array.isArray(ordRes.data) ? ordRes.data : [])
        setDrivers(Array.isArray(drvRes.data) ? drvRes.data : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleStatusChange = async (id: number, status: string) => {
    await adminOrdersApi.updateStatus(id, status)
    load()
  }

  const handleAssignDriver = async (orderId: number, driverId: number) => {
    await adminOrdersApi.assignDriver(orderId, driverId)
    load()
  }

  const filtered = orders.filter(o => {
    const matchSearch = `${o.clientName} ${o.address} #${o.id}`.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const counts: Record<string, number> = { all: orders.length }
  ALL_STATUSES.forEach(s => { counts[s] = orders.filter(o => o.status === s).length })

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Commandes</h1>
          <p className="text-slate-500 text-sm mt-0.5">{orders.length} commandes au total</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-48 max-w-sm">
          <Input
            prefix={<Search className="w-3.5 h-3.5" />}
            placeholder="Rechercher commande, client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-1 bg-orbit-surface2 border border-orbit-border rounded-lg p-1 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn('px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap',
              statusFilter === 'all' ? 'bg-orbit-primary text-white' : 'text-slate-500 hover:text-slate-300'
            )}
          >
            Tous ({counts.all})
          </button>
          {ALL_STATUSES.map(s => {
            const c = STATUS_CFG[s]
            return (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5',
                  statusFilter === s ? `${c.bg} ${c.color}` : 'text-slate-500 hover:text-slate-300'
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', c.dot)} />
                {c.label} ({counts[s] ?? 0})
              </button>
            )
          })}
        </div>
      </div>

      {/* Table */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-orbit-primary border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">Aucune commande trouvée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-orbit-border">
                  {['#', 'Client', 'Adresse', 'Montant', 'Livreur', 'Statut', 'Date', 'Actions'].map(col => (
                    <th key={col} className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-4 py-3">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-orbit-border">
                {filtered.map((order, i) => {
                  const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.EN_ATTENTE
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-white/2 transition-colors group"
                    >
                      <td className="px-4 py-3 text-sm text-slate-500 font-mono">#{order.id}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar initials={(order.clientName || 'U').slice(0, 2)} size="sm" />
                          <span className="text-sm text-slate-200 font-medium whitespace-nowrap">{order.clientName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400 max-w-[150px] truncate">{order.address}</td>
                      <td className="px-4 py-3 text-sm font-bold text-emerald-400 whitespace-nowrap">
                        {order.totalAmount?.toFixed(2)} DT
                      </td>
                      <td className="px-4 py-3">
                        {order.driverName ? (
                          <span className="text-xs text-cyan-400 font-medium flex items-center gap-1">
                            <Truck className="w-3 h-3" />{order.driverName}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600 italic">Non assigné</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 w-fit', cfg.bg, cfg.color)}>
                          <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', cfg.dot)} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {new Date(order.orderDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orbit-primary/15 text-orbit-primary-light text-xs font-medium hover:bg-orbit-primary/25 transition-all"
                        >
                          <Eye className="w-3 h-3" />
                          Gérer
                        </button>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailModal
            order={selectedOrder}
            drivers={drivers}
            onClose={() => setSelectedOrder(null)}
            onStatusChange={handleStatusChange}
            onAssignDriver={handleAssignDriver}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
