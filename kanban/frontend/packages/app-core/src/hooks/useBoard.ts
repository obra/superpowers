import { useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchBoard } from '../api.js'
import type { Board } from '../types.js'

export const BOARD_KEY = ['board'] as const

const EMPTY_TASKS: Board['tasks'] = []
const EMPTY_SPRINTS: Board['sprints'] = []
const EMPTY_PEOPLE: Board['people'] = []
const EMPTY_BOARD: Board = { tasks: EMPTY_TASKS, sprints: EMPTY_SPRINTS, people: EMPTY_PEOPLE }

export function useBoard() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: BOARD_KEY,
    queryFn: fetchBoard,
    staleTime: 30_000,
  })

  // Subscribe to server-sent file-change events → invalidate board cache
  useEffect(() => {
    const es = new EventSource('/api/events')

    es.addEventListener('change', () => {
      queryClient.invalidateQueries({ queryKey: BOARD_KEY })
    })

    es.onerror = () => {
      // Silently reconnect — EventSource retries automatically
    }

    return () => es.close()
  }, [queryClient])

  const tasks = data?.tasks ?? EMPTY_TASKS
  const sprints = data?.sprints ?? EMPTY_SPRINTS
  const people = data?.people ?? EMPTY_PEOPLE
  const activeSprint = useMemo(
    () => sprints.find(s => s.status === 'active') ?? null,
    [sprints]
  )

  return {
    board: data ?? EMPTY_BOARD,
    tasks,
    sprints,
    people,
    activeSprint,
    isLoading,
    error,
  }
}
