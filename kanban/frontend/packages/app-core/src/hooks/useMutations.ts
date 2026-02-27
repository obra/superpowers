import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  updateSprint,
  updatePerson,
} from '../api.js'
import type { Task, TaskStatus } from '../types.js'
import { BOARD_KEY } from './useBoard.js'

function useInvalidateBoard() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries({ queryKey: BOARD_KEY })
}

// ─── Task mutations ───────────────────────────────────────────────────────────

export function useCreateTask() {
  const invalidate = useInvalidateBoard()
  return useMutation({
    mutationFn: (task: Omit<Task, 'created' | 'updated'>) => createTask(task),
    onSuccess: invalidate,
  })
}

export function useUpdateTask() {
  const invalidate = useInvalidateBoard()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Task> }) =>
      updateTask(id, patch),
    onSuccess: invalidate,
  })
}

export function useUpdateTaskStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      updateTaskStatus(id, status),
    // Optimistic update — flip status in cache immediately
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: BOARD_KEY })
      const prev = qc.getQueryData(BOARD_KEY)
      qc.setQueryData(BOARD_KEY, (old: { tasks: Task[] } | undefined) => {
        if (!old) return old
        return {
          ...old,
          tasks: old.tasks.map(t => (t.id === id ? { ...t, status } : t)),
        }
      })
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(BOARD_KEY, ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: BOARD_KEY }),
  })
}

export function useDeleteTask() {
  const invalidate = useInvalidateBoard()
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: invalidate,
  })
}

// ─── Sprint mutations ─────────────────────────────────────────────────────────

export function useUpdateSprint() {
  const invalidate = useInvalidateBoard()
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: Parameters<typeof updateSprint>[1] }) =>
      updateSprint(id, patch),
    onSuccess: invalidate,
  })
}

// ─── Person mutations ─────────────────────────────────────────────────────────

export function useUpdatePerson() {
  const invalidate = useInvalidateBoard()
  return useMutation({
    mutationFn: ({
      username,
      patch,
    }: {
      username: string
      patch: Parameters<typeof updatePerson>[1]
    }) => updatePerson(username, patch),
    onSuccess: invalidate,
  })
}
