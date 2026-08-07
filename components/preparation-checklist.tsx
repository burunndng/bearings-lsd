'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'

type Task = {
  id: string
  label: string
  detail: string
}

const TASKS: Task[] = [
  {
    id: 'intentions',
    label: 'Write your intentions',
    detail: 'Note what you hope to attend to — questions, not outcomes.',
  },
  {
    id: 'medications',
    label: 'Review medications with your prescriber',
    detail: 'Confirm interactions and any tapering plan well in advance.',
  },
  {
    id: 'logistics',
    label: 'Arrange transport and the day after',
    detail: 'Plan a ride home and keep the following day unscheduled.',
  },
  {
    id: 'support',
    label: 'Tell one trusted person',
    detail: 'Someone who can be reached before and after the session.',
  },
  {
    id: 'setting',
    label: 'Prepare your space',
    detail: 'Comfortable clothing, water, eye mask, and a chosen playlist.',
  },
]

const STORAGE_KEY = 'bearings.preparation.v1'

export function PreparationChecklist() {
  const [done, setDone] = useState<Record<string, boolean>>({})
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) setDone(JSON.parse(raw))
    } catch {
      // ignore malformed storage
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(done))
    } catch {
      // ignore quota errors
    }
  }, [done, hydrated])

  const completed = TASKS.filter((t) => done[t.id]).length

  function toggle(id: string) {
    setDone((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div>
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-mono tabular-nums text-foreground">
            {completed}
          </span>
          {` of ${TASKS.length} complete`}
        </p>
        <div
          className="h-px flex-1 bg-border"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={TASKS.length}
          aria-valuenow={completed}
          aria-label="Preparation progress"
        >
          <div
            className="h-px bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${(completed / TASKS.length) * 100}%` }}
          />
        </div>
      </div>

      <ul className="flex flex-col divide-y divide-border">
        {TASKS.map((task) => {
          const isDone = Boolean(done[task.id])
          return (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => toggle(task.id)}
                aria-pressed={isDone}
                className="group flex w-full items-start gap-4 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors ${
                    isDone
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-transparent text-transparent group-hover:border-primary/60'
                  }`}
                >
                  <Check className="size-4" strokeWidth={2.5} />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span
                    className={`text-[0.95rem] font-medium leading-snug transition-colors ${
                      isDone
                        ? 'text-muted-foreground line-through'
                        : 'text-foreground'
                    }`}
                  >
                    {task.label}
                  </span>
                  <span className="text-sm leading-relaxed text-muted-foreground">
                    {task.detail}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
