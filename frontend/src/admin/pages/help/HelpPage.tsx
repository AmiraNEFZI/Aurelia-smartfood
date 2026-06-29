import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, BookOpen, Code2, Zap, MessageSquare, ChevronDown, ExternalLink, FileText, Lightbulb } from 'lucide-react'
import { Input, Card, CardBody, Badge } from '@/admin/components/ui'
import { cn } from '@/utils/cn'

const quickLinks = [
  { icon: BookOpen, title: 'Documentation', description: 'Full guide to every admin page and feature', badge: undefined, color: 'text-orbit-primary-light', bg: 'bg-orbit-primary/10' },
  { icon: Code2, title: 'API Integration', description: 'Connect the Spring Boot backend to the admin panel', badge: 'New', color: 'text-orbit-accent-light', bg: 'bg-orbit-accent/10' },
  { icon: Zap, title: 'Changelog', description: "What's new in the latest version of SmartFood Admin", badge: 'v1.0', color: 'text-amber-400', bg: 'bg-orbit-warning/10' },
  { icon: MessageSquare, title: 'Community', description: 'Get support and share ideas with the team', badge: undefined, color: 'text-emerald-400', bg: 'bg-orbit-success/10' },
]

const faqs = [
  { q: 'How do I connect the Spring Boot backend?', a: 'Configure your API base URL in the environment variables. Create a `.env` file with `VITE_API_URL=http://localhost:8080`. Then use the fetch or axios client in your service files to call the backend endpoints.' },
  { q: 'How do I add a new admin page?', a: 'Three steps: (1) Create a new `.tsx` file in `src/admin/pages/your-feature/`. (2) Add a route in `src/App.tsx` inside the `/admin` route group. (3) Add a nav item in `src/admin/data/navigation.ts`.' },
  { q: 'How does authentication work?', a: 'Currently the auth pages are UI-only placeholders. When your Spring Boot backend is ready, wire up the SignInPage to call your `/api/auth/login` endpoint, store the JWT in localStorage or a cookie, and add an auth guard to the admin routes.' },
  { q: 'How do I customize the admin theme colors?', a: 'Open `src/index.css` and find the `--color-orbit-primary` and `--color-orbit-accent` values. Change them to match your brand. The entire admin UI inherits these tokens automatically.' },
  { q: 'How do I deploy the project?', a: 'Run `npm run build` to get the `dist/` folder. Deploy to Vercel, Netlify, or any static host. Make sure to configure your host to redirect all paths to `index.html` for client-side routing.' },
]

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="border-b border-orbit-border last:border-0">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between gap-4 py-4 text-left">
        <span className="text-sm font-medium text-slate-200">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
          <ChevronDown className="w-4 h-4 text-slate-500" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <p className="text-sm text-slate-400 leading-relaxed pb-4">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function HelpPage() {
  const [search, setSearch] = useState('')
  const filtered = faqs.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex-1 overflow-y-auto p-6 max-w-3xl space-y-8">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-slate-100">Help & Documentation</h1>
        <p className="text-slate-500 text-sm mt-1">Everything you need to manage SmartFood</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Input prefix={<Search className="w-4 h-4" />} placeholder="Search documentation and FAQs..." value={search} onChange={e => setSearch(e.target.value)} className="text-sm" />
      </motion.div>

      {!search && (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Quick Links</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickLinks.map((link, i) => (
              <motion.button key={link.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="flex items-start gap-4 p-4 rounded-xl border border-orbit-border bg-orbit-surface hover:border-orbit-border2 hover:bg-orbit-surface2 transition-all text-left group">
                <div className={cn('p-2.5 rounded-lg flex-shrink-0', link.bg)}><link.icon className={cn('w-5 h-5', link.color)} /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-200">{link.title}</p>
                    {link.badge && <Badge variant="primary">{link.badge}</Badge>}
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">{link.description}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0 mt-1" />
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {!search && (
        <Card>
          <CardBody>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-orbit-accent/10 flex-shrink-0"><Lightbulb className="w-4 h-4 text-orbit-accent-light" /></div>
              <div>
                <p className="text-sm font-semibold text-slate-200 mb-1">Pro tip — Spring Boot integration</p>
                <p className="text-sm text-slate-400 leading-relaxed">
                  When your backend is ready, update the API base URL in <code className="text-xs bg-orbit-surface2 px-1.5 py-0.5 rounded text-orbit-accent-light font-mono">.env</code> and wire up the service files. All pages are structured to be replaced with real API calls.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            {search ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}` : 'Frequently Asked Questions'}
          </h2>
        </div>
        <Card>
          <CardBody className="divide-y-0 py-0 px-5">
            {filtered.length > 0
              ? filtered.map((faq, i) => <FAQItem key={i} q={faq.q} a={faq.a} index={i} />)
              : <div className="py-10 text-center"><p className="text-slate-500 text-sm">No results for "{search}"</p></div>
            }
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
