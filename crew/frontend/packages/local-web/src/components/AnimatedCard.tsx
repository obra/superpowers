/**
 * AnimatedCard — CSS-keyframe entry animation for kanban cards.
 * Uses CSS (not framer-motion) to avoid conflicts with @hello-pangea/dnd transforms.
 * Stagger delay is capped at 300ms so long columns don't look broken.
 */
export default function AnimatedCard({
  children,
  index,
}: {
  children: React.ReactNode
  index: number
}) {
  return (
    <div
      className="rb-card-in"
      style={{ animationDelay: `${Math.min(index * 0.045, 0.3)}s` }}
    >
      {children}
    </div>
  )
}
