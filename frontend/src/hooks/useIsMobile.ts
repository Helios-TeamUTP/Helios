import { useEffect, useState } from 'react'

/**
 * Hook reactivo que devuelve true si el viewport es <= 768px (Tailwind md).
 *
 * Bug B-18: usado por CalendarioCitas para renderizar lista de slots en
 * vez de FullCalendar en pantallas pequeñas. FullCalendar timeGridWeek se
 * desordena en celular (7 columnas en 360px = 50px/dia, imposible leer
 * los slots de 20 min).
 *
 * Escucha resize/orientationchange para que el componente cambie de modo
 * si el usuario rota el dispositivo o redimensiona la ventana.
 *
 * SSR-safe: en server (window indefinido) devuelve false hasta el mount.
 */
export function useIsMobile(breakpointPx = 768): boolean {
  // Funcion getter para evitar acceder a window en SSR / primer render.
  const getMatch = () => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(`(max-width: ${breakpointPx}px)`).matches
  }

  const [isMobile, setIsMobile] = useState<boolean>(getMatch)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia(`(max-width: ${breakpointPx}px)`)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    // Sync inicial por si el state inicial no matcheo (SSR -> CSR).
    setIsMobile(mql.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [breakpointPx])

  return isMobile
}
