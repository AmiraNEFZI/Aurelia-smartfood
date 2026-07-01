import { motion } from 'framer-motion'
import { Check, Download, CreditCard, Zap, Building2, ArrowUpRight, DollarSign, Truck, CalendarDays } from 'lucide-react'
import { Button, Badge, Card, CardHeader, CardBody } from '@/admin/components/ui'
import { currentPlan, plans, invoices, billingMetrics } from '@/admin/data/billing'
import { cn } from '@/utils/cn'
import type { Invoice } from '@/types'

function UsageMeter({ label, used, limit, unit = '' }: { label: string; used: number; limit: number | null; unit?: string }) {
  const pct = limit ? Math.min((used / limit) * 100, 100) : 0
  const isHigh = pct > 80
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-slate-300">{label}</p>
        <p className="text-xs text-slate-500">
          {used > 999 ? used.toLocaleString() : used}{unit}
          {limit ? ` / ${limit.toLocaleString()}${unit}` : ' (Unlimited)'}
        </p>
      </div>
      {limit && (
        <div className="h-1.5 bg-orbit-surface3 rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
            className={cn('h-full rounded-full', isHigh ? 'bg-gradient-to-r from-orbit-warning to-orbit-danger' : 'bg-gradient-to-r from-orbit-primary to-orbit-accent')}
          />
        </div>
      )}
      {limit && isHigh && <p className="text-[11px] text-amber-500 mt-1">{Math.round(pct)}% used — consider upgrading</p>}
    </div>
  )
}

function invoiceStatusConfig(status: Invoice['status']) {
  return {
    paid:    { label: 'Paid',    variant: 'success' as const },
    pending: { label: 'Pending', variant: 'warning' as const },
    overdue: { label: 'Overdue', variant: 'danger'  as const },
    draft:   { label: 'Draft',   variant: 'neutral' as const },
  }[status]
}

