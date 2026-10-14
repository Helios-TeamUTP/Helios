import { useEffect, useState } from 'react'

const QUERY = '(max-width: 767px)'

/**
 * true cuando la pantalla es menor a 768 px (CU-05, requisito especial: la
 * agenda del médico debe ser legible en móvil con una lista agrupada por día).
 *
 * Seguro sin `matchMedia` (jsdom/SSR): devuelve false y no se suscribe.
 */
export function useIsMobile(): boolean {
  const [esMovil, setEsMovil] = useState(
    () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(QUERY).matches
      : false,
  )

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(QUERY)
    const onChange = (e: MediaQueryListEvent) => setEsMovil(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return esMovil
}
