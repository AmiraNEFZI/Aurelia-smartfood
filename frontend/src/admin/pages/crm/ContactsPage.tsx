import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Filter, LayoutGrid, List, Mail, Phone, UserPlus, ChevronDown, Trash2, RefreshCw } from 'lucide-react'
import { Button, Badge, Avatar, Input, Card } from '@/admin/components/ui'
import { adminUsersApi } from '@/client/services/api'
import { cn } from '@/utils/cn'

interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  phone: string
  role: 'CLIENT' | 'LIVREUR' | 'ADMIN'
  statutLivreur: string | null
}

const ROLE_CONFIG = {
  CLIENT:  { label: 'Client',        variant: 'success' as const, color: 'text-emerald-400' },
  LIVREUR: { label: 'Livreur',       variant: 'accent'  as const, color: 'text-cyan-400' },
  ADMIN:   { label: 'Administrateur', variant: 'primary' as const, color: 'text-violet-400' },
}

const DRIVER_STATUS_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'neutral' | 'danger' }> = {
  DISPONIBLE:  { label: 'Disponible',  variant: 'success' },
  OCCUPE:      { label: 'Occupé',      variant: 'warning' },
  EN_LIGNE:    { label: 'En ligne',    variant: 'success' },
  HORS_LIGNE:  { label: 'Hors ligne',  variant: 'neutral' },
}

type RoleFilter = 'all' | 'CLIENT' | 'LIVREUR' | 'ADMIN'
type ViewMode = 'grid' | 'list'

function UserCard({ user, index, onDelete }: { user: User; index: number; onDelete: (id: number) => void }) {
  const initials = `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase()
  const roleCfg = ROLE_CONFIG[user.role]

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <Card className="p-5 hover:border-orbit-border2 transition-all group cursor-pointer">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar initials={initials || '?'} size="lg" online={user.statutLivreur === 'DISPONIBLE' || user.statutLivreur === 'EN_LIGNE'} />
            <div>
              <p className="text-sm font-semibold text-slate-100">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-slate-500 mt-0.5">{user.role === 'LIVREUR' ? 'Livreur' : user.role === 'ADMIN' ? 'Admin' : 'Client'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={roleCfg.variant}>{roleCfg.label}</Badge>
            <button
              onClick={() => onDelete(user.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-2 mb-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Mail className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Phone className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
              {user.phone}
            </div>
          )}
        </div>

        {user.statutLivreur && (
          <div className="pt-3 border-t border-orbit-border">
            <Badge
              variant={DRIVER_STATUS_CONFIG[user.statutLivreur]?.variant ?? 'neutral'}
              dot
            >
              {DRIVER_STATUS_CONFIG[user.statutLivreur]?.label ?? user.statutLivreur}
            </Badge>
          </div>
        )}
      </Card>
    </motion.div>
  )
}

function UserRow({ user, index, onDelete }: { user: User; index: number; onDelete: (id: number) => void }) {
  const initials = `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase()
  const roleCfg = ROLE_CONFIG[user.role]

  return (
    <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }}
      className="border-b border-orbit-border hover:bg-white/2 transition-colors group">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-3">
          <Avatar initials={initials || '?'} size="sm" online={user.statutLivreur === 'DISPONIBLE'} />
          <div>
            <p className="text-sm text-slate-200 font-medium">{user.firstName} {user.lastName}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-sm text-slate-400">{user.phone || '—'}</td>
      <td className="px-5 py-3.5">
        <Badge variant={roleCfg.variant}>{roleCfg.label}</Badge>
      </td>
      <td className="px-5 py-3.5">
        {user.statutLivreur ? (
          <Badge variant={DRIVER_STATUS_CONFIG[user.statutLivreur]?.variant ?? 'neutral'} dot>
            {DRIVER_STATUS_CONFIG[user.statutLivreur]?.label ?? user.statutLivreur}
          </Badge>
        ) : (
          <span className="text-xs text-slate-600">—</span>
        )}
      </td>
      <td className="px-5 py-3.5">
        <button onClick={() => onDelete(user.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300 p-1 rounded">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </motion.tr>
  )
}

