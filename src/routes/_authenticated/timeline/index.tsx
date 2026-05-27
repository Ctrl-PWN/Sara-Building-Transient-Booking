import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/timeline/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authenticated/_timeline/"!</div>
}
