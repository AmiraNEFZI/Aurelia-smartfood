import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Scroll automatiquement en haut de page à chaque changement de route.
 * À utiliser une seule fois, placé dans le composant racine (App ou BrowserRouter wrapper).
 */
export function useScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])
}
