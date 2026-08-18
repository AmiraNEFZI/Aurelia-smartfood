import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Star, Award, TrendingUp, Users, RefreshCw,
  ChevronDown, ChevronUp, AlertTriangle, ShieldOff,
  ShieldCheck, MessageSquare, X
} from 'lucide-react'
import api, { type ComplaintResponse, adminDriversApi } from '@/client/services/api'
import { cn } from '@/utils/cn'

// ── Interfaces ────────────────────────────────────────────────────────────────
interface DriverSummary {
  driverId: number
  driverName: string
  averageRating: number
  totalReviews: number
  satisfactionPct: number
  recentReviews: { id: number; orderId: number; rating: number; comment?: string; createdAt: string }[]
}

interface DriverFull extends DriverSummary {
  totalComplaints: number
  active: boolean           // true = actif, false = suspendu
  complaints: ComplaintResponse[]
  expanded: boolean
}

// ── Sous-composants ───────────────────────────────────────────────────────────
function StarRating({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star key={i} className={cn('w-3.5 h-3.5', i < Math.round(value) ? 'text-amber-400' : 'text-slate-700')} fill="currentColor" />
      ))}
    </div>
  )
}

function SatisfactionBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? 'bg-emerald-400' : pct >= 60 ? 'bg-amber-400' : pct > 0 ? 'bg-red-400' : 'bg-slate-700'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-orbit-border rounded-full overflow-hidden">
        <motion.div className={cn('h-2 rounded-full', color)} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
      </div>
      <span className={cn('text-xs font-bold w-9 text-right', pct >= 80 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : pct > 0 ? 'text-red-400' : 'text-slate-600')}>
        {pct > 0 ? `${pct}%` : '—'}
      </span>
    </div>
  )
}

function RatingBadge({ avg, total }: { avg: number; total: number }) {
  if (total === 0) return <span className="text-xs text-slate-600 italic">Aucun avis</span>
  const color = avg >= 4 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    : avg >= 3 ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    : 'bg-red-500/15 text-red-400 border-red-500/30'
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-bold border', color)}>
      <Star className="w-3.5 h-3.5" fill="currentColor" />{avg.toFixed(1)}
    </span>
  )
}

