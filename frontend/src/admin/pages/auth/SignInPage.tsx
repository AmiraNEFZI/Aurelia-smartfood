import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'
import { Button, Input } from '@/admin/components/ui'
import { authApi } from '@/client/services/api'
import '@/admin/admin.css'

export function SignInPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login({ email, password })
      const user = res.data
      // Vérifier que c'est bien un admin
      if (user.role !== 'ADMIN') {
        setError("Accès refusé. Ce portail est réservé aux administrateurs.")
        setLoading(false)
        return
      }
      // Stocker le token dans le même format que le client
      localStorage.setItem('smartfood_user', JSON.stringify(user))
      navigate('/admin/dashboard')
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { message?: string } } }
      setError(axErr.response?.data?.message || 'Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-root min-h-screen bg-orbit-bg flex">
      {/* Glow background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-orbit-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-orbit-accent/8 blur-[100px] rounded-full" />
      </div>

      {/* Left branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-orbit-border relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orbit-primary flex items-center justify-center">
            <svg viewBox="0 0 32 32" fill="none" className="w-5 h-5">
              <circle cx="16" cy="16" r="4" fill="white" />
              <ellipse cx="16" cy="16" rx="11" ry="5" stroke="white" strokeWidth="1.5" strokeOpacity="0.7" transform="rotate(-30 16 16)" />
              <circle cx="23" cy="11" r="2" fill="#06B6D4" />
            </svg>
          </div>
          <span className="text-slate-100 font-semibold text-xl tracking-tight">SmartFood Admin</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-100 mb-4 leading-tight">
            Votre boutique,{' '}
            <span className="text-gradient">entièrement maîtrisée</span>
          </h2>
          <p className="text-slate-500 text-base leading-relaxed mb-8">
            Gérez produits, commandes, clients et statistiques en toute simplicité.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '11+', label: 'Commandes passées' },
              { value: '10', label: 'Produits catalogue' },
              { value: '5', label: 'Utilisateurs inscrits' },
              { value: '100%', label: 'Données en DT' },
            ].map(stat => (
              <div key={stat.label} className="bg-orbit-surface/60 border border-orbit-border rounded-xl p-4">
                <p className="text-xl font-bold text-slate-100">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-700">Aurelia SmartFood — Portail Administrateur</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-orbit-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-slate-100 font-semibold text-lg">SmartFood Admin</span>
          </div>

          <h1 className="text-2xl font-bold text-slate-100 mb-1">Bienvenue</h1>
          <p className="text-slate-500 text-sm mb-8">Connectez-vous à votre compte administrateur</p>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Adresse email"
              type="email"
              placeholder="admin@smartfood.com"
              prefix={<Mail className="w-3.5 h-3.5" />}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <Input
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              prefix={<Lock className="w-3.5 h-3.5" />}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              }
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            {/* Aucun hint d'identifiants en production */}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              loading={loading}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Se connecter
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
