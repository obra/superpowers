import { useRef, useEffect, useCallback } from 'react'

interface Spark {
  x: number
  y: number
  angle: number
  startTime: number
}

interface Props {
  children: React.ReactNode
  sparkColor?: string
  sparkSize?: number
  sparkRadius?: number
  sparkCount?: number
  duration?: number
}

/**
 * ReactBits ClickSpark — canvas-drawn sparks radiate outward on click.
 * Wrap any container; the canvas is pointer-events:none so clicks pass through.
 */
export default function ClickSpark({
  children,
  sparkColor = '#10b981',
  sparkSize = 8,
  sparkRadius = 18,
  sparkCount = 8,
  duration = 380,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sparksRef = useRef<Spark[]>([])

  // Resize canvas to match parent
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement!
    let timer: ReturnType<typeof setTimeout>

    const resize = () => {
      const { width, height } = parent.getBoundingClientRect()
      canvas.width = width
      canvas.height = height
    }
    const ro = new ResizeObserver(() => { clearTimeout(timer); timer = setTimeout(resize, 80) })
    ro.observe(parent)
    resize()
    return () => { ro.disconnect(); clearTimeout(timer) }
  }, [])

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let raf: number

    const draw = (ts: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      sparksRef.current = sparksRef.current.filter(s => {
        const elapsed = ts - s.startTime
        if (elapsed >= duration) return false
        const t = elapsed / duration
        const eased = t * (2 - t) // ease-out quad
        const dist = eased * sparkRadius
        const len = sparkSize * (1 - eased)
        const x1 = s.x + dist * Math.cos(s.angle)
        const y1 = s.y + dist * Math.sin(s.angle)
        const x2 = s.x + (dist + len) * Math.cos(s.angle)
        const y2 = s.y + (dist + len) * Math.sin(s.angle)
        ctx.globalAlpha = 1 - eased
        ctx.strokeStyle = sparkColor
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke()
        return true
      })
      ctx.globalAlpha = 1
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [sparkColor, sparkSize, sparkRadius, duration])

  const handleClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const now = performance.now()
    sparksRef.current.push(
      ...Array.from({ length: sparkCount }, (_, i) => ({
        x, y,
        angle: (2 * Math.PI * i) / sparkCount,
        startTime: now,
      }))
    )
  }, [sparkCount])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }} onClick={handleClick}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none',
          zIndex: 999,
        }}
      />
      {children}
    </div>
  )
}
