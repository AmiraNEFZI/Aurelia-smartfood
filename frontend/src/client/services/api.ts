import axios from 'axios'

const API_BASE = 'http://localhost:8080/api'
const BACKEND_ORIGIN = new URL(API_BASE).origin

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  try {
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type']
    }
    const stored = localStorage.getItem('smartfood_user')
    if (stored) {
      const user = JSON.parse(stored)
      if (user?.token) config.headers.Authorization = `Bearer ${user.token}`
    }
  } catch { /* ignore */ }
  return config
})

// Intercepteur réponse : si 401 sur une route admin → déconnexion auto
api.interceptors.response.use(
  response => response,
  error => {
    if (error?.response?.status === 401) {
      const url = error?.config?.url ?? ''
      const isAdminRoute = url.includes('/admin') || url.includes('/orders') || url.includes('/partners')
      const storedUser = localStorage.getItem('smartfood_user')
      if (isAdminRoute && storedUser) {
        try {
          const user = JSON.parse(storedUser)
          if (user?.role === 'ADMIN') {
            // Token expiré pour l'admin → redirection login admin
            localStorage.removeItem('smartfood_user')
            if (!window.location.pathname.includes('/admin/sign-in')) {
              window.location.href = '/admin/sign-in'
            }
          }
        } catch { /* ignore */ }
      }
    }
    return Promise.reject(error)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface RegisterPayload { firstName: string; lastName: string; phone: string; email: string; password: string }
export interface LoginPayload { email: string; password: string }
export const authApi = {
  register: (data: RegisterPayload) => api.post('/auth/register', data),
  login: (data: LoginPayload) => api.post('/auth/login', data),
}

// ── Products ──────────────────────────────────────────────────────────────────
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

// ── Cart ──────────────────────────────────────────────────────────────────────
export interface CartItemResponse { id: number; productId: number; productName: string; productImage: string; unitPrice: number; quantity: number; subtotal: number }
export interface CartResponse { id: number; items: CartItemResponse[]; total: number; itemCount: number }
export const cartApi = {
  getCart: () => api.get<CartResponse>('/cart'),
  addItem: (productId: number, quantity: number) => api.post<CartResponse>('/cart/items', { productId, quantity }),
  updateItemQuantity: (itemId: number, quantity: number) => api.patch<CartResponse>(`/cart/items/${itemId}`, null, { params: { quantity } }),
  removeItem: (itemId: number) => api.delete<CartResponse>(`/cart/items/${itemId}`),
}

// ── Orders ────────────────────────────────────────────────────────────────────
export interface CheckoutPayload { address: string; paymentMethod: 'ESPECES' | 'CARTE_BANCAIRE' }
export const orderApi = {
  checkout: (data: CheckoutPayload) => api.post('/orders/checkout', data),
  getMyOrders: () => api.get('/orders/my'),
  getById: (id: number) => api.get(`/orders/${id}`),
}

// ── Admin Stats ───────────────────────────────────────────────────────────────
export const adminStatsApi = {
  getStats: () => api.get('/admin/stats'),
}

// ── Admin Orders ──────────────────────────────────────────────────────────────
export interface OrderResponse {
  id: number
  clientName: string
  driverId?: number
  driverName?: string
  address: string
  totalAmount: number
  status: string
  orderDate: string
  paymentMethod?: string
  items: {
    productName: string
    quantity: number
    unitPrice: number
    subtotal: number
    sourceType?: string
    sourcePartnerName?: string
  }[]
}
export const adminOrdersApi = {
  getAll: () => api.get<OrderResponse[]>('/orders'),
  updateStatus: (id: number, status: string) => api.patch<OrderResponse>(`/orders/${id}/status`, null, { params: { status } }),
  assignDriver: (orderId: number, driverId: number) => api.patch<OrderResponse>(`/orders/${orderId}/assign`, null, { params: { driverId } }),
}

// ── Admin Products ────────────────────────────────────────────────────────────
export interface ProductPayload { name: string; description?: string; price: number; stock: number; image?: string }
export const adminProductsApi = {
  getAll: () => api.get('/products'),
  create: (data: ProductPayload) => api.post('/products', data),
  update: (id: number, data: ProductPayload) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
}

// ── Admin Users ───────────────────────────────────────────────────────────────
export interface CreateDriverPayload { firstName: string; lastName: string; phone: string; email: string; password: string }
export interface CreateAdminPayload { firstName: string; lastName: string; phone?: string; email: string; password: string }
export const adminUsersApi = {
  getAll: (role?: string) => api.get('/admin/users', { params: role ? { role } : {} }),
  createDriver: (data: CreateDriverPayload) => api.post('/admin/drivers', data),
  createAdmin: (data: CreateAdminPayload) => api.post('/admin/admins', data),
  deleteUser: (id: number) => api.delete(`/admin/users/${id}`),
}

// ── Partners ──────────────────────────────────────────────────────────────────
export interface PartnerProductData {
  id: number; partnerId: number; partnerName: string
  productId: number; productName: string; productImage?: string
  stock: number; price: number; isAvailable: boolean
}
export interface PartnerData {
  id: number; name: string; email?: string; phone?: string
  address?: string; contactPerson?: string; website?: string
  description?: string; isActive: boolean
  products: PartnerProductData[]; totalProducts: number; totalStock: number
}
export const partnerApi = {
  getAll: () => api.get<PartnerData[]>('/partners'),
  getById: (id: number) => api.get<PartnerData>(`/partners/${id}`),
  create: (data: Partial<PartnerData>) => api.post<PartnerData>('/partners', data),
  update: (id: number, data: Partial<PartnerData>) => api.put<PartnerData>(`/partners/${id}`, data),
  toggle: (id: number) => api.patch<PartnerData>(`/partners/${id}/toggle`),
  delete: (id: number) => api.delete(`/partners/${id}`),
  getProducts: (partnerId: number) => api.get<PartnerProductData[]>(`/partners/${partnerId}/products`),
  addProduct: (partnerId: number, data: { productId: number; stock: number; price: number; isAvailable?: boolean }) =>
    api.post<PartnerProductData>(`/partners/${partnerId}/products`, data),
  updateProduct: (ppId: number, data: { stock: number; price: number; isAvailable?: boolean }) =>
    api.put<PartnerProductData>(`/partners/products/${ppId}`, data),
  removeProduct: (ppId: number) => api.delete(`/partners/products/${ppId}`),
  checkAvailability: (productId: number) => api.get<boolean>(`/partners/availability/${productId}`),
  getBestPartnerStock: (productId: number) => api.get<number>(`/partners/availability/${productId}/stock`),
}

export default api
