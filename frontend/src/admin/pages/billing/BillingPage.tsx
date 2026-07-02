import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts'
import { Download, TrendingUp, ShoppingBag, Truck, Users } from 'lucide-react'
import { Button, Badge, Card, CardHeader, CardBody } from '@/admin/components/ui'
import { adminStatsApi } from '@/client/services/api'
import { cn } from '@/utils/cn'

interface DailyRevenue {
  day: string
  amount: number
  orderCount: number
  percentage: number
}

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
  weeklyRevenue: DailyRevenue[]
  ordersEnAttente: number
  ordersPriseEnCharge: number
  ordersEnLivraison: number
  ordersLivrees: number
  ordersAnnulees: number
}

const BAR_COLORS = ['#7C3AED', '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444', '#A78BFA']

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: DailyRevenue }[]; label?: string }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-orbit-surface2 border border-orbit-border rounded-xl p-3 shadow-2xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-100">{payload[0].value.toFixed(2)} DT</p>
      <p className="text-xs text-slate-500">{payload[0].payload.orderCount} commandes</p>
    </div>
  )
}

export function BillingPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminStatsApi.getStats()
      .then(res => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const fmt = (v: number) => v?.toFixed(2) ?? '0.00'

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Revenus & Finances</h1>
          <p className="text-slate-500 text-sm mt-0.5">Données réelles depuis la base de données</p>
        </div>
        <Button variant="outline" icon={<Download className="w-3.5 h-3.5" />}>
          Exporter
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-orbit-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* ── KPI CARDS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {
                icon: TrendingUp,
                label: 'Revenu total',
                value: `${fmt(stats?.totalRevenue ?? 0)} DT`,
                sub: 'Toutes les commandes confirmées',
                color: 'bg-orbit-primary/15 text-orbit-primary-light',
              },
              {
                icon: TrendingUp,
                label: 'Revenu ce mois',
                value: `${fmt(stats?.revenueThisMonth ?? 0)} DT`,
                sub: `${stats?.ordersThisMonth ?? 0} commandes ce mois`,
                color: 'bg-orbit-accent/15 text-orbit-accent-light',
              },
              {
                icon: ShoppingBag,
                label: "Commandes aujourd'hui",
                value: `${stats?.ordersToday ?? 0}`,
                sub: `${fmt(stats?.revenueToday ?? 0)} DT générés`,
                color: 'bg-orbit-success/15 text-emerald-400',
              },
              {
                icon: Truck,
                label: 'Valeur moy. commande',
                value: `${fmt(stats?.averageOrderValue ?? 0)} DT`,
                sub: `${stats?.totalOrders ?? 0} commandes au total`,
                color: 'bg-orbit-warning/15 text-amber-400',
              },
            ].map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className="bg-orbit-surface rounded-xl border border-orbit-border p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('p-2 rounded-lg', card.color)}>
                    <card.icon className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-1">{card.label}</p>
                <p className="text-2xl font-bold text-slate-100">{card.value}</p>
                <p className="text-xs text-slate-600 mt-1">{card.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* ── MAIN CONTENT ROW ── */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

            {/* Daily Revenue Chart — 2/3 width */}
            <Card className="xl:col-span-2">
              <CardHeader
                title="Revenus journaliers"
                subtitle="Cette semaine (en DT)"
              />
              <CardBody className="pt-2">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart
                    data={stats?.weeklyRevenue ?? []}
                    margin={{ top: 5, right: 5, bottom: 0, left: -10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} tickFormatter={v => `${v} DT`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={55}>
                      {(stats?.weeklyRevenue ?? []).map((_, index) => (
                        <Cell key={index} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Day details below chart */}
                <div className="grid grid-cols-7 gap-1 mt-4 pt-3 border-t border-orbit-border">
                  {(stats?.weeklyRevenue ?? []).map((day, i) => (
                    <div key={i} className="text-center">
                      <p className="text-[11px] font-semibold text-slate-400">{day.day}</p>
                      <p className="text-xs font-bold text-slate-200 mt-0.5">{day.amount.toFixed(0)} DT</p>
                      <p className="text-[10px] text-slate-600">{day.orderCount} cmd</p>
                      <div className="mt-1 h-1 rounded-full bg-orbit-surface3 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${day.percentage}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-600 mt-0.5">{day.percentage}%</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* Overview panel — 1/3 width */}
            <div className="flex flex-col gap-4">
              {/* Monetary breakdown */}
              <Card>
                <CardHeader title="Vue d'ensemble" subtitle="Données monétaires" />
                <CardBody className="pt-2 space-y-3">
                  {[
                    { label: 'CE MOIS', value: `${fmt(stats?.revenueThisMonth ?? 0)} DT`, color: 'text-orbit-primary-light' },
                    { label: "AUJOURD'HUI", value: `${fmt(stats?.revenueToday ?? 0)} DT`, color: 'text-orbit-accent-light' },
                    { label: 'TOTAL CLIENTS', value: `${stats?.totalClients ?? 0}`, color: 'text-emerald-400' },
                  ].map((item, i) => (
                    <div key={i} className="bg-orbit-surface2 rounded-xl p-4">
                      <p className="text-[11px] font-semibold tracking-wider text-slate-500 mb-1">{item.label}</p>
                      <p className={cn('text-2xl font-bold', item.color)}>{item.value}</p>
                    </div>
                  ))}
                </CardBody>
              </Card>

              {/* Order performance */}
              <Card>
                <CardHeader title="Performance commandes" subtitle="Statistiques de livraison" />
                <CardBody className="pt-2 space-y-3">
                  {[
                    { label: 'VALEUR MOY. COMMANDE', value: `${fmt(stats?.averageOrderValue ?? 0)} DT`, color: 'text-amber-400' },
                    { label: 'LIVRAISONS AUJOURD\'HUI', value: `${stats?.deliveriesToday ?? 0}`, color: 'text-orbit-primary-light' },
                    { label: 'LIVREURS ACTIFS', value: `${stats?.activeDrivers ?? 0} / ${stats?.totalDrivers ?? 0}`, color: 'text-orbit-accent-light' },
                  ].map((item, i) => (
                    <div key={i} className="bg-orbit-surface2 rounded-xl p-4">
                      <p className="text-[11px] font-semibold tracking-wider text-slate-500 mb-1">{item.label}</p>
                      <p className={cn('text-2xl font-bold', item.color)}>{item.value}</p>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </div>
          </div>

          {/* ── ORDER STATUS ── */}
          <Card>
            <CardHeader title="Statuts des commandes" subtitle="Répartition en temps réel" />
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'En attente', value: stats?.ordersEnAttente ?? 0, color: 'bg-amber-500/15 text-amber-400', dot: 'bg-amber-400' },
                  { label: 'Prise en charge', value: stats?.ordersPriseEnCharge ?? 0, color: 'bg-orbit-primary/15 text-orbit-primary-light', dot: 'bg-orbit-primary' },
                  { label: 'En livraison', value: stats?.ordersEnLivraison ?? 0, color: 'bg-orbit-accent/15 text-orbit-accent-light', dot: 'bg-orbit-accent' },
                  { label: 'Livrées', value: stats?.ordersLivrees ?? 0, color: 'bg-emerald-500/15 text-emerald-400', dot: 'bg-emerald-400' },
                  { label: 'Annulées', value: stats?.ordersAnnulees ?? 0, color: 'bg-red-500/15 text-red-400', dot: 'bg-red-400' },
                ].map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                    className={cn('rounded-xl p-4 text-center', s.color)}
                  >
                    <div className={cn('w-2 h-2 rounded-full mx-auto mb-2', s.dot)} />
                    <p className="text-3xl font-bold">{s.value}</p>
                    <p className="text-xs font-medium mt-1 opacity-80">{s.label}</p>
                  </motion.div>
                ))}
              </div>
            </CardBody>
          </Card>
        </>
      )}
    </div>
  )
}
