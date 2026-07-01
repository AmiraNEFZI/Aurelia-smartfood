import { DollarSign, Users, Truck, MapPin } from 'lucide-react'
import type { StatCardData, Transaction } from '@/types'

export const revenueData = [
  { month: 'Jan', revenue: 42000, expenses: 28000 },
  { month: 'Feb', revenue: 53000, expenses: 31000 },
  { month: 'Mar', revenue: 48000, expenses: 29000 },
  { month: 'Apr', revenue: 71000, expenses: 35000 },
  { month: 'May', revenue: 64000, expenses: 32000 },
  { month: 'Jun', revenue: 89000, expenses: 38000 },
  { month: 'Jul', revenue: 95000, expenses: 41000 },
  { month: 'Aug', revenue: 108000, expenses: 44000 },
  { month: 'Sep', revenue: 96000, expenses: 39000 },
  { month: 'Oct', revenue: 114000, expenses: 47000 },
  { month: 'Nov', revenue: 128000, expenses: 52000 },
  { month: 'Dec', revenue: 142000, expenses: 55000 },
]

export const trafficData = [
  { name: 'Organic', value: 38, color: '#7C3AED' },
  { name: 'Direct', value: 24, color: '#06B6D4' },
  { name: 'Social', value: 18, color: '#8B5CF6' },
  { name: 'Email', value: 12, color: '#22D3EE' },
  { name: 'Paid', value: 8, color: '#A78BFA' },
]

export const statsData: StatCardData[] = [
  {
    id: 'orders',
    label: 'Total Orders',
    value: '1,242',
    change: 14.2,
    changeLabel: 'vs last week',
    icon: Truck,
    color: 'primary',
    sparkData: [
      { value: 152 }, { value: 168 }, { value: 174 }, { value: 188 },
      { value: 196 }, { value: 212 }, { value: 242 }, { value: 280 },
    ],
  },
  {
    id: 'revenue',
    label: 'Total Revenue',
    value: '$1.62M',
    change: 9.8,
    changeLabel: 'vs last month',
    icon: DollarSign,
    color: 'accent',
    sparkData: [
      { value: 42 }, { value: 53 }, { value: 48 }, { value: 71 },
      { value: 64 }, { value: 89 }, { value: 95 }, { value: 108 },
    ],
  },
  {
    id: 'delivery',
    label: 'Delivery Revenue',
    value: '$382K',
    change: 12.4,
    changeLabel: 'vs last month',
    icon: MapPin,
    color: 'success',
    sparkData: [
      { value: 18 }, { value: 21 }, { value: 22 }, { value: 25 },
      { value: 28 }, { value: 31 }, { value: 34 }, { value: 38 },
    ],
  },
  {
    id: 'drivers',
    label: 'Active Drivers',
    value: '28',
    change: 5.1,
    changeLabel: 'vs last week',
    icon: Users,
    color: 'warning',
    sparkData: [
      { value: 18 }, { value: 19 }, { value: 20 }, { value: 22 },
      { value: 23 }, { value: 25 }, { value: 27 }, { value: 28 },
    ],
  },
]

export const transactions: Transaction[] = [
  { id: 'OD-1021', customer: 'Karim Salah', email: 'karim@smartfood.tn', initials: 'KS', date: 'Jun 21, 2026', type: 'Grocery Delivery', amount: 128, status: 'completed' },
  { id: 'OD-1018', customer: 'Yasmine Bouazizi', email: 'yasmine@aurelia.tn', initials: 'YB', date: 'Jun 21, 2026', type: 'Express Pickup', amount: 76, status: 'pending' },
  { id: 'OD-1015', customer: 'Amine Trabelsi', email: 'amine@hendrix.tn', initials: 'AT', date: 'Jun 20, 2026', type: 'Home Delivery', amount: 199, status: 'completed' },
  { id: 'OD-1012', customer: 'Mouna Jaziri', email: 'mouna@nectar.tn', initials: 'MJ', date: 'Jun 20, 2026', type: 'Grocery Delivery', amount: 54, status: 'completed' },
  { id: 'OD-1009', customer: 'Sami Khlifi', email: 'sami@artisan.tn', initials: 'SK', date: 'Jun 19, 2026', type: 'Express Pickup', amount: 42, status: 'completed' },
  { id: 'OD-1005', customer: 'Rania Ghali', email: 'rania@nova.tn', initials: 'RG', date: 'Jun 19, 2026', type: 'Home Delivery', amount: 173, status: 'completed' },
  { id: 'OD-1001', customer: 'Nabil Fersi', email: 'nabil@loop.tn', initials: 'NF', date: 'Jun 18, 2026', type: 'Grocery Delivery', amount: 215, status: 'completed' },
]

export const driverActivity = [
  { id: '1', name: 'Salma Hamdi', initials: 'SH', status: 'Active', connectedSince: '2h 18m ago', duration: '2h 18m', lastActive: 'Online now', route: 'Tunis → La Marsa' },
  { id: '2', name: 'Walid Jdid', initials: 'WJ', status: 'Suspended', connectedSince: '13h ago', duration: '1h 05m', lastActive: 'Suspended', route: 'Sfax — inactive' },
  { id: '3', name: 'Meriem Ba', initials: 'MB', status: 'Active', connectedSince: '45m ago', duration: '45m', lastActive: 'Online now', route: 'Ariana → Carthage' },
  { id: '4', name: 'Fares Mzoughi', initials: 'FM', status: 'Active', connectedSince: '1h 12m ago', duration: '1h 12m', lastActive: 'Online now', route: 'Bardo → Sidi Bouzid' },
]
