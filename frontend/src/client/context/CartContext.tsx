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
  clearCart: () => void
  totalItems: number
  subtotal: number
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'smartfood_cart'

function mapApiItemToCartItem(item: CartItemResponse): CartItem {
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

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  const persistLocalCart = (nextItems: CartItem[]) => {
    setItems(nextItems)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems))
  }

  const loadLocalCart = (): CartItem[] => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const items: CartItem[] = stored ? JSON.parse(stored) : []
      return items.map(item => ({
        ...item,
        img: resolveProductImage(item.img),
      }))
    } catch {
      return []
    }
  }

  const fetchCart = async () => {
    try {
      const response = await cartApi.getCart()
      setItems(response.data.items.map(mapApiItemToCartItem))
    } catch {
      setItems(loadLocalCart())
    }
  }

  const syncLocalCartToBackend = async () => {
    const localItems = loadLocalCart()
    if (!localItems.length) {
      return
    }
    for (const item of localItems) {
      try {
        await cartApi.addItem(item.productId, item.quantity)
      } catch {
        // ignore item sync failure for now
      }
    }
    localStorage.removeItem(STORAGE_KEY)
  }

  useEffect(() => {
    if (isAuthenticated) {
      syncLocalCartToBackend()
        .then(fetchCart)
        .catch(() => {
          const fallback = loadLocalCart()
          setItems(fallback)
        })
    } else {
      /* eslint-disable react-hooks/set-state-in-effect */
      setItems(loadLocalCart())
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [isAuthenticated])

  const addItem = async (product: Omit<CartItem, 'quantity'>) => {
    if (isAuthenticated) {
      const response = await cartApi.addItem(product.productId, 1)
      setItems(response.data.items.map(mapApiItemToCartItem))
      return
    }

    const current = loadLocalCart()
    const existing = current.find(i => i.productId === product.productId)
    const nextItems = existing
      ? current.map(i =>
          i.productId === product.productId ? { ...i, quantity: i.quantity + 1 } : i
        )
      : [...current, { ...product, productId: product.id, quantity: 1, id: product.id, img: resolveProductImage(product.img) }]
    persistLocalCart(nextItems)
  }

  const removeItem = async (id: number) => {
    if (isAuthenticated) {
      const response = await cartApi.removeItem(id)
      setItems(response.data.items.map(mapApiItemToCartItem))
      return
    }
    persistLocalCart(items.filter(item => item.id !== id))
  }

  const updateQty = async (id: number, delta: number) => {
    if (isAuthenticated) {
      const item = items.find(i => i.id === id)
      if (!item) return
      const nextQuantity = Math.max(0, item.quantity + delta)
      if (nextQuantity === 0) {
        await cartApi.removeItem(id)
        const response = await cartApi.getCart()
        setItems(response.data.items.map(mapApiItemToCartItem))
        return
      }
      const response = await cartApi.updateItemQuantity(id, nextQuantity)
      setItems(response.data.items.map(mapApiItemToCartItem))
      return
    }
    persistLocalCart(
      items
        .map(i =>
          i.id === id ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
        )
        .filter(i => i.quantity > 0)
    )
  }

  const clearCart = () => {
    setItems([])
    localStorage.removeItem(STORAGE_KEY)
  }

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

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
