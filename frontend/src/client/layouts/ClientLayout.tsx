import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { ClientNavbar } from './ClientNavbar'
import { ClientFooter } from './ClientFooter'

/**
 * Injects Fruitables Bootstrap CSS into <head> when the client layout mounts,
 * and removes it when unmounting (so admin routes stay clean).
 */
function useFruitablesStyles() {
  useEffect(() => {
    const links: HTMLLinkElement[] = []

    const stylesheets = [
      'https://use.fontawesome.com/releases/v5.15.4/css/all.css',
      'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.4.1/font/bootstrap-icons.css',
      'https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/css/bootstrap.min.css',
      '/fruitables/css/style.css',
    ]

    stylesheets.forEach(href => {
      // Avoid duplicates
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = href
        document.head.appendChild(link)
        links.push(link)
      }
    })

    // Bootstrap JS bundle
    let bsScript: HTMLScriptElement | null = null
    const bsSrc = 'https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.bundle.min.js'
    if (!document.querySelector(`script[src="${bsSrc}"]`)) {
      bsScript = document.createElement('script')
      bsScript.src = bsSrc
      document.body.appendChild(bsScript)
    }

    return () => {
      links.forEach(link => link.remove())
      bsScript?.remove()
    }
  }, [])
}

export function ClientLayout() {
  useFruitablesStyles()

  return (
    <div style={{ fontFamily: "'Open Sans', sans-serif" }}>
      <ClientNavbar />
      <main style={{ paddingTop: '131px' }}>
        <Outlet />
      </main>
      <ClientFooter />
    </div>
  )
}
