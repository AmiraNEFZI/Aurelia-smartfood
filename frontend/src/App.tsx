import { Routes, Route, Navigate } from 'react-router-dom'

// ── Client (Fruitables) layout & pages ────────────────────────────────────
import { ClientLayout } from '@/client/layouts/ClientLayout'
import { HomePage } from '@/client/pages/HomePage'
import { ShopPage } from '@/client/pages/ShopPage'
import { ShopDetailPage } from '@/client/pages/ShopDetailPage'
import { CartPage } from '@/client/pages/CartPage'
import { CheckoutPage } from '@/client/pages/CheckoutPage'
import { TestimonialPage } from '@/client/pages/TestimonialPage'
import { ContactPage } from '@/client/pages/ContactPage'
import { NotFoundPage } from '@/client/pages/NotFoundPage'

// ── Admin (Orbit) layout & pages ──────────────────────────────────────────
import { AdminLayout } from '@/admin/layouts/AdminLayout'
import { DashboardPage } from '@/admin/pages/dashboard/DashboardPage'
import { BillingPage } from '@/admin/pages/billing/BillingPage'
import { ContactsPage } from '@/admin/pages/crm/ContactsPage'
import { ChatPage } from '@/admin/pages/ai/ChatPage'
import { SettingsPage } from '@/admin/pages/settings/SettingsPage'
import { HelpPage } from '@/admin/pages/help/HelpPage'
import { ComponentsPage } from '@/admin/pages/components/ComponentsPage'
import { SignInPage } from '@/admin/pages/auth/SignInPage'
import { SignUpPage } from '@/admin/pages/auth/SignUpPage'
import { ForgotPasswordPage } from '@/admin/pages/auth/ForgotPasswordPage'

export default function App() {
  return (
    <Routes>
      {/* ── Client routes (Fruitables) ── */}
      <Route element={<ClientLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/:id" element={<ShopDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/testimonials" element={<TestimonialPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* ── Admin auth routes (no sidebar) ── */}
      <Route path="/admin/sign-in" element={<SignInPage />} />
      <Route path="/admin/sign-up" element={<SignUpPage />} />
      <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />

      {/* ── Admin routes (Orbit) ── */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="crm/contacts" element={<ContactsPage />} />
        <Route path="ai/chat" element={<ChatPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="components" element={<ComponentsPage />} />
      </Route>
    </Routes>
  )
}
