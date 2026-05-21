import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'

export const Route = createFileRoute('/demo/tanstack-query')({
  component: TanStackQueryDemo,
})

function TanStackQueryDemo() {
  const { data } = useQuery({
    queryKey: ['todos'],
    queryFn: () =>
      Promise.resolve([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
        { id: 3, name: 'Charlie' },
      ]),
    initialData: [],
  })

  return (
    <div className="page-wrap px-4 py-12">
      <div className="block-card p-6 sm:p-8">
        <div className="block-header pb-4 mb-6">
          <p className="font-data text-xs font-bold uppercase tracking-[0.05em] text-[var(--on-surface-variant)] mb-1">
            Demo
          </p>
          <h1 className="font-display text-3xl font-bold text-[var(--on-surface)]">
            TanStack Query
          </h1>
        </div>

        <p className="font-body text-sm text-[var(--on-surface-variant)] mb-4">
          Simple promise handling with TanStack Query.
        </p>

        <ul className="space-y-2">
          {data.map((todo) => (
            <li
              key={todo.id}
              className="block-card px-4 py-3 transition hover:bg-[var(--surface-container-low)]"
            >
              <span className="font-body text-base text-[var(--on-surface)]">
                {todo.name}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
