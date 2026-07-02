import { useEffect, useState } from 'react'
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { motion } from 'framer-motion'
import { Download, Plus, ShoppingBag, Users, Truck, TrendingUp } from 'lucide-react'
import { Button, Badge, Avatar, Card, CardHeader, CardBody } from '@/admin/components/ui'
import { adminStatsApi, adminOrdersApi } from '@/client/services/api'
import type { OrderResponse } from '@/client/services/api'
import { cn } from '@/utils/cn'

interface Stats {
  totalRevenue: number
  revenueThisMonth: number
  revenueToday: number
  totalOrders: number
  ordersToday: number
  ordersThisMonth: number
  totalClients: number
  totalDrivers: number
  activeDrivers: number
  deliveriesToday: number
  averageOrderValue: number
  weeklyRevenue: { day: string; amount: number; orderCount: number }[]
  ordersEnAttente: number
  ordersLivrees: number
  ordersAnnulees: number
}

interface OrderItem {
  id: number
  clientName: string
  address: string
  totalAmount: number
  status: string
  orderDate: string
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info' }> = {
  EN_ATTENTE:     { label: 'En attente',     variant: 'warning' },
  CONFIRMEE:      { label: 'Confirmée',      variant: 'info' },
  EN_PREPARATION: { label: 'En préparation', variant: 'info' },
  PRISE_EN_CHARGE:{ label: 'Prise en charge',variant: 'info' },
  EN_LIVRAISON:   { label: 'En livraison',   variant: 'info' },
  LIVREE:         { label: 'Livrée',         variant: 'success' },
  ANNULEE:        { label: 'Annulée',        variant: 'danger' },
}

