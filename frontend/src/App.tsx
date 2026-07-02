import { Routes, Route, Navigate } from 'react-router-dom'

// ── Client layout & pages ──────────────────────────────────────────────────
import { ClientLayout } from '@/client/layouts/ClientLayout'
import { HomePage } from '@/client/pages/HomePage'
import { ShopPage } from '@/client/pages/ShopPage'
import { ShopDetailPage } from '@/client/pages/ShopDetailPage'
import { CartPage } from '@/client/pages/CartPage'
import { CheckoutPage } from '@/client/pages/CheckoutPage'
import { LoginPage } from '@/client/pages/LoginPage'
import { RegisterPage } from '@/client/pages/RegisterPage'
import { OrderConfirmationPage } from '@/client/pages/OrderConfirmationPage'
import { TestimonialPage } from '@/client/pages/TestimonialPage'
import { ContactPage } from '@/client/pages/ContactPage'
import { NotFoundPage } from '@/client/pages/NotFoundPage'
import { ProfilePage } from '@/client/pages/ProfilePage'

// ── Admin layout & pages ───────────────────────────────────────────────────
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

// ── Driver layout & pages ──────────────────────────────────────────────────
import { DriverLayout } from '@/driver/layouts/DriverLayout'
import { DriverDashboardPage } from '@/driver/pages/DriverDashboardPage'
import { DriverOrdersPage } from '@/driver/pages/DriverOrdersPage'
// Admin additions
import { CreateProductPage } from '@/admin/pages/products/CreateProductPage'
import { CreateDriverPage as CreateDriverPageOld } from '@/admin/pages/drivers/CreateDriverPage'
import { CreateDriverPage } from '@/admin/pages/crm/CreateDriverPage'
import { CreateAdminPage } from '@/admin/pages/crm/CreateAdminPage'

export default function App() {
  return (
    <Routes>
      {/* ── Client routes ── */}
      <Route element={<ClientLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/shop" element={<ShopPage />} />
        <Route path="/shop/:id" element={<ShopDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/order-confirmation/:id" element={<OrderConfirmationPage />} />
        <Route path="/testimonials" element={<TestimonialPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* ── Admin auth routes (no sidebar) ── */}
      <Route path="/admin/sign-in" element={<SignInPage />} />
      <Route path="/admin/sign-up" element={<SignUpPage />} />
      <Route path="/admin/forgot-password" element={<ForgotPasswordPage />} />

      {/* ── Admin routes ── */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="billing" element={<BillingPage />} />
        <Route path="crm/contacts" element={<ContactsPage />} />
        <Route path="ai/chat" element={<ChatPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="components" element={<ComponentsPage />} />
        <Route path="products/create" element={<CreateProductPage />} />
        <Route path="drivers/create" element={<CreateDriverPageOld />} />
        {/* CRM — create user pages */}
        <Route path="users/create-driver" element={<CreateDriverPage />} />
        <Route path="users/create-admin" element={<CreateAdminPage />} />
      </Route>

      {/* ── Driver routes ── */}
      <Route path="/driver" element={<DriverLayout />}>
        <Route index element={<Navigate to="/driver/dashboard" replace />} />
        <Route path="dashboard" element={<DriverDashboardPage />} />
        <Route path="orders" element={<DriverOrdersPage />} />
      </Route>
    </Routes>
  )
}
