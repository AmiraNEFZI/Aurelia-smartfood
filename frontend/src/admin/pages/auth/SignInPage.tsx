import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { Button, Input } from '@/admin/components/ui'

export function SignInPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => { setLoading(false); navigate('/admin/dashboard') }, 1200)
  }

  return (
    <div className="min-h-screen bg-orbit-bg flex">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-orbit-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-orbit-accent/8 blur-[100px] rounded-full" />
      </div>

      {/* Left branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-orbit-border relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orbit-primary flex items-center justify-center glow-primary">
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
            Your store, <span className="text-gradient">fully in control</span>
          </h2>
          <p className="text-slate-500 text-base leading-relaxed mb-8">
            Manage products, orders, customers and analytics from one elegant admin interface.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[{ value: '1,247', label: 'Total Orders' }, { value: '384', label: 'Products' }, { value: '99.9%', label: 'Uptime' }, { value: '$48K', label: 'Monthly Revenue' }].map(stat => (
              <div key={stat.label} className="bg-orbit-surface/60 border border-orbit-border rounded-xl p-4">
                <p className="text-xl font-bold text-slate-100">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-700">SmartFood e-commerce platform</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-orbit-primary flex items-center justify-center"><span className="text-white font-bold text-sm">S</span></div>
            <span className="text-slate-100 font-semibold text-lg">SmartFood Admin</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mb-1">Welcome back</h1>
          <p className="text-slate-500 text-sm mb-8">Sign in to your admin account</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email address" type="email" placeholder="admin@smartfood.io" prefix={<Mail className="w-3.5 h-3.5" />} required />
            <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" prefix={<Lock className="w-3.5 h-3.5" />}
              suffix={<button type="button" onClick={() => setShowPassword(v => !v)} className="text-slate-500 hover:text-slate-300 transition-colors">{showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>}
              required />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-orbit-border bg-orbit-surface2 text-orbit-primary w-3.5 h-3.5" />
                <span className="text-xs text-slate-500">Remember me</span>
              </label>
              <Link to="/admin/forgot-password" className="text-xs text-orbit-primary-light hover:text-orbit-accent transition-colors">Forgot password?</Link>
            </div>
            <Button type="submit" size="lg" className="w-full" loading={loading} icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">Sign In</Button>
          </form>
          <p className="text-center text-xs text-slate-500 mt-8">
            No account? <Link to="/admin/sign-up" className="text-orbit-primary-light hover:text-orbit-accent transition-colors font-medium">Create one</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