const TRAFFIC = [
  { name: 'En ligne', value: 42, color: '#7C3AED' },
  { name: 'App mobile', value: 35, color: '#06B6D4' },
  { name: 'Téléphone', value: 23, color: '#10B981' },
]

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-orbit-surface2 border border-orbit-border rounded-xl p-3 shadow-2xl">
      <p className="text-xs text-slate-500 mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400 capitalize">{p.name}</span>
          <span className="text-slate-100 font-semibold ml-auto">{p.value.toFixed(2)} DT</span>
        </div>
      ))}
    </div>
  )
}

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentOrders, setRecentOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Bonjour' : now.getHours() < 17 ? 'Bon après-midi' : 'Bonsoir'
  const dateStr = now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  useEffect(() => {
    adminStatsApi.getStats()
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))

    // Fetch recent orders via proper API service (admin token attached automatically)
    adminOrdersApi.getAll()
      .then(res => {
        const orders: OrderResponse[] = Array.isArray(res.data) ? res.data : []
        setRecentOrders(
          orders.slice(0, 7).map(o => ({
            id: o.id,
            clientName: o.clientName,
            address: o.address,
            totalAmount: o.totalAmount,
            status: o.status,
            orderDate: o.orderDate,
          }))
        )
      })
      .catch(() => setRecentOrders([]))
  }, [])

  const fmt = (v: number) => `${(v ?? 0).toFixed(2)} DT`
  const fmtInt = (v: number) => (v ?? 0).toString()

  const kpis = [
    {
      icon: TrendingUp,
      label: 'Revenu total',
      value: fmt(stats?.totalRevenue ?? 0),
      sub: 'Toutes commandes confirmées',
      change: '+12%',
      good: true,
      color: 'primary' as const,
    },
    {
      icon: Users,
      label: 'Clients inscrits',
      value: fmtInt(stats?.totalClients ?? 0),
      sub: `+${stats?.ordersToday ?? 0} commandes aujourd'hui`,
      change: '+8%',
      good: true,
      color: 'accent' as const,
    },
    {
      icon: ShoppingBag,
      label: 'Commandes totales',
      value: fmtInt(stats?.totalOrders ?? 0),
      sub: `${stats?.ordersThisMonth ?? 0} ce mois`,
      change: '+5%',
      good: true,
      color: 'success' as const,
    },
    {
      icon: Truck,
      label: 'Livreurs actifs',
      value: `${stats?.activeDrivers ?? 0} / ${stats?.totalDrivers ?? 0}`,
      sub: `${stats?.deliveriesToday ?? 0} livraisons aujourd'hui`,
      change: `${stats?.ordersEnAttente ?? 0} en attente`,
      good: true,
      color: 'warning' as const,
    },
  ]

  const colorMap = {
    primary: { icon: 'bg-orbit-primary/15 text-orbit-primary-light', chart: '#7C3AED', badge: 'bg-emerald-500/10 text-emerald-400' },
    accent:  { icon: 'bg-orbit-accent/15 text-orbit-accent-light',   chart: '#06B6D4', badge: 'bg-emerald-500/10 text-emerald-400' },
    success: { icon: 'bg-orbit-success/15 text-emerald-400',         chart: '#10B981', badge: 'bg-emerald-500/10 text-emerald-400' },
    warning: { icon: 'bg-orbit-warning/15 text-amber-400',           chart: '#F59E0B', badge: 'bg-emerald-500/10 text-emerald-400' },
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-[1600px]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{greeting}, Admin 👋</h1>
          <p className="text-slate-500 text-sm mt-1 capitalize">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<Download className="w-3.5 h-3.5" />}>Export</Button>
          <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />}>Rapport</Button>
        </div>
      </motion.div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-orbit-surface rounded-xl border border-orbit-border hover:border-orbit-border2 transition-colors overflow-hidden"
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={cn('p-2 rounded-lg', colorMap[kpi.color].icon)}>
                  <kpi.icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                  {kpi.change}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-1">{kpi.label}</p>
              <p className="text-2xl font-bold text-slate-100">{loading ? '...' : kpi.value}</p>
              <p className="text-xs text-slate-600 mt-1">{kpi.sub}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <Card className="xl:col-span-2">
          <CardHeader title="Revenus de la semaine" subtitle="En dinars tunisiens (DT)" />
          <CardBody className="pt-2">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={stats?.weeklyRevenue ?? []} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="grad-revenue-dash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} tickFormatter={v => `${v} DT`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="amount" name="Revenu" stroke="#7C3AED" strokeWidth={2} fill="url(#grad-revenue-dash)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 pt-3 border-t border-orbit-border">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-3 h-0.5 bg-orbit-primary rounded" />Revenu journalier (DT)
              </div>
              <div className="ml-auto text-xs text-slate-600">
                Ce mois : <span className="text-emerald-400 font-semibold">{fmt(stats?.revenueThisMonth ?? 0)}</span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Traffic Sources */}
        <Card>
          <CardHeader title="Canaux de commande" subtitle="Répartition" />
          <CardBody className="pt-2">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={TRAFFIC} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {TRAFFIC.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2.5 mt-2">
              {TRAFFIC.map(item => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                  <span className="text-xs text-slate-400 flex-1">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-orbit-surface3 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${item.value}%`, background: item.color }} />
                    </div>
                    <span className="text-xs text-slate-300 w-8 text-right">{item.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader
          title="Dernières commandes"
          subtitle="Données en temps réel"
          actions={
            <Button variant="ghost" size="sm">Voir tout</Button>
          }
        />
        <CardBody className="p-0 pt-2">
          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              {loading ? 'Chargement...' : 'Aucune commande pour le moment.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-orbit-border">
                    {['#', 'Client', 'Adresse', 'Montant', 'Statut', 'Date'].map(col => (
                      <th key={col} className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-5 pb-3">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-orbit-border">
                  {recentOrders.map(order => {
                    const s = STATUS_CONFIG[order.status] ?? { label: order.status, variant: 'neutral' as const }
                    return (
                      <tr key={order.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-5 py-3 text-sm text-slate-500 font-mono">#{order.id}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar initials={(order.clientName || 'U').slice(0, 2)} size="sm" />
                            <span className="text-sm text-slate-200 font-medium">{order.clientName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-400 max-w-[180px] truncate">{order.address}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-slate-100">{order.totalAmount?.toFixed(2)} DT</td>
                        <td className="px-5 py-3">
                          <Badge variant={s.variant} dot>{s.label}</Badge>
                        </td>
                        <td className="px-5 py-3 text-sm text-slate-400 whitespace-nowrap">
                          {new Date(order.orderDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
