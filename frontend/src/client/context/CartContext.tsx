/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '@/client/context/AuthContext'
import { cartApi, resolveProductImage } from '@/client/services/api'
import type { CartItemResponse } from '@/client/services/api'

export interface CartItem {
  id: number
  productId: number
  name: string
  price: number
  quantity: number
  img: string
  category: string
}

interface CartContextValue {
  items: CartItem[]
  addItem: (product: Omit<CartItem, 'quantity'>) => Promise<void>
  removeItem: (id: number) => Promise<void>
  updateQty: (id: number, delta: number) => Promise<void>
  clearCart: () => Promise<void>
  totalItems: number
  subtotal: number
}

const CartContext = createContext<CartContextValue | null>(null)
const STORAGE_KEY = 'smartfood_cart'

function mapApiItem(item: CartItemResponse): CartItem {
  return {
    id: item.id,
    productId: item.productId,
    name: item.productName,
    price: item.unitPrice,
    quantity: item.quantity,
    img: resolveProductImage(item.productImage),
    category: 'Produit',
  }
}

function loadLocal(): CartItem[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    return s ? JSON.parse(s) : []
  } catch { return [] }
}

function saveLocal(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function clearLocal() {
  localStorage.removeItem(STORAGE_KEY)
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  const isClient = isAuthenticated && (!user || user.role === 'CLIENT')

  const [items, setItems] = useState<CartItem[]>(() => loadLocal())

  // ── Chargement initial ───────────────────────────────────────────────────
  useEffect(() => {
    if (isClient) {
      // Client connecté : charger depuis le backend (source de vérité)
      cartApi.getCart()
        .then(res => {
          const backendItems = res.data.items.map(mapApiItem)
          setItems(backendItems)
          clearLocal() // le backend est la source de vérité → vider le local
        })
        .catch(() => {
          // Si le backend échoue, garder le local en attendant
          setItems(loadLocal())
        })
    } else if (!isAuthenticated) {
      // Non connecté : localStorage uniquement
      setItems(loadLocal())
    } else {
      // Admin/Livreur : panier vide, pas d'appel API
      setItems([])
    }
  }, [isAuthenticated, user?.role])

  // ── addItem ───────────────────────────────────────────────────────────────
  const addItem = async (product: Omit<CartItem, 'quantity'>) => {
    if (isClient) {
      // Backend : source de vérité
      const res = await cartApi.addItem(product.productId, 1)
      setItems(res.data.items.map(mapApiItem))
      clearLocal()
      return
    }
    // Non connecté : localStorage
    const current = loadLocal()
    const existing = current.find(i => i.productId === product.productId)
    const next = existing
      ? current.map(i => i.productId === product.productId ? { ...i, quantity: i.quantity + 1 } : i)
      : [...current, { ...product, productId: product.id, quantity: 1, id: product.id }]
    setItems(next)
    saveLocal(next)
  }

  // ── removeItem ────────────────────────────────────────────────────────────
  const removeItem = async (id: number) => {
    if (isClient) {
      const res = await cartApi.removeItem(id)
      setItems(res.data.items.map(mapApiItem))
      clearLocal()
      return
    }
    const next = items.filter(i => i.id !== id)
    setItems(next)
    saveLocal(next)
  }

  // ── updateQty ─────────────────────────────────────────────────────────────
  const updateQty = async (id: number, delta: number) => {
    if (isClient) {
      const item = items.find(i => i.id === id)
      if (!item) return
      const nextQty = Math.max(0, item.quantity + delta)
      if (nextQty === 0) {
        const res = await cartApi.removeItem(id)
        setItems(res.data.items.map(mapApiItem))
      } else {
        const res = await cartApi.updateItemQuantity(id, nextQty)
        setItems(res.data.items.map(mapApiItem))
      }
      clearLocal()
      return
    }
    const next = items
      .map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i)
      .filter(i => i.quantity > 0)
    setItems(next)
    saveLocal(next)
  }

  // ── clearCart ─────────────────────────────────────────────────────────────
  const clearCart = async () => {
    setItems([])
    clearLocal()
    // Si connecté : vider aussi le backend item par item
    if (isClient) {
      try {
        const current = await cartApi.getCart()
        for (const item of current.data.items) {
          await cartApi.removeItem(item.id)
        }
      } catch { /* ignore */ }
    }
  }

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totalItems, subtotal }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
