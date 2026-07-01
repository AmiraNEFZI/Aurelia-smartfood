/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/client/context/AuthContext'
import type { ReactNode } from 'react'

export interface NotificationItem {
  id: string
  title: string
  message: string
  orderId?: number
  createdAt: string
  read: boolean
}

interface NotificationContextValue {
  notifications: NotificationItem[]
  unreadCount: number
  addNotification: (notification: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllRead: () => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)
const STORAGE_KEY_BASE = 'smartfood_notifications'

function createId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const storageKey = user ? `${STORAGE_KEY_BASE}_${user.id}` : STORAGE_KEY_BASE

  const loadNotifications = () => {
    try {
      const stored = localStorage.getItem(storageKey)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  const [notifications, setNotifications] = useState<NotificationItem[]>(loadNotifications)

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (!user) {
      setNotifications([])
      return
    }
    try {
      const stored = localStorage.getItem(storageKey)
      setNotifications(stored ? JSON.parse(stored) : [])
    } catch {
      setNotifications([])
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [storageKey, user])

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications))
    } catch {
      // ignore storage errors
    }
  }, [notifications, storageKey])

  const addNotification = (notification: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => {
    const next: NotificationItem = {
      id: createId(),
      createdAt: new Date().toISOString(),
      read: false,
      ...notification,
    }
    setNotifications(prev => [next, ...prev])
  }

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = () => {
    setNotifications([])
  }

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications],
  )

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAsRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider')
  return ctx
}
