---
title: Do Not Put Effect Events in Dependency Arrays
impact: LOW
impactDescription: avoids unnecessary effect re-runs and lint errors
tags: advanced, hooks, useEffectEvent, dependencies, effects
---

## Do Not Put Effect Events in Dependency Arrays

Effect Event functions do not have a stable identity. Their identity intentionally changes on every render. Do not include the function returned by `useEffectEvent` in a `useEffect` dependency array. Keep the actual reactive values as dependencies and call the Effect Event from inside the effect body or subscriptions created by that effect.

**Incorrect (Effect Event added as a dependency):**

```tsx
import { useEffect, useEffectEvent } from 'react'

function ChatRoom({ roomId, onConnected }: {
  roomId: string
  onConnected: () => void
}) {
  const handleConnected = useEffectEvent(onConnected)

  useEffect(() => {
    const connection = createConnection(roomId)
    connection.on('connected', handleConnected)
    connection.connect()

    return () => connection.disconnect()
  }, [roomId, handleConnected])
}
```

Including the Effect Event in dependencies makes the effect re-run every render and triggers the React Hooks lint rule.

**Correct (depend on reactive values, not the Effect Event):**

```tsx
import { useEffect, useEffectEvent } from 'react'

function ChatRoom({ roomId, onConnected }: {
  roomId: string
  onConnected: () => void
}) {
  const handleConnected = useEffectEvent(onConnected)

  useEffect(() => {
    const connection = createConnection(roomId)
    connection.on('connected', handleConnected)
    connection.connect()

    return () => connection.disconnect()
  }, [roomId])
}
```

Reference: [React useEffectEvent: Effect Event in deps](https://react.dev/reference/react/useEffectEvent#effect-event-in-deps)
