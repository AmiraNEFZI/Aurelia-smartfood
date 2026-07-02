import axios from 'axios'

const API_BASE = 'http://localhost:8080/api'
const BACKEND_ORIGIN = new URL(API_BASE).origin

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request if present
api.interceptors.request.use(config => {
  try {
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type']
    }
    const stored = localStorage.getItem('smartfood_user')
    if (stored) {
      const user = JSON.parse(stored)
      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`
      }
    }
  } catch {
    // ignore
  }
  return config
})

// ── Auth ────────────────────────────────────────────────────────────────────
export interface RegisterPayload {
  firstName: string
  lastName: string
  phone: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export const authApi = {
  register: (data: RegisterPayload) =>
    api.post('/auth/register', data),

  login: (data: LoginPayload) =>
    api.post('/auth/login', data),
}

// ── Products ─────────────────────────────────────────────────────────────────
export const productApi = {
  getAll: () => api.get('/products'),
  getById: (id: number) => api.get(`/products/${id}`),
}

export const uploadApi = {
  uploadFile: (formData: FormData) => api.post('/uploads', formData),
}

export function resolveProductImage(image?: string | null) {
  if (!image) return ''
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  if (image.startsWith('/uploads')) return `${BACKEND_ORIGIN}${image}`
  if (image.startsWith('uploads/')) return `${BACKEND_ORIGIN}/${image}`
  return image
}

// ── Orders ───────────────────────────────────────────────────────────────────
export interface CheckoutPayload {
  address: string
  paymentMethod: 'ESPECES' | 'CARTE_BANCAIRE'
}

export interface CartItemResponse {
  id: number
  productId: number
  productName: string
  productImage: string
  unitPrice: number
  quantity: number
  subtotal: number
}

export interface CartResponse {
  id: number
  items: CartItemResponse[]
  total: number
  itemCount: number
}

export const cartApi = {
  getCart: () => api.get<CartResponse>('/cart'),
  addItem: (productId: number, quantity: number) => api.post<CartResponse>('/cart/items', { productId, quantity }),
  updateItemQuantity: (itemId: number, quantity: number) => api.patch<CartResponse>(`/cart/items/${itemId}`, null, { params: { quantity } }),
  removeItem: (itemId: number) => api.delete<CartResponse>(`/cart/items/${itemId}`),
}

export const orderApi = {
  checkout: (data: CheckoutPayload) =>
    api.post('/orders/checkout', data),

  getMyOrders: () => api.get('/orders/my'),

  getById: (id: number) => api.get(`/orders/${id}`),
}

// ── Admin Stats ──────────────────────────────────────────────────────────────
export const adminStatsApi = {
  getStats: () => api.get('/admin/stats'),
}

// ── Admin Orders ─────────────────────────────────────────────────────────────
export interface OrderResponse {
  id: number
  clientName: string
  address: string
  totalAmount: number
  status: string
  orderDate: string
  items: { productName: string; quantity: number; unitPrice: number; subtotal: number }[]
}

export const adminOrdersApi = {
  getAll: () => api.get<OrderResponse[]>('/orders'),
  updateStatus: (id: number, status: string) =>
    api.patch<OrderResponse>(`/orders/${id}/status`, null, { params: { status } }),
}

// ── Admin Users ───────────────────────────────────────────────────────────────
export interface CreateDriverPayload {
  firstName: string
  lastName: string
  phone: string
  email: string
  password: string
}

export interface CreateAdminPayload {
  firstName: string
  lastName: string
  phone?: string
  email: string
  password: string
}

export const adminUsersApi = {
  getAll: (role?: string) => api.get('/admin/users', { params: role ? { role } : {} }),
  createDriver: (data: CreateDriverPayload) => api.post('/admin/drivers', data),
  createAdmin: (data: CreateAdminPayload) => api.post('/admin/admins', data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
}

export default api
