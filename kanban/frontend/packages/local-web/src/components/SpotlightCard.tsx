import { useRef, useCallback } from 'react'

interface Props {
  children: React.ReactNode
  className?: string
  spotlightColor?: string
  style?: React.CSSProperties
}

/**
 * ReactBits SpotlightCard — radial glow follows the mouse inside the card.
 * spotlightColor defaults to theme-aware value (dark: white glow, light: dark dimple).
 */
export default function SpotlightCard({ children, className = '', spotlightColor, style }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    ref.current.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`)
    ref.current.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`)
    const color = spotlightColor ?? (
      document.documentElement.classList.contains('dark')
        ? 'rgba(255,255,255,0.10)'
        : 'rgba(0,0,0,0.06)'
    )
    ref.current.style.setProperty('--spotlight-color', color)
  }, [spotlightColor])

  return (
    <div ref={ref} onMouseMove={handleMouseMove} className={`rb-spotlight ${className}`} style={style}>
      {children}
    </div>
  )
}
