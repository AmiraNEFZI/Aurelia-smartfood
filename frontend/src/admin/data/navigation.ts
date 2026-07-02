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
} from 'lucide-react'
import type { NavSection } from '@/types'

export const navigation: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
      { label: 'Analytics', icon: BarChart3, href: '/admin/dashboard' },
    ],
  },
  {
    title: 'Apps',
    items: [
      { label: 'AI Chat', icon: MessageSquare, href: '/admin/ai/chat', badge: 'New' },
      {
        label: 'CRM',
        icon: Users,
        children: [
          { label: 'Utilisateurs', href: '/admin/crm/contacts' },
          { label: 'Ajouter livreur', href: '/admin/users/create-driver' },
          { label: 'Ajouter admin', href: '/admin/users/create-admin' },
        ],
      },
      {
        label: 'Billing',
        icon: CreditCard,
        children: [
          { label: 'Overview', href: '/admin/billing' },
          { label: 'Invoices', href: '/admin/billing' },
        ],
      },
      {
        label: 'Commerce',
        icon: Package,
        children: [
          { label: 'Produits', href: '/admin/products/create' },
          { label: 'Livreurs', href: '/admin/drivers/create' },
        ],
      },
    ],
  },
  {
    title: 'Design System',
    items: [
      { label: 'Components', icon: Puzzle, href: '/admin/components' },
      { label: 'Settings', icon: Settings, href: '/admin/settings' },
      { label: 'Help', icon: HelpCircle, href: '/admin/help' },
    ],
  },
]