export function ContactsPage() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [showAddMenu, setShowAddMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const loadUsers = () => {
    setLoading(true)
    adminUsersApi.getAll(roleFilter !== 'all' ? roleFilter : undefined)
      .then(res => setUsers(res.data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadUsers() }, [roleFilter])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = users.filter(u =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet utilisateur ?')) return
    try {
      await adminUsersApi.deleteUser(id)
      setUsers(prev => prev.filter(u => u.id !== id))
    } catch {
      alert('Erreur lors de la suppression.')
    }
  }

  const counts = {
    all: users.length,
    CLIENT: users.filter(u => u.role === 'CLIENT').length,
    LIVREUR: users.filter(u => u.role === 'LIVREUR').length,
    ADMIN: users.filter(u => u.role === 'ADMIN').length,
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5 max-w-[1600px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Utilisateurs</h1>
          <p className="text-slate-500 text-sm mt-0.5">{users.length} utilisateurs au total</p>
        </div>

        {/* Add User button with dropdown */}
        <div className="relative" ref={menuRef}>
          <Button
            icon={<UserPlus className="w-3.5 h-3.5" />}
            onClick={() => setShowAddMenu(v => !v)}
            iconPosition="left"
          >
            Ajouter un utilisateur
            <ChevronDown className={cn('w-3.5 h-3.5 ml-1 transition-transform', showAddMenu && 'rotate-180')} />
          </Button>

          {showAddMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute right-0 top-full mt-2 w-52 bg-orbit-surface2 border border-orbit-border rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="px-3 py-2 border-b border-orbit-border">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Choisir un type</p>
              </div>
              <button
                onClick={() => { setShowAddMenu(false); navigate('/admin/users/create-driver') }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-orbit-accent/15 flex items-center justify-center">
                  <span className="text-orbit-accent-light text-xs font-bold">LV</span>
                </div>
                <div>
                  <p className="font-medium">Ajouter un Livreur</p>
                  <p className="text-xs text-slate-500">Créer un compte livreur</p>
                </div>
              </button>
              <button
                onClick={() => { setShowAddMenu(false); navigate('/admin/users/create-admin') }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-200 hover:bg-white/5 transition-colors text-left border-t border-orbit-border"
              >
                <div className="w-8 h-8 rounded-lg bg-orbit-primary/15 flex items-center justify-center">
                  <span className="text-orbit-primary-light text-xs font-bold">AD</span>
                </div>
                <div>
                  <p className="font-medium">Ajouter un Admin</p>
                  <p className="text-xs text-slate-500">Créer un compte admin</p>
                </div>
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex-1 min-w-48 max-w-sm">
          <Input
            prefix={<Search className="w-3.5 h-3.5" />}
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Role filter pills */}
        <div className="flex items-center gap-1 bg-orbit-surface2 border border-orbit-border rounded-lg p-1">
          {([
            { key: 'all', label: `Tous (${counts.all})` },
            { key: 'CLIENT', label: `Clients (${counts.CLIENT})` },
            { key: 'LIVREUR', label: `Livreurs (${counts.LIVREUR})` },
            { key: 'ADMIN', label: `Admins (${counts.ADMIN})` },
          ] as { key: RoleFilter; label: string }[]).map(f => (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-all whitespace-nowrap',
                roleFilter === f.key ? 'bg-orbit-primary text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <button onClick={loadUsers} className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-orbit-surface2 border border-orbit-border rounded-lg p-1">
          <button onClick={() => setViewMode('grid')}
            className={cn('p-1.5 rounded-md transition-all', viewMode === 'grid' ? 'bg-orbit-primary text-white' : 'text-slate-500 hover:text-slate-300')}>
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setViewMode('list')}
            className={cn('p-1.5 rounded-md transition-all', viewMode === 'list' ? 'bg-orbit-primary text-white' : 'text-slate-500 hover:text-slate-300')}>
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-600">
        {filtered.length} résultat{filtered.length > 1 ? 's' : ''} sur {users.length}
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 rounded-full border-2 border-orbit-primary border-t-transparent animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-500">Aucun utilisateur trouvé.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((user, i) => (
            <UserCard key={user.id} user={user} index={i} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-orbit-border">
                  {['Utilisateur', 'Téléphone', 'Rôle', 'Statut livreur', ''].map(col => (
                    <th key={col} className="text-left text-[11px] font-semibold text-slate-600 uppercase tracking-wider px-5 py-3">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((user, i) => (
                  <UserRow key={user.id} user={user} index={i} onDelete={handleDelete} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
