import { useRef, useEffect, useCallback } from 'react'
import { useInView, useMotionValue, useSpring } from 'framer-motion'

interface Props {
  to: number
  from?: number
  duration?: number
  delay?: number
  className?: string
}

/**
 * ReactBits CountUp — spring-animated number counter.
 * Use key={value} to re-trigger animation when value changes.
 */
export default function CountUp({ to, from = 0, duration = 0.8, delay = 0, className = '' }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(from)
  const damping = 20 + 40 * (1 / duration)
  const stiffness = 100 * (1 / duration)
  const springValue = useSpring(motionValue, { damping, stiffness })
  const isInView = useInView(ref, { once: true, margin: '0px' })

  useEffect(() => {
    if (ref.current) ref.current.textContent = String(from)
  }, [from])

  useEffect(() => {
    if (!isInView) return
    const id = setTimeout(() => motionValue.set(to), delay * 1000)
    return () => clearTimeout(id)
  }, [isInView, motionValue, to, delay])

  const fmt = useCallback((v: number) => String(Math.round(v)), [])

  useEffect(() => {
    return springValue.on('change', latest => {
      if (ref.current) ref.current.textContent = fmt(latest)
    })
  }, [springValue, fmt])

  return <span ref={ref} className={className} />
}