export function BillingPage() {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Billing</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage your plan, usage, and invoices</p>
        </div>
        <Button variant="outline" icon={<CreditCard className="w-3.5 h-3.5" />}>Update Payment Method</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-3">
          <Card className="p-5 bg-gradient-to-br from-orbit-primary/5 to-orbit-accent/5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-3xl bg-orbit-surface2 border border-orbit-border">
                <div className="flex items-center gap-3 mb-3">
                  <DollarSign className="w-4 h-4 text-orbit-primary-light" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-slate-100">${billingMetrics.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400">Revenue from all orders and deliveries.</p>
              </div>

              <div className="p-4 rounded-3xl bg-orbit-surface2 border border-orbit-border">
                <div className="flex items-center gap-3 mb-3">
                  <Truck className="w-4 h-4 text-orbit-accent-light" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Order Revenue</p>
                    <p className="text-2xl font-bold text-slate-100">${billingMetrics.orderRevenue.toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400">Revenue from customer orders.</p>
              </div>

              <div className="p-4 rounded-3xl bg-orbit-surface2 border border-orbit-border">
                <div className="flex items-center gap-3 mb-3">
                  <CalendarDays className="w-4 h-4 text-orbit-success-light" />
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Delivery Revenue</p>
                    <p className="text-2xl font-bold text-slate-100">${billingMetrics.deliveryRevenue.toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400">Revenue from delivery fees and surcharges.</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader title="Daily Revenue" subtitle="This week" />
          <CardBody className="pt-2">
            <div className="space-y-4">
              {billingMetrics.dailyRevenue.map(day => (
                <div key={day.day} className="flex items-center justify-between gap-3 p-3 rounded-3xl bg-orbit-surface2 border border-orbit-border">
                  <div>
                    <p className="text-sm text-slate-400">{day.day}</p>
                    <p className="text-lg font-semibold text-slate-100">${day.amount.toLocaleString()}</p>
                  </div>
                  <div className="text-xs text-slate-500">{Math.round((day.amount / billingMetrics.monthRevenue) * 100)}%</div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card className="space-y-4">
          <CardHeader title="Overview" subtitle="Monetary breakdown" />
          <CardBody className="grid gap-4">
            <div className="rounded-3xl bg-orbit-surface2 border border-orbit-border p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">This Month</p>
              <p className="text-2xl font-bold text-slate-100 mt-2">${billingMetrics.monthRevenue.toLocaleString()}</p>
            </div>
            <div className="rounded-3xl bg-orbit-surface2 border border-orbit-border p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Orders Today</p>
              <p className="text-2xl font-bold text-slate-100 mt-2">{billingMetrics.ordersToday}</p>
            </div>
            <div className="rounded-3xl bg-orbit-surface2 border border-orbit-border p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Deliveries Today</p>
              <p className="text-2xl font-bold text-slate-100 mt-2">{billingMetrics.deliveriesToday}</p>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Averages" subtitle="Order performance" />
          <CardBody>
            <div className="rounded-3xl bg-orbit-surface2 border border-orbit-border p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Average Order Value</p>
              <p className="text-2xl font-bold text-slate-100 mt-2">${billingMetrics.avgOrderValue}</p>
            </div>
          </CardBody>
        </Card>
      </div>

      <div>
        <h2 className="text-base font-semibold text-slate-200 mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={cn(plan.highlight && 'gradient-border')}
            >
              <Card className={cn('p-5 relative', plan.highlight && 'bg-gradient-to-b from-orbit-primary/5 to-transparent')}>
                {plan.highlight && (
                  <div className="absolute -top-px left-1/2 -translate-x-1/2 bg-orbit-primary text-white text-[10px] font-semibold px-3 py-0.5 rounded-b-lg">CURRENT</div>
                )}
                <div className="flex items-center gap-2 mb-1">
                  {plan.id === 'starter' && <Zap className="w-4 h-4 text-slate-400" />}
                  {plan.id === 'pro' && <Zap className="w-4 h-4 text-orbit-primary-light" />}
                  {plan.id === 'enterprise' && <Building2 className="w-4 h-4 text-orbit-accent" />}
                  <h3 className="font-semibold text-slate-200">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-2xl font-bold text-slate-100">${plan.price}</span>
                  <span className="text-slate-500 text-xs">/{plan.period}</span>
                </div>
                <p className="text-xs text-slate-500 mb-4">{plan.description}</p>
                <div className="space-y-2 mb-5">
                  {plan.features.map(f => (
                    <div key={f} className="flex items-start gap-2 text-xs text-slate-400">
                      <Check className={cn('w-3.5 h-3.5 flex-shrink-0 mt-0.5', plan.highlight ? 'text-orbit-primary-light' : 'text-slate-500')} />{f}
                    </div>
                  ))}
                </div>
                <Button variant={plan.highlight ? 'secondary' : plan.id === 'enterprise' ? 'primary' : 'outline'} size="sm" className="w-full" disabled={plan.highlight}>
                  {plan.cta}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader title="Invoice History" subtitle={`${invoices.length} invoices`}
          actions={<Button variant="ghost" size="sm" icon={<Download className="w-3.5 h-3.5" />}>Download All</Button>}
        />
        <CardBody className="p-0 pt-2">
          <table className="w-full">
            <thead>
              <tr className="border-b border-orbit-border">
                {['Invoice', 'Date', 'Due Date', 'Description', 'Amount', 'Status', ''].map(col => (
                  <th key={col} className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-5 pb-3">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-orbit-border">
              {invoices.map((inv, i) => (
                <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="hover:bg-white/2 transition-colors group">
                  <td className="px-5 py-3.5"><p className="text-sm text-slate-300 font-mono">{inv.number}</p></td>
                  <td className="px-5 py-3.5 text-sm text-slate-400">{inv.date}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-400">{inv.dueDate}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-400">{inv.description}</td>
                  <td className="px-5 py-3.5"><span className="text-sm font-semibold text-slate-200">${inv.amount.toLocaleString()}</span></td>
                  <td className="px-5 py-3.5"><Badge variant={invoiceStatusConfig(inv.status).variant} dot>{invoiceStatusConfig(inv.status).label}</Badge></td>
                  <td className="px-5 py-3.5">
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-slate-300 flex items-center gap-1 text-xs">
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  )
}
