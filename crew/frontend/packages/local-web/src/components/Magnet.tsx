import { useState, useEffect, useRef } from 'react'

interface Props {
  children: React.ReactNode
  padding?: number
  magnetStrength?: number
  disabled?: boolean
  className?: string
}

/**
 * ReactBits Magnet — child element drifts toward the cursor when nearby.
 */
export default function Magnet({
  children,
  padding = 60,
  magnetStrength = 3,
  disabled = false,
  className = '',
}: Props) {
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [active, setActive] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (disabled) { setPos({ x: 0, y: 0 }); return }

    const onMove = (e: MouseEvent) => {
      if (!ref.current) return
      const { left, top, width, height } = ref.current.getBoundingClientRect()
      const cx = left + width / 2
      const cy = top + height / 2
      if (Math.abs(cx - e.clientX) < width / 2 + padding && Math.abs(cy - e.clientY) < height / 2 + padding) {
        setActive(true)
        setPos({ x: (e.clientX - cx) / magnetStrength, y: (e.clientY - cy) / magnetStrength })
      } else {
        setActive(false)
        setPos({ x: 0, y: 0 })
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [padding, magnetStrength, disabled])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }} className={className}>
      <div style={{
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        transition: active ? 'transform 0.2s ease-out' : 'transform 0.45s ease-in-out',
        willChange: 'transform',
      }}>
        {children}
      </div>
    </div>
  )
}
