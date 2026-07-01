import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { Button, Input } from '@/admin/components/ui'
import '@/admin/admin.css'

export function SignUpPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => { setLoading(false); navigate('/admin/dashboard') }, 1200)
  }

  return (
    <div className="admin-root min-h-screen bg-orbit-bg flex items-center justify-center p-6 relative">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-orbit-primary/8 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-orbit-accent/8 blur-[100px] rounded-full" />
      </div>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm relative">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-orbit-primary flex items-center justify-center glow-primary">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-slate-100 font-semibold">SmartFood Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-100 mb-1">Create admin account</h1>
        <p className="text-slate-500 text-sm mb-8">Get started — no credit card required</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Full name" type="text" placeholder="Admin User" prefix={<User className="w-3.5 h-3.5" />} required />
          <Input label="Email address" type="email" placeholder="admin@smartfood.io" prefix={<Mail className="w-3.5 h-3.5" />} required />
          <Input label="Password" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" prefix={<Lock className="w-3.5 h-3.5" />} hint="Use at least 8 characters"
            suffix={<button type="button" onClick={() => setShowPassword(v => !v)} className="text-slate-500 hover:text-slate-300 transition-colors">{showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>} required />
          <Button type="submit" size="lg" className="w-full" loading={loading} icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">Create Account</Button>
        </form>
        <p className="text-center text-xs text-slate-500 mt-8">
          Already have an account? <Link to="/admin/sign-in" className="text-orbit-primary-light hover:text-orbit-accent transition-colors font-medium">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
