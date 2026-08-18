import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import { Button, Card, CardBody, Badge } from '@/admin/components/ui'
import { adminDriverApplicationsApi } from '@/client/services/api'
import type { DriverApplicationResponse } from '@/client/services/api'

const STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  PENDING: { label: 'En attente', variant: 'warning' },
  APPROVED: { label: 'Approuvée', variant: 'success' },
  REJECTED: { label: 'Rejetée', variant: 'danger' },
}

export function DriverApplicationsPage() {
  const navigate = useNavigate()
  const [applications, setApplications] = useState<DriverApplicationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalApp, setModalApp] = useState<DriverApplicationResponse | null>(null)
  const [modalMode, setModalMode] = useState<'approve' | 'reject' | null>(null)
  const [modalPassword, setModalPassword] = useState('')
  const [modalReason, setModalReason] = useState('')
  const [modalError, setModalError] = useState('')
  const [error, setError] = useState('')

  const loadApplications = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminDriverApplicationsApi.getAll()
      setApplications(res.data)
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      setError(ax.response?.data?.message || 'Impossible de charger les candidatures.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadApplications()
  }, [])

  const openModal = (app: DriverApplicationResponse, mode: 'approve' | 'reject') => {
    setModalApp(app)
    setModalMode(mode)
    setModalPassword('')
    setModalReason('')
    setModalError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setModalApp(null)
    setModalMode(null)
    setModalPassword('')
    setModalReason('')
    setModalError('')
  }

  const handleDecision = async () => {
    if (!modalApp || !modalMode) return
    setActionLoading(modalApp.id)
    setModalError('')
    setError('')
    try {
      if (modalMode === 'approve') {
        await adminDriverApplicationsApi.approve(modalApp.id, modalPassword ? { password: modalPassword } : undefined)
      } else {
        if (!modalReason.trim()) {
          setModalError('Une raison est requise pour le rejet.')
          return
        }
        await adminDriverApplicationsApi.reject(modalApp.id, { reason: modalReason.trim() })
      }
      closeModal()
      loadApplications()
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      setModalError(ax.response?.data?.message || 'Erreur lors de la mise à jour.')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Candidatures livreurs</h1>
            <p className="text-slate-500 text-sm">Validez les documents et créez le compte uniquement si la candidature est complète.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)} icon={<ArrowLeft className="w-4 h-4" />}>
              Retour
            </Button>
            <Button onClick={loadApplications}>Rafraîchir</Button>
          </div>
        </div>

        <Card>
          <CardBody className="space-y-4">
            {error && <div className="text-sm text-red-400">{error}</div>}

            {loading ? (
              <div className="py-20 flex justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-orbit-primary border-t-transparent animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <div className="py-16 text-center text-slate-500">Aucune candidature pour le moment.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-slate-400 text-xs uppercase tracking-[0.15em]">
                      <th className="px-4 py-3">Candidat</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Document</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3">Raison</th>
                      <th className="px-4 py-3">Soumis le</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map(app => (
                      <motion.tr key={app.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <td className="px-4 py-4 text-slate-100 font-medium">
                          {app.firstName} {app.lastName}
                        </td>
                        <td className="px-4 py-4 text-slate-300">
                          <div>{app.email}</div>
                          <div className="text-xs text-slate-500">{app.phone}</div>
                        </td>
                        <td className="px-4 py-4 text-slate-300 break-words max-w-[220px]">
                          <a href={app.documentUrl} target="_blank" rel="noreferrer" className="text-orbit-primary underline">
                            Voir le document
                          </a>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant={STATUS_CONFIG[app.status]?.variant ?? 'neutral'}>
                            {STATUS_CONFIG[app.status]?.label ?? app.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-slate-300 max-w-[220px] break-words">
                          {app.status === 'REJECTED' ? app.rejectReason || '-' : '-'}
                        </td>
                        <td className="px-4 py-4 text-slate-300">{new Date(app.createdAt).toLocaleString('fr-FR')}</td>
                        <td className="px-4 py-4 flex flex-wrap gap-2">
                          {app.status === 'PENDING' ? (
                            <>
                              <Button
                                size="sm"
                                variant="accent"
                                onClick={() => openModal(app, 'approve')}
                                disabled={actionLoading === app.id}
                                icon={<CheckCircle className="w-4 h-4" />}
                              >
                                Approuver
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => openModal(app, 'reject')}
                                disabled={actionLoading === app.id}
                                icon={<XCircle className="w-4 h-4" />}
                              >
                                Rejeter
                              </Button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-500 uppercase tracking-[0.12em]">Aucun action</span>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {modalOpen && modalApp && modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="w-full max-w-2xl bg-orbit-surface border border-orbit-border rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-orbit-border">
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  {modalMode === 'approve' ? 'Approuver la candidature' : 'Rejeter la candidature'}
                </h2>
                <p className="text-sm text-slate-500">
                  {modalMode === 'approve'
                    ? 'Créez un compte livreur et envoyez le mot de passe temporaire au candidat.'
                    : 'Expliquez clairement pourquoi la candidature est rejetée.'}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-2xl bg-orbit-surface2 border border-orbit-border p-4">
                <p className="text-sm text-slate-400">Candidat</p>
                <p className="mt-1 text-slate-100 font-semibold">{modalApp.firstName} {modalApp.lastName}</p>
                <p className="text-sm text-slate-300">{modalApp.email} · {modalApp.phone}</p>
                <a href={modalApp.documentUrl} target="_blank" rel="noreferrer" className="text-orbit-primary text-sm hover:underline">
                  Voir le document
                </a>
              </div>

              {modalMode === 'approve' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Mot de passe temporaire (facultatif)</label>
                  <input
                    value={modalPassword}
                    onChange={e => setModalPassword(e.target.value)}
                    placeholder="Laisser vide pour générer automatiquement"
                    className="w-full bg-orbit-surface2 border border-orbit-border rounded-2xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-orbit-primary"
                  />
                  <p className="text-xs text-slate-500">Le candidat pourra se connecter avec ce mot de passe après validation.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Raison du rejet</label>
                  <textarea
                    rows={4}
                    value={modalReason}
                    onChange={e => setModalReason(e.target.value)}
                    className="w-full bg-orbit-surface2 border border-orbit-border rounded-2xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-orbit-primary resize-none"
                    placeholder="Précisez la raison du rejet"
                  />
                </div>
              )}

              {modalError && <div className="text-sm text-red-400">{modalError}</div>}
            </div>
            <div className="flex flex-wrap gap-3 items-center justify-end px-6 py-4 border-t border-orbit-border">
              <button type="button" onClick={closeModal} className="px-4 py-2 rounded-2xl text-sm text-slate-400 border border-orbit-border hover:bg-white/5">
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDecision}
                disabled={actionLoading === modalApp.id}
                className="px-4 py-2 rounded-2xl text-sm font-semibold bg-orbit-primary text-white hover:bg-orbit-primary/80 disabled:opacity-50"
              >
                {modalMode === 'approve' ? 'Approuver et créer le compte' : 'Rejeter la candidature'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