// ── Modal de suspension ───────────────────────────────────────────────────────
function SuspendModal({ driverName, onConfirm, onClose, loading }: {
  driverName: string; onConfirm: (reason: string) => void; onClose: () => void; loading: boolean
}) {
  const [reason, setReason] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-orbit-surface border border-orbit-border rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-orbit-border bg-red-500/10">
          <div className="flex items-center gap-2">
            <ShieldOff className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-slate-100">Suspendre le compte</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-400">
            Vous êtes sur le point de suspendre le compte de <strong className="text-slate-200">{driverName}</strong>.
            Un email lui sera automatiquement envoyé avec la raison.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Raison de la suspension *
            </label>
            <textarea rows={3}
              className="w-full bg-orbit-surface2 border border-orbit-border rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 resize-none"
              placeholder="Expliquez la raison de cette suspension..."
              value={reason} onChange={e => setReason(e.target.value)}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-orbit-border text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all">
              Annuler
            </button>
            <button
              onClick={() => reason.trim() && onConfirm(reason.trim())}
              disabled={!reason.trim() || loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-400 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Suspension...</> : <><ShieldOff className="w-4 h-4" />Suspendre</>}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Ligne tableau ─────────────────────────────────────────────────────────────
function DriverRow({ d, index, onSuspend, onReactivate }: {
  d: DriverFull; index: number
  onSuspend: (id: number, name: string) => void
  onReactivate: (id: number) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const initials = d.driverName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const hasDetails = d.recentReviews.some(r => r.comment) || d.complaints.length > 0

  return (
    <>
      <motion.tr initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
        className={cn('border-b border-orbit-border transition-colors', expanded ? 'bg-white/4' : 'hover:bg-white/2')}
      >
        {/* Rang */}
        <td className="px-4 py-4 w-10">
          {index === 0 && d.totalReviews > 0 ? '🥇' : index === 1 && d.totalReviews > 0 ? '🥈' : index === 2 && d.totalReviews > 0 ? '🥉' :
            <span className="text-xs text-slate-600 font-mono">#{index + 1}</span>}
        </td>

        {/* Nom + statut */}
        <td className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0',
              d.active ? 'bg-orbit-primary/20 text-orbit-primary-light' : 'bg-red-500/15 text-red-400')}>
              {initials}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">{d.driverName}</p>
              <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full',
                d.active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')}>
                {d.active ? 'Actif' : 'Suspendu'}
              </span>
            </div>
          </div>
        </td>

        {/* Note */}
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            <RatingBadge avg={d.averageRating} total={d.totalReviews} />
            {d.totalReviews > 0 && <StarRating value={d.averageRating} />}
          </div>
        </td>

        {/* Satisfaction */}
        <td className="px-4 py-4 min-w-[160px]"><SatisfactionBar pct={d.satisfactionPct} /></td>

        {/* Avis */}
        <td className="px-4 py-4 text-center text-sm text-slate-400">
          {d.totalReviews > 0 ? d.totalReviews : <span className="text-slate-600">—</span>}
        </td>

        {/* Réclamations */}
        <td className="px-4 py-4 text-center">
          {d.totalComplaints > 0 ? (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertTriangle className="w-3 h-3" />{d.totalComplaints}
            </span>
          ) : (
            <span className="text-slate-600 text-xs">—</span>
          )}
        </td>

        {/* Actions */}
        <td className="px-4 py-4">
          <div className="flex items-center gap-2">
            {d.active ? (
              <button onClick={() => onSuspend(d.driverId, d.driverName)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">
                <ShieldOff className="w-3.5 h-3.5" />Suspendre
              </button>
            ) : (
              <button onClick={() => onReactivate(d.driverId)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">
                <ShieldCheck className="w-3.5 h-3.5" />Réactiver
              </button>
            )}
            {hasDetails && (
              <button onClick={() => setExpanded(e => !e)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-500 hover:text-slate-300 transition-colors">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </td>
      </motion.tr>

      {/* Détails dépliés */}
      {expanded && hasDetails && (
        <tr className="bg-white/2 border-b border-orbit-border">
          <td colSpan={7} className="px-6 pb-5 pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Derniers avis */}
              {d.recentReviews.filter(r => r.comment).length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />Derniers avis
                  </p>
                  <div className="space-y-2">
                    {d.recentReviews.filter(r => r.comment).map(r => (
                      <div key={r.id} className="flex items-start gap-2 p-3 rounded-xl bg-orbit-surface2 border border-orbit-border">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-400 text-[11px] font-bold">{r.rating}★</span>
                        <div>
                          <StarRating value={r.rating} />
                          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{r.comment}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Réclamations */}
              {d.complaints.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span className="text-red-400">Réclamations</span>
                  </p>
                  <div className="space-y-2">
                    {d.complaints.map(c => (
                      <div key={c.id} className="p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                        <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                          <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">{c.categoryLabel}</span>
                          <span className="text-[11px] text-slate-600">
                            {new Date(c.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">{c.description}</p>
                        <p className="text-[11px] text-slate-600 mt-1">Client : {c.clientName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────
export function DriversSatisfactionPage() {
  const [drivers, setDrivers]     = useState<DriverFull[]>([])
  const [loading, setLoading]     = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [suspendTarget, setSuspendTarget] = useState<{ id: number; name: string } | null>(null)
  const [toast, setToast]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const load = async () => {
    setLoading(true)
    try {
      const [summaryRes, complaintsRes, usersRes] = await Promise.all([
        api.get('/admin/drivers/reviews-summary'),
        api.get('/admin/complaints'),
        api.get('/admin/users?role=LIVREUR'),
      ])

      const summaries: DriverSummary[] = Array.isArray(summaryRes.data) ? summaryRes.data : []
      const allComplaints: ComplaintResponse[] = Array.isArray(complaintsRes.data) ? complaintsRes.data : []
      const allUsers: { id: number; active: boolean }[] = Array.isArray(usersRes.data) ? usersRes.data : []

      const activeMap = new Map(allUsers.map(u => [u.id, u.active !== false]))

      const full: DriverFull[] = summaries.map(s => {
        const dc = allComplaints.filter(c => c.driverId === s.driverId)
        return {
          ...s,
          totalComplaints: dc.length,
          complaints: dc,
          active: activeMap.get(s.driverId) ?? true,
          expanded: false,
        }
      })
      setDrivers(full)
    } catch {
      setDrivers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleSuspend = async (reason: string) => {
    if (!suspendTarget) return
    setActionLoading(true)
    try {
      await adminDriversApi.suspend(suspendTarget.id, reason)
      setDrivers(prev => prev.map(d => d.driverId === suspendTarget.id ? { ...d, active: false } : d))
      showToast(`${suspendTarget.name} a été suspendu. Un email lui a été envoyé.`)
      setSuspendTarget(null)
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Erreur lors de la suspension.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReactivate = async (driverId: number) => {
    setActionLoading(true)
    try {
      await adminDriversApi.reactivate(driverId)
      const d = drivers.find(d => d.driverId === driverId)
      setDrivers(prev => prev.map(d => d.driverId === driverId ? { ...d, active: true } : d))
      showToast(`${d?.driverName ?? 'Livreur'} a été réactivé. Un email lui a été envoyé.`)
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Erreur lors de la réactivation.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const withReviews = drivers.filter(d => d.totalReviews > 0)
  const withoutReviews = drivers.filter(d => d.totalReviews === 0)
  const globalAvg = withReviews.length > 0 ? withReviews.reduce((s, d) => s + d.averageRating, 0) / withReviews.length : 0
  const globalSat = withReviews.length > 0 ? Math.round(withReviews.reduce((s, d) => s + d.satisfactionPct, 0) / withReviews.length) : 0
  const totalComplaints = drivers.reduce((s, d) => s + d.totalComplaints, 0)
  const suspended = drivers.filter(d => !d.active).length

  const sorted = [
    ...[...withReviews].sort((a, b) => b.averageRating - a.averageRating),
    ...withoutReviews,
  ]

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-[1400px]">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={cn('fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl text-sm font-medium max-w-sm',
              toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white')}>
            {toast.type === 'success' ? <ShieldCheck className="w-4 h-4 flex-shrink-0" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal suspension */}
      <AnimatePresence>
        {suspendTarget && (
          <SuspendModal
            driverName={suspendTarget.name}
            onConfirm={handleSuspend}
            onClose={() => setSuspendTarget(null)}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Satisfaction & Gestion livreurs</h1>
          <p className="text-slate-500 text-sm mt-0.5">Évaluations, réclamations et gestion des comptes livreurs</p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-orbit-border text-xs font-medium disabled:opacity-50 transition-all">
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />Actualiser
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: Users,        label: 'Livreurs évalués',   value: `${withReviews.length} / ${drivers.length}`, color: 'bg-orbit-primary/15 text-orbit-primary-light' },
          { icon: Star,         label: 'Note globale',        value: withReviews.length > 0 ? globalAvg.toFixed(1) + ' / 5' : '—', color: 'bg-amber-500/15 text-amber-400' },
          { icon: AlertTriangle,label: 'Réclamations totales',value: totalComplaints > 0 ? totalComplaints : '0', color: totalComplaints > 0 ? 'bg-red-500/15 text-red-400' : 'bg-slate-500/10 text-slate-500' },
          { icon: ShieldOff,    label: 'Comptes suspendus',   value: suspended, color: suspended > 0 ? 'bg-red-500/15 text-red-400' : 'bg-slate-500/10 text-slate-500' },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-orbit-surface border border-orbit-border rounded-xl p-4 flex items-center gap-3">
            <div className={cn('p-2.5 rounded-xl', kpi.color.split(' ')[0])}>
              <kpi.icon className={cn('w-4 h-4', kpi.color.split(' ')[1])} />
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">{kpi.label}</p>
              <p className="text-xl font-bold text-slate-100">{loading ? '...' : kpi.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tableau */}
      <div className="bg-orbit-surface border border-orbit-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-orbit-border flex items-center gap-3">
          <Award className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-slate-200">Classement & Gestion</h2>
          <span className="ml-auto text-xs text-slate-600">
            {withReviews.length} évalués · {drivers.filter(d => !d.active).length} suspendu{drivers.filter(d => !d.active).length > 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-orbit-accent border-t-transparent animate-spin" />
          </div>
        ) : drivers.length === 0 ? (
          <div className="text-center py-16">
            <Star className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Aucune donnée disponible.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-orbit-border">
                  {['#', 'Livreur', 'Note', 'Satisfaction', 'Avis', 'Réclamations', 'Actions'].map((col, i) => (
                    <th key={i} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((d, i) => (
                  <DriverRow key={d.driverId} d={d} index={i}
                    onSuspend={(id, name) => setSuspendTarget({ id, name })}
                    onReactivate={handleReactivate}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
