import { Outlet } from 'react-router-dom'
import { ClientNavbar } from './ClientNavbar'
import { ClientFooter } from './ClientFooter'

export function ClientLayout() {
  return (
    <div style={{ fontFamily: "'Open Sans', sans-serif" }}>
      <ClientNavbar />
      <main className="client-main">
        <Outlet />
      </main>
      <ClientFooter />
    </div>
  )
}
