import {
  LayoutDashboard,
  MessageSquare,
  Users,
  CreditCard,
  Puzzle,
  Settings,
  HelpCircle,
  BarChart3,
  Package,
  Truck,
  ShoppingBag,
  ClipboardList,
} from 'lucide-react'
import type { NavSection } from '@/types'

export const navigation: NavSection[] = [
  {
    title: 'Vue générale',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
      { label: 'Analytics', icon: BarChart3,        href: '/admin/billing' },
    ],
  },
  {
    title: 'Gestion',
    items: [
      {
        label: 'Commandes',
        icon: ClipboardList,
        children: [
          { label: 'Toutes les commandes', href: '/admin/orders' },
          { label: 'Revenus & Finances',   href: '/admin/billing' },
        ],
      },
      {
        label: 'Produits',
        icon: Package,
        children: [
          { label: 'Catalogue',       href: '/admin/products' },
          { label: 'Créer produit',   href: '/admin/products/create' },
        ],
      },
      {
        label: 'Utilisateurs',
        icon: Users,
        children: [
          { label: 'Tous les comptes',   href: '/admin/crm/contacts' },
          { label: 'Ajouter livreur',    href: '/admin/users/create-driver' },
          { label: 'Ajouter admin',      href: '/admin/users/create-admin' },
        ],
      },
      {
        label: 'Livreurs',
        icon: Truck,
        children: [
          { label: 'Liste livreurs',    href: '/admin/crm/contacts' },
          { label: 'Créer un livreur',  href: '/admin/users/create-driver' },
        ],
      },
    ],
  },
  {
    title: 'Apps',
    items: [
      { label: 'AI Chat',  icon: MessageSquare, href: '/admin/ai/chat',  badge: 'New' },
      { label: 'Billing',  icon: CreditCard,    href: '/admin/billing' },
    ],
  },
  {
    title: 'Système',
    items: [
      { label: 'Components', icon: Puzzle,     href: '/admin/components' },
      { label: 'Paramètres', icon: Settings,   href: '/admin/settings' },
      { label: 'Aide',       icon: HelpCircle, href: '/admin/help' },
    ],
  },
]
